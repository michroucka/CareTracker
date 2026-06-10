import React, { createContext, useContext, useState, useEffect } from "react";
import { get, post } from "../api/api.js";
import { toast } from "@heroui/react";
import {useNavigate} from "react-router-dom";

interface User {
    username: string;
    role: string;
    fullName?: string;
    employeeId?: number;
    employeeRole?: string;
    departmentId?: number;
    organizationId?: number;
    clientId?: number;
}

interface SuperadminOrg {
    id: number;
    name: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    superadminOrg: SuperadminOrg | null;
    setSuperadminOrg: (org: SuperadminOrg | null) => void;
    login: (username: string, role: string, fullName?: string, employeeId?: number, employeeRole?: string, departmentId?: number, organizationId?: number, clientId?: number) => void;
    logout: () => void;
    logoutSilent: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

/** localStorage key used to persist the SUPERADMIN's selected organization across page reloads. */
const SUPERADMIN_ORG_KEY = "superadmin_org";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provides global authentication state and actions.
 * On mount, calls /api/auth-status to restore session state from the server.
 * Listens for the "auth:unauthorized" custom event (dispatched by api.js on 401 responses)
 * to trigger an automatic logout without user interaction.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [superadminOrg, setSuperadminOrgState] = useState<SuperadminOrg | null>(null);
    const navigate = useNavigate();

    /**
     * Sets the SUPERADMIN's selected organization and persists the choice to localStorage
     * so it survives page reloads.
     */
    const setSuperadminOrg = (org: SuperadminOrg | null) => {
        setSuperadminOrgState(org);
        if (org) {
            localStorage.setItem(SUPERADMIN_ORG_KEY, JSON.stringify(org));
        } else {
            localStorage.removeItem(SUPERADMIN_ORG_KEY);
        }
    };

    /** Calls /api/auth-status and updates auth state accordingly. Called on mount and can be called manually. */
    const checkAuth = async () => {
        try {
            const response = await get("/auth-status");
            const data = await response.json();

            if (data.isLoggedIn) {
                setUser({
                    username: data.username,
                    role: data.role,
                    fullName: data.fullName,
                    employeeId: data.employeeId,
                    employeeRole: data.employeeRole,
                    departmentId: data.departmentId,
                    organizationId: data.organizationId,
                    clientId: data.clientId
                });

                if (data.role === "SUPERADMIN") {
                    const stored = localStorage.getItem(SUPERADMIN_ORG_KEY);
                    if (stored) {
                        try {
                            setSuperadminOrgState(JSON.parse(stored));
                        } catch {
                            localStorage.removeItem(SUPERADMIN_ORG_KEY);
                        }
                    }
                }
            } else {
                setUser(null);
                setSuperadminOrgState(null);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            setUser(null);
            setSuperadminOrgState(null);
        } finally {
            setLoading(false);
        }
    };

    /** Populates the user state directly after a successful login response without re-fetching /auth-status. */
    const login = (username: string, role: string, fullName?: string, employeeId?: number, employeeRole?: string, departmentId?: number, organizationId?: number, clientId?: number) => {
        setUser({
            username,
            role,
            fullName,
            employeeId,
            employeeRole,
            departmentId,
            organizationId,
            clientId
        });
    };

    /**
     * Clears auth state and calls /logout without showing a success toast.
     * Used when a 401 triggers automatic session expiry rather than an explicit user action.
     */
    const logoutSilent = async () => {
        try {
            await post("/logout", {});
        } catch (error) {
            console.error("Silent logout error:", error);
        } finally {
            setUser(null);
            setSuperadminOrgState(null);
            localStorage.removeItem(SUPERADMIN_ORG_KEY);
        }
    };

    const logout = async () => {
        try {
            const response = await post("/logout", {});

            if (response.ok) {
                setUser(null);
                setSuperadminOrgState(null);
                localStorage.removeItem(SUPERADMIN_ORG_KEY);
                toast.success("Odhlášení úspěšné", {
                    description: "Byli jste úspěšně odhlášeni",
                });

                navigate("/");
            }
        } catch (error) {
            console.error("Logout error:", error);
            toast.danger("Chyba při odhlašování", {
                description: "Nepodařilo se odhlásit",
            });
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
            setSuperadminOrgState(null);
            navigate("/login");
        };
        window.addEventListener("auth:unauthorized", handleUnauthorized);
        return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, superadminOrg, setSuperadminOrg, login, logout, logoutSilent, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Returns the auth context. Must be used inside an {@link AuthProvider}.
 * @throws if called outside an AuthProvider
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
