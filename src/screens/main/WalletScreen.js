import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, RefreshControl } from 'react-native';
import axios from 'axios';
import API_BASE from '../../config/api';
import { useSnackbar } from '../../context/SnackbarContext';
import { useTheme } from '../../context/ThemeContext';

const WalletScreen = () => {
    const snackbar = useSnackbar();
    const { colors } = useTheme();
    const [wallets, setWallets] = useState([]);
    const [amount, setAmount] = useState('');
    const [tab, setTab] = useState('deposit');
    const [refreshing, setRefreshing] = useState(false);

    const fetchWallets = async () => {
        try { setWallets((await axios.get(API_BASE + '/api/wallet')).data); } catch (e) {}
    };

    useEffect(() => { fetchWallets(); }, []);
    const onRefresh = async () => { setRefreshing(true); await fetchWallets(); setRefreshing(false); };

    const handleAction = async () => {
        if (!amount || parseFloat(amount) <= 0) { snackbar.warn('Enter a valid amount'); return; }
        try {
            await axios.post(API_BASE + `/api/wallet/${tab}`, { currency: 'USD', amount });
            snackbar.success(`${tab === 'deposit' ? 'Deposit' : 'Withdrawal'} successful`);
            setAmount(''); fetchWallets();
        } catch (e) { snackbar.error(e.response?.data?.error || 'Failed'); }
    };

    return (
        <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: colors.bg, flexGrow: 1 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: colors.text }}>Wallet</Text>

            {wallets.map(w => (
                <View key={w.id} style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>{w.currency} Balance</Text>
                    <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text, marginTop: 4 }}>${w.balance}</Text>
                    {w.lockedBalance > 0 && <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>Locked: ${w.lockedBalance}</Text>}
                </View>
            ))}

            <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: 'row', backgroundColor: colors.border, borderRadius: 8, padding: 3, marginBottom: 16 }}>
                    {['deposit', 'withdraw'].map(t => (
                        <Pressable key={t} onPress={() => setTab(t)}
                            style={{ flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center', backgroundColor: tab === t ? colors.card : 'transparent' }}>
                            <Text style={{ fontWeight: tab === t ? 'bold' : 'normal', textTransform: 'capitalize', color: colors.text }}>{t}</Text>
                        </Pressable>
                    ))}
                </View>

                <TextInput value={amount} onChangeText={setAmount} placeholder="Amount" placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad" style={{ borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 14, fontSize: 18, marginBottom: 12, backgroundColor: colors.inputBg, color: colors.text }} />

                <Pressable onPress={handleAction}
                    style={{ backgroundColor: tab === 'deposit' ? '#16a34a' : '#dc2626', borderRadius: 8, paddingVertical: 14, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, textTransform: 'capitalize' }}>{tab}</Text>
                </Pressable>
            </View>
        </ScrollView>
    );
};

export default WalletScreen;
