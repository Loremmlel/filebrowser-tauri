import { Store } from '@tauri-apps/plugin-store'

export interface AppConfig {
  online: boolean
  serverUrl: string
  baseDir: string
}

const STORE_KEY = 'app-config'
const store = await Store.load('.settings.dat')

export const configService = {
  async getConfig(): Promise<AppConfig | null> {
    try {
      const config = await store.get<AppConfig>(STORE_KEY)
      console.log('获取配置:', config)
      return config ?? null
    } catch (error) {
      console.error('获取配置失败:', error)
      return null
    }
  },

  async saveConfig(config: AppConfig): Promise<void> {
    try {
      await store.set(STORE_KEY, config)
      await store.save()
    } catch (error) {
      console.error('保存配置失败:', error)
      throw error
    }
  },

  async isFirstLaunch(): Promise<boolean> {
    try {
      const config = await this.getConfig()
      return !config
    } catch (error) {
      console.error('检查首次启动状态失败:', error)
      return true
    }
  },
}
