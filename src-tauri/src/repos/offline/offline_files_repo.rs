use std::{
    cmp::Ordering,
    path::{Path, PathBuf},
};

use pathdiff::diff_paths;

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

    async fn delete(_id: Self::Id) -> Result<bool, ApiError> {
        let path_string = format!("{}{}", &Self::get_base_dir(), _id);
        let file_path = Path::new(&path_string);

        if file_path.exists() {
            std::fs::remove_file(file_path)
                .map_err(|e| ApiError::new(500, format!("删除文件失败: {}", e)))?;
            Ok(true)
        } else {
            Err(ApiError::new(404, "文件不存在".to_string()))
        }
    }
}

impl OfflineRepo for OfflineFilesRepo {}

impl FilesRepo for OfflineFilesRepo {
    async fn get_files(path: &str) -> Result<Vec<FileInfo>, ApiError> {
        let path_string = format!("{}{}", &Self::get_base_dir(), path);
        let dir_path = Path::new(&path_string);

        if !dir_path.is_dir() {
            return Err(ApiError::new(400, "指定的路径不是一个目录".to_string()));
        }

        let mut files = Vec::new();
        let entries = dir_path
            .read_dir()
            .map_err(|e| ApiError::new(500, format!("读取目录失败: {}", e)))?;

        for entry in entries {
            let entry =
                entry.map_err(|e| ApiError::new(500, format!("读取目录条目失败: {}", e)))?;

            if let Ok(file_info) = Self::create_file_info(entry) {
                files.push(file_info);
            }
        }

        Self::sort_files(&mut files);
        Ok(files)
    }

    /// 下载文件的实现不适用于离线存储库，都在你硬盘上了下载什么。
    async fn download_file(_path: &str, _filename: &str) -> Result<(), ApiError> {
        Err(ApiError::new(
            400,
            format!("离线存储库不支持下载文件, {}", _path),
        ))
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

        let base_dir_path = PathBuf::from(Self::get_base_dir());
        Ok(FileInfo {
            name: file_name.to_string(),
            size: metadata.len(),
            file_type: path.to_file_type(),
            is_directory: metadata.is_dir(),
            last_modified,
            path: format!(
                "/{}",
                diff_paths(&path, &base_dir_path)
                    .unwrap_or_else(|| base_dir_path)
                    .to_string_lossy()
                    .into_owned()
            ),
        })
    }

    fn sort_files(files: &mut Vec<FileInfo>) {
        files.sort_by(|a, b| match (a.is_directory, b.is_directory) {
            (true, false) => Ordering::Less,
            (false, true) => Ordering::Greater,
            _ => a.name.cmp(&b.name),
        });
    }
}
