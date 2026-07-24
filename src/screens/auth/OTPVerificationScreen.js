import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import axios from 'axios';
import API_BASE from '../../config/api';
import { useSnackbar } from '../../context/SnackbarContext';

const OTPVerificationScreen = ({ route, navigation }) => {
    const { email } = route.params || {};
    const snackbar = useSnackbar();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (!otp) { snackbar.warn('Enter the OTP'); return; }
        setLoading(true);
        try {
            await axios.post(API_BASE + '/api/auth/verify-otp', { email, otp });
            snackbar.success('Email verified! Please login.');
            navigation.navigate('Login');
        } catch (error) {
            snackbar.error(error.response?.data?.error || 'Verification failed');
        } finally { setLoading(false); }
    };

    const handleResend = async () => {
        try {
            await axios.post(API_BASE + '/api/auth/resend-otp', { email });
            snackbar.success('OTP resent to ' + email);
        } catch (error) {
            snackbar.error(error.response?.data?.error || 'Failed to resend');
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f9fafb' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>Verify Email</Text>
                <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>Enter the OTP sent to {email}</Text>

                <TextInput value={otp} onChangeText={setOtp} placeholder="Enter OTP" keyboardType="number-pad"
                    style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 14, fontSize: 20, textAlign: 'center', letterSpacing: 8, marginBottom: 20 }} />

                <Pressable onPress={handleVerify} disabled={loading}
                    style={{ backgroundColor: loading ? '#93c5fd' : '#2563eb', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{loading ? 'Verifying...' : 'Verify'}</Text>
                </Pressable>

                <Pressable onPress={handleResend} style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#2563eb' }}>Resend OTP</Text>
                </Pressable>
            </View>
        </View>
    );
};

export default OTPVerificationScreen;
