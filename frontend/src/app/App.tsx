import {Routes, Route} from "react-router-dom";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import PublicOnlyRoute from "../components/auth/PublicOnlyRoute";
import { ROLES } from "../constants/roles";

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
    return (
        <>
            <Navbar />
            <main className="flex-1 flex flex-col sm:w-4/5 2xl:w-3/5 mx-4 sm:mx-auto my-6 sm:my-12">
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
            </main>
        </>
    );
}
