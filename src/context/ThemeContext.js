import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance } from 'react-native';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(Appearance.getColorScheme() === 'dark');

    useEffect(() => {
        const sub = Appearance.addChangeListener(({ colorScheme }) => {
            setIsDark(colorScheme === 'dark');
        });
        return () => sub.remove();
    }, []);

    const toggle = () => {
        const next = !isDark;
        setIsDark(next);
        Appearance.setColorScheme(next ? 'dark' : 'light');
    };

    const colors = isDark ? {
        bg: '#111827', card: '#1f2937', text: '#f9fafb',
        textSecondary: '#9ca3af', border: '#374151',
        inputBg: '#374151', inputBorder: '#4b5563',
    } : {
        bg: '#f9fafb', card: '#ffffff', text: '#1f2937',
        textSecondary: '#6b7280', border: '#e5e7eb',
        inputBg: '#ffffff', inputBorder: '#d1d5db',
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggle, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};
