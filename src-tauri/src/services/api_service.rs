use crate::models::api_response::ApiResponse;
use crate::models::error::ApiError;
use reqwest::{Client, Method, Response};
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

// 全局 HTTP 客户端，只创建一次
static HTTP_CLIENT: OnceLock<Client> = OnceLock::new();

fn get_client() -> &'static Client {
    HTTP_CLIENT.get_or_init(|| Client::new())
}

/// 构建完整的 URL
fn build_url(server_url: &str, endpoint: &str) -> String {
    if endpoint.starts_with('/') {
        format!("{}{}", server_url, endpoint)
    } else {
        format!("{}/{}", server_url, endpoint)
    }
}

/// 检查响应状态码并处理错误
async fn handle_response_error(response: Response) -> Result<Response, ApiError> {
    if !response.status().is_success() {
        let status_code = response.status().as_u16();

        // 尝试解析响应体中的错误信息
        let error_message = match response.text().await {
            Ok(text) => {
                // 尝试解析为 JSON 并提取 message 字段
                match serde_json::from_str::<serde_json::Value>(&text) {
                    Ok(json) => json
                        .get("message")
                        .and_then(|v| v.as_str())
                        .unwrap_or(&text)
                        .to_string(),
                    Err(_) => text,
                }
            }
            Err(_) => format!("请求失败，状态码: {}", status_code),
        };

        return Err(ApiError::new(status_code, error_message));
    }

    Ok(response)
}

/// 发送请求并获取原始响应
async fn send_request(
    method: Method,
    server_url: &str,
    endpoint: &str,
) -> Result<Response, ApiError> {
    let url = build_url(server_url, endpoint);
    let client = get_client();

    let request = match method {
        Method::GET => client.get(&url),
        Method::POST => client.post(&url),
        Method::DELETE => client.delete(&url),
        Method::PUT => client.put(&url),
        _ => return Err(ApiError::network("不支持的 HTTP 方法".to_string())),
    };

    let response = request
        .send()
        .await
        .map_err(|e| ApiError::network(format!("发送请求失败: {}", e)))?;

    handle_response_error(response).await
}

/// 发送请求并附带 JSON 数据
async fn send_request_with_json<T: Serialize>(
    method: Method,
    server_url: &str,
    endpoint: &str,
    json_data: &T,
) -> Result<Response, ApiError> {
    let url = build_url(server_url, endpoint);
    let client = get_client();

    let request = match method {
        Method::POST => client.post(&url).json(json_data),
        Method::PUT => client.put(&url).json(json_data),
        _ => return Err(ApiError::network("该方法不支持 JSON 数据".to_string())),
    };

    let response = request
        .send()
        .await
        .map_err(|e| ApiError::network(format!("发送请求失败: {}", e)))?;

    handle_response_error(response).await
}

/// 解析响应为 ApiResponse<T> 并提取数据
async fn parse_api_response<T: for<'de> Deserialize<'de>>(
    response: Response,
) -> Result<T, ApiError> {
    let api_response: ApiResponse<T> = response
        .json()
        .await
        .map_err(|e| ApiError::network(format!("解析响应失败: {}", e)))?;

    api_response
        .data
        .ok_or_else(|| ApiError::network("服务器返回空数据".to_string()))
}

/// GET 请求并解析为 ApiResponse<T>
pub async fn api_get<T: for<'de> Deserialize<'de>>(
    server_url: &str,
    endpoint: &str,
) -> Result<T, ApiError> {
    let response = send_request(Method::GET, server_url, endpoint).await?;
    parse_api_response(response).await
}

/// POST 请求并解析为 ApiResponse<T>
pub async fn api_post<T: for<'de> Deserialize<'de>, R: Serialize>(
    server_url: &str,
    endpoint: &str,
    json_data: &R,
) -> Result<T, ApiError> {
    let response = send_request_with_json(Method::POST, server_url, endpoint, json_data).await?;
    parse_api_response(response).await
}

pub async fn api_put<T: for<'de> Deserialize<'de>, R: Serialize>(
    server_url: &str,
    endpoint: &str,
    json_data: &R,
) -> Result<T, ApiError> {
    let response = send_request_with_json(Method::PUT, server_url, endpoint, json_data).await?;
    parse_api_response(response).await
}

/// POST 请求并返回是否成功
pub async fn api_post_success<R: Serialize>(
    server_url: &str,
    endpoint: &str,
    json_data: &R,
) -> Result<bool, ApiError> {
    let response = send_request_with_json(Method::POST, server_url, endpoint, json_data).await?;
    Ok(response.status().is_success())
}

/// DELETE 请求并返回是否成功
pub async fn api_delete_success(server_url: &str, endpoint: &str) -> Result<bool, ApiError> {
    let response = send_request(Method::DELETE, server_url, endpoint).await?;
    Ok(response.status().is_success())
}

/// GET 请求并返回字节数据（用于文件下载）
pub async fn api_get_bytes(server_url: &str, endpoint: &str) -> Result<Vec<u8>, ApiError> {
    let response = send_request(Method::GET, server_url, endpoint).await?;

    let bytes = response
        .bytes()
        .await
        .map_err(|e| ApiError::network(format!("读取文件内容失败: {}", e)))?;

    Ok(bytes.to_vec())
}
