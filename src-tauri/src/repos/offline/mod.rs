use std::sync::OnceLock;

use sqlx::SqlitePool;

use crate::{commands::config::with_config, models::error::ApiError};

pub mod offline_favorites_repo;
pub mod offline_files_repo;
pub mod offline_thumbnails_repo;
pub mod offline_transcode_repo;

pub trait OfflineRepo {
    fn get_base_dir() -> String {
        with_config(|config| config.base_dir.clone())
    }
}

static DB_POOL: OnceLock<SqlitePool> = OnceLock::new();

pub struct Database;

impl Database {
    pub async fn init(database_url: &str) -> Result<(), ApiError> {
        let pool = SqlitePool::connect(database_url)
            .await
            .map_err(|e| ApiError::new(500, e.to_string()))?;

        // 默认在包含cargo.toml的目录下的 migrations 文件夹里，但如果指定./migrations，就会发现不行！
        // 我想是db文件和可执行文件不在同一目录下导致的
        sqlx::migrate!()
            .run(&pool)
            .await
            .map_err(|e| ApiError::new(500, format!("迁移执行失败: {}", e)))?;

        DB_POOL
            .set(pool)
            .map_err(|_| ApiError::new(500, "设置数据库连接池失败".to_string()))?;
        Ok(())
    }

    pub fn get_pool() -> Result<&'static SqlitePool, ApiError> {
        DB_POOL
            .get()
            .ok_or_else(|| ApiError::new(500, "数据库连接池未初始化".to_string()))
    }
}
