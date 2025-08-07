import { useCallback, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface HevcSupport {
  isSupported: boolean
  platform: string
  reason?: string
  hardwareAccelerated?: boolean
}

type platform = 'windows' | 'macos' | 'linux' | 'android' | 'ios'

export const useHevcDetect = () => {
  const [support, setSupport] = useState<HevcSupport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detectHevcSupport = useCallback(async () => {
    const currentPlatform = await invoke<platform>('get_platform')

    const video = document.createElement('video')
    video.muted = true
    video.style.display = 'none'
    document.body.appendChild(video)

    try {
      // HEVC 测试用的 MIME 类型
      const hevcMimeTypes = [
        'video/mp4; codecs="hev1.1.6.L93.B0"',
        'video/mp4; codecs="hvc1.1.6.L93.B0"',
        'video/mp4; codecs="hev1"',
        'video/mp4; codecs="hvc1"',
      ]

      let isSupported = false

      // 测试 MIME 类型支持
      for (const mimeType of hevcMimeTypes) {
        const canPlay = video.canPlayType(mimeType)
        if (canPlay === 'probably' || canPlay === 'maybe') {
          isSupported = true
          break
        }
      }

      // 平台特定的检测逻辑
      const platformSupport = await getPlatformSpecificSupport(currentPlatform, isSupported)

      return {
        isSupported: platformSupport.isSupported,
        platform: currentPlatform,
        reason: platformSupport.reason,
        hardwareAccelerated: platformSupport.hardwareAccelerated,
      }
    } catch (err) {
      return {
        isSupported: false,
        platform: currentPlatform,
        reason: `检测失败: ${err instanceof Error ? err.message : '未知错误'}`,
      }
    } finally {
      document.body.removeChild(video)
    }
  }, [])

  const checkSupport = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await detectHevcSupport()
      setSupport(result)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'HEVC 支持检测失败'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [detectHevcSupport])

  useEffect(() => {
    checkSupport()
  }, [checkSupport])

  return {
    support,
    isLoading,
    error,
  }
}

async function getPlatformSpecificSupport(
  platformName: string,
  basicSupport: boolean
): Promise<Omit<HevcSupport, 'platform'>> {
  switch (platformName) {
    case 'windows':
      return await detectWindowsHevcSupport(basicSupport)
    case 'macos':
      return await detectMacOSHevcSupport(basicSupport)
    case 'linux':
      return await detectLinuxHevcSupport(basicSupport)
    case 'android':
      return await detectAndroidHevcSupport(basicSupport)
    case 'ios':
      return await detectIOSHevcSupport(basicSupport)
    default:
      return {
        isSupported: basicSupport,
        reason: basicSupport ? '基础支持检测通过' : '平台不支持或检测失败',
      }
  }
}

async function detectWindowsHevcSupport(basicSupport: boolean) {
  if (!basicSupport) {
    return {
      isSupported: false,
      reason: '浏览器不支持 HEVC 解码',
    }
  }

  // Windows 上通常需要 HEVC Video Extensions
  // 可以通过检测特定的编解码器来判断
  try {
    const video = document.createElement('video')
    const canPlayHEVC = video.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"')

    if (canPlayHEVC === 'probably') {
      return {
        isSupported: true,
        hardwareAccelerated: true,
        reason: 'Windows HEVC 扩展已安装',
      }
    } else if (canPlayHEVC === 'maybe') {
      return {
        isSupported: true,
        hardwareAccelerated: false,
        reason: 'HEVC 支持可用，但可能需要软件解码',
      }
    }
  } catch {
    // 忽略错误，继续其他检测
  }

  return {
    isSupported: false,
    reason: '需要安装 HEVC Video Extensions 或硬件不支持',
  }
}

async function detectMacOSHevcSupport(basicSupport: boolean) {
  if (!basicSupport) {
    return {
      isSupported: false,
      reason: '浏览器不支持 HEVC 解码',
    }
  }

  // macOS 从 macOS Big Sur (11.0) 开始原生支持 HEVC
  // Safari 通常有最好的支持
  const userAgent = navigator.userAgent
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent)

  if (isSafari) {
    return {
      isSupported: true,
      hardwareAccelerated: true,
      reason: 'macOS Safari 原生支持 HEVC',
    }
  }

  return {
    isSupported: basicSupport,
    hardwareAccelerated: false,
    reason: basicSupport ? 'HEVC 支持可用' : 'Chrome/Firefox 对 HEVC 支持有限',
  }
}

async function detectLinuxHevcSupport(basicSupport: boolean) {
  if (!basicSupport) {
    return {
      isSupported: false,
      reason: '浏览器不支持 HEVC 解码或缺少系统编解码器',
    }
  }

  // Linux 上的 HEVC 支持取决于系统安装的编解码器
  return {
    isSupported: basicSupport,
    hardwareAccelerated: false,
    reason: 'HEVC 支持取决于系统编解码器安装情况',
  }
}

async function detectAndroidHevcSupport(basicSupport: boolean) {
  if (!basicSupport) {
    return {
      isSupported: false,
      reason: '设备或浏览器不支持 HEVC',
    }
  }

  // Android 从 API 21 (Android 5.0) 开始支持 HEVC
  // 但实际支持情况取决于设备硬件
  const userAgent = navigator.userAgent
  const androidVersion = userAgent.match(/Android (\d+)/)?.[1]

  if (androidVersion && parseInt(androidVersion) >= 5) {
    return {
      isSupported: true,
      hardwareAccelerated: true,
      reason: `Android ${androidVersion} 设备支持 HEVC`,
    }
  }

  return {
    isSupported: basicSupport,
    reason: 'Android 设备 HEVC 支持情况因设备而异',
  }
}

async function detectIOSHevcSupport(basicSupport: boolean) {
  if (!basicSupport) {
    return {
      isSupported: false,
      reason: '设备或浏览器不支持 HEVC',
    }
  }

  // iOS 从 iOS 11 开始支持 HEVC
  const userAgent = navigator.userAgent
  const iosVersion = userAgent.match(/OS (\d+)_/)?.[1]

  if (iosVersion && parseInt(iosVersion) >= 11) {
    return {
      isSupported: true,
      hardwareAccelerated: true,
      reason: `iOS ${iosVersion} 原生支持 HEVC`,
    }
  }

  return {
    isSupported: basicSupport,
    reason: 'iOS 设备需要 iOS 11 或更高版本支持 HEVC',
  }
}
