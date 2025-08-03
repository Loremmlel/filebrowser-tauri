import { XMarkIcon } from '@heroicons/react/24/solid'
import { FormEvent, useState } from 'react'

interface CreateFavoriteModalProps {
  onClose: () => void
  onConirm: (name: string, sortOrder: number) => void
}

export const CreateFavoriteModal: React.FC<CreateFavoriteModalProps> = ({ onClose, onConirm }) => {
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState(0)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (name.trim()) {
      onConirm(name.trim(), sortOrder)
      onClose()
    }
  }

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-medium text-gray-900'>创建收藏夹</h3>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
            <XMarkIcon className='w-6 h-6' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
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

          <div className='flex space-x-3 pt-4'>
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
              className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-md 
              hover:bg-blue-700 transition-colors'
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
