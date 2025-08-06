import { favoriteService } from '@/api/favoriteService'
import { useFavoriteStore } from '@/stores/favoriteStore'

/**
 * 收藏夹选择管理Hook
 * 封装多选、全选等选择逻辑
 */
export const useFavoriteSelection = () => {
  const { selectedFavoriteIds, setSelectedFavoriteIds, toggleFavoriteSelection, clearSelection } =
    useFavoriteStore()

  const toggleSelectAll = (favoriteIds: number[]) => {
    const allSelected = favoriteIds.every(id => selectedFavoriteIds.has(id))

    if (allSelected) {
      clearSelection()
    } else {
      setSelectedFavoriteIds(favoriteIds)
    }
  }

  const deleteSelectedFavorites = async () => {
    const selectedIds = Array.from(selectedFavoriteIds)
    const successes = await Promise.all(
      selectedIds.map(id => {
        try {
          // fix: 写错了，应该是删除收藏夹，而不是收藏文件
          favoriteService.deleteFavorite(id)
          return true
        } catch {
          return false
        }
      })
    )

    clearSelection()
    return successes.reduce((acc, cur) => acc + (cur ? 1 : 0), 0)
  }

  return {
    selectedFavoriteIds,
    hasSelection: selectedFavoriteIds.size > 0,
    selectionCount: selectedFavoriteIds.size,
    toggleFavoriteSelection,
    toggleSelectAll,
    deleteSelectedFavorites,
    clearSelection,
  }
}
