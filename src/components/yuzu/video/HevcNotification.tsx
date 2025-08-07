import { useHevcDetect } from '@/hooks/useHevcDetect.ts'
import { YuzuLoading } from '@/components/yuzu/Loading.tsx'
import { CheckIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/solid'
import React, { useState } from 'react'

interface YuzuHevcNotificationProps {
  className?: string
}

export const YuzuHevcNotification: React.FC<YuzuHevcNotificationProps> = ({ className = '' }) => {
  const { support, isLoading, error } = useHevcDetect()
  const [expanded, setExpanded] = useState(false)
  const [close, setClose] = useState(false)

  if (isLoading) {
    return (
      <div
        className={`bg-gray-100 text-gray-700 px-4 py-2 text-sm flex items-center justify-center ${className}`}
      >
        <YuzuLoading />
        <span>正在检测HEVC支持...</span>
      </div>
    )
  }

  if (!support || error) {
    return null
  }

  return (
    !close && (
      <div
        className={`px-4 py-2 text-sm relative ${
          support.isSupported ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        } ${className}`}
      >
        <button className='absolute top-2 right-2' onClick={() => setClose(true)}>
          <XMarkIcon className='text-gray-400 h-4 w-4' />
        </button>
        <div className='mt-4 flex items-center justify-between'>
          <div className='flex items-center'>
            {support.isSupported ? (
              <>
                <CheckIcon className='text-green-600 h-5 w-5' />
                <span>你的平台支持HEVC原生播放，可以直接播放视频无需转码</span>
              </>
            ) : (
              <>
                <XCircleIcon className='text-red-600 h-5 w-5' />
                <span>你的平台不支持HEVC原生播放，视频将需要转码</span>
              </>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className='ml-2 text-xs underline focus:outline-none'
          >
            {expanded ? '收起' : '详情'}
          </button>
        </div>

        {expanded && (
          <div className='mt-2 text-xs bg-white p-2 rounded'>
            <p>
              {support.reason && (
                <>
                  <strong>详细信息:</strong> {support.reason}
                </>
              )}
              {support.hardwareAccelerated && (
                <>
                  <strong>硬件加速:</strong> {support.hardwareAccelerated}
                </>
              )}
            </p>
          </div>
        )}
      </div>
    )
  )
}
