import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import { View, Text, Animated, Pressable } from 'react-native';

const SnackbarContext = createContext();
export const useSnackbar = () => useContext(SnackbarContext);

const BG = { success: '#16a34a', error: '#dc2626', warn: '#ca8a04', info: '#2563eb' };

export const SnackbarProvider = ({ children }) => {
    const [snackbar, setSnackbar] = useState(null);
    const translateY = useRef(new Animated.Value(80)).current;

    useEffect(() => {
        if (snackbar) {
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
            const t = setTimeout(() => dismiss(), snackbar.type === 'error' ? 5000 : 4000);
            return () => clearTimeout(t);
        }
    }, [snackbar]);

    const dismiss = () => {
        Animated.timing(translateY, { toValue: 80, duration: 200, useNativeDriver: true }).start(() => setSnackbar(null));
    };

    const showSnackbar = useCallback((message, type = 'info') => {
        translateY.setValue(80);
        setSnackbar({ message, type, id: Date.now() });
    }, []);

    const success = useCallback((msg) => showSnackbar(msg, 'success'), [showSnackbar]);
    const error = useCallback((msg) => showSnackbar(msg, 'error'), [showSnackbar]);
    const warn = useCallback((msg) => showSnackbar(msg, 'warn'), [showSnackbar]);
    const info = useCallback((msg) => showSnackbar(msg, 'info'), [showSnackbar]);

    return (
        <SnackbarContext.Provider value={{ showSnackbar, success, error, warn, info }}>
            {children}
            {snackbar && (
                <Animated.View style={{
                    position: 'absolute', bottom: 40, left: 20, right: 20,
                    transform: [{ translateY }], zIndex: 9999,
                }}>
                    <Pressable onPress={dismiss} style={{
                        backgroundColor: BG[snackbar.type], borderRadius: 12,
                        paddingHorizontal: 20, paddingVertical: 14,
                        flexDirection: 'row', alignItems: 'center',
                        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
                    }}>
                        <Text style={{ color: '#fff', flex: 1, fontSize: 14 }}>{snackbar.message}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, fontWeight: 'bold', marginLeft: 12 }}>×</Text>
                    </Pressable>
                </Animated.View>
            )}
        </SnackbarContext.Provider>
    );
};
