import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ConfigState {
  online: boolean
  serverUrl: string
  baseDir: string
  supportHevc?: boolean
}

interface ConfigStore extends ConfigState {
  setServerUrl(serverUrl: string): void

  setBaseDir(baseDir: string): void

  setOnline(online: boolean): void

  setSupportHevc(supportHevc: boolean): void
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    set => ({
      serverUrl: 'http://localhost:8080',
      baseDir: 'E:/ZTEMP/kukuku',
      online: true,
      supportHevc: undefined,

      setServerUrl: serverUrl => {
        set({ serverUrl })
      },
      setBaseDir(baseDir: string) {
        set({ baseDir })
      },
      setOnline(online: boolean) {
        set({ online })
      },
      setSupportHevc(supportHevc: boolean) {
        set({ supportHevc })
      },
    }),
    { name: 'config' }
  )
)
