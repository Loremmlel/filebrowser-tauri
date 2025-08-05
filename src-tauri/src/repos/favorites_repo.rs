use crate::{
    models::{
        error::ApiError,
        favorite::{AddFileToFavoriteRequest, CreateFavoriteRequest, FavoriteDto, FavoriteFileDto},
    },
    repos::Repo,
};

pub trait FavoritesRepo: Repo {
    async fn get_favorites() -> Result<Vec<FavoriteDto>, ApiError>;
    async fn add_file_to_favorite(
        request: AddFileToFavoriteRequest,
        favorite_id: i64,
    ) -> Result<bool, ApiError>;
    async fn get_all_favorite_files() -> Result<Vec<FavoriteFileDto>, ApiError>;
    async fn delete_favorite_file(id: i64) -> Result<bool, ApiError>;
    async fn create_favorite(request: CreateFavoriteRequest) -> Result<FavoriteDto, ApiError>;
    async fn delete_favorite(id: i64) -> Result<bool, ApiError>;
}
