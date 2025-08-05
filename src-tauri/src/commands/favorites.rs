use tauri::command;

use crate::models::error::ApiError;
use crate::models::favorite::{
    AddFileToFavoriteRequest, CreateFavoriteRequest, FavoriteDto, FavoriteFileDto,
};
use crate::repos::favorites_repo::FavoritesRepo;
use crate::repos::online::online_favorites_repo::OnlineFavoritesRepo;

#[command]
pub async fn get_favorites() -> Result<Vec<FavoriteDto>, ApiError> {
    OnlineFavoritesRepo::get_favorites().await
}

#[command]
pub async fn add_file_to_favorite(
    request: AddFileToFavoriteRequest,
    favorite_id: i64,
) -> Result<bool, ApiError> {
    OnlineFavoritesRepo::add_file_to_favorite(request, favorite_id).await
}

#[command]
pub async fn get_all_favorite_files() -> Result<Vec<FavoriteFileDto>, ApiError> {
    OnlineFavoritesRepo::get_all_favorite_files().await
}

#[command]
pub async fn delete_favorite_file(id: i64) -> Result<bool, ApiError> {
    OnlineFavoritesRepo::delete_favorite_file(id).await
}

#[command]
pub async fn create_favorite(request: CreateFavoriteRequest) -> Result<FavoriteDto, ApiError> {
    OnlineFavoritesRepo::create_favorite(request).await
}

#[command]
pub async fn delete_favorite(id: i64) -> Result<bool, ApiError> {
    OnlineFavoritesRepo::delete_favorite(id).await
}
