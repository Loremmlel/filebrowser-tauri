use serde::{Deserialize, Serialize};

use crate::models::files::FileType;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FavoriteDto {
    pub id: i64,
    pub name: String,
    pub created_at: u64,
    pub updated_at: u64,
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
    pub last_modified: u64,
    pub is_directory: bool,
    pub created_at: u64,
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
