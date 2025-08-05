use crate::{
    models::{
        error::ApiError,
        favorite::{AddFileToFavoriteRequest, CreateFavoriteRequest, FavoriteDto, FavoriteFileDto},
    },
    repos::{favorites_repo::FavoritesRepo, online::OnlineRepo, Repo},
    services::api_service::{api_delete_success, api_get, api_post, api_post_success},
};

pub struct OnlineFavoritesRepo;

impl Repo for OnlineFavoritesRepo {}

impl OnlineRepo for OnlineFavoritesRepo {}

impl FavoritesRepo for OnlineFavoritesRepo {
    async fn get_favorites() -> Result<Vec<FavoriteDto>, ApiError> {
        api_get("favorites").await
    }

    async fn add_file_to_favorite(
        request: AddFileToFavoriteRequest,
        favorite_id: i64,
    ) -> Result<bool, ApiError> {
        let endpoint = format!("favorites/{}/files", favorite_id);
        api_post_success(&endpoint, &request).await
    }

    async fn get_all_favorite_files() -> Result<Vec<FavoriteFileDto>, ApiError> {
        api_get("favorites/files").await
    }

    async fn delete_favorite_file(id: i64) -> Result<bool, ApiError> {
        let endpoint = format!("favorites/files/{}", id);
        api_delete_success(&endpoint).await
    }

    async fn create_favorite(request: CreateFavoriteRequest) -> Result<FavoriteDto, ApiError> {
        api_post("favorites", &request).await
    }

    async fn delete_favorite(id: i64) -> Result<bool, ApiError> {
        let endpoint = format!("favorites/{}", id);
        api_delete_success(&endpoint).await
    }
}
