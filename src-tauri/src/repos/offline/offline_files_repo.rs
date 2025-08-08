use crate::{
    models::files::FileInfo,
    repos::{offline::OfflineRepo, Repo},
};

pub struct OfflineFilesRepo;

impl Repo for OfflineFilesRepo {
    type Id = String;
    type Item = FileInfo;
    type CreateRequest = ();
    type UpdateRequest = ();
}

impl OfflineRepo for OfflineFilesRepo {}

impl OfflineFilesRepo {
    
}
