import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

export interface ThumbnailStatus {
  max_concurrent: number
  current_waiting: number
  current_processing: number
  available_slots: number
  cache_size: number
  cache_max_size: number
  cache_memory_usage: number
}

export const useThumbnailStatus = () => {
  const [status, setStatus] = useState<ThumbnailStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await invoke<ThumbnailStatus>('get_thumbnail_status')
      setStatus(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取缩略图状态失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let unlisten: UnlistenFn | null = null

    // 初始加载
    fetchStatus()

    // 监听缩略图状态更新事件
    const setupListener = async () => {
      try {
        unlisten = await listen<ThumbnailStatus>('thumbnail-status', event => {
          setStatus(event.payload)
          setError(null)
        })
      } catch (err) {
        console.error('Failed to setup thumbnail status listener:', err)
      }
    }

    setupListener()

    return () => {
      unlisten?.()
    }
  }, [fetchStatus])

  const clearCache = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      await invoke('clear_thumbnail_cache')
      // 清理缓存后刷新状态
      await fetchStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : '清理缓存失败')
    } finally {
      setIsLoading(false)
    }
  }, [fetchStatus])

  return {
    status,
    isLoading,
    error,
    clearCache,
  }
}
