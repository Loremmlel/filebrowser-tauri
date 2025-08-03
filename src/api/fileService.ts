import { useConfigStore } from "@/stores/configStore";
import { FileInfo } from "@/types/files";
import { invoke } from "@tauri-apps/api/core";

class FileService {
  private getServerUrl(): string {
    return useConfigStore.getState().serverUrl;
  }

  async getFiles(path: string): Promise<FileInfo[]> {
    try {
      const files = await invoke<FileInfo[]>("get_files", {
        path,
        serverUrl: this.getServerUrl(),
      });
      return files;
    } catch (error) {
      throw new Error(`获取文件列表失败: ${error}`);
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await invoke("delete_file", {
        path,
        serverUrl: this.getServerUrl(),
      });
    } catch (error) {
      throw new Error(`删除文件失败: ${error}`);
    }
  }

  async downloadFile(path: string, filename: string): Promise<void> {
    try {
      await invoke("download_file", {
        path,
        filename,
        serverUrl: this.getServerUrl(),
      });
    } catch (error) {
      throw new Error(`下载文件失败: ${error}`);
    }
  }

  async getThumbnail(path: string): Promise<Uint8Array> {
    try {
      const thumbnail = await invoke<number[]>("get_thumbnail", {
        path,
        serverUrl: this.getServerUrl(),
      });
      return new Uint8Array(thumbnail);
    } catch (error) {
      throw new Error(`获取缩略图失败: ${error}`);
    }
  }
}

export const fileService = new FileService();
