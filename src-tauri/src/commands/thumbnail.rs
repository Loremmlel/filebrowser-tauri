use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::OnceLock;
use tauri::command;
use tokio::sync::Semaphore;

use crate::models::error::ApiError;
use crate::services::api_service::api_get_bytes;

// 全局信号量，限制最多5个并发缩略图请求
static THUMBNAIL_SEMAPHORE: OnceLock<Semaphore> = OnceLock::new();
// 当前等待请求数量统计
static WAITING_COUNT: AtomicUsize = AtomicUsize::new(0);
// 当前处理中请求数量统计
static PROCESSING_COUNT: AtomicUsize = AtomicUsize::new(0);

#[derive(Serialize, Deserialize)]
pub struct ThumbnailStatus {
    pub max_concurrent: usize,
    pub current_waiting: usize,
    pub current_processing: usize,
    pub available_slots: usize,
}

fn get_thumbnail_semaphore() -> &'static Semaphore {
    THUMBNAIL_SEMAPHORE.get_or_init(|| Semaphore::new(5))
}

#[command]
pub async fn get_thumbnail_status() -> ThumbnailStatus {
    let semaphore = get_thumbnail_semaphore();
    let waiting = WAITING_COUNT.load(Ordering::Relaxed);
    let processing = PROCESSING_COUNT.load(Ordering::Relaxed);
    let available = semaphore.available_permits();

    ThumbnailStatus {
        max_concurrent: 5,
        current_waiting: waiting,
        current_processing: processing,
        available_slots: available,
    }
}

#[command]
pub async fn get_thumbnail(path: String, server_url: String) -> Result<Vec<u8>, ApiError> {
    // 增加等待计数
    WAITING_COUNT.fetch_add(1, Ordering::Relaxed);
    let waiting_count = WAITING_COUNT.load(Ordering::Relaxed);
    let processing_count = PROCESSING_COUNT.load(Ordering::Relaxed);

    println!(
        "[缩略图限流] 新请求排队 - 当前等待: {}, 处理中: {}, 文件: {}",
        waiting_count, processing_count, path
    );

    // 获取信号量许可，如果当前已有5个请求在处理，则等待
    let _permit = get_thumbnail_semaphore()
        .acquire()
        .await
        .map_err(|e| ApiError::network(format!("获取缩略图请求许可失败: {}", e)))?;

    // 减少等待计数，增加处理计数
    WAITING_COUNT.fetch_sub(1, Ordering::Relaxed);
    PROCESSING_COUNT.fetch_add(1, Ordering::Relaxed);

    let waiting_count = WAITING_COUNT.load(Ordering::Relaxed);
    let processing_count = PROCESSING_COUNT.load(Ordering::Relaxed);

    println!(
        "[缩略图限流] 开始处理 - 当前等待: {}, 处理中: {}, 文件: {}",
        waiting_count, processing_count, path
    );

    // 执行实际的缩略图获取操作
    let result = async {
        let endpoint = format!("thumbnail?path={}", path);
        api_get_bytes(&server_url, &endpoint).await
    }
    .await;

    // 处理完成，减少处理计数
    PROCESSING_COUNT.fetch_sub(1, Ordering::Relaxed);
    let waiting_count = WAITING_COUNT.load(Ordering::Relaxed);
    let processing_count = PROCESSING_COUNT.load(Ordering::Relaxed);

    match &result {
        Ok(_) => println!(
            "[缩略图限流] 处理成功 - 当前等待: {}, 处理中: {}, 文件: {}",
            waiting_count, processing_count, path
        ),
        Err(e) => println!(
            "[缩略图限流] 处理失败 - 当前等待: {}, 处理中: {}, 文件: {}, 错误: {}",
            waiting_count, processing_count, path, e
        ),
    }

    result
    // _permit 在函数结束时自动释放
}
