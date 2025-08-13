use crate::{
    models::{
        error::ApiError,
        favorite::{
            AddFileToFavoriteRequest, CreateFavoriteRequest, FavoriteDto, FavoriteFileDto,
            UpdateFavoriteRequest,
        },
    },
    repos::{favorites_repo::FavoritesRepo, online::OnlineRepo, Repo},
    services::api_service::{api_delete_success, api_get, api_post, api_post_success, api_put},
};

pub struct OnlineFavoritesRepo;

impl Repo for OnlineFavoritesRepo {
    type Id = i64;
    type Item = FavoriteDto;
    type CreateRequest = CreateFavoriteRequest;
    type UpdateRequest = UpdateFavoriteRequest;

    async fn create(data: Self::CreateRequest) -> Result<Self::Item, ApiError> {
        api_post(&Self::get_server_url(), "favorites", &data).await
    }

    async fn get_all() -> Result<Vec<Self::Item>, ApiError> {
        api_get(&Self::get_server_url(), "favorites").await
    }

    async fn delete(id: i64) -> Result<bool, ApiError> {
        let endpoint = format!("favorites/{}", id);
        api_delete_success(&Self::get_server_url(), &endpoint).await
    }

    async fn update(id: Self::Id, data: Self::UpdateRequest) -> Result<Self::Item, ApiError> {
        let endpoint = format!("favorites/{}", id);
        api_put(&Self::get_server_url(), &endpoint, &data).await
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
        api_get(&Self::get_server_url(), "favorites/files").await
    }

    async fn delete_favorite_file(id: i64) -> Result<bool, ApiError> {
        let endpoint = format!("favorites/files/{}", id);
        api_delete_success(&Self::get_server_url(), &endpoint).await
    }
}
