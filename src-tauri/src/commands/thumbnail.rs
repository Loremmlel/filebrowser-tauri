use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::OnceLock;
use tauri::{command, AppHandle, Emitter};
use tokio::sync::{RwLock, Semaphore};

use crate::commands::config::is_online;
use crate::models::error::ApiError;
use crate::repos::offline::offline_thumbnails_repo::OfflineThumbnailsRepo;
use crate::repos::online::online_thumbnails_repo::OnlineThumbnailsRepo;
use crate::repos::Repo;
use crate::utils::lru_cache::LruCache;

// 全局信号量，限制最多5个并发缩略图请求
static THUMBNAIL_SEMAPHORE: OnceLock<Semaphore> = OnceLock::new();
// 当前等待请求数量统计
static WAITING_COUNT: AtomicUsize = AtomicUsize::new(0);
// 当前处理中请求数量统计
static PROCESSING_COUNT: AtomicUsize = AtomicUsize::new(0);

// 缩略图缓存类型别名
type ThumbnailCache = LruCache<String, Vec<u8>>;

// 全局缓存实例，容量设置为200个缩略图
static THUMBNAIL_CACHE: OnceLock<RwLock<ThumbnailCache>> = OnceLock::new();

#[derive(Serialize, Deserialize)]
pub struct ThumbnailStatus {
    pub max_concurrent: usize,
    pub current_waiting: usize,
    pub current_processing: usize,
    pub available_slots: usize,
    pub cache_size: usize,
    pub cache_max_size: usize,
    pub cache_memory_usage: usize,
}

fn get_thumbnail_semaphore() -> &'static Semaphore {
    THUMBNAIL_SEMAPHORE.get_or_init(|| Semaphore::new(5))
}

fn get_thumbnail_cache() -> &'static RwLock<ThumbnailCache> {
    THUMBNAIL_CACHE.get_or_init(|| RwLock::new(LruCache::new(200)))
}

// 发送缩略图状态更新事件
async fn emit_thumbnail_status_update(app: &AppHandle) {
    if let Ok(status) = get_thumbnail_status_internal().await {
        let _ = app.emit("thumbnail-status-update", &status);
    }
}

async fn get_thumbnail_status_internal() -> Result<ThumbnailStatus, ApiError> {
    let semaphore = get_thumbnail_semaphore();
    let waiting = WAITING_COUNT.load(Ordering::Relaxed);
    let processing = PROCESSING_COUNT.load(Ordering::Relaxed);
    let available = semaphore.available_permits();

    let cache = get_thumbnail_cache().read().await;
    let cache_size = cache.len();
    let cache_max_size = cache.max_size();
    let cache_memory_usage = cache.memory_usage();
    drop(cache); // 释放读锁

    Ok(ThumbnailStatus {
        max_concurrent: 5,
        current_waiting: waiting,
        current_processing: processing,
        available_slots: available,
        cache_size,
        cache_max_size,
        cache_memory_usage,
    })
}

#[command]
pub async fn get_thumbnail_status() -> Result<ThumbnailStatus, ApiError> {
    get_thumbnail_status_internal().await
}

#[command]
pub async fn get_thumbnail(path: String, app: AppHandle) -> Result<Vec<u8>, ApiError> {
    // 首先检查缓存
    {
        let mut cache = get_thumbnail_cache().write().await;
        if let Some(cached_data) = cache.get(&path) {
            return Ok(cached_data);
        }
    }

    // 缓存未命中，增加等待计数
    WAITING_COUNT.fetch_add(1, Ordering::Relaxed);

    emit_thumbnail_status_update(&app).await;

    // 获取信号量许可，如果当前已有5个请求在处理，则等待
    let _permit = get_thumbnail_semaphore()
        .acquire()
        .await
        .map_err(|e| ApiError::network(format!("获取缩略图请求许可失败: {}", e)))?;

    // 减少等待计数，增加处理计数
    WAITING_COUNT.fetch_sub(1, Ordering::Relaxed);
    PROCESSING_COUNT.fetch_add(1, Ordering::Relaxed);

    emit_thumbnail_status_update(&app).await;

    // 执行实际的缩略图获取操作
    let result = if is_online() {
        OnlineThumbnailsRepo::get(path.clone()).await
    } else {
        OfflineThumbnailsRepo::get(path.clone()).await
    };

    // 处理完成，减少处理计数
    PROCESSING_COUNT.fetch_sub(1, Ordering::Relaxed);

    emit_thumbnail_status_update(&app).await;

    match &result {
        Ok(data) => {
            // 将结果存储到缓存
            {
                let mut cache = get_thumbnail_cache().write().await;
                cache.put(path.clone(), data.clone());
            }
            // 缓存更新后再次发送状态更新事件
            emit_thumbnail_status_update(&app).await;
        }
        Err(_e) => (),
    }

    result
    // _permit 在函数结束时自动释放
}

#[command]
pub async fn clear_thumbnail_cache(app: AppHandle) -> Result<(), ApiError> {
    let mut cache = get_thumbnail_cache().write().await;
    cache.clear();
    drop(cache); // 释放锁

    // 发送状态更新事件
    emit_thumbnail_status_update(&app).await;

    Ok(())
}
