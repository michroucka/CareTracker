import React from "react";
import {Routes, Route, useLocation} from "react-router-dom";
import {motion} from "motion/react";
import {DURATION, EASE_OUT} from "../lib/motion";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import PublicOnlyRoute from "../components/auth/PublicOnlyRoute";
import { ROLES } from "../constants/roles";
import { useAuth } from "../contexts/AuthContext";

import { AppSidebar } from "../components/layout/AppSidebar";
import { AppHeader } from "../components/layout/AppHeader";
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar";
import { PageLoader } from "../components/PageLoader";
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
import {ClientCreate} from "../pages/ClientCreate";
import {ClientDetail} from "../pages/ClientDetail";
import ComponentCatalog from "../pages/ComponentCatalog";

const AUTH_PAGES = ["/login", "/activate", "/reset-password"];

const PageTransition = motion.div;

function PageTransitionWrapper(props: React.ComponentProps<typeof motion.div>) {
    return (
        <PageTransition
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.slow, ease: EASE_OUT }}
            {...props}
        />
    );
}

function readSidebarOpenCookie() {
    return !document.cookie.split("; ").includes("sidebar_state=false");
}

export default function App() {
    const { user, loading } = useAuth();
    const { pathname } = useLocation();
    const contentRef = React.useRef<HTMLDivElement>(null);
    const isAuthPage = AUTH_PAGES.includes(pathname);
    const showShell = !loading && !!user && !isAuthPage;

    // The content area scrolls on its own (desktop), so reset it on navigation like a normal page
    React.useEffect(() => {
        contentRef.current?.scrollTo(0, 0);
        window.scrollTo(0, 0);
    }, [pathname]);

    const routes = (
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
                path="/clients/new"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR]}>
                        <ClientCreate />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/clients/:clientId"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER]}>
                        <ClientDetail />
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
            {import.meta.env.DEV && <Route path="/dev/components" element={<ComponentCatalog />} />}
        </Routes>
    );

    if (loading && !isAuthPage) {
        return <PageLoader />;
    }

    if (!showShell) {
        return routes;
    }

    return (
        <SidebarProvider defaultOpen={readSidebarOpenCookie()} className="md:h-svh md:overflow-hidden">
            <AppSidebar />
            <SidebarInset className="md:overflow-hidden">
                <AppHeader />
                <div ref={contentRef} data-scroll-root className="flex-1 md:overflow-y-auto">
                    {/* keyed by pathname so every page change replays the short enter animation */}
                    <PageTransitionWrapper key={pathname} className="p-4 md:p-6">
                        {routes}
                    </PageTransitionWrapper>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
