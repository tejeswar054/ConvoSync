import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastContainer } from 'react-toastify'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <ToastContainer
          position='top-right'
          autoClose={false}
          highProgressBar={false}
          newestOnTop={true}
          closeButton={true}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)