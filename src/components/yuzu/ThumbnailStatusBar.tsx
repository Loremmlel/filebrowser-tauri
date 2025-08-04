import React, { useState } from 'react'
import { useThumbnailStatus } from '@/hooks/thumbnail/useThumbnailStatus'
import { formatBytes } from '@/utils/stringUtil'

interface ThumbnailStatusBarProps {
  className?: string
}

export const ThumbnailStatusBar: React.FC<ThumbnailStatusBarProps> = ({ className = '' }) => {
  const { status, error, clearCache } = useThumbnailStatus(1000)
  const [showDetails, setShowDetails] = useState(false)

  // 如果没有任何活动（等待或处理中），则不显示状态栏
  if (!status) {
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

  const handleClearCache = async () => {
    try {
      await clearCache()
    } catch (err) {
      console.error('清理缓存失败:', err)
    }
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

        {/* 缓存信息 */}
        <div className='flex items-center space-x-1 text-xs text-gray-500'>
          <span>
            缓存: {status.cache_size}/{status.cache_max_size}
          </span>
          <span>({formatBytes(status.cache_memory_usage)})</span>
        </div>

        {/* 操作按钮 */}
        <div className='flex items-center space-x-1'>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className='text-xs text-blue-600 hover:text-blue-800 transition-colors'
            title='显示详细信息'
          >
            ℹ️
          </button>
          {status.cache_size > 0 && (
            <button
              onClick={handleClearCache}
              className='text-xs text-red-600 hover:text-red-800 transition-colors'
              title='清理缓存'
            >
              🗑️
            </button>
          )}
        </div>

        {/* 小进度条 */}
        <div className='w-12 h-1 bg-gray-200 rounded-full overflow-hidden'>
          <div
            className={`h-full transition-all duration-300 ease-out ${getStatusColor()}`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* 详细信息面板 */}
      {showDetails && (
        <div className='mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600'>
          <div className='grid grid-cols-2 gap-2'>
            <div>最大并发: {status.max_concurrent}</div>
            <div>可用槽位: {status.available_slots}</div>
            <div>
              缓存命中率:
              {status.cache_size > 0
                ? `${Math.round((status.cache_size / (status.cache_size + status.current_processing)) * 100)}%`
                : 'N/A'}
            </div>
            <div>内存使用: {formatBytes(status.cache_memory_usage)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
