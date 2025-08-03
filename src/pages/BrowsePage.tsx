import { favoriteService } from '@/api/favoriteService'
import { fileService } from '@/api/fileService'
import { AddToFavoritesModal } from '@/components/browse/AddToFavoritesModal'
import { BreadCrumb } from '@/components/browse/BreadCrumb'
import { FileItem } from '@/components/browse/FileItem'
import { ImageViewer } from '@/components/yuzu/ImageViewer'
import { useBrowseStore } from '@/stores/browseStore'
import { FileInfo, FileType } from '@/types/files'
import { AddFileToFavoriteRequest } from '@/types/request/favorites'
import { toast } from '@/utils/toast'
import { useCallback, useEffect, useState } from 'react'

export const BrowsePage: React.FC = () => {
  const store = useBrowseStore()

  const [showAddToFavoritesModal, setShowAddToFavoritesModal] = useState(false)

  const loadFiles = useCallback(
    async (path?: string) => {
      try {
        store.setLoading(true)
        const targetPath = path ?? store.requestPath()
        const files = await fileService.getFiles(targetPath)
        store.setFiles(files)
      } catch {
        toast.show('加载文件失败，请稍后重试')
      } finally {
        store.setLoading(false)
      }
    },
    [store]
  )

  const loadFavorites = useCallback(async () => {
    try {
      const [favorites, favoriteFiles] = await Promise.all([
        favoriteService.getFavorites(),
        favoriteService.getAllFavoriteFiles(),
      ])

      store.setFavorites(favorites)

      const favoriteFilesMap = new Map<string, number>()
      favoriteFiles.forEach(favoriteFile => {
        favoriteFilesMap.set(favoriteFile.filePath, favoriteFile.id)
      })
      store.setFavoriteFilesMap(favoriteFilesMap)
    } catch {
      toast.show('加载收藏夹失败，请稍后重试')
    }
  }, [store])

  useEffect(() => {
    loadFiles()
    loadFavorites()
  }, [loadFiles, loadFavorites])

  // 监听路径变化
  useEffect(() => {
    loadFiles()
  }, [store.currentPath, loadFiles])

  const handleBreadCrumbNavigate = useCallback(
    (targetIndex: number) => {
      if (targetIndex === 0) {
        store.setCurrentPath([])
      } else {
        store.setCurrentPath(store.currentPath.slice(0, targetIndex))
      }
    },
    [store]
  )

  const handleFileClick = useCallback(
    (file: FileInfo) => {
      if (file.isDirectory) {
        store.setCurrentPath([...store.currentPath, { name: file.name, id: file.name }])
      } else if (file.type === FileType.Image || file.type === FileType.Video) {
        store.setPreviewItem(file)
      }
    },
    [store]
  )

  const handleCancelFavorite = useCallback(
    async (favoriteFileId: number) => {
      try {
        const success = await favoriteService.deleteFavoriteFile(favoriteFileId)
        if (success) {
          toast.show('取消收藏成功')
          loadFavorites() // 重新加载收藏数据
        }
      } catch {
        toast.show('取消收藏失败')
      }
    },
    [loadFavorites]
  )

  const handleFavoriteToggle = useCallback(
    (file: FileInfo, isFavorite: boolean) => {
      if (isFavorite) {
        const favoriteFileId = store.favoriteFilesMap.get(file.path)
        if (favoriteFileId) {
          handleCancelFavorite(favoriteFileId)
        }
      } else {
        store.setCurrentFavoriteFile(file)
        setShowAddToFavoritesModal(true)
      }
    },
    [handleCancelFavorite, store]
  )

  const handleAddToFavorites = useCallback(
    async (favoriteId: number) => {
      const currentFavoriteFile = store.currentFavoriteFile
      if (!currentFavoriteFile) return

      try {
        const request: AddFileToFavoriteRequest = {
          filename: currentFavoriteFile.name,
          filePath: currentFavoriteFile.path,
          isDirectory: currentFavoriteFile.isDirectory,
          fileType: currentFavoriteFile.type,
          lastModified: currentFavoriteFile.lastModified,
          fileSize: currentFavoriteFile.size,
        }
        const success = await favoriteService.addFileToFavorite(request, favoriteId)
        if (success) {
          toast.show('添加到收藏夹成功')
          loadFavorites()
        }
      } catch {
        toast.show('添加到收藏夹失败')
      } finally {
        setShowAddToFavoritesModal(false)
        store.setCurrentFavoriteFile(null)
      }
    },
    [loadFavorites, store]
  )

  const handleDownload = useCallback(async (file: FileInfo) => {
    try {
      await fileService.downloadFile(file.path, file.name)
      toast.show('下载完成')
    } catch {
      toast.show('下载失败')
    }
  }, [])

  const handleDelete = useCallback(
    async (file: FileInfo) => {
      try {
        await fileService.deleteFile(file.path)
        toast.show('删除成功')
        loadFiles()
      } catch {
        toast.show('删除失败')
      }
    },
    [loadFiles]
  )

  const handleImageNavigation = useCallback(
    (direction: 'next' | 'prev') => {
      const previewItem = store.previewItem
      if (!previewItem) return

      const images = store.files.filter(file => file.type === FileType.Image)
      const currentIndex = images.findIndex(file => file.path === previewItem.path)

      if (currentIndex === -1) return

      let nextIndex = currentIndex
      if (direction === 'next') {
        nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1
        if (currentIndex === images.length - 1) {
          toast.show('已到最后一张图片,循环到第一张')
        }
      } else if (direction === 'prev') {
        nextIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1
        if (currentIndex === 0) {
          toast.show('已到第一张图片,循环到最后一张')
        }
      }
      store.setPreviewItem(images[nextIndex])
    },
    [store]
  )
  return (
    <div className='flex flex-col h-full bg-gray-50'>
      {/* 面包屑导航 */}
      <BreadCrumb path={store.currentPath} onNavigate={handleBreadCrumbNavigate} />

      {/* 文件列表 */}
      <div className='flex-1 overflow-auto p-4'>
        {store.loading ? (
          <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
              <div
                className='w-8 h-8 border-2 border-blue-500 border-t-transparent 
              rounded-full animate-spin mx-auto mb-4'
              />
              <p className='text-gray-600'>加载中...</p>
            </div>
          </div>
        ) : store.files.length === 0 ? (
          <div className='flex items-center justify-center h-64'>
            <p className='text-gray-600'>文件夹为空</p>
          </div>
        ) : (
          <div
            className='grid grid-cols-2 sm:grid-cols-3 
          md:grid-cols-4 lg:grid-cols-6 gap-4'
          >
            {store.files.map(file => (
              <FileItem
                key={file.path}
                file={file}
                isFavorite={store.isFileFavorite(file.path)}
                onClick={() => handleFileClick(file)}
                onFavoriteToggle={() => handleFavoriteToggle(file, store.isFileFavorite(file.path))}
                onDownload={!file.isDirectory ? () => handleDownload(file) : undefined}
                onDelete={() => handleDelete(file)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 收藏夹模态框 */}
      {showAddToFavoritesModal && (
        <AddToFavoritesModal
          favorites={store.favorites}
          onClose={() => {
            setShowAddToFavoritesModal(false)
            store.setCurrentFavoriteFile(null)
          }}
          onAdd={handleAddToFavorites}
        />
      )}

      {/* 图片预览 */}
      {store.previewItem != null && store.previewItem.type === FileType.Image && (
        <ImageViewer
          file={store.previewItem}
          onClose={() => store.setPreviewItem(null)}
          onNext={() => handleImageNavigation('next')}
          onPrev={() => handleImageNavigation('prev')}
          onDownlaod={() => handleDownload(store.previewItem!)}
        />
      )}
    </div>
  )
}
