import { YuzuModal } from '@/components/yuzu/Modal'
import { useAppInitialization } from '@/hooks/useAppInitialization'
import { AppConfigForm } from '@/components/AppConfigForm'
import { useConfigStore } from '@/stores/configStore'

interface AppInitModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AppInitModal = ({ isOpen, onClose }: AppInitModalProps) => {
  const { configure } = useAppInitialization()
  const { serverUrl, baseDir, online } = useConfigStore()

  const handleConfigure = async (config: {
    serverUrl: string
    baseDir: string
    online: boolean
  }) => {
    try {
      await configure(config.baseDir, config.serverUrl, config.online)
      onClose()
    } catch {
      // 错误已在 configure 函数中处理
    }
  }

  return (
    <YuzuModal
      isOpen={isOpen}
      onClose={() => {}}
      title='应用初始化'
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <AppConfigForm
        initialServerUrl={serverUrl}
        initialBaseDir={baseDir}
        initialOnline={online}
        onSubmit={handleConfigure}
        submitText='确定'
      />
    </YuzuModal>
  )
}
