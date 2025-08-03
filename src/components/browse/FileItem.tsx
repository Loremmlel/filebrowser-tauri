import { FileInfo, FileType } from '@/types/files'
import {
  HeartIcon,
  HeartIcon as HeartSolidIcon,
} from '@heroicons/react/24/outline'
import {
  ArrowDownTrayIcon,
  DocumentIcon,
  FolderIcon,
  PhotoIcon,
  TrashIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/solid'
import { useMemo, useState } from 'react'
import { Thumbnail } from '../yuzu/Thumbnail'

interface FileItemProps {
  file: FileInfo
  isFavorite: boolean
  onFileClick: (file: FileInfo) => void
  onFavoriteToggle: (isFavorite: boolean, file: FileInfo) => void
  onDownload?: (file: FileInfo) => void
  onDelete?: (file: FileInfo) => void
}

export const FileItem: React.FC<FileItemProps> = ({
  file,
  isFavorite,
  onFileClick,
  onFavoriteToggle,
  onDownload,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const FileIcon = useMemo(() => {
    switch (file.type) {
      case FileType.Folder:
        return <FolderIcon className='w-12 h-12 text-blue-500' />
      case FileType.Image:
        return <PhotoIcon className='w-12 h-12 text-green-500' />
      case FileType.Video:
        return <VideoCameraIcon className='w-12 h-12 text-purple-500' />
      default:
        return <DocumentIcon className='w-12 h-12 text-gray-500' />
    }
  }, [file.type])

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow'>
      {/* 操作按钮 */}
      <div className='flex justify-end space-x-2 mb-2'>
        <button
          onClick={() => onFavoriteToggle(!isFavorite, file)}
          className={`p-1 rounded-full transition-colors ${
            isFavorite
              ? 'text-red-500 hover:bg-red-50'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          {isFavorite ? (
            <HeartSolidIcon className='w-5 h-5' />
          ) : (
            <HeartIcon className='w-5 h-5' />
          )}
        </button>

        {onDownload != null && !file.isDirectory && (
          <button
            onClick={() => onDownload(file)}
            className='p-1 rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors'
          >
            <ArrowDownTrayIcon className='w-5 h-5' />
          </button>
        )}

        {onDelete != null && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className='p-1 rounded-full text-gray-400 hover:bg-gray-50 hover:text-red-500 transition-colors'
          >
            <TrashIcon className='w-5 h-5' />
          </button>
        )}
      </div>

      {/* 文件内容 */}
      <div
        className='flex flex-col items-center space-y-2 cursor-pointer'
        onClick={() => onFileClick(file)}
      >
        <div className='w-16 h-16 flex items-center justify-center'>
          {file.type === FileType.Image || file.type === FileType.Video ? (
            <Thumbnail file={file} />
          ) : (
            FileIcon
          )}
        </div>

        <div className='text-center'>
          <p className='text-sm font-medium text-gray-900 truncate max-w-full'>
            {file.name}
          </p>
          {!file.isDirectory && (
            <p className='text-xs text-gray-500'>{formatFileSize(file.size)}</p>
          )}
        </div>
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-sm mx-4'>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>确认删除</h3>
            <p className='text-gray-600 mb-4'>
              确定要删除 {file.name} 吗？此操作无法撤销
            </p>
            <div className='flex space-x-3'>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className='flex-1 bg-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors'
              >
                取消
              </button>
              <button
                onClick={() => {
                  onDelete?.(file)
                  setShowDeleteConfirm(false)
                }}
                className='flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors'
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  function formatFileSize(bytes: number): string {
    if (bytes <= 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }
}
