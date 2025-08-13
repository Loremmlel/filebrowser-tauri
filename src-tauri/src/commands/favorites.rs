use tauri::command;

use crate::commands::config::is_online;
use crate::models::error::ApiError;
use crate::models::favorite::{
    AddFileToFavoriteRequest, CreateFavoriteRequest, FavoriteDto, FavoriteFileDto,
    UpdateFavoriteRequest,
};
use crate::repos::favorites_repo::FavoritesRepo;
use crate::repos::offline::offline_favorites_repo::OfflineFavoritesRepo;
use crate::repos::online::online_favorites_repo::OnlineFavoritesRepo;
use crate::repos::Repo;

#[command]
pub async fn get_favorites() -> Result<Vec<FavoriteDto>, ApiError> {
    if is_online() {
        OnlineFavoritesRepo::get_all().await
    } else {
        OfflineFavoritesRepo::get_all().await
    }
}

#[command]
pub async fn add_file_to_favorite(
    request: AddFileToFavoriteRequest,
    favorite_id: i64,
) -> Result<bool, ApiError> {
    if is_online() {
        OnlineFavoritesRepo::add_file_to_favorite(request, favorite_id).await
    } else {
        OfflineFavoritesRepo::add_file_to_favorite(request, favorite_id).await
    }
}

#[command]
pub async fn get_all_favorite_files() -> Result<Vec<FavoriteFileDto>, ApiError> {
    if is_online() {
        OnlineFavoritesRepo::get_all_favorite_files().await
    } else {
        OfflineFavoritesRepo::get_all_favorite_files().await
    }
}

#[command]
pub async fn delete_favorite_file(id: i64) -> Result<bool, ApiError> {
    if is_online() {
        OnlineFavoritesRepo::delete_favorite_file(id).await
    } else {
        OfflineFavoritesRepo::delete_favorite_file(id).await
    }
}

#[command]
pub async fn create_favorite(request: CreateFavoriteRequest) -> Result<FavoriteDto, ApiError> {
    if is_online() {
        OnlineFavoritesRepo::create(request).await
    } else {
        OfflineFavoritesRepo::create(request).await
    }
}

#[command]
pub async fn delete_favorite(id: i64) -> Result<bool, ApiError> {
    if is_online() {
        OnlineFavoritesRepo::delete(id).await
    } else {
        OfflineFavoritesRepo::delete(id).await
    }
}

#[command]
pub async fn update_favorite(
    id: i64,
    request: UpdateFavoriteRequest,
) -> Result<FavoriteDto, ApiError> {
    if is_online() {
        OnlineFavoritesRepo::update(id, request).await
    } else {
        OfflineFavoritesRepo::update(id, request).await
    }
}
