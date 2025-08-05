import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useConfigStore } from '../stores/configStore'

export const useAppInitialization = () => {
  const [showInitModal, setShowInitModal] = useState(true)
  const { serverUrl, setServerUrl, setBaseDir, setOnline } = useConfigStore()

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const platform = await invoke<string>('get_platform')

        // 如果是安卓系统，设置服务器地址为 10.0.2.2
        if (platform === 'android') {
          const androidServerUrl = 'http://10.0.2.2:8080'
          setServerUrl(androidServerUrl)
        } else {
        }
      } catch (error) {
        console.error('获取平台信息失败:', error)
      }
    }

    initializeApp()
  }, [setServerUrl, serverUrl])

  function configure(newBaseDir: string, newServerUrl: string, isOnline: boolean) {
    setBaseDir(newBaseDir)
    setServerUrl(newServerUrl)
    setOnline(isOnline)
    invoke('set_app_config', {
      baseDir: newBaseDir,
      serverUrl: newServerUrl,
      online: isOnline,
    })
    setShowInitModal(false)
  }

  return {
    showInitModal,
    configure,
  }
}
