use std::sync::{Arc, RwLock};

use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use tauri::command;

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

#[command]
pub fn get_app_config() -> AppConfig {
    let config = APP_CONFIG.read().unwrap();
    config.clone()
}

#[command]
pub fn set_app_config(config: AppConfig) {
    let mut app_config = APP_CONFIG.write().unwrap();
    *app_config = config;
}
