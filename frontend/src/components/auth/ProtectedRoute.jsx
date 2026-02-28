import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { hasRole } from "../../constants/roles";
import { showToast } from "../MyToast";
import { ShieldAlert, UserRoundX } from "lucide-react";
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
    const wasAuthenticatedRef = useRef(false);

    useEffect(() => {
        if (user) wasAuthenticatedRef.current = true;
    }, [user]);

    // Kontrola přihlášení a oprávnění
    const isNotAuthenticated = !loading && !user;
    const hasInsufficientPermissions = !loading && user && allowedRoles && !hasRole(user.role, allowedRoles);

    useEffect(() => {
        if (!toastShownRef.current) {
            if (isNotAuthenticated && !wasAuthenticatedRef.current) {
                showToast({
                    title: "Přístup odepřen",
                    description: "Pro zobrazení této stránky se musíte přihlásit",
                    color: "warning",
                    icon: <ShieldAlert />,
                });
                toastShownRef.current = true;
            } else if (hasInsufficientPermissions) {
                console.warn("User tried to access page with insufficient permissions:", user.role, " - ", location.pathname);
                showToast({
                    title: "Nedostatečná oprávnění",
                    description: "Nemáte oprávnění pro zobrazení této stránky",
                    color: "danger",
                    icon: <UserRoundX />,
                });
                toastShownRef.current = true;
            }
        }
    }, [isNotAuthenticated, hasInsufficientPermissions]);

    // Počkej na načtení autentizace
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner size="lg" variant="gradient" label="Načítání..." />
            </div>
        );
    }

    // Přesměrování
    if (isNotAuthenticated) {
        // Uživatel byl přihlášen → záměrné odhlášení, přesměruj na domovskou stránku
        if (wasAuthenticatedRef.current) {
            return <Navigate to="/" replace />;
        }
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (hasInsufficientPermissions) {
        return <Navigate to="/" replace />;
    }

    // Vše OK, zobraz požadovanou komponentu
    return children;
}