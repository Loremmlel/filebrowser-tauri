use crate::models::error::ApiError;
use crate::models::transcode::TranscodeStatus;
use crate::repos::transcode_repo::TranscodeRepo;
use crate::repos::Repo;
use crate::services::api_service::{api_delete_success, api_get, api_post};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;
use tokio::task::JoinHandle;
use tokio::time::sleep;

static POLLING_ACTIVE: AtomicBool = AtomicBool::new(false);
static POLLING_HANDLE: Mutex<Option<JoinHandle<()>>> = Mutex::const_new(None);

pub struct OnlineTranscodeRepo;

impl Repo for OnlineTranscodeRepo {
    type Id = String;
    type Item = TranscodeStatus;
    type CreateRequest = String;
    type UpdateRequest = ();

    async fn create(_data: Self::CreateRequest) -> Result<Self::Item, ApiError> {
        let endpoint = format!("transcode?path={}", &_data);
        api_post(&endpoint, &()).await
    }

    async fn get(_id: Self::Id) -> Result<Self::Item, ApiError> {
        let endpoint = format!("transcoding/{}", &_id);
        api_get(&endpoint).await
    }

    async fn delete(_id: Self::Id) -> Result<bool, ApiError> {
        let endpoint = format!("transcoding/{}", &_id);
        api_delete_success(&endpoint).await
    }
}

impl TranscodeRepo for OnlineTranscodeRepo {
    async fn start_pooling_status(id: String, app: &AppHandle) {
        if POLLING_ACTIVE.load(Ordering::Relaxed) {
            Self::stop_pooling_status().await;
        }

        POLLING_ACTIVE.store(true, Ordering::Relaxed);

        let app_clone = app.clone();
        let handle = tokio::spawn(async move {
            while POLLING_ACTIVE.load(Ordering::Relaxed) {
                match Self::get(id.clone()).await {
                    Ok(res) => {
                        Self::emit_pooling_status(&res, &app_clone).await;
                        if res.progress >= 0.99 || res.error.is_some() {
                            break;
                        }
                    }
                    Err(_) => {}
                }

                sleep(Duration::from_secs(2)).await;
            }
            let mut handle = POLLING_HANDLE.lock().await;
            *handle = None;
            POLLING_ACTIVE.store(false, Ordering::Relaxed);
        });
        let mut polling_handle = POLLING_HANDLE.lock().await;
        *polling_handle = Some(handle);
    }

    async fn stop_pooling_status() {
        POLLING_ACTIVE.store(false, Ordering::Relaxed);
        let mut polling_handle = POLLING_HANDLE.lock().await;
        if let Some(handle) = polling_handle.take() {
            let _ = handle.await;
        }
    }
}

impl OnlineTranscodeRepo {
    async fn emit_pooling_status(status: &TranscodeStatus, app: &AppHandle) {
        let _ = app.emit("transcode-status-update", status);
    }
}