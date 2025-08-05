use crate::{
    models::error::ApiError,
    repos::{online::OnlineRepo, thumbnails_repo::ThumbnailsRepo, Repo},
    services::api_service::api_get_bytes,
};

pub struct OnlineThumbnailsRepo;

impl Repo for OnlineThumbnailsRepo {}

impl OnlineRepo for OnlineThumbnailsRepo {}

impl ThumbnailsRepo for OnlineThumbnailsRepo {
    async fn get_thumbnail(path: &str) -> Result<Vec<u8>, ApiError> {
        let endpoint = format!("thumbnail?path={}", path);
        api_get_bytes(&endpoint).await
    }
}
