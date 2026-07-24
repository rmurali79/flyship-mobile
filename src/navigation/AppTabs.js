import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TextInput, Pressable, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import API_BASE from '../config/api';
import { useSnackbar } from '../context/SnackbarContext';
import DashboardStack from './DashboardStack';
import ChatStack from './ChatStack';
import WalletScreen from '../screens/main/WalletScreen';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

const ICONS = { Home: '🏠', Chat: '💬', Wallet: '💰', Profile: '👤' };

const TabIcon = ({ label, focused }) => (
    <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 20 }}>{ICONS[label] || '📄'}</Text>
        <Text style={{ fontSize: 10, color: focused ? '#2563eb' : '#9ca3af', fontWeight: focused ? 'bold' : 'normal' }}>{label}</Text>
    </View>
);

const ProfileScreen = () => {
    const { user, logout, login } = useAuth();
    const snackbar = useSnackbar();
    const { isDark, toggle, colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('');
    const [profilePic, setProfilePic] = useState(user?.profile_picture || null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axios.get(API_BASE + '/api/users/profile').then(res => {
            setName(res.data.name || '');
            setPhone(res.data.mobile_number || '');
            setCountryCode(res.data.country_code || '');
            setProfilePic(res.data.profile_picture || null);
        }).catch(() => {});
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1] });
        if (result.canceled) return;
        const asset = result.assets[0];
        const data = new FormData();
        data.append('profile_picture', { uri: asset.uri, type: 'image/jpeg', name: 'profile.jpg' });
        try {
            const res = await axios.post(API_BASE + '/api/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            const url = res.data.profile_url?.startsWith('http') ? res.data.profile_url : API_BASE + res.data.profile_url;
            setProfilePic(url);
            await axios.put(API_BASE + '/api/users/profile', { profile_picture: url });
            snackbar.success('Profile picture updated');
        } catch (e) { snackbar.error('Upload failed'); }
    };

    const handleSave = async () => {
        if (!name.trim()) { snackbar.warn('Name cannot be empty'); return; }
        setSaving(true);
        try {
            const res = await axios.put(API_BASE + '/api/users/profile', {
                name: name.trim(),
                profile_picture: profilePic,
                country_code: countryCode,
                mobile_number: phone,
            });
            snackbar.success('Profile updated');
            setEditing(false);
        } catch (e) { snackbar.error(e.response?.data?.error || 'Failed'); }
        finally { setSaving(false); }
    };

    const initials = (name || user?.name || '?').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: insets.bottom + 24, backgroundColor: colors.bg }}>
            <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 32 }}>
                <View style={{ position: 'relative', marginBottom: 16 }}>
                    {profilePic ? (
                        <Image source={{ uri: profilePic }} style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#e5e7eb' }} />
                    ) : (
                        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>{initials}</Text>
                        </View>
                    )}
                    <Pressable onPress={pickImage} style={{
                            position: 'absolute', bottom: -2, right: -2,
                            width: 30, height: 30, borderRadius: 15, backgroundColor: '#2563eb',
                            justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.bg,
                        }}>
                            <Text style={{ color: '#fff', fontSize: 14 }}>📷</Text>
                        </Pressable>
                </View>

                {editing ? (
                    <View style={{ width: '100%', marginBottom: 8 }}>
                        <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 4 }}>Name</Text>
                        <TextInput value={name} onChangeText={setName}
                            style={{ borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: colors.inputBg, color: colors.text, fontSize: 16, textAlign: 'center' }} />
                        <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 4 }}>Country Code</Text>
                        <TextInput value={countryCode} onChangeText={setCountryCode} placeholder="+91"
                            placeholderTextColor={colors.textSecondary} keyboardType="phone-pad"
                            style={{ borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: colors.inputBg, color: colors.text, fontSize: 16, textAlign: 'center' }} />
                        <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 4 }}>Mobile Number</Text>
                        <TextInput value={phone} onChangeText={setPhone} placeholder="9876543210"
                            placeholderTextColor={colors.textSecondary} keyboardType="phone-pad"
                            style={{ borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: colors.inputBg, color: colors.text, fontSize: 16, textAlign: 'center' }} />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Pressable onPress={handleSave} disabled={saving}
                                style={{ flex: 1, backgroundColor: saving ? '#93c5fd' : '#2563eb', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{saving ? 'Saving...' : 'Save'}</Text>
                            </Pressable>
                            <Pressable onPress={() => setEditing(false)}
                                style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}>
                                <Text style={{ color: colors.text }}>Cancel</Text>
                            </Pressable>
                        </View>
                    </View>
                ) : (
                    <View style={{ alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text }}>{name || user?.name}</Text>
                            <Pressable onPress={() => setEditing(true)}>
                                <Text style={{ fontSize: 16 }}>✏️</Text>
                            </Pressable>
                        </View>
                        <Text style={{ color: colors.textSecondary, marginTop: 2 }}>{user?.email}</Text>
                        {phone ? <Text style={{ color: colors.textSecondary, marginTop: 2 }}>{countryCode} {phone}</Text> : null}
                        <View style={{ backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 }}>
                            <Text style={{ color: '#1e40af', fontWeight: '600', textTransform: 'capitalize', fontSize: 13 }}>{user?.role}</Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={{ backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 24 }}>
                <Pressable onPress={toggle} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Text style={{ fontSize: 20 }}>{isDark ? '🌙' : '☀️'}</Text>
                        <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text }}>Dark Mode</Text>
                    </View>
                    <View style={{
                        width: 48, height: 28, borderRadius: 14,
                        backgroundColor: isDark ? '#2563eb' : '#d1d5db',
                        justifyContent: 'center', paddingHorizontal: 3,
                    }}>
                        <View style={{
                            width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff',
                            alignSelf: isDark ? 'flex-end' : 'flex-start',
                        }} />
                    </View>
                </Pressable>

                <Pressable onPress={logout} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
                    <Text style={{ fontSize: 20 }}>🚪</Text>
                    <Text style={{ fontSize: 15, fontWeight: '500', color: '#dc2626' }}>Logout</Text>
                </Pressable>
            </View>
        </ScrollView>
    );
};

const AppTabs = () => {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    return (
        <Tab.Navigator screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: {
                height: 60 + insets.bottom,
                paddingBottom: insets.bottom + 4,
                paddingTop: 4,
                backgroundColor: colors.card,
                borderTopColor: colors.border,
            },
        }}>
            <Tab.Screen name="Dashboard" component={DashboardStack} options={{ tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} /> }} />
            <Tab.Screen name="ChatTab" component={ChatStack} options={{ tabBarIcon: ({ focused }) => <TabIcon label="Chat" focused={focused} /> }} />
            <Tab.Screen name="Wallet" component={WalletScreen} options={{ headerShown: true, headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text, tabBarIcon: ({ focused }) => <TabIcon label="Wallet" focused={focused} /> }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: 'Profile', headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text, tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} /> }} />
        </Tab.Navigator>
    );
};

export default AppTabs;
