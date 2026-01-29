import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import React, { useEffect, useRef } from "react";
import {Spinner} from "@heroui/react";
import { showToast } from "../MyToast";
import { ShieldAlert } from "lucide-react";

/**
 * Route wrapper that only allows unauthenticated users.
 * Redirects authenticated users to a specified path (default: home page).
 *
 * Use this for login/register pages to prevent authenticated users from accessing them.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render
 * @param {string} [props.redirectTo='/'] - Path to redirect authenticated users (default: '/')
 */
const PublicOnlyRoute = ({ children, redirectTo = '/' }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const toastShownRef = useRef(false);
    const initialAuthStatusRef = useRef(null);

    const isAuthenticated = !loading && user;

    // Zaznamenej initial auth status po dokončení loadingu
    useEffect(() => {
        if (!loading && initialAuthStatusRef.current === null) {
            initialAuthStatusRef.current = !!user;
        }
    }, [loading, user]);

    useEffect(() => {
        // Toast zobraz jen když už byl uživatel přihlášený na začátku
        // (ne když se právě přihlásil na této stránce)
        if (isAuthenticated && !toastShownRef.current && initialAuthStatusRef.current === true) {
            showToast({
                title: "Již jste přihlášeni",
                description: "Nemůžete přistupovat na tuto stránku, když jste už přihlášeni",
                color: "warning",
                icon: <ShieldAlert />,
            });
            toastShownRef.current = true;
        }
    }, [isAuthenticated]);

        // Wait for auth check to complete
        if (loading) {
            return (
                <div className="flex justify-center items-center h-screen">
                  <Spinner size="lg" variant="gradient" label="Načítání..." />
                </div>
            );
        }

        // If user is authenticated, redirect them away from this page
        if (user) {
          // Pokud přišel přes ProtectedRoute (má uloženou původní stránku), vrať ho tam
          const from = location.state?.from?.pathname || redirectTo;
          return <Navigate to={from} replace />;
        }

        // If user is not authenticated, allow access
        return <>{children}</>;
};

export default PublicOnlyRoute;