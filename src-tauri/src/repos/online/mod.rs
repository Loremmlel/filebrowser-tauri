use crate::{commands::config::with_config, repos::Repo};

pub mod online_favorites_repo;
pub mod online_files_repo;
pub mod online_thumbnails_repo;
pub mod online_transcode_repo;

pub trait OnlineRepo: Repo {
    fn get_server_url() -> String {
        with_config(|config| config.server_url.clone())
    }
}
