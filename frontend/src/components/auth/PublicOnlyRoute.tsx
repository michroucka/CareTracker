import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import React, { useEffect, useRef } from "react";
import {Spinner} from "@heroui/react";
import { showToast } from "../MyToast";
import { ShieldAlert } from "lucide-react";

interface PublicOnlyRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Route wrapper that only allows unauthenticated users.
 * Redirects authenticated users to a specified path (default: home page).
 *
 * Use this for login/register pages to prevent authenticated users from accessing them.
 */
const PublicOnlyRoute = ({ children, redirectTo = '/' }: PublicOnlyRouteProps) => {
    const { user, loading } = useAuth();
    const toastShownRef = useRef(false);

    const isAuthenticated = !loading && user;

    useEffect(() => {
        if (isAuthenticated && !toastShownRef.current) {
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
          return <Navigate to={redirectTo} replace />;
        }

        // If user is not authenticated, allow access
        return <>{children}</>;
};

export default PublicOnlyRoute;