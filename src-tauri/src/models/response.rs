use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ApiResponse<T> {
    pub message: String,
    pub data: Option<T>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: Option<T>) -> Self {
        ApiResponse {
            message: "Success".to_string(),
            data,
        }
    }

    pub fn error(message: String) -> Self {
        ApiResponse {
            message,
            data: None,
        }
    }
}
