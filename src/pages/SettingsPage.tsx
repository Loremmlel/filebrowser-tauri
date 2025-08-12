import { useState } from 'react'
import { useConfigStore } from '@/stores/configStore'
import { AppConfigForm } from '@/components/AppConfigForm'
import { useAppInitialization } from '@/hooks/useAppInitialization'

export const SettingsPage = () => {
  const { serverUrl, baseDir, online } = useConfigStore()
  const { configure } = useAppInitialization()
  const [isLoading, setIsLoading] = useState(false)

  const handleSaveSettings = async (config: {
    serverUrl: string
    baseDir: string
    online: boolean
  }) => {
    setIsLoading(true)
    await configure(config.baseDir, config.serverUrl, config.online)
    setIsLoading(false)
  }

  return (
    <div className='h-full flex-1 overflow-y-auto p-6'>
      <div className='max-w-2xl mx-auto'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>应用设置</h1>
          <p className='text-gray-600'>配置应用的服务模式和连接参数</p>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <AppConfigForm
            initialServerUrl={serverUrl}
            initialBaseDir={baseDir}
            initialOnline={online}
            onSubmit={handleSaveSettings}
            submitText={isLoading ? '保存中...' : '保存设置'}
            disabled={isLoading}
          />
        </div>

        <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
          <h3 className='text-sm font-medium text-blue-900 mb-2'>当前配置</h3>
          <div className='text-sm text-blue-700 space-y-1'>
            <div>
              <span className='font-medium'>服务模式:</span> {online ? '在线服务' : '离线服务'}
            </div>
            {online ? (
              <div>
                <span className='font-medium'>服务器地址:</span> {serverUrl}
              </div>
            ) : (
              <div>
                <span className='font-medium'>本地根目录:</span> {baseDir}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
