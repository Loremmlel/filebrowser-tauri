import { ChevronRightIcon } from '@heroicons/react/24/solid'
import React from 'react'

export interface BreadCrumbItem {
  name: string
  id?: string
}

interface BreadCrumbProps {
  path: BreadCrumbItem[]
  onNavigate: (targetIndex: number) => void
}

export const BreadCrumb: React.FC<BreadCrumbProps> = ({ path, onNavigate }) => {
  const fullPath: BreadCrumbItem[] = [{ name: '/', id: undefined }, ...path]

  return (
    <div className='flex items-center space-x-1 p-4 bg-white border-b border-gray-200'>
      {fullPath.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRightIcon className='w-4 h-4 to-gray-400' />}
          <button
            onClick={() => onNavigate(index)}
            className={`px-2 py-1 rounded text-sm transition-colors ${
              index === fullPath.length - 1
                ? 'font-medium text-gray-900'
                : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
            }`}
          >
            {item.name.length > 20 ? `${item.name.slice(0, 20)}...` : item.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  )
}
