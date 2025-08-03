import { fileService } from '@/api/fileService'
import { useBrowseStore } from '@/stores/browseStore'
import { FileInfo, FileType } from '@/types/files'
import { toast } from '@/utils/toast'
import { useCallback } from 'react'

/**
 * 文件操作相关的Hook
 * 封装了文件点击、导航、下载、删除等操作逻辑
 */
export const useFileOperations = () => {
  const { currentPath, setCurrentPath, setPreviewItem } = useBrowseStore()

  // 处理面包屑导航
  const handleBreadCrumbNavigate = useCallback(
    (targetIndex: number) => {
      if (targetIndex === 0) {
        setCurrentPath([])
      } else {
        setCurrentPath(currentPath.slice(0, targetIndex))
      }
    },
    [currentPath, setCurrentPath]
  )

  // 处理文件点击
  const handleFileClick = useCallback(
    (file: FileInfo) => {
      if (file.isDirectory) {
        setCurrentPath([...currentPath, { name: file.name, id: file.name }])
      } else if (file.type === FileType.Image || file.type === FileType.Video) {
        setPreviewItem(file)
      }
    },
    [currentPath, setCurrentPath, setPreviewItem]
  )

  // 处理文件下载
  const handleDownload = useCallback(async (file: FileInfo) => {
    try {
      await fileService.downloadFile(file.path, file.name)
      toast.show('下载完成')
    } catch {
      toast.show('下载失败')
    }
  }, [])

  // 处理文件删除
  const handleDelete = useCallback(async (file: FileInfo, onSuccess?: () => void) => {
    try {
      await fileService.deleteFile(file.path)
      toast.show('删除成功')
      onSuccess?.()
    } catch {
      toast.show('删除失败')
    }
  }, [])

  return {
    handleBreadCrumbNavigate,
    handleFileClick,
    handleDownload,
    handleDelete,
  }
}
