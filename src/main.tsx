import { createRoot } from 'react-dom/client'
import './index.css'
import '@/lib/auth-init' // Single auth subscription — runs once on boot
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(<App />)
