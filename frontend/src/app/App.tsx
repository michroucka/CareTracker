import {Routes, Route} from "react-router-dom";
import Navbar from "../components/Navbar";
import Home from "../pages/Home.jsx";
import Login from "../pages/Login.jsx";
import Clients from "../pages/Clients";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { ROLES } from "../constants/roles";

export default function App() {
    return (
        <>
            <Navbar />
            <main className="sm:w-3/4 2xl:w-3/5 mx-4 sm:mx-auto my-6 sm:my-12">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />

                    {/* Chráněné routes */}
                    <Route
                        path="/clients"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.COORDINATOR, ROLES.CAREGIVER]}>
                                <Clients />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </main>
        </>
    );
}
