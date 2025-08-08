import { useCallback, useEffect } from 'react'
import { TranscodeStatus } from '@/types/transcode.ts'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { useTranscodeStore } from '@/stores/transcodeStore'

export const useTranscodeStatus = () => {
  const { status, isLoading, error, setIsLoading, setStatus, clearStatus, setError } =
    useTranscodeStore()

  useEffect(() => {
    let unlisten: UnlistenFn | null = null

    const setupListener = async () => {
      try {
        unlisten = await listen<TranscodeStatus>('transcode-status-update', event => {
          setStatus(event.payload)
          setError(event.payload.error ?? null)
        })
      } catch (error) {
        console.error('设置tauri监听器失败: ', error)
      }
    }
    setupListener()

    return () => {
      unlisten?.()
    }
  }, [setError, setStatus])
  const startTranscode = useCallback(
    async (path: string) => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await invoke<TranscodeStatus>('start_transcode', { path })
        setStatus(result)
        return result
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '启动转码失败'
        setError(errorMsg)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [setError, setIsLoading, setStatus]
  )

  const stopTranscode = async () => {
    if (!status?.id) return

    try {
      setIsLoading(true)
      await invoke('stop_transcode', { id: status.id })
      setStatus(null)
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '停止转码失败'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    status,
    isLoading,
    error,
    startTranscode,
    stopTranscode,
    clearStatus,
  }
}
