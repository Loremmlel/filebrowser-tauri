import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { AppLayout } from './layouts/AppLayout'
import { ROUTES } from './constants/routes'
import { BrowsePage } from './pages/BrowsePage'
import { FavoritePage } from './pages/FavoritePage'
import { useAppInitialization } from './hooks/useAppInitialization'
import { useState } from 'react'

function App() {
  // 初始化应用，根据平台设置服务器地址
  const { showInitModal, configure } = useAppInitialization()

  const [serverUrl, setServerUrl] = useState('http://localhost:8080')
  const [baseDir, setBaseDir] = useState('/')
  const [online, setOnline] = useState(true)

  return (
    <BrowserRouter>
      {showInitModal ? (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>应用初始化</h3>

            <div className='mb-4'>
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
            </div>
            <div className='flex space-x-3 justify-center'>
              <button
                onClick={() => configure(baseDir, serverUrl, online)}
                disabled={(online && !serverUrl) || (!online && !baseDir)}
                className='flex-1 bg-gray-200 text-white py-2 px-4 rounded-md 
            hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
              >
                确定
              </button>
            </div>
          </div>
        </div>
      ) : (
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
