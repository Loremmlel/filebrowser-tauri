use crate::{
    models::{
        error::ApiError,
        favorite::{AddFileToFavoriteRequest, CreateFavoriteRequest, FavoriteDto, FavoriteFileDto},
    },
    repos::{favorites_repo::FavoritesRepo, online::OnlineRepo, Repo},
    services::api_service::{api_delete_success, api_get, api_post, api_post_success},
};

pub struct OnlineFavoritesRepo;

impl Repo for OnlineFavoritesRepo {
    type Id = i64;
    type Item = FavoriteDto;
    type CreateRequest = CreateFavoriteRequest;
    type UpdateRequest = ();

    async fn create(_data: Self::CreateRequest) -> Result<Self::Item, ApiError> {
        api_post("favorites", &Self::get_server_url(), &_data).await
    }

    async fn get_all() -> Result<Vec<Self::Item>, ApiError> {
        api_get("favorites", &Self::get_server_url()).await
    }

    async fn delete(_id: i64) -> Result<bool, ApiError> {
        let endpoint = format!("favorites/{}", _id);
        api_delete_success(&Self::get_server_url(), &endpoint).await
    }
}

impl OnlineRepo for OnlineFavoritesRepo {}

impl FavoritesRepo for OnlineFavoritesRepo {
    async fn add_file_to_favorite(
        request: AddFileToFavoriteRequest,
        favorite_id: i64,
    ) -> Result<bool, ApiError> {
        let endpoint = format!("favorites/{}/files", favorite_id);
        api_post_success(&Self::get_server_url(), &endpoint, &request).await
    }

    async fn get_all_favorite_files() -> Result<Vec<FavoriteFileDto>, ApiError> {
        api_get("favorites/files", &Self::get_server_url()).await
    }

    async fn delete_favorite_file(id: i64) -> Result<bool, ApiError> {
        let endpoint = format!("favorites/files/{}", id);
        api_delete_success(&Self::get_server_url(), &endpoint).await
    }
}
