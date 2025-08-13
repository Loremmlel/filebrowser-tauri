use std::sync::{Arc, RwLock};

use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Manager};

use crate::{models::error::ApiError, repos::offline::Database};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub online: bool,
    pub server_url: String,
    pub base_dir: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            online: true,
            server_url: "http://localhost:8080".to_string(),
            base_dir: "E:/ZTEMP/kukuku".to_string(),
        }
    }
}

lazy_static! {
    static ref APP_CONFIG: Arc<RwLock<AppConfig>> = Arc::new(RwLock::new(AppConfig::default()));
}

pub fn with_config<T>(f: impl FnOnce(&AppConfig) -> T) -> T {
    let config = APP_CONFIG.read().unwrap();
    f(&config)
}

pub fn with_config_mut<T>(f: impl FnOnce(&mut AppConfig) -> T) -> T {
    let mut config = APP_CONFIG.write().unwrap();
    f(&mut config)
}

pub fn is_online() -> bool {
    with_config(|config| config.online)
}

#[command]
pub fn get_app_config() -> AppConfig {
    with_config(|config| config.clone())
}

#[command]
pub fn set_app_config(config: AppConfig) {
    with_config_mut(|current_config| {
        *current_config = config;
    });
}

#[command]
pub async fn init_database(app: &AppHandle) -> Result<(), ApiError> {
    let db_path = match app.path().app_local_data_dir() {
        Ok(path) => {
            if !path.exists() {
                if let Err(e) = std::fs::create_dir_all(&path) {
                    return Err(ApiError::new(500, format!("创建数据库目录失败: {}", e)));
                }
            }
            path.join("filebrowser.db")
        }
        Err(e) => {
            return Err(ApiError::new(
                500,
                format!("无法获取应用本地数据目录: {}", e),
            ));
        }
    };

    let database_url = format!("sqlite:{}", db_path.to_str().unwrap_or_default());
    if database_url == "sqlite:" {
        return Err(ApiError::new(500, "数据库路径无效".to_string()));
    }

    let result = Database::init(&database_url).await;
    result
}
