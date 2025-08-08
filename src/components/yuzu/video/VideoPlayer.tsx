import React, { useCallback, useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { useConfigStore } from '@/stores/configStore'
import { useTranscodeStatus } from '@/hooks/video/useTranscodeStatus'
import { YuzuVideoControlOverlay } from './VideoControlOverlay'
import { YuzuTranscodeStatusBar } from '@/components/yuzu/TranscodeStatusBar'
import { TranscodeState } from '@/types/transcode'
import { YuzuLoading } from '@/components/yuzu/Loading'

interface YuzuVideoPlayerProps {
  path: string
  supportHevc: boolean
  onClose: () => void
}

export const YuzuVideoPlayer: React.FC<YuzuVideoPlayerProps> = ({ path, supportHevc, onClose }) => {
  const { serverUrl } = useConfigStore()
  const { startTranscode, stopTranscode, clearStatus: clearTranscodeStatus } = useTranscodeStatus()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const title = path.split('/').pop() ?? 'Video'

  const cleanupHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
  }, [])

  // 初始化HLS播放器的通用函数
  const initializeHls = useCallback(
    (sourceUrl: string, useLoadSource = true) => {
      if (!videoRef.current) return false

      if (Hls.isSupported()) {
        cleanupHls()

        const hls = new Hls({
          maxBufferLength: 600,
          autoStartLoad: true,
          maxBufferHole: 1,
        })

        hlsRef.current = hls
        hls.attachMedia(videoRef.current)

        if (useLoadSource) {
          hls.loadSource(sourceUrl)
        } else {
          // 直接播放模式，设置 src 而不是 loadSource
          videoRef.current.src = sourceUrl
        }

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false)
        })

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError(`网络错误，请检查网络连接。 信息: ${data.details}`)
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError('媒体错误，视频格式不支持')
                break
              default:
                setError(`播放器错误。 信息: ${data.details}`)
                break
            }
          }
        })

        return true
      }
      return false
    },
    [cleanupHls]
  )

  // 设置直接播放（支持HEVC）
  const setupDirectPlay = useCallback(() => {
    const directVideoUrl = `${serverUrl}/direct-video?path=${encodeURIComponent(path)}`

    if (!initializeHls(directVideoUrl, false)) {
      // 如果不支持 HLS.js，直接使用原生播放
      if (videoRef.current) {
        videoRef.current.src = directVideoUrl
      }
    }

    setIsLoading(false)
  }, [serverUrl, path, initializeHls])

  // 设置HLS播放（需要转码）
  const setupHlsPlay = useCallback(async () => {
    if (!videoRef.current) return

    try {
      setIsLoading(true)

      const transcodeResult = await startTranscode(path)

      if (
        transcodeResult.status === TranscodeState.Processing ||
        transcodeResult.status === TranscodeState.Completed
      ) {
        const playlistUrl = `${serverUrl}/video/${transcodeResult.id}/playlist.m3u8`

        if (!initializeHls(playlistUrl, true)) {
          // Safari原生支持HLS的fallback
          if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
            videoRef.current.src = playlistUrl
            setIsLoading(false)
          } else {
            setError('浏览器不支持HLS播放')
          }
        }
      } else {
        setError('转码启动失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '启动转码失败')
      setIsLoading(false)
    }
  }, [serverUrl, path, startTranscode, initializeHls])

  // 初始化视频播放
  useEffect(() => {
    if (supportHevc) {
      setupDirectPlay()
    } else {
      setupHlsPlay()
    }

    return () => {
      cleanupHls()
      // 清理时不调用stopTranscode和clearStatus，让组件自然卸载
    }
  }, [supportHevc, setupDirectPlay, setupHlsPlay, cleanupHls])

  // 组件卸载时清理转码状态
  useEffect(() => {
    return () => {
      stopTranscode()
      clearTranscodeStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const handleToggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return

    try {
      if (isFullscreen) {
        await document.exitFullscreen()
      } else {
        await containerRef.current.requestFullscreen()
      }
    } catch (err) {
      console.error('切换全屏失败:', err)
    }
  }, [isFullscreen])

  // 错误显示
  if (error) {
    return (
      <div className='fixed inset-0 bg-black flex items-center justify-center z-50'>
        <div className='text-white text-center'>
          <h2 className='text-xl font-semibold mb-4'>视频播放错误</h2>
          <p className='text-gray-300 mb-6'>{error}</p>
          <button
            onClick={onClose}
            className='px-6 py-2 bg-blue-600 text-white 
            rounded-lg hover:bg-blue-700 transition-colors'
          >
            关闭
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`fixed inset-0 bg-black z-50 ${isFullscreen ? 'cursor-none' : ''}`}
      >
        {/* 视频元素 */}
        <video
          ref={videoRef}
          className='w-full h-full object-contain'
          controls={false}
          autoPlay
          playsInline
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onError={() => setError('视频加载失败')}
        />

        {/* 加载指示器 */}
        {isLoading && (
          <div className='absolute inset-0 flex items-center justify-center bg-black/50'>
            <YuzuLoading className='w-16 h-16' />
          </div>
        )}

        {/* 视频控制覆盖层 */}
        <YuzuVideoControlOverlay
          videoRef={videoRef}
          title={title}
          onClose={onClose}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </div>

      {/* 转码状态栏 */}
      {!supportHevc && <YuzuTranscodeStatusBar />}
    </>
  )
}
