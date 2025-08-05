use tauri::command;

use crate::models::error::ApiError;
use crate::models::favorite::{
    AddFileToFavoriteRequest, CreateFavoriteRequest, FavoriteDto, FavoriteFileDto,
};
use crate::services::api_service::{api_delete_success, api_get, api_post, api_post_success};

#[command]
pub async fn get_favorites() -> Result<Vec<FavoriteDto>, ApiError> {
    api_get("favorites").await
}

#[command]
pub async fn add_file_to_favorite(
    request: AddFileToFavoriteRequest,
    favorite_id: i64,
) -> Result<bool, ApiError> {
    let endpoint = format!("favorites/{}/files", favorite_id);
    api_post_success(&endpoint, &request).await
}

#[command]
pub async fn get_all_favorite_files() -> Result<Vec<FavoriteFileDto>, ApiError> {
    api_get("favorites/files").await
}

#[command]
pub async fn delete_favorite_file(id: i64) -> Result<bool, ApiError> {
    let endpoint = format!("favorites/files/{}", id);
    api_delete_success(&endpoint).await
}

#[command]
pub async fn create_favorite(request: CreateFavoriteRequest) -> Result<FavoriteDto, ApiError> {
    api_post("favorites", &request).await
}

#[command]
pub async fn delete_favorite(id: i64) -> Result<bool, ApiError> {
    let endpoint = format!("favorites/{}", id);
    api_delete_success(&endpoint).await
}
