use tauri::command;

use crate::models::favorite::{
    AddFileToFavoriteRequest, CreateFavoriteRequest, FavoriteDto, FavoriteFileDto,
};
use crate::models::error::ApiError;
use crate::services::api_service::{api_delete_success, api_get, api_post, api_post_success};

#[command]
pub async fn get_favorites(server_url: String) -> Result<Vec<FavoriteDto>, ApiError> {
    api_get(&server_url, "favorites").await
}

#[command]
pub async fn add_file_to_favorite(
    request: AddFileToFavoriteRequest,
    favorite_id: i64,
    server_url: String,
) -> Result<bool, ApiError> {
    let endpoint = format!("favorites/{}/files", favorite_id);
    api_post_success(&server_url, &endpoint, &request).await
}

#[command]
pub async fn get_all_favorite_files(server_url: String) -> Result<Vec<FavoriteFileDto>, ApiError> {
    api_get(&server_url, "favorites/files").await
}

#[command]
pub async fn delete_favorite_file(id: i64, server_url: String) -> Result<bool, ApiError> {
    let endpoint = format!("favorites/files/{}", id);
    api_delete_success(&server_url, &endpoint).await
}

#[command]
pub async fn create_favorite(
    request: CreateFavoriteRequest,
    server_url: String,
) -> Result<FavoriteDto, ApiError> {
    api_post(&server_url, "favorites", &request).await
}

#[command]
pub async fn delete_favorite(id: i64, server_url: String) -> Result<bool, ApiError> {
    let endpoint = format!("favorites/{}", id);
    api_delete_success(&server_url, &endpoint).await
}
