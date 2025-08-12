use std::sync::OnceLock;

use sqlx::SqlitePool;

use crate::{commands::config::with_config, models::error::ApiError};

pub mod offline_favorites_repo;
pub mod offline_files_repo;

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
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .map_err(|e| ApiError::new(500, e.to_string()))?;
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
