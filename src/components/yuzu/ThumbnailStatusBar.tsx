import React from 'react'
import { useThumbnailStatus } from '@/hooks/thumbnail/useThumbnailStatus'

interface ThumbnailStatusBarProps {
  className?: string
}

export const ThumbnailStatusBar: React.FC<ThumbnailStatusBarProps> = ({ className = '' }) => {
  const { status, error } = useThumbnailStatus(1000)

  // 如果没有任何活动（等待或处理中），则不显示状态栏
  if (!status || (status.current_waiting === 0 && status.current_processing === 0)) {
    return null
  }

  const getStatusColor = () => {
    if (status.current_processing >= status.max_concurrent) {
      return 'bg-red-500'
    }
    if (status.current_waiting > 0) {
      return 'bg-yellow-500'
    }
    return 'bg-blue-500'
  }

  const getProgressPercentage = () => {
    return (status.current_processing / status.max_concurrent) * 100
  }

  if (error) {
    return (
      <div
        className={`fixed top-2 right-2 z-50 bg-red-100 border border-red-300 rounded-lg px-3 py-2 shadow-sm ${className}`}
      >
        <span className='text-red-700 text-xs'>状态获取失败</span>
      </div>
    )
  }

  return (
    <div
      className={`fixed top-2 right-2 z-50 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm backdrop-blur-sm bg-opacity-95 ${className}`}
    >
      <div className='flex items-center space-x-2'>
        {/* 状态指示器 */}
        <div className='flex items-center space-x-1'>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
          <span className='text-xs text-gray-600'>缩略图</span>
        </div>

        {/* 简化的状态信息 */}
        <div className='flex items-center space-x-2 text-xs text-gray-500'>
          <span>{status.current_processing}处理中</span>
          {status.current_waiting > 0 && <span>{status.current_waiting}等待</span>}
        </div>

        {/* 小进度条 */}
        <div className='w-12 h-1 bg-gray-200 rounded-full overflow-hidden'>
          <div
            className={`h-full transition-all duration-300 ease-out ${getStatusColor()}`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>
    </div>
  )
}
