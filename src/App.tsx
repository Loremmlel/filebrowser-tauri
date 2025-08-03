import { BrowserRouter, Route, Routes } from "react-router-dom"
import "./App.css"
import { AppLayout } from "./layouts/AppLayout"
import { ROUTES } from "./constants/routes"

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path={ROUTES.MAIN}>1</Route>
          <Route path={ROUTES.FAVORITE}>2</Route>
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App
