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
import Login from "../pages/Login";
import Activate from "../pages/Activate";
import ResetPassword from "../pages/ResetPassword";

// Pages behind the login load on demand, so the login screen does not wait for charts, maps and tables.
const Home = React.lazy(() => import("../pages/Home"));
const Clients = React.lazy(() => import("../pages/Clients"));
const PerformedTasks = React.lazy(() => import("../pages/PerformedTasks"));
const IndividualPlan = React.lazy(() => import("../pages/IndividualPlan"));
const Employees = React.lazy(() => import("../pages/Employees"));
const Tasks = React.lazy(() => import("../pages/Tasks"));
const Account = React.lazy(() => import("../pages/Account"));
const MonthlyReport = React.lazy(() => import("../pages/MonthlyReport"));
const Departments = React.lazy(() => import("../pages/Departments"));
const Organizations = React.lazy(() => import("../pages/Organizations"));
const ClientCreate = React.lazy(() => import("../pages/ClientCreate").then((module) => ({ default: module.ClientCreate })));
const ClientDetail = React.lazy(() => import("../pages/ClientDetail").then((module) => ({ default: module.ClientDetail })));
const ComponentCatalog = React.lazy(() => import("../pages/ComponentCatalog"));

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
        return <React.Suspense fallback={<PageLoader />}>{routes}</React.Suspense>;
    }

    return (
        <SidebarProvider defaultOpen={readSidebarOpenCookie()} className="md:h-svh md:overflow-hidden">
            <a
                href="#content"
                onClick={(event) => {
                    // move focus without adding #content to the URL
                    event.preventDefault();
                    contentRef.current?.focus();
                }}
                className="sr-only rounded-md bg-primary font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2"
            >
                Přeskočit na obsah
            </a>
            <AppSidebar />
            <SidebarInset className="md:overflow-hidden">
                <AppHeader />
                <div ref={contentRef} id="content" tabIndex={-1} data-scroll-root className="flex-1 outline-none md:overflow-y-auto">
                    {/* keyed by pathname so every page change replays the short enter animation */}
                    <PageTransitionWrapper key={pathname} className="p-4 md:p-6">
                        {/* a page chunk loads in a fraction of a second; an empty area flickers less than a loader */}
                        <React.Suspense fallback={null}>{routes}</React.Suspense>
                    </PageTransitionWrapper>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
