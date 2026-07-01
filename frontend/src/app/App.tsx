import {Routes, Route} from "react-router-dom";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import PublicOnlyRoute from "../components/auth/PublicOnlyRoute";
import { ROLES } from "../constants/roles";
import { useAuth } from "../contexts/AuthContext";

import Navbar from "../components/Navbar";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Clients from "../pages/Clients";
import PerformedTasks from "../pages/PerformedTasks"
import IndividualPlan from "../pages/IndividualPlan";
import Employees from "../pages/Employees";
import Activate from "../pages/Activate";
import Tasks from "../pages/Tasks";
import Account from "../pages/Account";
import ResetPassword from "../pages/ResetPassword";
import MonthlyReport from "../pages/MonthlyReport";
import Departments from "../pages/Departments";
import Organizations from "../pages/Organizations";

export default function App() {
    const { user, loading } = useAuth();
    const showNav = !loading && !!user;

    return (
        <div className="flex-1 sm:flex-none flex flex-col sm:flex-row sm:h-screen sm:overflow-hidden">
            {showNav && <Navbar />}
            <main className={`flex-1 flex flex-col sm:overflow-hidden ${showNav ? "sm:p-6 sm:pl-2" : "sm:p-6"}`}>
                <div className="bg-background sm:rounded-2xl sm:shadow-lg p-4 sm:p-8 flex-1 sm:overflow-y-auto">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route
                            path="/login"
                            element={
                                <PublicOnlyRoute>
                                    <Login />
                                </PublicOnlyRoute>
                            }
                        />

                        <Route
                            path="/clients"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER]}>
                                    <Clients />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/clients/:clientId/individual-plan"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER]}>
                                    <IndividualPlan />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/performed-tasks"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER]}>
                                    <PerformedTasks />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/employees"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER]}>
                                    <Employees />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/tasks"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER]}>
                                    <Tasks />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/departments"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.ADMIN]}>
                                    <Departments />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/organizations"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN]}>
                                    <Organizations />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/activate"
                            element={
                                <PublicOnlyRoute>
                                    <Activate />
                                </PublicOnlyRoute>
                            }
                        />

                        <Route
                            path="/reset-password"
                            element={
                                <ResetPassword />
                            }
                        />

                        <Route
                            path="/account"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER, ROLES.CLIENT]}>
                                    <Account />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/monthly-report"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
                                    <MonthlyReport />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </div>
            </main>
        </div>
    );
}
