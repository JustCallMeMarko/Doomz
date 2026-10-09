import { BrowserRouter, Route, Routes } from "react-router-dom"
import MainLayout from "./layouts/MainLayout"
import ChatPage from "./pages/ChatPage"
import ElementsPage from "./pages/ElementsPage"
import HomePage from "./pages/HomePage"
import InventoryPage from "./pages/InventoryPage"
import PlansPage from "./pages/PlansPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/elements" element={<ElementsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
