import { FavoriteDto, FavoriteFileDto } from '@/types/favorite'
import { FileInfo } from '@/types/files'
import { ChevronRightIcon, PencilIcon } from '@heroicons/react/24/solid'
import { FavoriteFileItem } from './FavoriteFileItem'
import React from 'react'

interface FavoriteItemProps {
  favorite: FavoriteDto
  isSelected: boolean
  onToggleSelection: () => void
  onClick: () => void
  onItemClick: (file: FileInfo) => void
  onEdit?: () => void
}

export const FavoriteItem: React.FC<FavoriteItemProps> = ({
  favorite,
  isSelected,
  onToggleSelection,
  onClick,
  onItemClick,
  onEdit,
}) => {
  function convertToFileInfo(favoriteFile: FavoriteFileDto): FileInfo {
    return {
      name: favoriteFile.filename,
      size: favoriteFile.fileSize,
      isDirectory: favoriteFile.isDirectory,
      type: favoriteFile.fileType,
      lastModified: favoriteFile.lastModified,
      path: favoriteFile.filePath,
    }
  }

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-4 shadow-sm'>
      {/* 收藏夹头部 */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center space-x-3'>
          {/* 选择框 */}
          <input
            type='checkbox'
            checked={isSelected}
            onChange={onToggleSelection}
            className='w-4 h-4 text-blue-600 border-gray-300 rounded'
          />

          {/* 收藏夹名称 */}
          <h3 className='text-lg font-semibold text-gray-900 truncate'>{favorite.name}</h3>
        </div>

        {/* 操作按钮组 */}
        <div className='flex items-center space-x-2'>
          {/* 编辑按钮 */}
          {onEdit && (
            <button
              onClick={onEdit}
              className='p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 
              rounded-md transition-colors'
              title='编辑收藏夹'
            >
              <PencilIcon className='w-4 h-4' />
            </button>
          )}

          {/* 进入收藏夹按钮 */}
          <button
            onClick={onClick}
            className='flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 
            hover:bg-blue-50 rounded-md transition-colors'
          >
            <span>{favorite.files.length}个内容</span>
            <ChevronRightIcon className='w-4 h-4' />
          </button>
        </div>
      </div>

      {/* 收藏夹文件预览 */}
      <div className='h-32 overflow-hidden'>
        {favorite.files.length === 0 ? (
          <div className='flex items-center justify-center h-full text-gray-500'>
            <span>收藏夹为空</span>
          </div>
        ) : (
          <div className='flex space-x-2 overflow-x-auto pb-2'>
            {favorite.files.map(favoriteFile => (
              <div key={favoriteFile.id} className='flex-shrink-0'>
                <FavoriteFileItem
                  file={convertToFileInfo(favoriteFile)}
                  onClick={() => onItemClick(convertToFileInfo(favoriteFile))}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
