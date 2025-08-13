import { favoriteService } from '@/api/favoriteService'
import { useFavoriteStore } from '@/stores/favoriteStore'
import { CreateFavoriteRequest, UpdateFavoriteRequest } from '@/types/request/favorites'
import { toast } from '@/utils/toast'
import { useCallback, useEffect } from 'react'

/**
 * 收藏夹数据管理Hook
 * 封装收藏夹的加载、创建、删除等操作
 */
export const useFavoriteData = () => {
  const { favorites, loading, setFavorites, setLoading } = useFavoriteStore()

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true)
      const favorites = await favoriteService.getFavorites()
      setFavorites(favorites)
    } catch (error) {
      toast.handleApiError(error, '加载收藏夹失败')
    } finally {
      setLoading(false)
    }
  }, [setFavorites, setLoading])

  const createFavorite = async (request: CreateFavoriteRequest) => {
    try {
      await favoriteService.createFavorite(request)
      toast.success('创建收藏夹成功')
      loadFavorites()
      return true
    } catch (error) {
      toast.handleApiError(error, '创建收藏夹失败')
      return false
    }
  }

  const updateFavorite = async (id: number, request: UpdateFavoriteRequest) => {
    try {
      await favoriteService.updateFavorite(id, request)
      toast.success('更新收藏夹成功')
      loadFavorites()
      return true
    } catch (error) {
      toast.handleApiError(error, '更新收藏夹失败')
      return false
    }
  }

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  return { favorites, loading, loadFavorites, createFavorite, updateFavorite }
}
