import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { AppLayout } from './layouts/AppLayout'
import { ROUTES } from './constants/routes'
import { BrowsePage } from './pages/BrowsePage'
import { FavoritePage } from './pages/FavoritePage'
import { useAppInitialization } from './hooks/useAppInitialization'
import { useState } from 'react'
import { YuzuModal } from './components/yuzu/Modal'

function App() {
  // 初始化应用，根据平台设置服务器地址
  const { showInitModal, udpBroadcastIp, configure } = useAppInitialization()

  const [serverUrl, setServerUrl] = useState('http://localhost:8080')
  const [baseDir, setBaseDir] = useState('/')
  const [online, setOnline] = useState(true)

  const initModalFooter = (
    <div className='flex space-x-3 justify-center'>
      <button
        onClick={() => configure(baseDir, serverUrl, online)}
        disabled={(online && !serverUrl) || (!online && !baseDir)}
        className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-md 
        hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
      >
        确定
      </button>
    </div>
  )

  return (
    <BrowserRouter>
      <YuzuModal
        isOpen={showInitModal}
        onClose={() => {}}
        title='应用初始化'
        footer={initModalFooter}
        showCloseButton={false}
        closeOnOverlayClick={false}
        closeOnEscape={false}
      >
        {/* 选择使用在线服务还是离线服务 */}
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          选择服务模式
          <input
            type='radio'
            name='mode'
            value='online'
            checked={online}
            onChange={() => setOnline(true)}
            className='ml-4 mr-1'
          />
          在线服务
          <input
            type='radio'
            name='mode'
            value='offline'
            checked={!online}
            onChange={() => setOnline(false)}
            className='ml-4 mr-1'
          />
          离线服务
        </label>

        {online && (
          <div className='mt-2'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>服务器地址</label>
            <input
              type='text'
              value={serverUrl}
              onChange={e => setServerUrl(e.target.value)}
              className='w-full p-2 border border-gray-300 rounded-md 
              focus:ring-blue-500 focus:border-blue-500'
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
                    onClick={() => setServerUrl(`http://${udpBroadcastIp}:8080`)}
                    className='px-3 py-1 text-xs bg-blue-600 text-white rounded-md 
                    hover:bg-blue-700 transition-colors'
                  >
                    应用
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {!online && (
          <div className='mt-2'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>本地根目录</label>
            <input
              type='text'
              value={baseDir}
              onChange={e => setBaseDir(e.target.value)}
              className='w-full p-2 border border-gray-300 rounded-md 
              focus:ring-blue-500 focus:border-blue-500'
            />
          </div>
        )}
      </YuzuModal>

      {!showInitModal && (
        <AppLayout>
          <Routes>
            <Route path={ROUTES.MAIN} element={<BrowsePage />}></Route>
            <Route path={ROUTES.FAVORITE} element={<FavoritePage />}></Route>
          </Routes>
        </AppLayout>
      )}
    </BrowserRouter>
  )
}

export default App
