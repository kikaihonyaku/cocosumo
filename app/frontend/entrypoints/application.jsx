import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'
import './application.css'

console.log('CoCoスモ Starting React application...')

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('CoCoスモ: Root element not found!')
} else {
  console.log('CoCoスモ: Root element found, mounting React app...')
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
  console.log('CoCoスモ: React app mounted successfully!')
}
