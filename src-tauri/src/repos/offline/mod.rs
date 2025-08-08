use crate::commands::config::with_config;

pub mod offline_files_repo;

pub trait OfflineRepo {
    fn get_base_dir() -> String {
        with_config(|config| config.base_dir.clone())
    }
}
