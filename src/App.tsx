import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { AppLayout } from './layouts/AppLayout'
import { ROUTES } from './constants/routes'
import { BrowsePage } from './pages/BrowsePage'
import { FavoritePage } from './pages/FavoritePage'
import { SettingsPage } from './pages/SettingsPage'
import { AppInitModal } from './components/AppInitModal'
import { useAppInitialization } from './hooks/useAppInitialization'
import { YuzuLoading } from './components/yuzu/Loading'

function App() {
  const { isFirstLaunch, refreshConfig } = useAppInitialization()

  // 在检查首次启动状态时显示加载状态
  if (isFirstLaunch === null) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center space-y-4'>
          <YuzuLoading className='h-12 w-12' />
          <p className='text-gray-600'>正在初始化应用...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AppInitModal
        isOpen={isFirstLaunch}
        onClose={() => {
          refreshConfig()
        }}
      />

      {!isFirstLaunch && (
        <AppLayout>
          <Routes>
            <Route path={ROUTES.MAIN} element={<BrowsePage />}></Route>
            <Route path={ROUTES.FAVORITE} element={<FavoritePage />}></Route>
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />}></Route>
          </Routes>
        </AppLayout>
      )}
    </BrowserRouter>
  )
}

export default App
