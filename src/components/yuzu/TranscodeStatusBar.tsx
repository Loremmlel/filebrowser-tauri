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
        bg-red-100 border border-red-300 rounded-lg px-4 py-3 shadow-lg max-w-md ${className}`}
      >
        <div className='flex flex-col items-center space-x-3'>
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
    const isCompleted = status.progress >= 0.99

    return (
      <div
        className={`fixed left-4 bottom-1/2 transform -translate-x-1/2 z-50 bg-white border 
        border-gray-200 rounded-lg px-4 py-3 shadow-lg 
        backdrop-blur-sm bg-opacity-95 min-w-80 ${className}`}
      >
        <div className='flex flex-col items-center space-x-3'>
          <div className='flex-1'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-gray-700'>
                {isCompleted ? '转码完成' : '正在转码...'}
              </span>
              <span className='text-sm text-gray-500'>{percentage}%</span>
            </div>

            {/* 进度条 */}
            <div className='w-full h-2 bg-gray-200 rounded-full overflow-hidden'>
              <div
                className={`h-full transition-all duration-300 ease-out ${
                  isCompleted ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
  return null
}
