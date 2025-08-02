use tauri::command;

use crate::models::{
    api_response::ApiResponse,
    favorite::{AddFileToFavoriteRequest, FavoriteDto, FavoriteFileDto},
};

#[command]
pub async fn get_favorites(server_url: String) -> Result<Vec<FavoriteDto>, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/favorites", server_url);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("发送获取收藏夹请求失败: {}", e))?;

    let api_response: ApiResponse<Vec<FavoriteDto>> = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    api_response
        .data
        .ok_or_else(|| "服务器返回空数据".to_string())
}

#[command]
pub async fn add_file_to_favorite(
    request: AddFileToFavoriteRequest,
    favorite_id: i64,
    server_url: String,
) -> Result<bool, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/favorites/{}/files", server_url, favorite_id);

    let response = client
        .post(&url)
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("发送添加文件到收藏夹请求失败: {}", e))?;

    Ok(response.status().is_success())
}

#[command]
pub async fn get_all_favorite_files(server_url: String) -> Result<Vec<FavoriteFileDto>, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/favorites/files", server_url);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("发送获取所有收藏文件请求失败: {}", e))?;

    let api_response: ApiResponse<Vec<FavoriteFileDto>> = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    api_response
        .data
        .ok_or_else(|| "服务器返回空数据".to_string())
}

#[command]
pub async fn delete_favorite_file(id: i64, server_url: String) -> Result<bool, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/favorites/files/{}", server_url, id);

    let response = client
        .delete(&url)
        .send()
        .await
        .map_err(|e| format!("发送删除收藏文件请求失败: {}", e))?;

    Ok(response.status().is_success())
}
