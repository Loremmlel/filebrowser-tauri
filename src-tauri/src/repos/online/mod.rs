use crate::repos::Repo;

pub mod online_favorites_repo;
pub mod online_files_repo;
pub mod online_thumbnails_repo;

pub trait OnlineRepo: Repo {}
