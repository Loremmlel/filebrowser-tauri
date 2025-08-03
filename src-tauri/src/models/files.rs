use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileInfo {
    pub name: String,
    pub size: u64,
    #[serde(rename = "type")]
    pub file_type: FileType,
    pub is_directory: bool,
    pub last_modified: u64,
    pub path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum FileType {
    Folder,
    Image,
    Video,
    Other,
}
