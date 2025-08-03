import { TOAST_DURATION } from '@/constants/toast'
import { create } from 'zustand'

interface ToastState {
  message: string
  visible: boolean
  duration: number
}

interface ToastStore extends ToastState {
  showToast: (message: string, duration?: number) => void
  hideToast: () => void
}

export const useToastStore = create<ToastStore>((set, get) => ({
  message: '',
  visible: false,
  duration: TOAST_DURATION.SHORT,

  showToast: (message, duration = TOAST_DURATION.SHORT) => {
    set({
      message,
      visible: true,
      duration,
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
