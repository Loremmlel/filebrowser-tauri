use tauri::{AppHandle, Emitter};

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
    tauri::Builder::default()
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
                                println!("Discovered server at IP: {}", ip);
                                app.emit(
                                    "service-discovered",
                                    DiscoveredServicePayload { ip: ip.to_string() },
                                )
                                .unwrap();
                                break;
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
