use std::collections::HashMap;
use std::hash::Hash;

/// LRU缓存条目
#[derive(Clone)]
struct CacheEntry<V> {
    value: V,
    access_time: std::time::Instant,
}

/// 通用LRU缓存实现
pub struct LruCache<K, V>
where
    K: Hash + Eq + Clone,
    V: Clone,
{
    cache: HashMap<K, CacheEntry<V>>,
    max_size: usize,
}

impl<K, V> LruCache<K, V>
where
    K: Hash + Eq + Clone,
    V: Clone,
{
    /// 创建新的LRU缓存
    pub fn new(max_size: usize) -> Self {
        Self {
            cache: HashMap::new(),
            max_size,
        }
    }

    /// 获取缓存值，如果存在则更新访问时间
    pub fn get(&mut self, key: &K) -> Option<V> {
        if let Some(entry) = self.cache.get_mut(key) {
            // 更新访问时间
            entry.access_time = std::time::Instant::now();
            Some(entry.value.clone())
        } else {
            None
        }
    }

    /// 插入或更新缓存值
    pub fn put(&mut self, key: K, value: V) {
        // 如果缓存已满，移除最旧的条目
        if self.cache.len() >= self.max_size && !self.cache.contains_key(&key) {
            self.evict_oldest();
        }

        let entry = CacheEntry {
            value,
            access_time: std::time::Instant::now(),
        };
        self.cache.insert(key, entry);
    }

    /// 清空所有缓存
    pub fn clear(&mut self) {
        self.cache.clear();
    }

    /// 获取缓存中的条目数量
    pub fn len(&self) -> usize {
        self.cache.len()
    }

    /// 获取缓存的最大容量
    pub fn max_size(&self) -> usize {
        self.max_size
    }

    /// 移除最旧的缓存条目
    fn evict_oldest(&mut self) {
        if let Some((oldest_key, _)) = self
            .cache
            .iter()
            .min_by_key(|(_, entry)| entry.access_time)
            .map(|(k, v)| (k.clone(), v.access_time))
        {
            self.cache.remove(&oldest_key);
        }
    }
}

/// 为包含Vec<u8>值的LRU缓存提供内存使用统计
impl<K> LruCache<K, Vec<u8>>
where
    K: Hash + Eq + Clone,
{
    /// 计算缓存中所有数据的总内存使用量（仅适用于Vec<u8>值）
    pub fn memory_usage(&self) -> usize {
        self.cache.values().map(|entry| entry.value.len()).sum()
    }
}
