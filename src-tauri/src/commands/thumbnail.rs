use tauri::command;

use crate::services::api_service::api_get_bytes;

#[command]
pub async fn get_thumbnail(path: String, server_url: String) -> Result<Vec<u8>, String> {
    let endpoint = format!("thumbnail?path={}", path);
    let bytes = api_get_bytes(&server_url, &endpoint).await?;
    Ok(bytes)
}
