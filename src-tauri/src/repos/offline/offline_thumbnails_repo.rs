use crate::{
    models::error::ApiError,
    repos::{offline::OfflineRepo, thumbnails_repo::ThumbnailsRepo, Repo},
};

pub struct OfflineThumbnailsRepo;

impl Repo for OfflineThumbnailsRepo {
    type Id = String;

    type Item = Vec<u8>;

    type CreateRequest = ();

    type UpdateRequest = ();

    async fn get(id: Self::Id) -> Result<Self::Item, ApiError> {
        let path_string = format!("{}{}", &Self::get_base_dir(), id);
        todo!()
    }
}

impl OfflineRepo for OfflineThumbnailsRepo {}

impl ThumbnailsRepo for OfflineThumbnailsRepo {}
