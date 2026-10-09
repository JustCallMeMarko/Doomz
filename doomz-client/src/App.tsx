import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import MainLayout from "./layouts/MainLayout"
import ChatPage from "./pages/ChatPage"
import ElementsPage from "./pages/ElementsPage"
import InventoryPage from "./pages/InventoryPage"
import PlanPage from "./pages/PlanPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home/:threadId?" element={<ChatPage />} />
          <Route path="/plan/:planId?" element={<PlanPage />} />
          <Route path="/elements/:symbol?" element={<ElementsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/inventory/*" element={<Navigate to="/inventory" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
