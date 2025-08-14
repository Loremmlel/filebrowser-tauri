use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TranscodeStatus {
    pub id: String,
    pub status: TranscodeState,
    pub progress: f64,
    pub output_path: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum TranscodeState {
    Pending,
    Processing,
    Completed,
    Error,
}
