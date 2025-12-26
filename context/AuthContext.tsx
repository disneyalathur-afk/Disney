import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
    isAdmin: boolean;
    login: (username: string, password: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Admin credentials (in production, use environment variables or backend auth)
const ADMIN_USERNAME = 'DisneyAlathur@shammu';
const ADMIN_PASSWORD = 'Shammu@2002';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);

    // Check for existing session on mount
    useEffect(() => {
        const storedAuth = localStorage.getItem('disney_admin_auth');
        if (storedAuth === 'true') {
            setIsAdmin(true);
        }
    }, []);

    const login = (username: string, password: string): boolean => {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            setIsAdmin(true);
            localStorage.setItem('disney_admin_auth', 'true');
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAdmin(false);
        localStorage.removeItem('disney_admin_auth');
    };

    return (
        <AuthContext.Provider value={{ isAdmin, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
