import { useToastStore } from '../stores/toastStore'

export const toast = {
  show: (message: string, duration?: number) => {
    useToastStore.getState().showToast(message, duration)
  },
}
