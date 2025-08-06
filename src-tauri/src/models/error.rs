use serde::{Deserialize, Serialize};

/// API 错误类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiError {
    pub status_code: u16,
    pub message: String,
    pub error_type: ErrorType,
}

/// 错误类型分类
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ErrorType {
    /// 客户端错误 (4xx) - 显示为警告
    Warning,
    /// 服务器错误 (5xx) - 显示为错误
    Error,
    /// 网络错误或其他错误
    Network,
    /// 未实现错误
    NotImplemented,
}

impl ApiError {
    pub fn new(status_code: u16, message: String) -> Self {
        let error_type = match status_code {
            400..=499 => ErrorType::Warning,
            500..=599 => ErrorType::Error,
            _ => ErrorType::Network,
        };

        Self {
            status_code,
            message,
            error_type,
        }
    }

    pub fn network(message: String) -> Self {
        Self {
            status_code: 0,
            message,
            error_type: ErrorType::Network,
        }
    }
    
    pub fn not_implemented(fn_name: &str) -> Self {
        Self {
            status_code: 599,
            message: format!("函数没有实现: {}", fn_name),
            error_type: ErrorType::NotImplemented
        }
    }
}

impl std::fmt::Display for ApiError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for ApiError {}
