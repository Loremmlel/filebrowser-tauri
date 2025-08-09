import React from 'react'
import { useTranscodeStatus } from '@/hooks/video/useTranscodeStatus.ts'
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid'

interface YuzuTranscodeStatusBarProps {
  className?: string
}

export const YuzuTranscodeStatusBar: React.FC<YuzuTranscodeStatusBarProps> = ({
  className = '',
}) => {
  const { status, error } = useTranscodeStatus()

  if (error || status?.error) {
    return (
      <div
        className={`fixed left-4 bottom-1/2 transform -translate-x-1/2 z-50 
        bg-red-100 border border-red-300 rounded-lg px-4 py-3 shadow-lg ${className}`}
      >
        <div className='flex flex-col items-center space-y-3'>
          <ExclamationTriangleIcon className='w-5 h-5 text-red-500 flex-shrink-0' />
          <div className='flex-1'>
            <div className='text-red-800 text-sm font-medium'>转码失败</div>
            <div className='text-red-600 text-xs mt-1'>{error || status?.error || '未知错误'}</div>
          </div>
        </div>
      </div>
    )
  }

  if (status) {
    const percentage = Math.round(status.progress * 100)
    const isCompleted = status.progress >= 0.98

    return (
      <div
        className={`fixed left-4 bottom-1/2 transform -translate-x-1/2 z-50 bg-white/95 border 
        border-gray-200 rounded-lg px-4 py-3 shadow-lg 
        backdrop-blur-sm min-h-60 flex flex-col items-center ${className}`}
      >
        <div className='flex flex-col items-center w-full'>
          <span className='text-sm font-medium text-gray-700 mb-2'>
            {isCompleted ? '转码完成' : '正在转码...'}
          </span>
          {/* 竖直进度条 */}
          <div
            className='relative h-40 w-6 bg-gray-200 rounded-full 
          overflow-hidden flex items-end mb-2'
          >
            <div
              className={`absolute bottom-0 left-0 w-full transition-all duration-300 ease-out ${
                isCompleted ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ height: `${percentage}%` }}
            />
            {/* 进度百分比数字 */}
            <span
              className='absolute top-1 left-1/2 -translate-x-1/2 text-xs 
            text-gray-700 font-bold select-none'
            >
              {percentage}%
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}
