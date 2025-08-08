use crate::{
    models::{error::ApiError, files::FileInfo},
    repos::{files_repo::FilesRepo, offline::OfflineRepo, Repo},
};

pub struct OfflineFilesRepo;

impl Repo for OfflineFilesRepo {
    type Id = String;
    type Item = FileInfo;
    type CreateRequest = ();
    type UpdateRequest = ();
}

impl OfflineRepo for OfflineFilesRepo {}

impl FilesRepo for OfflineFilesRepo {
    async fn get_files(path: &str) -> Result<Vec<FileInfo>, ApiError> {
        todo!()
    }

    async fn download_file(path: &str, filename: &str) -> Result<(), ApiError> {
        todo!()
    }
}
