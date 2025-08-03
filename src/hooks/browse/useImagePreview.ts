import { useBrowseStore } from '@/stores/browseStore'
import { FileType } from '@/types/files'
import { toast } from '@/utils/toast'

/**
 * 图片预览相关的Hook
 * 封装了图片导航、预览控制等逻辑
 */
export const useImagePreview = () => {
  const { files, previewItem, setPreviewItem } = useBrowseStore()

  // 处理图片导航
  const handleImageNavigation = (direction: 'next' | 'prev') => {
    if (!previewItem) return

    const images = files.filter(file => file.type === FileType.Image)
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
    setPreviewItem(images[nextIndex])
  }

  // 关闭预览
  const handleClosePreview = () => {
    setPreviewItem(null)
  }

  return {
    previewItem,
    handleImageNavigation,
    handleClosePreview,
  }
}
