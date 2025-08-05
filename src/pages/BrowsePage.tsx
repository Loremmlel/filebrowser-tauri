import { AddToFavoritesModal } from '@/components/browse/AddToFavoritesModal'
import { BreadCrumb } from '@/components/browse/BreadCrumb'
import { FileItem } from '@/components/browse/FileItem'
import { YuzuImageViewer } from '@/components/yuzu/ImageViewer'
import { useBrowseData } from '@/hooks/browse/useBrowseData'
import { useFavoriteOperations } from '@/hooks/browse/useFavoriteOperations'
import { useFileOperations } from '@/hooks/browse/useFileOperations'
import { useImagePreview } from '@/hooks/browse/useImagePreview'
import { useBrowseStore } from '@/stores/browseStore'
import { FileInfo, FileType } from '@/types/files'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export const BrowsePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const { path, currentFavoriteFile, setCurrentFavoriteFile, setPath, setPreviewItem } =
    useBrowseStore()
  const [showAddToFavoritesModal, setShowAddToFavoritesModal] = useState(false)

  const { files, loading, loadFiles, loadFavorites } = useBrowseData()
  const { handleBreadCrumbNavigate, handleFileClick, handleDownload, handleDelete } =
    useFileOperations()
  const { favorites, isFileFavorite, handleFavoriteToggle, handleAddToFavorites } =
    useFavoriteOperations()
  const { previewItem, handleImageNavigation, handleClosePreview } = useImagePreview()

  // 处理URL参数
  useEffect(() => {
    const pathParam = searchParams.get('path')
    const previewParam = searchParams.get('preview')

    // 处理路径参数
    if (pathParam && pathParam !== '/') {
      const pathParts = pathParam.split('/').filter(part => part.length > 0)
      const breadcrumbPath = pathParts.map(part => ({ name: part, id: part }))
      setPath(breadcrumbPath)
    }

    // 处理预览参数
    if (previewParam && files.length > 0) {
      const previewFile = files.find(file => file.name === previewParam)
      if (
        previewFile &&
        (previewFile.type === FileType.Image || previewFile.type === FileType.Video)
      ) {
        setPreviewItem(previewFile)
      }
    }

    if (pathParam || previewParam) {
      setSearchParams({})
    }
  }, [files, searchParams, setPath, setPreviewItem, setSearchParams])

  async function onAddToFavorites(favoriteId: number) {
    if (!currentFavoriteFile) return

    await handleAddToFavorites(currentFavoriteFile, favoriteId, () => {
      loadFavorites() // 成功后重新加载收藏数据
      setShowAddToFavoritesModal(false)
      setCurrentFavoriteFile(null)
    })
  }

  function onDelete(file: FileInfo) {
    handleDelete(file, () => loadFiles()) // 删除成功后重新加载文件列表
  }
  return (
    <div className='flex flex-col h-full bg-gray-50'>
      {/* 面包屑导航 */}
      <BreadCrumb path={path} onNavigate={handleBreadCrumbNavigate} />

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
      <AddToFavoritesModal
        isOpen={showAddToFavoritesModal}
        favorites={favorites}
        onClose={() => {
          setShowAddToFavoritesModal(false)
          setCurrentFavoriteFile(null)
        }}
        onAdd={onAddToFavorites}
      />

      {/* 图片预览 */}
      {previewItem != null && previewItem.type === FileType.Image && (
        <YuzuImageViewer
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

