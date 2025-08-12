use tauri::command;

use crate::commands::config::is_online;
use crate::models::error::ApiError;
use crate::models::files::FileInfo;
use crate::repos::files_repo::FilesRepo;
use crate::repos::offline::offline_files_repo::OfflineFilesRepo;
use crate::repos::online::online_files_repo::OnlineFilesRepo;
use crate::repos::Repo;

#[command]
pub async fn get_files(path: String) -> Result<Vec<FileInfo>, ApiError> {
    if is_online() {
        OnlineFilesRepo::get_files(&path).await
    } else {
        OfflineFilesRepo::get_files(&path).await
    }
}

#[command]
pub async fn delete_file(path: String) -> Result<bool, ApiError> {
    if is_online() {
        OnlineFilesRepo::delete(path).await
    } else {
        OfflineFilesRepo::delete(path).await
    }
}

#[command]
pub async fn download_file(path: String, filename: String) -> Result<(), ApiError> {
    if is_online() {
        OnlineFilesRepo::download_file(&path, &filename).await
    } else {
        OfflineFilesRepo::download_file(&path, &filename).await
    }
}
