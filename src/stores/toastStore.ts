import { TOAST_DURATION } from '@/constants/toast'
import { create } from 'zustand'

export enum ToastType {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
  Success = 'success',
}

interface ToastState {
  message: string
  visible: boolean
  duration: number
  type: ToastType
}

interface ToastStore extends ToastState {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  hideToast: () => void
}

export const useToastStore = create<ToastStore>((set, get) => ({
  message: '',
  visible: false,
  duration: TOAST_DURATION.SHORT,
  type: ToastType.Info,

  showToast: (message, type = ToastType.Info, duration = TOAST_DURATION.SHORT) => {
    set({
      message,
      visible: true,
      duration,
      type,
    })

    setTimeout(() => {
      get().hideToast()
    }, duration)
  },

  hideToast: () => {
    set({
      message: '',
      visible: false,
    })
  },
}))
