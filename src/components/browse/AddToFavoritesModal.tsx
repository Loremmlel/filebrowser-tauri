import { FavoriteDto } from '@/types/favorite'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'

interface AddFavoritesModalProps {
  favorites: FavoriteDto[]
  onAdd: (favoriteId: number) => void
  onClose: () => void
}

export const AddToFavoritesModal: React.FC<AddFavoritesModalProps> = ({
  favorites,
  onAdd,
  onClose,
}) => {
  const [selectedFavoriteId, setSelectedFavoriteId] = useState<number | null>(null)

  function handleAdd() {
    if (selectedFavoriteId != null) {
      onAdd(selectedFavoriteId)
      onClose()
    }
  }

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-medium text-gray-900'>添加到收藏夹</h3>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
            <XMarkIcon className='w-6 h-6' />
          </button>
        </div>

        <div className='mb-4'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>选择收藏夹</label>
          <select
            value={selectedFavoriteId ?? ''}
            onChange={e => setSelectedFavoriteId(Number(e.target.value))}
            className='w-full p-2 border border-gray-300 rounded-md 
            focus:ring-blue-500 focus:border-blue-500'
          >
            <option value=''>请选择收藏夹</option>
            {favorites.map(favorite => (
              <option key={favorite.id} value={favorite.id}>
                {favorite.name}
              </option>
            ))}
          </select>
        </div>

        <div className='flex space-x-3'>
          <button
            onClick={onClose}
            className='flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md 
            hover:bg-gray-300 transition-colors'
          >
            取消
          </button>
          <button
            onClick={handleAdd}
            disabled={selectedFavoriteId == null}
            className='flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md 
            hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
          >
            添加
          </button>
        </div>
      </div>
    </div>
  )
}
