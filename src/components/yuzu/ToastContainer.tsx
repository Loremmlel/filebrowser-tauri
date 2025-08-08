import { useToastStore, ToastType } from '@/stores/toastStore'
import React from 'react'

export const YuzuToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { message, visible, type } = useToastStore()

  // 根据类型获取样式
  const getToastStyles = (toastType: ToastType) => {
    switch (toastType) {
      case ToastType.Success:
        return 'bg-green-600/90'
      case ToastType.Warning:
        return 'bg-yellow-600/90'
      case ToastType.Error:
        return 'bg-red-600/90'
      case ToastType.Info:
      default:
        return 'bg-blue-600/90'
    }
  }

  return (
    <div className='relative w-full h-full'>
      {children}

      {/* Toast */}
      <div
        className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <div
          className={`${getToastStyles(type)} backdrop-blur-sm text-white px-6 py-2 rounded-2xl`}
        >
          <p className='text-sm font-medium whitespace-nowrap max-w-xs truncate'>{message}</p>
        </div>
      </div>
    </div>
  )
}
