use crate::repos::Repo;
use tauri::AppHandle;

pub trait TranscodeRepo: Repo {
    async fn start_pooling_status(id: String, app: &AppHandle);

    async fn stop_pooling_status();
}
