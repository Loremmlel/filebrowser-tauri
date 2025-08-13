import { FavoriteDto, FavoriteFileDto } from '@/types/favorite'
import {
  AddFileToFavoriteRequest,
  CreateFavoriteRequest,
  UpdateFavoriteRequest,
} from '@/types/request/favorites'
import { invoke } from '@tauri-apps/api/core'

class FavoriteService {
  async getFavorites(): Promise<FavoriteDto[]> {
    return await invoke<FavoriteDto[]>('get_favorites')
  }

  async createFavorite(request: CreateFavoriteRequest): Promise<FavoriteDto> {
    return await invoke<FavoriteDto>('create_favorite', { request })
  }

  async deleteFavorite(favoriteId: number): Promise<boolean> {
    return await invoke<boolean>('delete_favorite', { favoriteId })
  }

  async addFileToFavorite(request: AddFileToFavoriteRequest, favoriteId: number): Promise<boolean> {
    return await invoke<boolean>('add_file_to_favorite', {
      request,
      favoriteId,
    })
  }

  async getAllFavoriteFiles(): Promise<FavoriteFileDto[]> {
    return await invoke<FavoriteFileDto[]>('get_all_favorite_files')
  }

  async deleteFavoriteFile(id: number): Promise<boolean> {
    return await invoke<boolean>('delete_favorite_file', { id })
  }

  async updateFavorite(id: number, request: UpdateFavoriteRequest): Promise<FavoriteDto> {
    return await invoke<FavoriteDto>('update_favorite', {
      id,
      request,
    })
  }
}

export const favoriteService = new FavoriteService()
