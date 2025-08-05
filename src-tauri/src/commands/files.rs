use std::fs;

use tauri::command;

use crate::models::error::ApiError;
use crate::models::files::FileInfo;
use crate::services::api_service::{api_delete, api_get, api_get_bytes};

#[command]
pub async fn get_files(path: String) -> Result<Vec<FileInfo>, ApiError> {
    let endpoint = format!("files?path={}", path);
    api_get(&endpoint).await
}

#[command]
pub async fn delete_file(path: String) -> Result<(), ApiError> {
    let endpoint = format!("files?path={}", path);
    api_delete(&endpoint).await
}

#[command]
pub async fn download_file(path: String, filename: String) -> Result<(), ApiError> {
    let endpoint = format!("files/download?path={}", path);
    let bytes = api_get_bytes(&endpoint).await?;

    let download_dir =
        dirs::download_dir().ok_or_else(|| ApiError::network("无法获取下载目录".to_string()))?;
    let file_path = download_dir.join(&filename);

    fs::write(&file_path, &bytes).map_err(|e| ApiError::network(format!("保存文件失败: {}", e)))?;

    Ok(())
}
