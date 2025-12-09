import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { hasRole } from "../../constants/roles";
import { showToast } from "../MyToast";
import { ShieldExclamationIcon } from "@heroicons/react/24/solid";
import {Spinner} from "@heroui/react";

/**
 * Komponenta pro ochranu routes podle autentizace a autorizace
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Komponenta k zobrazení
 * @param {Array<string>} props.allowedRoles - Povolené role (nepovinné, pokud není zadáno, stačí být přihlášen)
 */
export function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    const toastShownRef = useRef(false);

    // Kontrola přihlášení a oprávnění
    const isNotAuthenticated = !loading && !user;
    const hasInsufficientPermissions = !loading && user && allowedRoles && !hasRole(user.role, allowedRoles);

    useEffect(() => {
        if (!toastShownRef.current) {
            if (isNotAuthenticated) {
                showToast({
                    title: "Přístup odepřen",
                    description: "Pro zobrazení této stránky se musíte přihlásit",
                    color: "warning",
                    icon: <ShieldExclamationIcon />,
                });
                toastShownRef.current = true;
            } else if (hasInsufficientPermissions) {
                console.warn("User tried to access page with insufficient permissions:", user.role, " - ", location.pathname);
                showToast({
                    title: "Nedostatečná oprávnění",
                    description: "Nemáte oprávnění pro zobrazení této stránky",
                    color: "danger",
                    icon: <ShieldExclamationIcon />,
                });
                toastShownRef.current = true;
            }
        }
    }, [isNotAuthenticated, hasInsufficientPermissions]);

    // Počkej na načtení autentizace
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner size="lg" label="Načítání..." />
            </div>
        );
    }

    // Přesměrování
    if (isNotAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (hasInsufficientPermissions) {
        return <Navigate to="/" replace />;
    }

    // Vše OK, zobraz požadovanou komponentu
    return children;
}