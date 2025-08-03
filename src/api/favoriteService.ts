import { useConfigStore } from '@/stores/configStore'
import { FavoriteDto, FavoriteFileDto } from '@/types/favorite'
import { AddFileToFavoriteRequest, CreateFavoriteRequest } from '@/types/request/favorites'
import { invoke } from '@tauri-apps/api/core'

class FavoriteService {
  private getServerUrl(): string {
    return useConfigStore.getState().serverUrl
  }

  async getFavorites(): Promise<FavoriteDto[]> {
    const favorites = await invoke<FavoriteDto[]>('get_favorites', {
      serverUrl: this.getServerUrl(),
    })
    return favorites
  }

  async createFavorite(request: CreateFavoriteRequest): Promise<FavoriteDto> {
    const favorite = await invoke<FavoriteDto>('create_favorite', {
      request,
      serverUrl: this.getServerUrl(),
    })
    return favorite
  }

  async deleteFavorite(favoriteId: number): Promise<boolean> {
    const result = await invoke<boolean>('delete_favorite', {
      favoriteId,
      serverUrl: this.getServerUrl(),
    })
    return result
  }

  async addFileToFavorite(request: AddFileToFavoriteRequest, favoriteId: number): Promise<boolean> {
    const result = await invoke<boolean>('add_file_to_favorite', {
      request,
      favoriteId,
      serverUrl: this.getServerUrl(),
    })
    return result
  }

  async getAllFavoriteFiles(): Promise<FavoriteFileDto[]> {
    const files = await invoke<FavoriteFileDto[]>('get_all_favorite_files', {
      serverUrl: this.getServerUrl(),
    })
    return files
  }

  async deleteFavoriteFile(favoriteFileId: number): Promise<boolean> {
    const result = await invoke<boolean>('delete_favorite_file', {
      favoriteFileId,
      serverUrl: this.getServerUrl(),
    })
    return result
  }
}

export const favoriteService = new FavoriteService()
