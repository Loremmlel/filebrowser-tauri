import { FileInfo } from '@/types/files'
import { invoke } from '@tauri-apps/api/core'

class FileService {
  async getFiles(path: string): Promise<FileInfo[]> {
    return await invoke<FileInfo[]>('get_files', { path })
  }

  async deleteFile(path: string): Promise<void> {
    await invoke('delete_file', { path })
  }

  async downloadFile(path: string, filename: string): Promise<void> {
    await invoke('download_file', {
      path,
      filename,
    })
  }

  async getThumbnail(path: string): Promise<Uint8Array> {
    const thumbnail = await invoke<number[]>('get_thumbnail', { path })
    return new Uint8Array(thumbnail)
  }
}

export const fileService = new FileService()
