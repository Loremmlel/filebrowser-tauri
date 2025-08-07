import { forwardRef, useEffect, useRef } from 'react'
import {
  PlayIcon,
  PauseIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline'
import { useVideoStatus } from '@/hooks/video/useVideoStatus'
import { useVideoControls } from '@/hooks/video/useVideoControls'
import { formatTime } from '@/utils/stringUtil'
import { YuzuLoading } from '../Loading'
import { YuzuSpeedIndicator } from './indicator/SpeedIndicator'
import { YuzuSeekIndicator } from './indicator/SeekIndicator'
import { YuzuVolumeIndicator } from './indicator/VolumeIndicator'

interface VideoControlOverlayProps {
  videoRef: React.MutableRefObject<HTMLVideoElement | null>
  title: string
  onClose: () => void
  onSeek: (time: number) => void
  onVolumeChange: (volume: number) => void
  onSpeedChange: (speed: number) => void
  onToggleFullscreen: () => void
}

export const YuzuVideoControlOverlay = forwardRef<HTMLDivElement, VideoControlOverlayProps>(
  (
    { videoRef, title, onClose, onSeek, onVolumeChange, onSpeedChange, onToggleFullscreen },
    _ref
  ) => {
    const overlayRef = useRef<HTMLDivElement>(null)
    const titleRef = useRef<HTMLDivElement>(null)

    const {
      isPlaying,
      isLoading,
      isFullscreen,
      duration,
      currentTime,
      buffered,
      playbackRate,
      volume,
      isMuted,
      togglePlay,
      setPlaybackRate,
    } = useVideoStatus(videoRef)

    const {
      isVisible,
      showSpeedIndicator,
      showSeekIndicator,
      showVolumeIndicator,
      seekDirection,
      seekTime,
      isMobile,
      show,
      toggle,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleKeyDown,
      handleKeyUp,
    } = useVideoControls(videoRef, onSeek, onVolumeChange, onSpeedChange, onClose)

    // 标题自动滚动
    useEffect(() => {
      const titleElement = titleRef.current
      if (!titleElement) return

      const container = titleElement.parentElement
      if (!container) return

      const titleWidth = titleElement.scrollWidth
      const containerWidth = container.clientWidth

      if (titleWidth > containerWidth) {
        titleElement.style.animation = `scroll-title ${Math.max(3, titleWidth / 50)}s linear infinite`
      }
    }, [title])

    // 事件监听器设置
    useEffect(() => {
      const overlay = overlayRef.current
      if (!overlay) return

      // 鼠标移动显示控制层
      const handleMouseMove = () => {
        if (!isVisible) {
          show()
        }
      }

      // 点击中层隐藏控制层
      const handleClick = (e: MouseEvent) => {
        if (e.target === overlay) {
          toggle()
        }
      }

      // 移动端事件
      if (isMobile) {
        overlay.addEventListener('touchstart', handleTouchStart)
        overlay.addEventListener('touchmove', handleTouchMove)
        overlay.addEventListener('touchend', handleTouchEnd)
      }

      // 桌面端事件
      overlay.addEventListener('mousemove', handleMouseMove)
      overlay.addEventListener('click', handleClick)
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('keyup', handleKeyUp)

      return () => {
        if (isMobile) {
          overlay.removeEventListener('touchstart', handleTouchStart)
          overlay.removeEventListener('touchmove', handleTouchMove)
          overlay.removeEventListener('touchend', handleTouchEnd)
        }
        overlay.removeEventListener('mousemove', handleMouseMove)
        overlay.removeEventListener('click', handleClick)
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('keyup', handleKeyUp)
      }
    }, [
      isVisible,
      isMobile,
      show,
      toggle,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleKeyDown,
      handleKeyUp,
    ])

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
    const bufferedPercentage = duration > 0 ? (buffered / duration) * 100 : 0

    const speedOptions = [1, 1.25, 1.5, 2]

    return (
      <>
        {/* 样式定义 */}
        <style>{`
        @keyframes scroll-title {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        @keyframes speed-pulse {
          0%, 100% { opacity: 0.3; }
          33% { opacity: 1; }
          66% { opacity: 0.3; }
        }
        
        .speed-icon-1 { animation: speed-pulse 1.2s infinite; }
        .speed-icon-2 { animation: speed-pulse 1.2s infinite 0.4s; }
        .speed-icon-3 { animation: speed-pulse 1.2s infinite 0.8s; }
      `}</style>

        {/* 主控制覆盖层 */}
        <div
          ref={overlayRef}
          className={`absolute inset-0 z-50 flex flex-col transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* 上层 */}
          <div
            className='flex items-center justify-between 
          p-4 bg-gradient-to-b from-black/80 to-transparent'
          >
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className='p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors'
            >
              <XMarkIcon className='w-6 h-6 text-white' />
            </button>

            {/* 标题区域 */}
            <div className='flex-1 mx-4 overflow-hidden'>
              <div ref={titleRef} className='text-white font-medium whitespace-nowrap'>
                {title}
              </div>
            </div>

            {/* 全屏切换按钮 */}
            <button
              onClick={onToggleFullscreen}
              className='p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors'
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className='w-6 h-6 text-white' />
              ) : (
                <ArrowsPointingOutIcon className='w-6 h-6 text-white' />
              )}
            </button>
          </div>

          {/* 中层 */}
          <div className='flex-1 flex items-center justify-center relative'>
            {/* 加载指示器 */}
            {isLoading && <YuzuLoading className='w-12 h-12' />}

            {/* 播放/暂停按钮 */}
            {!isLoading && (
              <button
                onClick={togglePlay}
                className='p-4 rounded-full bg-black/50 hover:bg-black/70 transition-colors'
              >
                {isPlaying ? (
                  <PauseIcon className='w-12 h-12 text-white' />
                ) : (
                  <PlayIcon className='w-12 h-12 text-white' />
                )}
              </button>
            )}
          </div>

          {/* 下层 */}
          <div className='p-4 bg-gradient-to-t from-black/80 to-transparent'>
            <div className='flex items-center space-x-4'>
              {/* 播放/暂停按钮 */}
              <button
                onClick={togglePlay}
                className='p-2 rounded-full hover:bg-white/20 transition-colors'
              >
                {isPlaying ? (
                  <PauseIcon className='w-6 h-6 text-white' />
                ) : (
                  <PlayIcon className='w-6 h-6 text-white' />
                )}
              </button>

              {/* 时间显示 */}
              <div className='text-white text-sm font-mono'>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* 进度条 */}
              <div className='flex-1 relative'>
                <div className='h-2 bg-white/30 rounded-full overflow-hidden'>
                  {/* 缓冲进度 */}
                  <div
                    className='h-full bg-white/50 transition-all duration-300'
                    style={{ width: `${bufferedPercentage}%` }}
                  />
                  {/* 播放进度 */}
                  <div
                    className='h-full bg-white absolute top-0 left-0 transition-all duration-100'
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                {/* 进度条点击区域 */}
                <input
                  type='range'
                  min='0'
                  max={duration || 0}
                  value={currentTime}
                  onChange={e => onSeek(Number(e.target.value))}
                  className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                />
              </div>

              {/* 倍速选择 */}
              <div className='flex items-center space-x-1'>
                {speedOptions.map(speed => (
                  <button
                    key={speed}
                    onClick={() => {
                      setPlaybackRate(speed)
                      onSpeedChange(speed)
                    }}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      playbackRate === speed
                        ? 'bg-white text-black'
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 三倍速指示器 */}
        {showSpeedIndicator && <YuzuSpeedIndicator />}

        {/* 跳转指示器（仅移动端） */}
        {showSeekIndicator && isMobile && (
          <YuzuSeekIndicator
            seekDirection={seekDirection}
            seekTime={seekTime}
            duration={duration}
          />
        )}

        {/* 音量指示器 */}
        {showVolumeIndicator && <YuzuVolumeIndicator isMuted={isMuted} volume={volume} />}
      </>
    )
  }
)
