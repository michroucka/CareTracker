import {Routes, Route} from "react-router-dom";
import Navbar from "../components/Navbar";
import Home from "../pages/Home.jsx";

export default function App() {
    return (
        <>
            <Navbar />
            <main className="sm:w-3/4 2xl:w-3/5 mx-4 sm:mx-auto my-12">
                <Routes>
                    <Route path="/" element={<Home />} />
                    {/* ... */}
                </Routes>
            </main>
        </>
    );
}
