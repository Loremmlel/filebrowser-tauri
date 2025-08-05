use crate::{models::error::ApiError, repos::Repo};

pub trait ThumbnailsRepo: Repo {
    async fn get_thumbnail(path: &str) -> Result<Vec<u8>, ApiError>;
}
