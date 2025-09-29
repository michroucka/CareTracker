import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {HeroUIProvider} from '@heroui/react'
import './styles/index.css'
import App from './App.jsx'
import Navbar from './components/Navbar'
import {BrowserRouter} from "react-router-dom";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <HeroUIProvider>
                <Navbar />

                <main className="light text-foreground bg-background px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <App />
                </main>
            </HeroUIProvider>
        </BrowserRouter>
  </StrictMode>,
)
