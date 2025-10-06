import {Routes, Route} from "react-router-dom";
import Navbar from "../components/Navbar";
import Home from "../pages/Home.jsx";

export default function App() {
    return (
        <>
            <Navbar />
            <main className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                <Routes>
                    <Route path="/" element={<Home />} />
                    {/* ... */}
                </Routes>
            </main>
        </>
    );
}
