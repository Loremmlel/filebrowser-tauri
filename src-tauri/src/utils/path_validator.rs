use std::path::{Path, PathBuf};

use crate::models::response::ApiResponse;

pub struct PathValidator {
    base_path: PathBuf,
}

impl PathValidator {
    pub fn new(base_path: impl AsRef<Path>) -> Self {
        Self {
            base_path: base_path.as_ref().to_path_buf(),
        }
    }

    pub fn validate_path(&self, path: &str) -> Result<PathBuf, ApiResponse<()>> {
        // 验证路径格式
        if !path.starts_with('/') {
            return Err(ApiResponse::error("Path must start with '/'".to_string()));
        }

        // 路径规范化和安全检查
        let normalized_path = self
            .base_path
            .join(&path[1..])
            .canonicalize()
            .map_err(|_| ApiResponse::error("Path not found".to_string()))?;

        if !normalized_path.starts_with(&self.base_path) {
            return Err(ApiResponse::error("Access forbidden".to_string()));
        }

        if !normalized_path.exists() {
            return Err(ApiResponse::error("File not found".to_string()));
        }

        Ok(normalized_path)
    }
}
