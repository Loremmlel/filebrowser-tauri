import { favoriteService } from '@/api/favoriteService'
import { useFavoriteStore } from '@/stores/favoriteStore'
import { CreateFavoriteRequest } from '@/types/request/favorites'
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
    } catch {
      toast.show('加载收藏夹失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }, [setFavorites, setLoading])

  const createFavorite = async (request: CreateFavoriteRequest) => {
    try {
      await favoriteService.createFavorite(request)
      toast.show('创建收藏夹成功')
      loadFavorites()
      return true
    } catch {
      toast.show('创建收藏夹失败，请稍后再试')
      return false
    }
  }

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  return { favorites, loading, loadFavorites, createFavorite }
}
