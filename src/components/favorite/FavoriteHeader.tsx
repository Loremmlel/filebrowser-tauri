import { PlusIcon, Squares2X2Icon, TrashIcon } from '@heroicons/react/24/solid'
import React from 'react'

interface FavoriteHeaderProps {
  onAddClick: () => void
  onDeleteClick: () => void
  onTreeClick: () => void
  hasSelection: boolean
}

export const FavoriteHeader: React.FC<FavoriteHeaderProps> = ({
  onAddClick,
  onDeleteClick,
  onTreeClick,
  hasSelection,
}) => {
  return (
    <div
      className='flex items-center justify-between w-full 
    bg-blue-100 px-4 py-3 border-b border-blue-200'
    >
      {/* 左侧：树形视图按钮 */}
      <button
        onClick={onTreeClick}
        className='p-2 rounded-full text-blue-600 hover:bg-blue-200 transition-colors'
        title='树形视图'
      >
        <Squares2X2Icon className='w-6 h-6' />
      </button>

      {/* 右侧：操作按钮 */}
      <div className='flex items-center space-x-2'>
        <button
          onClick={onDeleteClick}
          disabled={!hasSelection}
          className={`p-2 rounded-full transition-colors ${
            hasSelection ? 'text-red-600 hover:bg-red-200' : 'text-gray-400 cursor-not-allowed'
          }`}
          title='删除选中收藏夹'
        >
          <TrashIcon className='w-6 h-6' />
        </button>

        <button
          onClick={onAddClick}
          className='p-2 rounded-full text-blue-600 hover:bg-blue-200 transition-colors'
          title='添加收藏夹'
        >
          <PlusIcon className='w-6 h-6' />
        </button>
      </div>
    </div>
  )
}
