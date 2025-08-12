use tauri::{AppHandle, Emitter};
use tauri_plugin_sql::{Migration, MigrationKind};

use crate::commands::transcode::{start_transcode, stop_transcode};
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
mod repos;
mod services;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create initial schema",
        sql: "
        create table if not exists favorites (
            id integer primary key autoincrement,
            name varchar(255) not null,
            created_at timestamp default current_timestamp,
            updated_at timestamp default current_timestamp,
            sort_order integer default 0
        );
        create unique index if not exists idx_favorites_name on favorites(name);
        create table if not exists favorite_files (
            id integer primary key autoincrement,
            favorite_id integer not null,
            filename varchar(255) not null,
            file_size integer not null,
            file_type varchar(50) not null,
            file_path text not null,
            last_modified integer not null,
            is_directory boolean default 0,
            created_at timestamp default current_timestamp,

            foreign key (favorite_id) references favorites(id) on delete cascade
        );
        create unique index if not exists idx_favorite_files_favorite_path on favorite_files(favorite_id, file_path);",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("filebrowser", migrations)
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                start_udp_listener(&app_handle).await;
            });
            Ok(())
        })
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
            start_transcode,
            stop_transcode
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

const BROADCAST_PORT: u16 = 23333;
const HANDSHAKE_MESSAGE: &str = "SHIKIYUZU CIALLO";

#[derive(Clone, serde::Serialize)]
struct DiscoveredServicePayload {
    ip: String,
}

async fn start_udp_listener(app: &AppHandle) {
    let listen_address = format!("0.0.0.0:{}", BROADCAST_PORT);
    match tokio::net::UdpSocket::bind(&listen_address).await {
        Ok(socket) => {
            println!("Listening for UDP broadcasts on {}", listen_address);
            let mut buf = [0; 1024];

            loop {
                if let Ok((len, _src_addr)) = socket.recv_from(&mut buf).await {
                    if let Ok(message) = std::str::from_utf8(&buf[..len]) {
                        if let Some((handshake, ip)) = message.split_once(":") {
                            if handshake == HANDSHAKE_MESSAGE {
                                app.emit(
                                    "service-discovered",
                                    DiscoveredServicePayload { ip: ip.to_string() },
                                )
                                .unwrap();
                            }
                        }
                    }
                }
            }
        }
        Err(e) => {
            eprintln!("Failed to bind UDP socket on {}: {}", listen_address, e);
            return;
        }
    }
}
