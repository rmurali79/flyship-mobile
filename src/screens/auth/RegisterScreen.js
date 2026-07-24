import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { useTheme } from '../../context/ThemeContext';

const RegisterScreen = ({ navigation }) => {
    const { register } = useAuth();
    const snackbar = useSnackbar();
    const { colors } = useTheme();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'shipper' });
    const [loading, setLoading] = useState(false);
    const update = (key, val) => setForm({ ...form, [key]: val });

    const handleRegister = async () => {
        if (!form.name || !form.email || !form.password) { snackbar.warn('Please fill all fields'); return; }
        setLoading(true);
        const result = await register(form.name, form.email, form.password, form.role);
        setLoading(false);
        if (result.success) {
            snackbar.success('Registration successful! Check your email for OTP.');
            navigation.navigate('OTPVerification', { email: form.email });
        } else { snackbar.error(result.error); }
    };

    const inputStyle = { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: colors.inputBg, color: colors.text };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.bg }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 32, color: colors.text }}>Create Account</Text>

                <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontWeight: '600', marginBottom: 6, color: colors.text }}>Name</Text>
                    <TextInput value={form.name} onChangeText={v => update('name', v)} placeholder="Full Name" placeholderTextColor={colors.textSecondary} style={inputStyle} />

                    <Text style={{ fontWeight: '600', marginBottom: 6, color: colors.text }}>Email</Text>
                    <TextInput value={form.email} onChangeText={v => update('email', v)} placeholder="email@example.com" placeholderTextColor={colors.textSecondary}
                        keyboardType="email-address" autoCapitalize="none" style={inputStyle} />

                    <Text style={{ fontWeight: '600', marginBottom: 6, color: colors.text }}>Password</Text>
                    <TextInput value={form.password} onChangeText={v => update('password', v)} placeholder="••••••" placeholderTextColor={colors.textSecondary} secureTextEntry style={inputStyle} />

                    <Text style={{ fontWeight: '600', marginBottom: 8, color: colors.text }}>I am a</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                        {['shipper', 'traveler'].map(role => (
                            <Pressable key={role} onPress={() => update('role', role)}
                                style={{ flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: form.role === role ? '#2563eb' : colors.border }}>
                                <Text style={{ fontWeight: 'bold', color: form.role === role ? '#fff' : colors.text, textTransform: 'capitalize' }}>{role}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Pressable onPress={handleRegister} disabled={loading}
                        style={{ backgroundColor: loading ? '#93c5fd' : '#2563eb', borderRadius: 8, paddingVertical: 14, alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{loading ? 'Creating...' : 'Register'}</Text>
                    </Pressable>
                </View>

                <Pressable onPress={() => navigation.navigate('Login')} style={{ marginTop: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#2563eb' }}>Already have an account? <Text style={{ fontWeight: 'bold' }}>Login</Text></Text>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default RegisterScreen;
