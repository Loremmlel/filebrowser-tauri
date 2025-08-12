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

impl ToString for FileType {
    fn to_string(&self) -> String {
        match self {
            FileType::Folder => "Folder".to_string(),
            FileType::Image => "Image".to_string(),
            FileType::Video => "Video".to_string(),
            FileType::Other => "Other".to_string(),
        }
    }
}

pub trait ToFileType {
    fn to_file_type(&self) -> FileType;
}

impl ToFileType for std::path::Path {
    fn to_file_type(&self) -> FileType {
        if self.is_dir() {
            return FileType::Folder;
        }

        match self.extension().and_then(|ext| ext.to_str()) {
            Some(ext) => match ext.to_lowercase().as_str() {
                "png" | "jpg" | "jpeg" | "gif" | "bmp" | "svg" => FileType::Image,
                "mp4" | "mkv" | "avi" | "mov" | "wmv" | "flv" | "3gp" => FileType::Video,
                _ => FileType::Other,
            },
            None => FileType::Other,
        }
    }
}
