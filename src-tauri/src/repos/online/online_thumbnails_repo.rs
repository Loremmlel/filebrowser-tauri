use crate::{
    models::error::ApiError,
    repos::{online::OnlineRepo, thumbnails_repo::ThumbnailsRepo, Repo},
    services::api_service::api_get_bytes,
};

pub struct OnlineThumbnailsRepo;

impl Repo for OnlineThumbnailsRepo {
    type Id = String;
    type Item = Vec<u8>;
    type CreateRequest = ();
    type UpdateRequest = ();

    async fn get(_id: Self::Id) -> Result<Self::Item, ApiError> {
        let endpoint = format!("thumbnail?path={}", _id);
        api_get_bytes(&endpoint).await
    }
}

impl OnlineRepo for OnlineThumbnailsRepo {}

impl ThumbnailsRepo for OnlineThumbnailsRepo {}
