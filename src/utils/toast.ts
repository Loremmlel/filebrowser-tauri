import { useToastStore, ToastType } from '../stores/toastStore'
import { ErrorType, parseApiError } from '../types/error'
import { TOAST_DURATION } from '../constants/toast'

export const toast = {
  // 普通信息提示
  show: (message: string, duration?: number) => {
    useToastStore.getState().showToast(message, ToastType.Info, duration)
  },

  // 成功提示
  success: (message: string, duration?: number) => {
    useToastStore.getState().showToast(message, ToastType.Success, duration)
  },

  // 警告提示
  warning: (message: string, duration?: number) => {
    useToastStore.getState().showToast(message, ToastType.Warning, duration)
  },

  // 错误提示
  error: (message: string, duration?: number) => {
    useToastStore.getState().showToast(message, ToastType.Error, duration)
  },

  // 处理 API 错误的便捷方法
  handleApiError: (error: unknown, defaultMessage?: string) => {
    const apiError = parseApiError(error)
    const message = defaultMessage ? `${defaultMessage}: ${apiError.message}` : apiError.message

    switch (apiError.error_type) {
      case ErrorType.Warning:
        toast.warning(message, TOAST_DURATION.LONG)
        break
      case ErrorType.Error:
        toast.error(message, TOAST_DURATION.LONG)
        break
      case ErrorType.Network:
      default:
        toast.error(message, TOAST_DURATION.LONG)
        break
    }

    return apiError
  },
}
