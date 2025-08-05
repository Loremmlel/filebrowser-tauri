import { useConfigStore } from '@/stores/configStore'
import { FileInfo } from '@/types/files'
import {
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import { useState } from 'react'
import { YuzuLoading } from './Loading'

interface ImageViewerProps {
  file: FileInfo
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  onDownlaod?: () => void
}

export const YuzuImageViewer: React.FC<ImageViewerProps> = ({
  file,
  onClose,
  onNext,
  onPrev,
  onDownlaod,
}) => {
  const { serverUrl } = useConfigStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const imageUrl = `${serverUrl}/image?path=${encodeURIComponent(file.path)}`

  function handleImageLoad() {
    setLoading(false)
  }

  function handleImageError() {
    setLoading(false)
    setError(true)
  }

  return (
    <div className='fixed inset-0 bg-black/90 flex items-center justify-center z-50'>
      {/* 顶部工具栏 */}
      <div className='absolute top-4 left-4 right-4 flex justify-between items-center z-10'>
        <h3 className='text-white text-lg font-medium truncate max-w-md'>{file.name}</h3>
        <div className='flex space-x-2'>
          {onDownlaod != null && (
            <button
              onClick={onDownlaod}
              className='p-2 text-white hover:bg-white/20 rounded-full transition-colors'
            >
              <ArrowDownTrayIcon className='w-6 h-6' />
            </button>
          )}
          <button
            onClick={onClose}
            className='p-2 text-white hover:bg-white/20 rounded-full transition-colors'
          >
            <XMarkIcon className='w-6 h-6' />
          </button>
        </div>
      </div>

      {/* 导航按钮 */}
      <button
        onClick={onPrev}
        className='absolute left-4 top-1/2 transform -translate-y-1/2 p-2 text-white 
        hover:bg-white/20 rounded-full transition-colors z-10'
      >
        <ChevronLeftIcon className='w-8 h-8' />
      </button>

      <button
        onClick={onNext}
        className='absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-white 
        hover:bg-white/20 rounded-full transition-colors z-10'
      >
        <ChevronRightIcon className='w-8 h-8' />
      </button>

      {/* 图片内容 */}
      <div className='w-full h-full flex items-center justify-center p-16'>
        {loading && <YuzuLoading />}

        {error ? (
          <div className='text-white text-center'>
            <p className='text-lg mb-2'>图片加载失败</p>
            <p className='text-sm text-gray-300'>请检查网络连接或稍后重试</p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={file.name}
            className='max-w-full max-h-full object-contain'
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: loading ? 'none' : 'block' }}
          />
        )}
      </div>
    </div>
  )
}
