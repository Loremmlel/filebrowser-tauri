import { useCallback, useEffect } from 'react'
import { TranscodeStatus } from '@/types/transcode.ts'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { useTranscodeStore } from '@/stores/transcodeStore'
import { transcodeService } from '@/api/transcodeService'

export const useTranscodeStatus = () => {
  const { status, isLoading, error, setIsLoading, setStatus, clearStatus, setError } =
    useTranscodeStore()

  useEffect(() => {
    let unlisten: UnlistenFn | null = null

    const setupListener = async () => {
      try {
        unlisten = await listen<TranscodeStatus>('transcode-status', event => {
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
        const result = await transcodeService.startTranscode(path)
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
    // React的反直觉行为：即使useCallback依赖了status，有时还是会有时序问题
    // 所以直接从store获取最新状态比较保险 🤷‍♂️
    const currentStatus = useTranscodeStore.getState().status
    if (!currentStatus?.id) return

    try {
      setIsLoading(true)
      await transcodeService.stopTranscode(currentStatus.id)
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
