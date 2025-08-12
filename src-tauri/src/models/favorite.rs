use serde::{Deserialize, Serialize};
use sqlx::types::chrono::{DateTime, Utc};

use crate::models::files::FileType;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FavoriteDto {
    pub id: i64,
    pub name: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub sort_order: i32,
    pub files: Vec<FavoriteFileDto>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FavoriteFileDto {
    pub id: i64,
    pub favorite_id: i64,
    pub filename: String,
    pub file_size: u64,
    pub file_type: FileType,
    pub file_path: String,
    pub last_modified: i64,
    pub is_directory: bool,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddFileToFavoriteRequest {
    pub filename: String,
    pub file_path: String,
    pub is_directory: bool,
    pub file_type: FileType,
    pub last_modified: u64,
    pub file_size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFavoriteRequest {
    pub name: String,
    pub sort_order: i32,
}

/// 数据库实体
#[derive(Debug, sqlx::FromRow)]
pub struct Favorite {
    pub id: i64,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub sort_order: i32,
}

#[derive(Debug, sqlx::FromRow)]
pub struct FavoriteFile {
    pub id: i64,
    pub favorite_id: i64,
    pub filename: String,
    pub file_size: u64,
    pub file_type: String,
    pub file_path: String,
    pub last_modified: i64,
    pub is_directory: bool,
    pub created_at: DateTime<Utc>,
}

impl From<Favorite> for FavoriteDto {
    fn from(favorite: Favorite) -> Self {
        Self {
            id: favorite.id,
            name: favorite.name,
            created_at: favorite.created_at.timestamp_millis(),
            updated_at: favorite.updated_at.timestamp_millis(),
            sort_order: favorite.sort_order,
            files: Vec::new(), // 需要单独查询
        }
    }
}

impl From<FavoriteFile> for FavoriteFileDto {
    fn from(file: FavoriteFile) -> Self {
        Self {
            id: file.id,
            favorite_id: file.favorite_id,
            filename: file.filename,
            file_size: file.file_size,
            file_type: match file.file_type.as_str() {
                "Folder" => FileType::Folder,
                "Image" => FileType::Image,
                "Video" => FileType::Video,
                _ => FileType::Other,
            },
            file_path: file.file_path,
            last_modified: file.last_modified,
            is_directory: file.is_directory,
            created_at: file.created_at.timestamp_millis(),
        }
    }
}
