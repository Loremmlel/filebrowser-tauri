import { MutableRefObject, useCallback, useEffect, useState } from 'react'

interface TouchData {
  startX: number
  startY: number
  startTime: number
  isLongPress: boolean
  longPressTimer: ReturnType<typeof setTimeout> | null
}

export const useVideoControls = (
  videoRef: MutableRefObject<HTMLVideoElement | null>,
  onSeek: (time: number) => void,
  onVolumeChange: (volume: number) => void,
  onSpeedChange: (speed: number) => void,
  onClose: () => void
) => {
  const [isVisible, setIsVisible] = useState(true)
  const [showSpeedIndicator, setShowSpeedIndicator] = useState(false)
  const [showSeekIndicator, setShowSeekIndicator] = useState(false)
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false)
  const [seekDirection, setSeekDirection] = useState<'forward' | 'backward' | null>(null)
  const [seekTime, setSeekTime] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [hideTimer, setHideTimer] = useState<NodeJS.Timeout | null>(null)
  const [touchData, setTouchData] = useState<TouchData>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isLongPress: false,
    longPressTimer: null,
  })
  const [isSpeedMode, setIsSpeedMode] = useState(false)
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())

  // 检测设备类型
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // 自动隐藏计时器
  const resetHideTimer = useCallback(() => {
    if (hideTimer) {
      clearTimeout(hideTimer)
    }
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 3000)
    setHideTimer(timer)
  }, [hideTimer])

  // 显示控制层
  const show = useCallback(() => {
    setIsVisible(true)
    resetHideTimer()
  }, [resetHideTimer])

  // 隐藏控制层
  const hide = useCallback(() => {
    setIsVisible(false)
    if (hideTimer) {
      clearTimeout(hideTimer)
      setHideTimer(null)
    }
  }, [hideTimer])

  // 切换控制层显示
  const toggle = useCallback(() => {
    if (isVisible) {
      hide()
    } else {
      show()
    }
  }, [isVisible, show, hide])

  // 跳转指示器控制
  const showSeekIndicatorAction = useCallback((direction: 'forward' | 'backward', time: number) => {
    setSeekDirection(direction)
    setSeekTime(time)
    setShowSeekIndicator(true)
  }, [])

  const hideSeekIndicatorAction = useCallback(() => {
    setShowSeekIndicator(false)
    setSeekDirection(null)
    setSeekTime(0)
  }, [])

  // 触摸事件处理
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0]
      const startTime = Date.now()

      // 清除之前的长按计时器
      if (touchData.longPressTimer) {
        clearTimeout(touchData.longPressTimer)
      }

      // 设置长按计时器
      const longPressTimer = setTimeout(() => {
        setTouchData(prev => ({ ...prev, isLongPress: true }))
        setIsSpeedMode(true)
        onSpeedChange(3)
        setShowSeekIndicator(true)
      }, 500)

      setTouchData({
        startX: touch.clientX,
        startY: touch.clientY,
        startTime,
        isLongPress: false,
        longPressTimer,
      })
    },
    [touchData.longPressTimer, onSpeedChange]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!videoRef.current) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - touchData.startX
      const deltaY = touch.clientY - touchData.startY
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      // 如果是长按模式，不处理移动
      if (touchData.isLongPress) return

      // 清除长按计时器（因为用户在移动）
      if (touchData.longPressTimer) {
        clearTimeout(touchData.longPressTimer)
        setTouchData(prev => ({ ...prev, longPressTimer: null }))
      }

      // 水平滑动处理快进/后退
      if (absX > absY && absX > 30) {
        const screenWidth = window.innerWidth
        const seekAmount = (deltaX / screenWidth) * 600 // 全屏滑动最多10分钟
        const direction = deltaX > 0 ? 'forward' : 'backward'
        const currentTime = videoRef.current.currentTime
        const newTime = Math.max(0, Math.min(videoRef.current.duration, currentTime + seekAmount))

        showSeekIndicatorAction(direction, newTime)
      }
      // 垂直滑动处理音量
      else if (absY > absX && absY > 30) {
        const screenHeight = window.innerHeight
        const volumeChange = -(deltaY / screenHeight) // 向上增加音量
        const currentVolume = videoRef.current.volume
        const newVolume = Math.max(0, Math.min(1, currentVolume + volumeChange))

        onVolumeChange(newVolume)
        setShowVolumeIndicator(true)
      }
    },
    [touchData, videoRef, onVolumeChange, showSeekIndicatorAction]
  )

  const handleTouchEnd = useCallback(() => {
    // 清除长按计时器
    if (touchData.longPressTimer) {
      clearTimeout(touchData.longPressTimer)
    }

    // 如果是长按模式，恢复正常速度
    if (touchData.isLongPress || isSpeedMode) {
      onSpeedChange(1)
      setIsSpeedMode(false)
      setShowSpeedIndicator(false)
    }

    // 如果有跳转，执行跳转
    if (showSeekIndicator && seekDirection) {
      onSeek(seekTime)
      setTimeout(hideSeekIndicatorAction, 500)
    }

    // 隐藏音量指示器
    if (showVolumeIndicator) {
      setTimeout(() => setShowVolumeIndicator(false), 1000)
    }

    // 重置触摸数据
    setTouchData({
      startX: 0,
      startY: 0,
      startTime: 0,
      isLongPress: false,
      longPressTimer: null,
    })
  }, [
    touchData,
    isSpeedMode,
    showSeekIndicator,
    seekDirection,
    seekTime,
    showVolumeIndicator,
    onSpeedChange,
    onSeek,
    hideSeekIndicatorAction,
  ])

  // 键盘事件处理
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!videoRef.current) return

      const newKeys = new Set(pressedKeys)
      newKeys.add(e.key)
      setPressedKeys(newKeys)

      // 长按右键三倍速
      if (e.key === 'ArrowRight' && !isSpeedMode) {
        const timer = setTimeout(() => {
          setIsSpeedMode(true)
          onSpeedChange(3)
          setShowSpeedIndicator(true)
        }, 500)

        // 存储计时器引用
        setTouchData(prev => ({ ...prev, longPressTimer: timer }))
      }
    },
    [pressedKeys, isSpeedMode, onSpeedChange]
  )

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (!videoRef.current) return

      const newKeys = new Set(pressedKeys)
      newKeys.delete(e.key)
      setPressedKeys(newKeys)

      // 清除长按计时器
      if (touchData.longPressTimer) {
        clearTimeout(touchData.longPressTimer)
        setTouchData(prev => ({ ...prev, longPressTimer: null }))
      }

      switch (e.key) {
        case 'ArrowLeft':
          // 后退10秒
          onSeek(Math.max(0, videoRef.current.currentTime - 10))
          break
        case 'ArrowRight':
          // 如果是长按模式，恢复正常速度
          if (isSpeedMode) {
            setIsSpeedMode(false)
            onSpeedChange(1)
            setShowSpeedIndicator(false)
          } else {
            // 快进10秒
            onSeek(Math.min(videoRef.current.duration, videoRef.current.currentTime + 10))
          }
          break
        case 'ArrowUp':
          // 音量增加5%
          onVolumeChange(Math.min(1, videoRef.current.volume + 0.05))
          setShowVolumeIndicator(true)
          setTimeout(() => setShowVolumeIndicator(false), 1000)
          break
        case 'ArrowDown':
          // 音量减少5%
          onVolumeChange(Math.max(0, videoRef.current.volume - 0.05))
          setShowVolumeIndicator(true)
          setTimeout(() => setShowVolumeIndicator(false), 1000)
          break
        case 'Escape':
          onClose()
          break
      }
    },
    [
      pressedKeys,
      touchData.longPressTimer,
      isSpeedMode,
      videoRef,
      onSeek,
      onVolumeChange,
      onSpeedChange,
      onClose,
    ]
  )

  // 鼠标活动时显示控制层
  useEffect(() => {
    if (isVisible) {
      resetHideTimer()
    }
  }, [isVisible, resetHideTimer])

  // 清理计时器
  useEffect(() => {
    return () => {
      if (hideTimer) {
        clearTimeout(hideTimer)
      }
      if (touchData.longPressTimer) {
        clearTimeout(touchData.longPressTimer)
      }
    }
  }, [hideTimer, touchData.longPressTimer])

  return {
    isVisible,
    showSpeedIndicator,
    showSeekIndicator,
    showVolumeIndicator,
    seekDirection,
    seekTime,
    isMobile,
    show,
    hide,
    toggle,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
    handleKeyUp,
  }
}

