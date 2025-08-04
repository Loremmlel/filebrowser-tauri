import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ConfigState {
  serverUrl: string
}

interface ConfigStore extends ConfigState {
  setServerUrl(serverUrl: string): void
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    set => ({
      serverUrl: 'http://localhost:8080',

      setServerUrl: serverUrl => {
        set({ serverUrl })
      },
    }),
    { name: 'config' }
  )
)
