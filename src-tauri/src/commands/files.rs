use std::{fs, path};

use tauri::command;

use crate::models::{api_response::ApiResponse, files::FileInfo};

#[command]
pub async fn get_files(path: String, server_url: String) -> Result<Vec<FileInfo>, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/files?path={}", server_url, path);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("发送获取文件请求失败: {}", e))?;

    let api_response: ApiResponse<Vec<FileInfo>> = response
        .json()
        .await
        .map_err(|e| format!("解析文件响应失败: {}", e))?;

    api_response
        .data
        .ok_or_else(|| "服务器返回空数据".to_string())
}

#[command]
pub async fn delete_file(path: String, server_url: String) -> Result<(), String> {
    let client = reqwest::Client::new();
    let url = format!("{}/files?path={}", server_url, path);

    client
        .delete(&url)
        .send()
        .await
        .map_err(|e| format!("发送文件删除请求失败: {}", e))?;

    Ok(())
}

#[command]
pub async fn download_file(
    path: String,
    filename: String,
    server_url: String,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let url = format!("{}/files/download?path={}", server_url, path);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("发送下载请求失败: {}", e))?;

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("读取文件内容失败: {}", e))?;

    let download_dir = dirs::download_dir().ok_or("无法获取下载目录")?;
    let file_path = download_dir.join(&filename);

    fs::write(&file_path, &bytes).map_err(|e| format!("保存文件失败: {}", e))?;

    Ok(())
}
