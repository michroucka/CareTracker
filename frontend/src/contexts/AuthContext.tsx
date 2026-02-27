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
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, role: string, employeeId?: number, employeeRole?: string, departmentId?: number, organizationId?: number) => void;
    logout: () => void;
    logoutSilent: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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
                    organizationId: data.organizationId
                });
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = (username: string, role: string, employeeId?: number, employeeRole?: string, departmentId?: number, organizationId?: number) => {
        setUser({
            username,
            role,
            employeeId,
            employeeRole,
            departmentId,
            organizationId
        });
    };

    const logoutSilent = async () => {
        try {
            await post("/logout", {});
        } catch (error) {
            console.error("Silent logout error:", error);
        } finally {
            setUser(null);
        }
    };

    const logout = async () => {
        try {
            const response = await post("/logout", {});

            if (response.ok) {
                setUser(null);
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

                // Redirect to home page after logout
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

    // Kontrola session při načtení aplikace
    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, logoutSilent, checkAuth }}>
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
