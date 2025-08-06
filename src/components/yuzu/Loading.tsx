import React from 'react'

interface YuzuLoadingProps {
  className?: string
}

export const YuzuLoading: React.FC<YuzuLoadingProps> = ({ className }) => {
  return (
    <div className={`${className} flex items-center justify-center bg-gray-100 rounded`}>
      <div
        className='w-6 h-6 border-2 border-blue-500 
      border-t-transparent rounded-full animate-spin'
      />
    </div>
  )
}
