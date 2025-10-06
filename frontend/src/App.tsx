import type {NavigateOptions} from "react-router-dom";
import {useNavigate, useHref, Routes, Route} from 'react-router-dom';
import {HeroUIProvider} from "@heroui/react";
import Home from './pages/Home.jsx';
import Navbar from './components/Navbar'

declare module "@react-types/shared" {
    interface RouterConfig {
        routerOptions: NavigateOptions;
    }
}

export default function App() {
    const navigate = useNavigate();

    return (
        <HeroUIProvider navigate={navigate} useHref={useHref}>
            <Navbar />
            <main className="text-foreground bg-background px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                <Routes>
                    <Route path="/" element={<Home />} />
                    {/* ... */}
                </Routes>
            </main>
        </HeroUIProvider>
    );
}