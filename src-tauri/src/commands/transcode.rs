use crate::models::error::ApiError;
use crate::models::transcode::TranscodeStatus;
use crate::repos::online::online_transcode_repo::OnlineTranscodeRepo;
use crate::repos::transcode_repo::TranscodeRepo;
use crate::repos::Repo;
use tauri::{command, AppHandle};

#[command]
pub async fn start_transcode(path: String, app: AppHandle) -> Result<TranscodeStatus, ApiError> {
    let transcode_status = OnlineTranscodeRepo::create(path).await;
    match transcode_status {
        Ok(status) => {
            OnlineTranscodeRepo::start_pooling_status(status.id.clone(), &app).await;
            Ok(status)
        }
        Err(e) => {
            Err(e.clone())
        }
    }
}

pub async fn stop_transcode(id: String) -> Result<bool, ApiError> {
    OnlineTranscodeRepo::stop_pooling_status().await;
    OnlineTranscodeRepo::delete(id).await
}