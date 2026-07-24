import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { useTheme } from '../../context/ThemeContext';

const LoginScreen = ({ navigation }) => {
    const { login } = useAuth();
    const snackbar = useSnackbar();
    const { colors } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) { snackbar.warn('Please fill all fields'); return; }
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);
        if (!result.success) snackbar.error(result.error);
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.bg }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: colors.text }}>JetRunner</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 32 }}>Sign in to your account</Text>

                <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontWeight: '600', marginBottom: 6, color: colors.text }}>Email</Text>
                    <TextInput value={email} onChangeText={setEmail} placeholder="shipper1@flyship.test" placeholderTextColor={colors.textSecondary}
                        keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                        style={{ borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 15, backgroundColor: colors.inputBg, color: colors.text }} />

                    <Text style={{ fontWeight: '600', marginBottom: 6, color: colors.text }}>Password</Text>
                    <TextInput value={password} onChangeText={setPassword} placeholder="••••••" placeholderTextColor={colors.textSecondary} secureTextEntry
                        style={{ borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 12, marginBottom: 24, fontSize: 15, backgroundColor: colors.inputBg, color: colors.text }} />

                    <Pressable onPress={handleLogin} disabled={loading}
                        style={{ backgroundColor: loading ? '#93c5fd' : '#2563eb', borderRadius: 8, paddingVertical: 14, alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{loading ? 'Signing in...' : 'Sign In'}</Text>
                    </Pressable>
                </View>

                <Pressable onPress={() => navigation.navigate('Register')} style={{ marginTop: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#2563eb' }}>Don't have an account? <Text style={{ fontWeight: 'bold' }}>Register</Text></Text>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;
