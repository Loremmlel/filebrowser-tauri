import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useConfigStore } from '../stores/configStore'
import { toast } from '@/utils/toast'
import { listen, UnlistenFn } from '@tauri-apps/api/event'

export const useAppInitialization = () => {
  const [showInitModal, setShowInitModal] = useState(true)
  const [udpBroadcastIp, setUdpBroadcastIp] = useState<string | null>(null)
  const { serverUrl, setServerUrl, setBaseDir, setOnline } = useConfigStore()

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const platform = await invoke<string>('get_platform')

        // 如果是安卓系统，设置服务器地址为 10.0.2.2
        if (platform === 'android') {
          const androidServerUrl = 'http://10.0.2.2:8080'
          setServerUrl(androidServerUrl)
        }
      } catch (error) {
        console.error('获取平台信息失败:', error)
      }
    }

    initializeApp()
  }, [setServerUrl, serverUrl])

  useEffect(() => {
    let unlisten: UnlistenFn | null = null

    async function setupListener() {
      try {
        unlisten = await listen<{ ip: string }>('service-discovered', event => {
          setUdpBroadcastIp(event.payload.ip)
        })
      } catch (error) {
        toast.error(`设置UDP监听失败: ${error}`)
      }
    }
    setupListener()
    return () => {
      unlisten?.()
    }
  }, [])

  async function configure(newBaseDir: string, newServerUrl: string, isOnline: boolean) {
    setBaseDir(newBaseDir)
    setServerUrl(newServerUrl)
    setOnline(isOnline)
    await invoke('set_app_config', {
      config: {
        baseDir: newBaseDir,
        serverUrl: newServerUrl,
        online: isOnline,
      },
    })
    toast.success('应用配置已保存')
    setShowInitModal(false)
  }

  return {
    showInitModal,
    udpBroadcastIp,
    configure,
  }
}
