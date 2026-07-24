import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import API_BASE from '../config/api';
import { getToken, setToken, removeToken, getUser, setUser, removeUser } from '../utils/storage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUserState] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const token = await getToken();
            const storedUser = await getUser();
            if (token && storedUser) {
                setUserState(storedUser);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            setLoading(false);
        })();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post(API_BASE + '/api/auth/login', { email, password });
            const { token, user: userData } = res.data;
            await setToken(token);
            await setUser(userData);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUserState({
                id: userData.id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                profile_picture: userData.profile_picture,
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Login failed' };
        }
    };

    const register = async (name, email, password, role) => {
        try {
            await axios.post(API_BASE + '/api/auth/register', { name, email, password, role });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Registration failed' };
        }
    };

    const logout = async () => {
        await removeToken();
        await removeUser();
        delete axios.defaults.headers.common['Authorization'];
        setUserState(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
