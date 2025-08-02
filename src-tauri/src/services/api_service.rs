use crate::models::api_response::ApiResponse;
use reqwest::{Client, Method, Response};
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

// 全局 HTTP 客户端，只创建一次
static HTTP_CLIENT: OnceLock<Client> = OnceLock::new();

fn get_client() -> &'static Client {
    HTTP_CLIENT.get_or_init(|| Client::new())
}

/// 构建完整的 URL
fn build_url(base_url: &str, endpoint: &str) -> String {
    if endpoint.starts_with('/') {
        format!("{}{}", base_url, endpoint)
    } else {
        format!("{}/{}", base_url, endpoint)
    }
}

/// 发送请求并获取原始响应
async fn send_request(base_url: &str, method: Method, endpoint: &str) -> Result<Response, String> {
    let url = build_url(base_url, endpoint);
    let client = get_client();

    let request = match method {
        Method::GET => client.get(&url),
        Method::POST => client.post(&url),
        Method::DELETE => client.delete(&url),
        Method::PUT => client.put(&url),
        _ => return Err("不支持的 HTTP 方法".to_string()),
    };

    request
        .send()
        .await
        .map_err(|e| format!("发送请求失败: {}", e))
}

/// 发送请求并附带 JSON 数据
async fn send_request_with_json<T: Serialize>(
    base_url: &str,
    method: Method,
    endpoint: &str,
    json_data: &T,
) -> Result<Response, String> {
    let url = build_url(base_url, endpoint);
    let client = get_client();

    let request = match method {
        Method::POST => client.post(&url).json(json_data),
        Method::PUT => client.put(&url).json(json_data),
        _ => return Err("该方法不支持 JSON 数据".to_string()),
    };

    request
        .send()
        .await
        .map_err(|e| format!("发送请求失败: {}", e))
}

/// GET 请求并解析为 ApiResponse<T>
pub async fn api_get<T: for<'de> Deserialize<'de>>(
    base_url: &str,
    endpoint: &str,
) -> Result<T, String> {
    let response = send_request(base_url, Method::GET, endpoint).await?;

    let api_response: ApiResponse<T> = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    api_response
        .data
        .ok_or_else(|| "服务器返回空数据".to_string())
}

/// POST 请求并返回是否成功
pub async fn api_post_success<R: Serialize>(
    base_url: &str,
    endpoint: &str,
    json_data: &R,
) -> Result<bool, String> {
    let response = send_request_with_json(base_url, Method::POST, endpoint, json_data).await?;
    Ok(response.status().is_success())
}

/// DELETE 请求
pub async fn api_delete(base_url: &str, endpoint: &str) -> Result<(), String> {
    send_request(base_url, Method::DELETE, endpoint).await?;
    Ok(())
}

/// DELETE 请求并返回是否成功
pub async fn api_delete_success(base_url: &str, endpoint: &str) -> Result<bool, String> {
    let response = send_request(base_url, Method::DELETE, endpoint).await?;
    Ok(response.status().is_success())
}

/// GET 请求并返回字节数据（用于文件下载）
pub async fn api_get_bytes(base_url: &str, endpoint: &str) -> Result<Vec<u8>, String> {
    let response = send_request(base_url, Method::GET, endpoint).await?;

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("读取文件内容失败: {}", e))?;

    Ok(bytes.to_vec())
}
