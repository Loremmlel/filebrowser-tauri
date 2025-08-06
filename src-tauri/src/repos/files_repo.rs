use crate::{
    models::{error::ApiError, files::FileInfo},
    repos::Repo,
};

pub trait FilesRepo: Repo {
    async fn get_files(path: &str) -> Result<Vec<FileInfo>, ApiError>;
    async fn download_file(path: &str, filename: &str) -> Result<(), ApiError>;
}
