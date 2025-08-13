use crate::{models::error::ApiError, repos::Repo};

pub trait ThumbnailsRepo: Repo {
    async fn get_image_thumbnail(_id: Self::Id) -> Result<Self::Item, ApiError> {
        todo!()
    }
    async fn get_video_thumbnail(_id: Self::Id) -> Result<Self::Item, ApiError> {
        todo!()
    }
}
