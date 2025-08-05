use crate::commands::{
    config::{get_app_config, set_app_config},
    favorites::{
        add_file_to_favorite, create_favorite, delete_favorite, delete_favorite_file,
        get_all_favorite_files, get_favorites,
    },
    files::{delete_file, download_file, get_files},
    os::get_platform,
    thumbnail::{clear_thumbnail_cache, get_thumbnail, get_thumbnail_status},
};

mod commands;
mod models;
mod services;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_app_config,
            set_app_config,
            get_platform,
            get_files,
            delete_file,
            download_file,
            get_thumbnail,
            get_thumbnail_status,
            clear_thumbnail_cache,
            get_favorites,
            create_favorite,
            delete_favorite,
            add_file_to_favorite,
            get_all_favorite_files,
            delete_favorite_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
