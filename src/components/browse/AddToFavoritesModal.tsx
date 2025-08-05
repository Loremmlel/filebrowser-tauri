import { FavoriteDto } from '@/types/favorite'
import { useState } from 'react'
import { Modal } from '../yuzu/Modal'

interface AddFavoritesModalProps {
  isOpen: boolean
  favorites: FavoriteDto[]
  onAdd: (favoriteId: number) => void
  onClose: () => void
}

export const AddToFavoritesModal: React.FC<AddFavoritesModalProps> = ({
  isOpen,
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

  const footer = (
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
        className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-md
        hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
      >
        添加
      </button>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='添加到收藏夹' footer={footer}>
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
    </Modal>
  )
}
