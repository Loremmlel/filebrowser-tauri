use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscodeStatus {
    pub id: String,
    pub status: TranscodeState,
    pub progress: f64,
    pub output_path: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum TranscodeState {
    Pending,
    Process,
    Completed,
    Error,
}
