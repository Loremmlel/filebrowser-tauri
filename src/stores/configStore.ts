import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ConfigState {
  online: boolean
  serverUrl: string
  baseDir: string
}

interface ConfigStore extends ConfigState {
  setServerUrl(serverUrl: string): void

  setBaseDir(baseDir: string): void

  setOnline(online: boolean): void
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    set => ({
      serverUrl: 'http://localhost:8080',
      baseDir: 'E:/ZTEMP/kukuku',
      online: true,

      setServerUrl: serverUrl => {
        set({ serverUrl })
      },
      setBaseDir(baseDir: string) {
        set({ baseDir })
      },
      setOnline(online: boolean) {
        set({ online })
      },
    }),
    { name: 'config' }
  )
)
