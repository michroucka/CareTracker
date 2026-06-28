import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { hasRole } from "../../constants/roles";
import { ShieldAlert, UserRoundX } from "lucide-react";
import {Spinner, toast} from "@heroui/react";

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
    const wasAuthenticatedRef = useRef(false);

    useEffect(() => {
        if (user) wasAuthenticatedRef.current = true;
    }, [user]);

    const isNotAuthenticated = !loading && !user;
    const hasInsufficientPermissions = !loading && user && allowedRoles && !hasRole(user.role, allowedRoles);

    useEffect(() => {
        if (!toastShownRef.current) {
            if (isNotAuthenticated && !wasAuthenticatedRef.current) {
                toast.warning("Přístup odepřen", {
                    description: "Pro zobrazení této stránky se musíte přihlásit",
                    indicator: <ShieldAlert />,
                });
                toastShownRef.current = true;
            } else if (hasInsufficientPermissions) {
                console.warn("User tried to access page with insufficient permissions:", user.role, " - ", location.pathname);
                toast.danger("Nedostatečná oprávnění", {
                    description: "Nemáte oprávnění pro zobrazení této stránky",
                    indicator: <UserRoundX />,
                });
                toastShownRef.current = true;
            }
        }
    }, [isNotAuthenticated, hasInsufficientPermissions]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    if (isNotAuthenticated) {
        // User was previously logged in — intentional logout, go home instead of login
        if (wasAuthenticatedRef.current) {
            return <Navigate to="/" replace />;
        }
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (hasInsufficientPermissions) {
        return <Navigate to="/" replace />;
    }

    return children;
}
