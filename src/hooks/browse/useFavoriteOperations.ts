import { favoriteService } from '@/api/favoriteService'
import { useBrowseStore } from '@/stores/browseStore'
import { FileInfo } from '@/types/files'
import { AddFileToFavoriteRequest } from '@/types/request/favorites'
import { toast } from '@/utils/toast'
import { useCallback } from 'react'

/**
 * 收藏夹操作相关的Hook
 * 封装了添加、删除收藏文件等操作逻辑
 */
export const useFavoriteOperations = () => {
  const { favorites, favoriteFilesMap, setCurrentFavoriteFile, isFileFavorite } = useBrowseStore()

  // 取消收藏
  const handleCancelFavorite = useCallback(
    async (favoriteFileId: number, onSuccess?: () => void) => {
      try {
        const success = await favoriteService.deleteFavoriteFile(favoriteFileId)
        if (success) {
          toast.show('取消收藏成功')
          onSuccess?.()
        }
      } catch {
        toast.show('取消收藏失败')
      }
    },
    []
  )

  // 切换收藏状态
  const handleFavoriteToggle = useCallback(
    (file: FileInfo, onCancelSuccess?: () => void, onAddClick?: () => void) => {
      const isFavorite = isFileFavorite(file.path)

      if (isFavorite) {
        const favoriteFileId = favoriteFilesMap.get(file.path)
        if (favoriteFileId) {
          handleCancelFavorite(favoriteFileId, onCancelSuccess)
        }
      } else {
        setCurrentFavoriteFile(file)
        onAddClick?.()
      }
    },
    [favoriteFilesMap, isFileFavorite, setCurrentFavoriteFile, handleCancelFavorite]
  )

  // 添加到收藏夹
  const handleAddToFavorites = useCallback(
    async (file: FileInfo, favoriteId: number, onSuccess?: () => void) => {
      try {
        const request: AddFileToFavoriteRequest = {
          filename: file.name,
          filePath: file.path,
          isDirectory: file.isDirectory,
          fileType: file.type,
          lastModified: file.lastModified,
          fileSize: file.size,
        }
        const success = await favoriteService.addFileToFavorite(request, favoriteId)
        if (success) {
          toast.show('添加到收藏夹成功')
          onSuccess?.()
        }
      } catch {
        toast.show('添加到收藏夹失败')
      }
    },
    []
  )

  return {
    favorites,
    isFileFavorite,
    handleFavoriteToggle,
    handleAddToFavorites,
  }
}
