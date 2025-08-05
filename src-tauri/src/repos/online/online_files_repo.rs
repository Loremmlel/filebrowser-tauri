use std::fs;

use crate::{
    models::{error::ApiError, files::FileInfo},
    repos::{files_repo::FilesRepo, online::OnlineRepo, Repo},
    services::api_service::{api_delete, api_get, api_get_bytes},
};

pub struct OnlineFilesRepo;

impl Repo for OnlineFilesRepo {}

impl OnlineRepo for OnlineFilesRepo {}

impl FilesRepo for OnlineFilesRepo {
    async fn get_files(path: &str) -> Result<Vec<FileInfo>, ApiError> {
        let endpoint = format!("files?path={}", path);
        api_get(&endpoint).await
    }

    async fn delete_file(path: &str) -> Result<(), ApiError> {
        let endpoint = format!("files?path={}", path);
        api_delete(&endpoint).await
    }

    async fn download_file(path: &str, filename: &str) -> Result<(), ApiError> {
        let endpoint = format!("files/download?path={}", path);
        let bytes = api_get_bytes(&endpoint).await?;

        let download_dir = dirs::download_dir()
            .ok_or_else(|| ApiError::network("无法获取下载目录".to_string()))?;
        let file_path = download_dir.join(&filename);

        fs::write(&file_path, &bytes)
            .map_err(|e| ApiError::network(format!("保存文件失败: {}", e)))?;

        Ok(())
    }
}
