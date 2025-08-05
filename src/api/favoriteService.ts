import { FavoriteDto, FavoriteFileDto } from '@/types/favorite'
import { AddFileToFavoriteRequest, CreateFavoriteRequest } from '@/types/request/favorites'
import { invoke } from '@tauri-apps/api/core'

class FavoriteService {
  async getFavorites(): Promise<FavoriteDto[]> {
    const favorites = await invoke<FavoriteDto[]>('get_favorites')
    return favorites
  }

  async createFavorite(request: CreateFavoriteRequest): Promise<FavoriteDto> {
    const favorite = await invoke<FavoriteDto>('create_favorite', { request })
    return favorite
  }

  async deleteFavorite(favoriteId: number): Promise<boolean> {
    const result = await invoke<boolean>('delete_favorite', { favoriteId })
    return result
  }

  async addFileToFavorite(request: AddFileToFavoriteRequest, favoriteId: number): Promise<boolean> {
    const result = await invoke<boolean>('add_file_to_favorite', {
      request,
      favoriteId,
    })
    return result
  }

  async getAllFavoriteFiles(): Promise<FavoriteFileDto[]> {
    const files = await invoke<FavoriteFileDto[]>('get_all_favorite_files')
    return files
  }

  async deleteFavoriteFile(id: number): Promise<boolean> {
    const result = await invoke<boolean>('delete_favorite_file', { id })
    return result
  }
}

export const favoriteService = new FavoriteService()
