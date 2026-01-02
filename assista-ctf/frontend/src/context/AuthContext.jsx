import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check expiry?
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser({ ...decoded, token });
                }
            } catch (e) {
                console.error("Invalid token", e);
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post('https://odoo-ctf.easyinstance.com/api/auth/login', { email, password });
            const { token, role, username } = res.data;
            localStorage.setItem('token', token);
            const decoded = jwtDecode(token);
            setUser({ ...decoded, token, role, username });
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const register = async (username, email, password, role = 'USER') => {
        try {
            await axios.post('https://odoo-ctf.easyinstance.com/api/auth/register', { username, email, password, role });
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
