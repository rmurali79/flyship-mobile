import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { SnackbarProvider } from './src/context/SnackbarContext';
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';

export default function App() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AuthProvider>
                    <SnackbarProvider>
                        <NavigationContainer>
                            <RootNavigator />
                        </NavigationContainer>
                        <StatusBar style="auto" />
                    </SnackbarProvider>
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
