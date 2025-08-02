use tauri::command;

#[command]
pub async fn get_thumbnail(path: String, server_url: String) -> Result<Vec<u8>, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/thumbnail?path={}", server_url, path);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("发送请求失败: {}", e))?;

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("读取缩略图失败: {}", e))?;

    Ok(bytes.to_vec())
}