import React, { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { hasRole } from "../../constants/roles";
import { toast } from "@/components/ui/sonner";
import { PageLoader } from "@/components/PageLoader";

/**
 * Route guard that requires authentication and optionally a specific role.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children component to render when access is granted
 * @param {Array<string>} [props.allowedRoles] permitted roles; if omitted, any authenticated user is allowed
 */
export function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    const toastShownRef = useRef(false);
    // tells an intentional logout (go home) from a visitor who never logged in (go to login)
    const [wasAuthenticated, setWasAuthenticated] = useState(false);
    if (user && !wasAuthenticated) setWasAuthenticated(true);

    const isNotAuthenticated = !loading && !user;
    const hasInsufficientPermissions = !loading && user && allowedRoles && !hasRole(user.role, allowedRoles);

    useEffect(() => {
        if (!toastShownRef.current) {
            if (isNotAuthenticated && !wasAuthenticated) {
                toast.warning("Přístup odepřen", { description: "Pro zobrazení této stránky se musíte přihlásit" });
                toastShownRef.current = true;
            } else if (hasInsufficientPermissions) {
                console.warn("User tried to access page with insufficient permissions:", user?.role, " - ", location.pathname);
                toast.error("Nedostatečná oprávnění", { description: "Nemáte oprávnění pro zobrazení této stránky" });
                toastShownRef.current = true;
            }
        }
    }, [isNotAuthenticated, hasInsufficientPermissions, wasAuthenticated, user?.role, location.pathname]);

    if (loading) {
        return <PageLoader />;
    }

    if (isNotAuthenticated) {
        // User was previously logged in – intentional logout, go home instead of login
        if (wasAuthenticated) {
            return <Navigate to="/" replace />;
        }
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (hasInsufficientPermissions) {
        return <Navigate to="/" replace />;
    }

    return children;
}
