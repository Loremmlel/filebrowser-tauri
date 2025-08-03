import { fileService } from '@/api/fileService'
import { useBrowseStore } from '@/stores/browseStore'
import { FileInfo, FileType } from '@/types/files'
import { toast } from '@/utils/toast'

/**
 * 文件操作相关的Hook
 * 封装了文件点击、导航、下载、删除等操作逻辑
 */
export const useFileOperations = () => {
  const { paths: currentPath, setCurrentPath, setPreviewItem } = useBrowseStore()

  // 处理面包屑导航
  const handleBreadCrumbNavigate = (targetIndex: number) => {
    if (targetIndex === 0) {
      setCurrentPath([])
    } else {
      setCurrentPath(currentPath.slice(0, targetIndex))
    }
  }

  // 处理文件点击
  const handleFileClick = (file: FileInfo) => {
    if (file.isDirectory) {
      setCurrentPath([...currentPath, { name: file.name, id: file.name }])
    } else if (file.type === FileType.Image || file.type === FileType.Video) {
      setPreviewItem(file)
    }
  }

  // 处理文件下载
  const handleDownload = async (file: FileInfo) => {
    try {
      await fileService.downloadFile(file.path, file.name)
      toast.show('下载完成')
    } catch {
      toast.show('下载失败')
    }
  }

  // 处理文件删除
  const handleDelete = async (file: FileInfo, onSuccess?: () => void) => {
    try {
      await fileService.deleteFile(file.path)
      toast.show('删除成功')
      onSuccess?.()
    } catch {
      toast.show('删除失败')
    }
  }

  return {
    handleBreadCrumbNavigate,
    handleFileClick,
    handleDownload,
    handleDelete,
  }
}
