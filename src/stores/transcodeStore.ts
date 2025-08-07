import { TranscodeStatus } from '@/types/transcode'
import { create } from 'zustand'

interface TranscodeState {
  status: TranscodeStatus | null
  error: string | null
  isLoading: boolean
}

interface TranscodeStore extends TranscodeState {
  setStatus(status: TranscodeStatus | null): void
  clearStatus(): void
  setError(error: string | null): void
  setIsLoading(isLoading: boolean): void
}

export const useTranscodeStore = create<TranscodeStore>(set => ({
  status: null,
  error: null,
  isLoading: false,

  setStatus: status => set({ status }),
  clearStatus: () => set({ status: null, error: null }),
  setError: error => set({ error }),
  setIsLoading: isLoading => set({ isLoading }),
}))
