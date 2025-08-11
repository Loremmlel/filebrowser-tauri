import { useState, useEffect } from 'react'
import { useAppInitialization } from '@/hooks/useAppInitialization'

interface AppConfigFormProps {
  initialServerUrl?: string
  initialBaseDir?: string
  initialOnline?: boolean
  onSubmit: (config: { serverUrl: string; baseDir: string; online: boolean }) => void
  submitText?: string
  disabled?: boolean
}

export const AppConfigForm = ({
  initialServerUrl = 'http://localhost:8080',
  initialBaseDir = '/',
  initialOnline = true,
  onSubmit,
  submitText = '确定',
  disabled = false,
}: AppConfigFormProps) => {
  const { udpBroadcastIp } = useAppInitialization()

  const [serverUrl, setServerUrl] = useState(initialServerUrl)
  const [baseDir, setBaseDir] = useState(initialBaseDir)
  const [online, setOnline] = useState(initialOnline)

  // 当初始值变化时更新状态
  useEffect(() => {
    setServerUrl(initialServerUrl)
    setBaseDir(initialBaseDir)
    setOnline(initialOnline)
  }, [initialServerUrl, initialBaseDir, initialOnline])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    onSubmit({
      serverUrl,
      baseDir,
      online,
    })
  }

  const isFormValid = (online && serverUrl) || (!online && baseDir)

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {/* 选择使用在线服务还是离线服务 */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>选择服务模式</label>
        <div className='flex space-x-6'>
          <label className='flex items-center'>
            <input
              type='radio'
              name='mode'
              value='online'
              checked={online}
              onChange={() => setOnline(true)}
              className='mr-2'
              disabled={disabled}
            />
            在线服务
          </label>
          <label className='flex items-center'>
            <input
              type='radio'
              name='mode'
              value='offline'
              checked={!online}
              onChange={() => setOnline(false)}
              className='mr-2'
              disabled={disabled}
            />
            离线服务
          </label>
        </div>
      </div>

      {online && (
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>服务器地址</label>
          <input
            type='text'
            value={serverUrl}
            onChange={e => setServerUrl(e.target.value)}
            className='w-full p-2 border border-gray-300 rounded-md 
            focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100'
            disabled={disabled}
          />

          {/* 服务器发现状态 */}
          <div className='mt-3 p-3 bg-gray-50 rounded-md border'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <span className='text-sm font-medium text-gray-700'>服务器发现：</span>
                {!udpBroadcastIp ? (
                  <div className='flex items-center space-x-2'>
                    <div className='flex space-x-1'>
                      <div className='w-2 h-2 bg-red-500 rounded-full animate-pulse'></div>
                      <div
                        className='w-2 h-2 bg-yellow-500 rounded-full animate-pulse'
                        style={{ animationDelay: '0.3s' }}
                      ></div>
                      <div
                        className='w-2 h-2 bg-green-500 rounded-full animate-pulse'
                        style={{ animationDelay: '0.6s' }}
                      ></div>
                    </div>
                    <span className='text-sm text-gray-500'>搜索中...</span>
                  </div>
                ) : (
                  <div className='flex items-center space-x-2'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <span className='text-sm text-green-600'>已发现: {udpBroadcastIp}</span>
                  </div>
                )}
              </div>
              {udpBroadcastIp && (
                <button
                  type='button'
                  onClick={() => setServerUrl(`http://${udpBroadcastIp}:8080`)}
                  className='px-3 py-1 text-xs bg-blue-600 text-white rounded-md 
                  hover:bg-blue-700 transition-colors disabled:bg-gray-300'
                  disabled={disabled}
                >
                  应用
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!online && (
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>本地根目录</label>
          <input
            type='text'
            value={baseDir}
            onChange={e => setBaseDir(e.target.value)}
            className='w-full p-2 border border-gray-300 rounded-md 
            focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100'
            disabled={disabled}
          />
        </div>
      )}

      <button
        type='submit'
        disabled={!isFormValid || disabled}
        className='w-full bg-blue-600 text-white py-2 px-4 rounded-md 
        hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
      >
        {submitText}
      </button>
    </form>
  )
}
