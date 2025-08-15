use crate::models::transcode::TranscodeStatus;
use crate::repos::offline::offline_transcode_repo::OfflineTranscodeRepo;
use crate::repos::online::online_transcode_repo::OnlineTranscodeRepo;
use crate::repos::transcode_repo::TranscodeRepo;
use crate::repos::Repo;
use crate::{commands::config::is_online, models::error::ApiError};
use tauri::{command, AppHandle};

#[command]
pub async fn start_transcode(path: String, app: AppHandle) -> Result<TranscodeStatus, ApiError> {
    if is_online() {
        let transcode_status = OnlineTranscodeRepo::create(path).await;
        match transcode_status {
            Ok(status) => {
                OnlineTranscodeRepo::start_pooling_status(status.id.clone(), &app).await;
                Ok(status)
            }
            Err(e) => Err(e),
        }
    } else {
        OfflineTranscodeRepo::set_app_handle(&app).await;
        OfflineTranscodeRepo::create(path).await
    }
}

#[command]
pub async fn stop_transcode(id: String) -> Result<bool, ApiError> {
    if is_online() {
        OnlineTranscodeRepo::stop_pooling_status().await;
        OnlineTranscodeRepo::delete(id).await
    } else {
        OfflineTranscodeRepo::delete(id).await
    }
}
