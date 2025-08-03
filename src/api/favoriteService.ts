import { useConfigStore } from '@/stores/configStore'
import { FavoriteDto, FavoriteFileDto } from '@/types/favorite'
import { AddFileToFavoriteRequest } from '@/types/request/favorites'
import { invoke } from '@tauri-apps/api/core'

class FavoriteService {
  private getServerUrl(): string {
    return useConfigStore.getState().serverUrl
  }

  async getFavorites(): Promise<FavoriteDto[]> {
    try {
      const favorites = await invoke<FavoriteDto[]>('get_favorites', {
        serverUrl: this.getServerUrl(),
      })
      return favorites
    } catch (error) {
      throw new Error(`获取收藏列表失败: ${error}`)
    }
  }

  async createFavorite(name: string, sortOrder: number): Promise<FavoriteDto> {
    try {
      const favorite = await invoke<FavoriteDto>('create_favorite', {
        name,
        sortOrder,
        serverUrl: this.getServerUrl(),
      })
      return favorite
    } catch (error) {
      throw new Error(`创建收藏失败: ${error}`)
    }
  }

  async deleteFavorite(favoriteId: number): Promise<boolean> {
    try {
      const result = await invoke<boolean>('delete_favorite', {
        favoriteId,
        serverUrl: this.getServerUrl(),
      })
      return result
    } catch (error) {
      throw new Error(`删除收藏夹失败: ${error}`)
    }
  }

  async addFileToFavorite(request: AddFileToFavoriteRequest, favoriteId: number): Promise<boolean> {
    try {
      const result = await invoke<boolean>('add_file_to_favorite', {
        request,
        favoriteId,
        serverUrl: this.getServerUrl(),
      })
      return result
    } catch (error) {
      throw new Error(`添加文件到收藏夹失败: ${error}`)
    }
  }

  async getAllFavoriteFiles(): Promise<FavoriteFileDto[]> {
    try {
      const files = await invoke<FavoriteFileDto[]>('get_all_favorite_files', {
        serverUrl: this.getServerUrl(),
      })
      return files
    } catch (error) {
      throw new Error(`获取收藏夹文件列表失败: ${error}`)
    }
  }

  async deleteFavoriteFile(favoriteFileId: number): Promise<boolean> {
    try {
      const result = await invoke<boolean>('delete_favorite_file', {
        favoriteFileId,
        serverUrl: this.getServerUrl(),
      })
      return result
    } catch (error) {
      throw new Error(`删除收藏夹文件失败: ${error}`)
    }
  }
}

export const favoriteService = new FavoriteService()
