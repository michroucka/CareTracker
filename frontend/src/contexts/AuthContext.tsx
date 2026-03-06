import React, { createContext, useContext, useState, useEffect } from "react";
import { get, post } from "../api/api.js";
import { addToast } from "@heroui/react";
import { X } from "lucide-react";
import {useNavigate} from "react-router-dom";

interface User {
    username: string;
    role: string;
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
    login: (username: string, role: string, employeeId?: number, employeeRole?: string, departmentId?: number, organizationId?: number, clientId?: number) => void;
    logout: () => void;
    logoutSilent: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const SUPERADMIN_ORG_KEY = "superadmin_org";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [superadminOrg, setSuperadminOrgState] = useState<SuperadminOrg | null>(null);
    const navigate = useNavigate();

    const setSuperadminOrg = (org: SuperadminOrg | null) => {
        setSuperadminOrgState(org);
        if (org) {
            localStorage.setItem(SUPERADMIN_ORG_KEY, JSON.stringify(org));
        } else {
            localStorage.removeItem(SUPERADMIN_ORG_KEY);
        }
    };

    const checkAuth = async () => {
        try {
            const response = await get("/auth-status");
            const data = await response.json();

            if (data.isLoggedIn) {
                setUser({
                    username: data.username,
                    role: data.role,
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

    const login = (username: string, role: string, employeeId?: number, employeeRole?: string, departmentId?: number, organizationId?: number, clientId?: number) => {
        setUser({
            username,
            role,
            employeeId,
            employeeRole,
            departmentId,
            organizationId,
            clientId
        });
    };

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
                addToast({
                    title: "Odhlášení úspěšné",
                    description: "Byli jste úspěšně odhlášeni",
                    color: "success",
                    closeIcon: <X />,
                    timeout: 5000,
                    classNames: {
                        closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
                    },
                });

                navigate("/");
            }
        } catch (error) {
            console.error("Logout error:", error);
            addToast({
                title: "Chyba při odhlašování",
                description: "Nepodařilo se odhlásit",
                color: "danger",
                closeIcon: <X />,
                timeout: 5000,
                classNames: {
                    closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
                },
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

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
