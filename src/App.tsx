import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { AppLayout } from './layouts/AppLayout'
import { ROUTES } from './constants/routes'
import { BrowsePage } from './pages/BrowsePage'
import { FavoritePage } from './pages/FavoritePage'
import { useAppInitialization } from './hooks/useAppInitialization'

function App() {
  // 初始化应用，根据平台设置服务器地址
  useAppInitialization()

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path={ROUTES.MAIN} element={<BrowsePage />}></Route>
          <Route path={ROUTES.FAVORITE} element={<FavoritePage />}></Route>
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App
