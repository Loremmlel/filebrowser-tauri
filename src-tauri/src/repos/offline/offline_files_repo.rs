use std::{cmp::Ordering, path::Path};

use crate::{
    models::{
        error::ApiError,
        files::{FileInfo, ToFileType},
    },
    repos::{files_repo::FilesRepo, offline::OfflineRepo, Repo},
};

pub struct OfflineFilesRepo;

impl Repo for OfflineFilesRepo {
    type Id = String;
    type Item = FileInfo;
    type CreateRequest = ();
    type UpdateRequest = ();
}

impl OfflineRepo for OfflineFilesRepo {}

impl FilesRepo for OfflineFilesRepo {
    async fn get_files(path: &str) -> Result<Vec<FileInfo>, ApiError> {
        let dir_path = format!("{}{}", &Self::get_base_dir(), path);
        let dir = Path::new(&dir_path);

        if !dir.is_dir() {
            return Err(ApiError::new(400, "指定的路径不是一个目录".to_string()));
        }

        let mut files = Vec::new();
        let entries = dir
            .read_dir()
            .map_err(|e| ApiError::new(500, format!("读取目录失败: {}", e)))?;

        for entry in entries {
            let entry =
                entry.map_err(|e| ApiError::new(500, format!("读取目录条目失败: {}", e)))?;

            if let Ok(file_info) = create_file_info(entry) {
                files.push(file_info);
            }
        }

        sort_files(&mut files);
        Ok(files)
    }

    /// 下载文件的实现不适用于离线存储库，都在你硬盘上了下载什么。
    async fn download_file(_path: &str, _filename: &str) -> Result<(), ApiError> {
        Ok(())
    }
}

impl OfflineFilesRepo {
    fn create_file_info(entry: std::fs::DirEntry) -> Result<FileInfo, ApiError> {
        let path = entry.path();
        let metadata = entry
            .metadata()
            .map_err(|e| ApiError::new(500, format!("获取文件元数据失败: {}", e)))?;

        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or_else(|| ApiError::new(500, "无效的文件名".to_string()))?;

        // 跳过隐藏文件
        if file_name.starts_with('.') {
            return Err(ApiError::new(400, "隐藏文件".to_string()));
        }

        let last_modified = metadata
            .modified()
            .map_err(|e| ApiError::new(500, format!("获取修改时间失败: {}", e)))?
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| ApiError::new(500, format!("时间错误: {}", e)))?
            .as_secs();

        Ok(FileInfo {
            name: file_name.to_string(),
            size: metadata.len(),
            file_type: path.to_file_type(),
            is_directory: metadata.is_dir(),
            last_modified,
            path: path.to_str().unwrap_or("").to_string(),
        })
    }
}
