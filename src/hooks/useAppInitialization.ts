import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useConfigStore } from '../stores/configStore'
import { toast } from '@/utils/toast'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { configService, AppConfig } from '@/services/configService'

export const useAppInitialization = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null)
  const [udpBroadcastIp, setUdpBroadcastIp] = useState<string | null>(null)
  const { setServerUrl, setBaseDir, setOnline } = useConfigStore()

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 检查是否首次启动
        const firstLaunch = await configService.isFirstLaunch()
        setIsFirstLaunch(firstLaunch)

        if (!firstLaunch) {
          // 不是首次启动，加载保存的配置
          const savedConfig = await configService.getConfig()
          if (savedConfig) {
            setServerUrl(savedConfig.serverUrl)
            setBaseDir(savedConfig.baseDir)
            setOnline(savedConfig.online)

            // 应用配置到后端
            await invoke('set_app_config', {
              config: {
                baseDir: savedConfig.baseDir,
                serverUrl: savedConfig.serverUrl,
                online: savedConfig.online,
              },
            })
          }
        } else {
          // 首次启动，检查平台并设置默认值
          const platform = await invoke<string>('get_platform')

          // 如果是安卓系统，设置服务器地址为 10.0.2.2
          if (platform === 'android') {
            const androidServerUrl = 'http://10.0.2.2:8080'
            setServerUrl(androidServerUrl)
          }
        }
      } catch (error) {
        console.error('应用初始化失败:', error)
        setIsFirstLaunch(true) // 发生错误时默认显示初始化界面
      }
    }

    initializeApp()
  }, [setServerUrl, setBaseDir, setOnline])

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
    try {
      // 更新状态
      setBaseDir(newBaseDir)
      setServerUrl(newServerUrl)
      setOnline(isOnline)

      // 保存到 tauri store
      const config: AppConfig = {
        baseDir: newBaseDir,
        serverUrl: newServerUrl,
        online: isOnline,
      }
      await configService.saveConfig(config)

      // 发送到后端
      await invoke('set_app_config', {
        config: {
          baseDir: newBaseDir,
          serverUrl: newServerUrl,
          online: isOnline,
        },
      })

      toast.success('应用配置已保存')
    } catch (error) {
      toast.error('保存配置失败', error)
    }
  }

  async function refreshConfig() {
    try {
      const config = await configService.getConfig()
      if (config) {
        setIsFirstLaunch(false)
        setServerUrl(config.serverUrl)
        setBaseDir(config.baseDir)
        setOnline(config.online)
      }
    } catch (error) {
      toast.error('刷新配置失败', error)
    }
  }

  return {
    isFirstLaunch,
    udpBroadcastIp,
    configure,
    refreshConfig,
  }
}
