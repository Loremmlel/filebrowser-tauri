import { ChevronRightIcon } from '@heroicons/react/24/solid'
import React from 'react'

export const YuzuSpeedIndicator: React.FC = () => {
  return (
    <div className='absolute inset-0 flex items-center justify-center z-60 pointer-events-none'>
      <div className='bg-black/70 rounded-lg p-6 flex flex-col items-center'>
        <div className='flex space-x-1 mb-2'>
          <ChevronRightIcon className='w-8 h-8 text-white speed-icon-1' />
          <ChevronRightIcon className='w-8 h-8 text-white speed-icon-2' />
          <ChevronRightIcon className='w-8 h-8 text-white speed-icon-3' />
        </div>
        <span className='text-white text-xl font-bold'>3×</span>
      </div>
    </div>
  )
}
