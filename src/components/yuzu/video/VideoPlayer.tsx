import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Hls, { LoaderCallbacks, LoaderConfiguration, LoaderContext } from 'hls.js'
import { useConfigStore } from '@/stores/configStore'
import { useTranscodeStatus } from '@/hooks/video/useTranscodeStatus'
import { YuzuVideoControlOverlay } from './VideoControlOverlay'
import { YuzuTranscodeStatusBar } from '@/components/yuzu/TranscodeStatusBar'
import { TranscodeState } from '@/types/transcode'
import { YuzuLoading } from '@/components/yuzu/Loading'
import { toast } from '@/utils/toast'
import { convertFileSrc } from '@tauri-apps/api/core'

interface YuzuVideoPlayerProps {
  path: string
  supportHevc: boolean
  onClose: () => void
}

export const YuzuVideoPlayer: React.FC<YuzuVideoPlayerProps> = ({ path, supportHevc, onClose }) => {
  const { online, serverUrl, baseDir } = useConfigStore()
  const { startTranscode, stopTranscode, clearStatus: clearTranscodeStatus } = useTranscodeStatus()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const title = path.split('/').pop() ?? 'Video'

  const directVideoUrl = useMemo(
    () =>
      online
        ? `${serverUrl}/direct-video?path=${encodeURIComponent(path)}`
        : convertFileSrc(`${baseDir}${path}`),
    [serverUrl, path, baseDir, online]
  )

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

          loader: class extends Hls.DefaultConfig.loader {
            load(
              context: LoaderContext,
              config: LoaderConfiguration,
              callbacks: LoaderCallbacks<LoaderContext>
            ) {
              if (context.url.endsWith('.ts')) {
                const tsFragmentName = context.url.split('/').pop()
                const url = new URL(sourceUrl)
                const fullPath = decodeURIComponent(url.pathname)
                const parts = fullPath.replace(/^\/+|\/+$/g, '').split('/')
                console.log('处理TS片段加载', parts, tsFragmentName)
                const dirPath = parts.slice(0, -1).join('/')
                context.url = convertFileSrc(`${dirPath}/${tsFragmentName}`)
              }
              console.log('正在加载视频地址', context.url)
              super.load(context, config, callbacks)
            }
          },
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
    if (!initializeHls(directVideoUrl, false)) {
      // 如果不支持 HLS.js，直接使用原生播放
      if (videoRef.current) {
        videoRef.current.src = directVideoUrl
      }
    }

    setIsLoading(false)
  }, [initializeHls, directVideoUrl])

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
        const playlistUrl = online
          ? `${serverUrl}${transcodeResult.outputPath}`
          : convertFileSrc(transcodeResult.outputPath ?? '')

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
  }, [startTranscode, path, online, serverUrl, initializeHls])

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
      const doc = document as Document & {
        webkitFullscreenElement?: Element
        mozFullScreenElement?: Element
        msFullscreenElement?: Element
      }

      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)
    }

    // 监听所有可能的全屏变化事件
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
    ]

    events.forEach(event => {
      document.addEventListener(event, handleFullscreenChange)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFullscreenChange)
      })
    }
  }, [])

  const handleToggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return

    try {
      if (isFullscreen) {
        // 退出全屏
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      } else {
        // 进入全屏 - 检查各种兼容性方法
        const element = containerRef.current as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>
          mozRequestFullScreen?: () => Promise<void>
          msRequestFullscreen?: () => Promise<void>
        }

        if (element.requestFullscreen) {
          await element.requestFullscreen()
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen()
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen()
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen()
        } else {
          toast.warning('当前环境不支持全屏功能')
          return
        }
      }
    } catch (error) {
      toast.warning(`切换全屏失败: ${error instanceof Error ? error.message : '未知错误'}`)
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
