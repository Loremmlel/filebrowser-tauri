import { useConfigStore } from '@/stores/configStore'
import { FileInfo } from '@/types/files'
import { invoke } from '@tauri-apps/api/core'

class FileService {
  private getServerUrl(): string {
    return useConfigStore.getState().serverUrl
  }

  async getFiles(path: string): Promise<FileInfo[]> {
    const files = await invoke<FileInfo[]>('get_files', {
      path,
      serverUrl: this.getServerUrl(),
    })
    return files
  }

  async deleteFile(path: string): Promise<void> {
    await invoke('delete_file', {
      path,
      serverUrl: this.getServerUrl(),
    })
  }

  async downloadFile(path: string, filename: string): Promise<void> {
    await invoke('download_file', {
      path,
      filename,
      serverUrl: this.getServerUrl(),
    })
  }

  async getThumbnail(path: string): Promise<Uint8Array> {
    const thumbnail = await invoke<number[]>('get_thumbnail', {
      path,
      serverUrl: this.getServerUrl(),
    })
    return new Uint8Array(thumbnail)
  }
}

export const fileService = new FileService()
