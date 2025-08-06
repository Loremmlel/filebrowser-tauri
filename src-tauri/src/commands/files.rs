use tauri::command;

use crate::models::error::ApiError;
use crate::models::files::FileInfo;
use crate::repos::files_repo::FilesRepo;
use crate::repos::online::online_files_repo::OnlineFilesRepo;
use crate::repos::Repo;

#[command]
pub async fn get_files(path: String) -> Result<Vec<FileInfo>, ApiError> {
    OnlineFilesRepo::get_files(&path).await
}

#[command]
pub async fn delete_file(path: String) -> Result<bool, ApiError> {
    OnlineFilesRepo::delete(path).await
}

#[command]
pub async fn download_file(path: String, filename: String) -> Result<(), ApiError> {
    OnlineFilesRepo::download_file(&path, &filename).await
}
