import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useConfigStore } from '../stores/configStore'

export const useAppInitialization = () => {
  const { setServerUrl, serverUrl } = useConfigStore()

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const platform = await invoke<string>('get_platform')
        console.log('当前平台:', platform)

        // 如果是安卓系统，设置服务器地址为 10.0.2.2
        if (platform === 'android') {
          const androidServerUrl = 'http://10.0.2.2:8080'
          setServerUrl(androidServerUrl)
          console.log('安卓平台检测到，服务器地址已设置为:', androidServerUrl)
        } else {
          console.log('非安卓平台，使用默认服务器地址:', serverUrl)
        }
      } catch (error) {
        console.error('获取平台信息失败:', error)
        console.log('将使用默认服务器地址:', serverUrl)
      }
    }

    initializeApp()
  }, [setServerUrl, serverUrl])
}

