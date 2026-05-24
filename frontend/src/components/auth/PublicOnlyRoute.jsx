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
 * @param {React.ReactNode} props.children component to render for unauthenticated users
 * @param {string} [props.redirectTo='/'] path to redirect authenticated users
 */
const PublicOnlyRoute = ({ children, redirectTo = '/' }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const toastShownRef = useRef(false);
    const initialAuthStatusRef = useRef(null);

    const isAuthenticated = !loading && user;

    // Record the auth state once the initial loading completes so we can distinguish
    // "user was already logged in" from "user just logged in on this page"
    useEffect(() => {
        if (!loading && initialAuthStatusRef.current === null) {
            initialAuthStatusRef.current = !!user;
        }
    }, [loading, user]);

    useEffect(() => {
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
              <Spinner size="lg" variant="gradient" label="Načítání..." />
            </div>
        );
    }

    if (user) {
        // If the user arrived via ProtectedRoute (state.from is set), return them there
        const from = location.state?.from?.pathname || redirectTo;
        return <Navigate to={from} replace />;
    }

    return <>{children}</>;
};

export default PublicOnlyRoute;
