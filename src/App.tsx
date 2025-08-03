import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { AppLayout } from './layouts/AppLayout'
import { ROUTES } from './constants/routes'
import { BrowsePage } from './pages/BrowsePage'
import { FavoritePage } from './pages/FavoritePage'

function App() {
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
