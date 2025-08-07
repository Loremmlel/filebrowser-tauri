import { MutableRefObject, useCallback, useEffect, useState } from 'react'

export const useVideoStatus = (videoRef: MutableRefObject<HTMLVideoElement | null>) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function handleEvent(event: Event) {
      switch (event.type) {
        case 'play':
          setIsPlaying(true)
          break
        case 'pause':
          setIsPlaying(false)
          break
        case 'waiting':
          setIsLoading(true)
          break
        case 'playing':
          setIsLoading(false)
          break
        case 'timeupdate':
          setCurrentTime(video!.currentTime)
          setBuffered(video!.buffered.length > 0 ? video!.buffered.end(0) : 0)
          break
        case 'durationchange':
          setDuration(video!.duration)
          break
        case 'ratechange':
          setPlaybackRate(video!.playbackRate)
          break
        case 'volumechange':
          setVolume(video!.volume)
          setIsMuted(video!.muted)
          break
        case 'error':
          setError(video!.error?.message ?? '视频播放错误')
          break
        case 'enterpictureinpicture':
        case 'leavepictureinpicture':
          setIsFullscreen(document.pictureInPictureElement === video)
          break
        case 'fullscreenchange':
          setIsFullscreen(document.fullscreenElement === video)
          break
        default:
          break
      }
    }

    function init() {
      setDuration(video!.duration)
      setPlaybackRate(video!.playbackRate)
      setVolume(video!.volume)
      setIsMuted(video!.muted)
    }

    const events = [
      'play',
      'pause',
      'waiting',
      'playing',
      'timeupdate',
      'durationchange',
      'ratechange',
      'volumechange',
      'error',
      'enterpictureinpicture',
      'leavepictureinpicture',
      'fullscreenchange',
    ]
    events.forEach(event => {
      video.addEventListener(event, handleEvent)
    })
    init()

    return () => {
      events.forEach(event => {
        video.removeEventListener(event, handleEvent)
      })
    }
  }, [videoRef])

  const controls = {
    play: useCallback(() => videoRef.current?.play(), [videoRef]),
    pause: useCallback(() => videoRef.current?.pause(), [videoRef]),
    togglePlay: useCallback(() => {
      if (isPlaying) {
        videoRef.current?.pause()
      } else {
        videoRef.current?.play()
      }
    }, [isPlaying, videoRef]),
    seek: useCallback(
      (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time
        }
      },
      [videoRef]
    ),
    setVolume: useCallback(
      (volume: number) => {
        if (videoRef.current) {
          videoRef.current.volume = volume
        }
      },
      [videoRef]
    ),
    setPlaybackRate: useCallback(
      (rate: number) => {
        if (videoRef.current) {
          videoRef.current.playbackRate = rate
        }
      },
      [videoRef]
    ),
    toggleFullscreen: useCallback(async () => {
      if (!videoRef.current) {
        return
      }

      try {
        if (isFullscreen) {
          await document.exitFullscreen()
        } else {
          await videoRef.current.requestFullscreen()
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : '切换全屏错误')
      }
    }, [isFullscreen, videoRef]),
  }

  return {
    isPlaying,
    isLoading,
    isFullscreen,
    duration,
    currentTime,
    buffered,
    playbackRate,
    volume,
    isMuted,
    error,
    ...controls,
  }
}
