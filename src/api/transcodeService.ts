import { TranscodeStatus } from '@/types/transcode'
import { invoke } from '@tauri-apps/api/core'

class TranscodeService {
  async startTranscode(path: string): Promise<TranscodeStatus> {
    return await invoke<TranscodeStatus>('start_transcode', { path })
  }

  async stopTranscode(id: string): Promise<void> {
    await invoke('stop_transcode', { id })
  }
}

export const transcodeService = new TranscodeService()
