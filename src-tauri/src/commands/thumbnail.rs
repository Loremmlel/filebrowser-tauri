use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::OnceLock;
use tauri::command;
use tokio::sync::{RwLock, Semaphore};

use crate::models::error::ApiError;
use crate::services::api_service::api_get_bytes;
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

#[command]
pub async fn get_thumbnail_status() -> ThumbnailStatus {
    let semaphore = get_thumbnail_semaphore();
    let waiting = WAITING_COUNT.load(Ordering::Relaxed);
    let processing = PROCESSING_COUNT.load(Ordering::Relaxed);
    let available = semaphore.available_permits();

    // 获取缓存信息
    let cache = get_thumbnail_cache().read().await;
    let cache_size = cache.len();
    let cache_max_size = cache.max_size();
    let cache_memory_usage = cache.memory_usage();
    drop(cache); // 释放读锁

    ThumbnailStatus {
        max_concurrent: 5,
        current_waiting: waiting,
        current_processing: processing,
        available_slots: available,
        cache_size,
        cache_max_size,
        cache_memory_usage,
    }
}

#[command]
pub async fn get_thumbnail(path: String, server_url: String) -> Result<Vec<u8>, ApiError> {
    // 首先检查缓存
    {
        let mut cache = get_thumbnail_cache().write().await;
        if let Some(cached_data) = cache.get(&path) {
            println!("[缩略图缓存] 缓存命中 - 文件: {}", path);
            return Ok(cached_data);
        }
    }

    // 缓存未命中，增加等待计数
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
        Ok(data) => {
            println!(
                "[缩略图限流] 处理成功 - 当前等待: {}, 处理中: {}, 文件: {}",
                waiting_count, processing_count, path
            );

            // 将结果存储到缓存
            {
                let mut cache = get_thumbnail_cache().write().await;
                cache.put(path.clone(), data.clone());
                println!(
                    "[缩略图缓存] 已缓存 - 文件: {}, 缓存大小: {}",
                    path,
                    cache.len()
                );
            }
        }
        Err(e) => println!(
            "[缩略图限流] 处理失败 - 当前等待: {}, 处理中: {}, 文件: {}, 错误: {}",
            waiting_count, processing_count, path, e
        ),
    }

    result
    // _permit 在函数结束时自动释放
}

#[command]
pub async fn clear_thumbnail_cache() -> Result<(), ApiError> {
    let mut cache = get_thumbnail_cache().write().await;
    let old_size = cache.len();
    let old_memory = cache.memory_usage();
    cache.clear();
    println!(
        "[缩略图缓存] 缓存已清理 - 原大小: {}, 原内存使用: {} bytes",
        old_size, old_memory
    );
    Ok(())
}
