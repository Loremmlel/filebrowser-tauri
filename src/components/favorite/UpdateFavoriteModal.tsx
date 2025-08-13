import React, { FormEvent, useState, useEffect } from 'react'
import { FavoriteDto } from '@/types/favorite'
import { YuzuModal } from '../yuzu/Modal'

interface UpdateFavoriteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (name: string, sortOrder: number) => void
  favorite: FavoriteDto | null
}

export const UpdateFavoriteModal: React.FC<UpdateFavoriteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  favorite,
}) => {
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState(0)

  // 当favorite变化时，更新表单数据
  useEffect(() => {
    if (favorite) {
      setName(favorite.name)
      setSortOrder(favorite.sortOrder)
    } else {
      setName('')
      setSortOrder(0)
    }
  }, [favorite])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (name.trim()) {
      onConfirm(name.trim(), sortOrder)
      onClose()
    }
  }

  const footer = (
    <div className='flex space-x-3'>
      <button
        type='button'
        onClick={onClose}
        className='flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md 
        hover:bg-gray-300 transition-colors'
      >
        取消
      </button>
      <button
        type='submit'
        form='update-favorite-form'
        className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-md 
        hover:bg-blue-700 transition-colors'
      >
        更新
      </button>
    </div>
  )

  return (
    <YuzuModal isOpen={isOpen} onClose={onClose} title='编辑收藏夹' footer={footer}>
      <form id='update-favorite-form' onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>收藏夹名称</label>
          <input
            type='text'
            value={name}
            onChange={e => setName(e.target.value)}
            className='w-full p-3 border border-gray-300 rounded-md 
            focus:ring-blue-500 focus:border-blue-500'
            autoFocus
            required
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>排序顺序</label>
          <input
            type='number'
            value={sortOrder}
            onChange={e => setSortOrder(Number(e.target.value))}
            className='w-full p-3 border border-gray-300 rounded-md 
            focus:ring-blue-500 focus:border-blue-500'
          />
        </div>
      </form>
    </YuzuModal>
  )
}
