import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react'

interface TouchData {
  startX: number
  startY: number
  startTime: number
  isLongPress: boolean
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
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hideVolumeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [touchData, setTouchData] = useState<TouchData>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isLongPress: false,
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
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
    }
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 3000)
  }, [])

  function resetHideVolumeTimer(createNew = false) {
    if (hideVolumeTimerRef.current) {
      clearTimeout(hideVolumeTimerRef.current)
      hideVolumeTimerRef.current = null
    }
    if (createNew) {
      hideVolumeTimerRef.current = setTimeout(() => {
        setShowVolumeIndicator(false)
      }, 1000)
    }
  }

  // 显示控制层
  function show() {
    setIsVisible(true)
    resetHideTimer()
  }

  // 隐藏控制层
  function hide() {
    setIsVisible(false)
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  // 切换控制层显示
  function toggle() {
    if (isVisible) {
      hide()
    } else {
      show()
    }
  }

  // 跳转指示器控制
  function showSeekIndicatorAction(direction: 'forward' | 'backward', time: number) {
    setSeekDirection(direction)
    setSeekTime(time)
    setShowSeekIndicator(true)
  }

  function hideSeekIndicatorAction() {
    setShowSeekIndicator(false)
    setSeekDirection(null)
    setSeekTime(0)
  }

  // 触摸事件处理
  function handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0]
    const startTime = Date.now()

    // 清除之前的长按计时器
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    // 设置长按计时器
    longPressTimerRef.current = setTimeout(() => {
      setTouchData(prev => ({ ...prev, isLongPress: true }))
      setIsSpeedMode(true)
      onSpeedChange(3)
      setShowSpeedIndicator(true)
    }, 500)

    setTouchData({
      startX: touch.clientX,
      startY: touch.clientY,
      startTime,
      isLongPress: false,
    })
  }

  function handleTouchMove(e: TouchEvent) {
    if (!videoRef.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchData.startX
    const deltaY = touch.clientY - touchData.startY
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // 如果是长按模式，不处理移动
    if (touchData.isLongPress) return

    // 清除长按计时器（因为用户在移动）
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
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
  }

  function handleTouchEnd() {
    // 清除长按计时器
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
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
      resetHideVolumeTimer(true)
    }

    // 重置触摸数据
    setTouchData({
      startX: 0,
      startY: 0,
      startTime: 0,
      isLongPress: false,
    })
  }

  // 键盘事件处理
  function handleKeyDown(e: KeyboardEvent) {
    if (!videoRef.current) return

    const newKeys = new Set(pressedKeys)
    newKeys.add(e.key)
    setPressedKeys(newKeys)

    // 长按右键三倍速
    if (e.key === 'ArrowRight' && !isSpeedMode) {
      // 存储计时器引用
      longPressTimerRef.current = setTimeout(() => {
        setIsSpeedMode(true)
        onSpeedChange(3)
        setShowSpeedIndicator(true)
      }, 500)
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (!videoRef.current) return

    const newKeys = new Set(pressedKeys)
    newKeys.delete(e.key)
    setPressedKeys(newKeys)

    // 清除长按计时器
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
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
        resetHideVolumeTimer(true)
        break
      case 'ArrowDown':
        // 音量减少5%
        onVolumeChange(Math.max(0, videoRef.current.volume - 0.05))
        setShowVolumeIndicator(true)
        resetHideVolumeTimer(true)
        break
      case 'Escape':
        onClose()
        break
    }
  }

  // 鼠标活动时显示控制层
  useEffect(() => {
    if (isVisible) {
      resetHideTimer()
    }
  }, [isVisible, resetHideTimer])

  // 清理计时器
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

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
