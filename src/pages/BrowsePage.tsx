import { AddToFavoritesModal } from '@/components/browse/AddToFavoritesModal'
import { BreadCrumb } from '@/components/browse/BreadCrumb'
import { FileItem } from '@/components/browse/FileItem'
import { ImageViewer } from '@/components/yuzu/ImageViewer'
import { useBrowseData } from '@/hooks/browse/useBrowseData'
import { useFavoriteOperations } from '@/hooks/browse/useFavoriteOperations'
import { useFileOperations } from '@/hooks/browse/useFileOperations'
import { useImagePreview } from '@/hooks/browse/useImagePreview'
import { useBrowseStore } from '@/stores/browseStore'
import { FileInfo, FileType } from '@/types/files'
import { useState } from 'react'

export const BrowsePage: React.FC = () => {
  const { currentPath, currentFavoriteFile, setCurrentFavoriteFile } = useBrowseStore()
  const [showAddToFavoritesModal, setShowAddToFavoritesModal] = useState(false)

  const { files, loading, loadFiles, loadFavorites } = useBrowseData()
  const { handleBreadCrumbNavigate, handleFileClick, handleDownload, handleDelete } =
    useFileOperations()
  const { favorites, isFileFavorite, handleFavoriteToggle, handleAddToFavorites } =
    useFavoriteOperations()
  const { previewItem, handleImageNavigation, handleClosePreview } = useImagePreview()

  const onAddToFavorites = async (favoriteId: number) => {
    if (!currentFavoriteFile) return

    await handleAddToFavorites(currentFavoriteFile, favoriteId, () => {
      loadFavorites() // 成功后重新加载收藏数据
      setShowAddToFavoritesModal(false)
      setCurrentFavoriteFile(null)
    })
  }

  const onDelete = (file: FileInfo) => {
    handleDelete(file, () => loadFiles()) // 删除成功后重新加载文件列表
  }
  return (
    <div className='flex flex-col h-full bg-gray-50'>
      {/* 面包屑导航 */}
      <BreadCrumb path={currentPath} onNavigate={handleBreadCrumbNavigate} />

      {/* 文件列表 */}
      <div className='flex-1 overflow-auto p-4'>
        {loading ? (
          <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
              <div
                className='w-8 h-8 border-2 border-blue-500 border-t-transparent 
              rounded-full animate-spin mx-auto mb-4'
              />
              <p className='text-gray-600'>加载中...</p>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className='flex items-center justify-center h-64'>
            <p className='text-gray-600'>文件夹为空</p>
          </div>
        ) : (
          <div
            className='grid grid-cols-2 sm:grid-cols-3 
          md:grid-cols-4 lg:grid-cols-6 gap-4'
          >
            {files.map(file => (
              <FileItem
                key={file.path}
                file={file}
                isFavorite={isFileFavorite(file.path)}
                onClick={() => handleFileClick(file)}
                onFavoriteToggle={() =>
                  handleFavoriteToggle(
                    file,
                    () => loadFavorites(), // 取消收藏成功后重新加载收藏数据
                    () => setShowAddToFavoritesModal(true) // 添加收藏时显示模态框
                  )
                }
                onDownload={!file.isDirectory ? () => handleDownload(file) : undefined}
                onDelete={() => onDelete(file)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 收藏夹模态框 */}
      {showAddToFavoritesModal && (
        <AddToFavoritesModal
          favorites={favorites}
          onClose={() => {
            setShowAddToFavoritesModal(false)
            setCurrentFavoriteFile(null)
          }}
          onAdd={onAddToFavorites}
        />
      )}

      {/* 图片预览 */}
      {previewItem != null && previewItem.type === FileType.Image && (
        <ImageViewer
          file={previewItem}
          onClose={() => handleClosePreview()}
          onNext={() => handleImageNavigation('next')}
          onPrev={() => handleImageNavigation('prev')}
          onDownlaod={() => handleDownload(previewItem!)}
        />
      )}
    </div>
  )
}
