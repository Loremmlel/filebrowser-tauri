import { CreateFavoriteModal } from '@/components/favorite/CreateFavoriteModal'
import { FavoriteHeader } from '@/components/favorite/FavoriteHeader'
import { FavoriteItem } from '@/components/favorite/FavoriteItem'
import { Loading } from '@/components/yuzu/Loading'
import { ROUTES } from '@/constants/routes'
import { useFavoriteData } from '@/hooks/favorite/useFavoriteData'
import { useFavoriteSelection } from '@/hooks/favorite/useFavoriteSelection'
import { FileInfo } from '@/types/files'
import { toast } from '@/utils/toast'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const FavoritePage: React.FC = () => {
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { favorites, loading, createFavorite, loadFavorites } = useFavoriteData()
  const {
    selectedFavoriteIds,
    hasSelection,
    selectionCount,
    toggleFavoriteSelection,
    toggleSelectAll,
    deleteSelectedFavorites,
    clearSelection,
  } = useFavoriteSelection()

  async function handleCreateFavorite(name: string, sortOrder: number) {
    const success = await createFavorite({ name, sortOrder })
    if (success) {
      setShowCreateModal(false)
    }
  }

  async function handleDeleteSelected() {
    if (!hasSelection) return

    const confirmed = window.confirm(
      `确定删除选中的 ${selectionCount} 个收藏夹吗？此操作不可撤销。`
    )

    if (confirmed) {
      const deleteCount = await deleteSelectedFavorites()
      if (deleteCount > 0) {
        loadFavorites()
        toast.success(`成功删除了 ${deleteCount} 个收藏夹。`)
        if (deleteCount < selectionCount) {
          toast.warning('部分收藏夹删除失败，请检查权限或网络连接。')
        }
      }
    }
  }

  /**
   * 处理收藏夹文件点击事件
   * 如果是文件夹则导航到该收藏夹的内容页面
   * 如果是图片视频则执行预览操作
   */
  async function handleFavoriteFileClick(file: FileInfo) {
    const pathParts = file.path.split('/').filter(part => part.length > 0)
    const fileName = pathParts.pop()

    const searchParams = new URLSearchParams()
    if (pathParts.length > 0) {
      searchParams.set('path', pathParts.join('/'))
    }
    searchParams.set('preview', fileName ?? '')

    navigate(`${ROUTES.MAIN}?${searchParams.toString()}`)
  }

  function handleToggleSelectAll() {
    const favoriteIds = favorites.map(fav => fav.id)
    toggleSelectAll(favoriteIds)
  }

  return (
    <div className='flex flex-col h-full bg-gray-50'>
      {/* 头部工具栏 */}
      <FavoriteHeader
        onAddClick={() => setShowCreateModal(true)}
        onTreeClick={() => {
          // TODO: 实现树形视图切换逻辑
          toast.show('树形视图功能尚未实现')
        }}
        onDeleteClick={handleDeleteSelected}
        hasSelection={hasSelection}
      />

      {/* 收藏夹列表 */}
      <div className='flex-1 overflow-auto p-4'>
        {loading ? (
          <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
              <Loading className='w-8 h-8' />
            </div>
          </div>
        ) : favorites.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-64 text-gray-500'>
            <p className='text-lg mb-2'>暂无收藏夹</p>
            <p className='text-sm'>点击右上角的 + 按钮创建第一个收藏夹</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {/* 全选控制 */}
            {favorites.length > 0 && (
              <div
                className='flex items-center justify-between bg-white rounded-lg p-3 
              border border-gray-200'
              >
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={
                      favorites.length > 0 &&
                      favorites.every(favorite => selectedFavoriteIds.has(favorite.id))
                    }
                    onChange={handleToggleSelectAll}
                    className='w-4 h-4 text-blue-600 border-gray-300 rounded 
                    focus:ring-blue-500 focus:ring-2'
                  />
                  <span className='text-sm font-medium text-gray-700'>
                    全选 ({selectionCount}/{favorites.length})
                  </span>
                </label>

                {hasSelection && (
                  <button
                    onClick={clearSelection}
                    className='text-sm text-blue-600 hover:text-blue-800'
                  >
                    清除选择
                  </button>
                )}
              </div>
            )}

            {/* 收藏夹列表 */}
            {favorites.map(favorite => (
              <FavoriteItem
                key={favorite.id}
                favorite={favorite}
                isSelected={selectedFavoriteIds.has(favorite.id)}
                onToggleSelection={() => toggleFavoriteSelection(favorite.id)}
                onClick={() => {
                  // TODO: 实现收藏夹详情页面
                  toast.show('功能尚未实现')
                }}
                onItemClick={handleFavoriteFileClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* 创建收藏夹模态框 */}
      <CreateFavoriteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConirm={handleCreateFavorite}
      />
    </div>
  )
}

