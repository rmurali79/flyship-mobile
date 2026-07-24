import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Image, RefreshControl, Linking } from 'react-native';
import axios from 'axios';
import API_BASE from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { useTheme } from '../../context/ThemeContext';
import { formatDate } from '../../utils/date';
import { resolveImageUrl } from '../../utils/image';
import ConfirmDialog from '../../components/ConfirmDialog';
import DatePicker from '../../components/DatePicker';

const ShipmentDetailsScreen = ({ route, navigation }) => {
    const { id } = route.params;
    const { user } = useAuth();
    const snackbar = useSnackbar();
    const { colors } = useTheme();
    const [shipment, setShipment] = useState(null);
    const [quotes, setQuotes] = useState([]);
    const [newQuote, setNewQuote] = useState({ amount: '', delivery_date: '', currency: 'USD', message: '' });
    const [deleteReason, setDeleteReason] = useState('');
    const [showDeleteForm, setShowDeleteForm] = useState(false);
    const [withdrawReason, setWithdrawReason] = useState('');
    const [showWithdrawForm, setShowWithdrawForm] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ open: false });
    const [refreshing, setRefreshing] = useState(false);

    const refreshData = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/shipments/${id}`);
            setShipment(res.data);
            const qRes = await axios.get(`${API_BASE}/api/quotes/shipment/${id}`);
            setQuotes(qRes.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { refreshData(); }, [id]);
    const onRefresh = async () => { setRefreshing(true); await refreshData(); setRefreshing(false); };

    const handleQuoteSubmit = async () => {
        if (!newQuote.amount || !newQuote.delivery_date) { snackbar.warn('Amount and delivery date required'); return; }
        try {
            await axios.post(API_BASE + '/api/quotes', { shipment_id: id, ...newQuote });
            await refreshData();
            setNewQuote({ amount: '', delivery_date: '', currency: 'USD', message: '' });
            snackbar.success('Quote submitted');
        } catch (e) { snackbar.error(e.response?.data?.error || 'Failed'); }
    };

    const handleAcceptQuote = async (quoteId) => {
        try {
            await axios.post(`${API_BASE}/api/quotes/${quoteId}/accept`);
            await refreshData();
            snackbar.success('Quote accepted');
        } catch (e) { snackbar.error(e.response?.data?.error || 'Failed'); }
    };

    const handleDelete = () => {
        if (!deleteReason.trim()) { snackbar.warn('Provide a reason'); return; }
        setConfirmDialog({
            open: true, title: 'Delete Shipment', message: 'This cannot be undone.',
            confirmText: 'Delete', variant: 'danger',
            onConfirm: async () => {
                setConfirmDialog({ open: false });
                try {
                    await axios.post(`${API_BASE}/api/shipments/${id}/delete`, { reason: deleteReason });
                    snackbar.success('Shipment deleted');
                    navigation.goBack();
                } catch (e) { snackbar.error(e.response?.data?.error || 'Failed'); }
            },
        });
    };

    const handleWithdraw = (quoteId) => {
        if (!withdrawReason.trim()) { snackbar.warn('Provide a reason'); return; }
        setConfirmDialog({
            open: true, title: 'Withdraw Quote', message: 'Your locked funds will be released.',
            confirmText: 'Withdraw', variant: 'danger',
            onConfirm: async () => {
                setConfirmDialog({ open: false });
                try {
                    await axios.post(`${API_BASE}/api/quotes/${quoteId}/withdraw`, { reason: withdrawReason });
                    setShowWithdrawForm(null); setWithdrawReason('');
                    await refreshData();
                    snackbar.success('Quote withdrawn');
                } catch (e) { snackbar.error(e.response?.data?.error || 'Failed'); }
            },
        });
    };

    if (!shipment) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}><Text style={{ color: colors.text }}>Loading...</Text></View>;

    const isOwner = user.role === 'shipper' && shipment.shipperId === user.id;
    const canDelete = isOwner && shipment.status !== 'delivered' && shipment.status !== 'deleted';
    const inputStyle = { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: colors.inputBg, color: colors.text };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog({ open: false })} />
            <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

                <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, flex: 1 }}>{shipment.origin} ✈️ {shipment.destination}</Text>
                        <View style={{ backgroundColor: '#2563eb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{shipment.status?.toUpperCase()}</Text>
                        </View>
                    </View>

                    {resolveImageUrl(shipment.photo_url) && <Image source={{ uri: resolveImageUrl(shipment.photo_url) }} style={{ width: '100%', height: 180, borderRadius: 8, marginBottom: 12, backgroundColor: '#e5e7eb' }} resizeMode="cover" />}

                    <Text style={{ fontWeight: '600', marginBottom: 4, color: colors.text }}>Description</Text>
                    <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>{shipment.item_description || shipment.details || 'N/A'}</Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                        {shipment.weight && <Detail label="Weight" value={`${shipment.weight} kg`} colors={colors} />}
                        {shipment.max_budget && <Detail label="Budget" value={`$${shipment.max_budget}`} colors={colors} />}
                        {shipment.reach_latest_by && <Detail label="Reach By" value={formatDate(shipment.reach_latest_by)} colors={colors} />}
                    </View>

                    {(shipment.status === 'accepted' || shipment.status === 'in_transit' || shipment.status === 'delivered') && (
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
                            <Pressable
                                onPress={() => navigation.navigate('ChatTab', { screen: 'ChatRoom', params: { shipmentId: shipment.id } })}
                                style={{ flex: 1, backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontSize: 16 }}>💬</Text>
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Chat</Text>
                            </Pressable>
                            <Pressable
                                onPress={async () => {
                                    try {
                                        const res = await axios.get(`${API_BASE}/api/chat/shipment/${shipment.id}/info`);
                                        const phone = (res.data.other_user_country_code || '') + res.data.other_user_phone;
                                        if (phone) Linking.openURL(`tel:${phone}`);
                                        else snackbar.warn('Phone number not available');
                                    } catch (e) { snackbar.warn('Contact info not available'); }
                                }}
                                style={{ flex: 1, backgroundColor: '#16a34a', borderRadius: 10, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontSize: 16 }}>📞</Text>
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Call</Text>
                            </Pressable>
                        </View>
                    )}

                    {canDelete && (
                        <View style={{ marginTop: 16 }}>
                            {!showDeleteForm ? (
                                <Pressable onPress={() => setShowDeleteForm(true)}
                                    style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, padding: 10, alignItems: 'center' }}>
                                    <Text style={{ color: '#dc2626', fontWeight: 'bold' }}>Delete Shipment</Text>
                                </Pressable>
                            ) : (
                                <View style={{ backgroundColor: '#fef2f2', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#fecaca' }}>
                                    <TextInput value={deleteReason} onChangeText={setDeleteReason} placeholder="Reason for deletion (required)"
                                        placeholderTextColor={colors.textSecondary} multiline style={{ ...inputStyle, minHeight: 60 }} />
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <Pressable onPress={handleDelete} style={{ backgroundColor: '#dc2626', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
                                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirm</Text>
                                        </Pressable>
                                        <Pressable onPress={() => { setShowDeleteForm(false); setDeleteReason(''); }} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
                                            <Text style={{ color: colors.text }}>Cancel</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: colors.text }}>Quotes</Text>

                    {user.role === 'shipper' && quotes.map(q => (
                        <View key={q.id} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 12, opacity: q.status === 'withdrawn' ? 0.5 : 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.text }}>${q.amount}</Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>by {q.Traveler?.name} · {formatDate(q.delivery_date)}</Text>
                                    {q.message && <Text style={{ color: colors.textSecondary, fontSize: 12, fontStyle: 'italic', marginTop: 2 }}>"{q.message}"</Text>}
                                    {q.status === 'withdrawn' && q.withdrawal_reason && <Text style={{ color: '#ea580c', fontSize: 12, marginTop: 2 }}>Withdrawn: {q.withdrawal_reason}</Text>}
                                </View>
                                {shipment.status === 'pending' && q.status === 'pending' && (
                                    <Pressable onPress={() => handleAcceptQuote(q.id)}
                                        style={{ backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginLeft: 8 }}>
                                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Accept</Text>
                                    </Pressable>
                                )}
                                {q.status !== 'pending' && (
                                    <View style={{ backgroundColor: q.status === 'accepted' ? '#dcfce7' : q.status === 'withdrawn' ? '#ffedd5' : '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 }}>
                                        <Text style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>{q.status}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))}

                    {user.role === 'traveler' && shipment.status === 'pending' && (
                        <View style={{ backgroundColor: colors.bg, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                            <Text style={{ fontWeight: 'bold', marginBottom: 8, color: colors.text }}>Submit a Quote</Text>
                            <TextInput value={newQuote.amount} onChangeText={v => setNewQuote({ ...newQuote, amount: v })}
                                placeholder="Amount" placeholderTextColor={colors.textSecondary} keyboardType="decimal-pad" style={inputStyle} />
                            <DatePicker value={newQuote.delivery_date} onChange={v => setNewQuote({ ...newQuote, delivery_date: v })}
                                placeholder="Select delivery date" minimumDate={new Date()}
                                maximumDate={shipment.reach_latest_by ? new Date(shipment.reach_latest_by + 'T00:00:00') : undefined} />
                            <TextInput value={newQuote.message} onChangeText={v => setNewQuote({ ...newQuote, message: v })}
                                placeholder="Message (optional)" placeholderTextColor={colors.textSecondary} multiline style={{ ...inputStyle, minHeight: 50 }} />
                            <Pressable onPress={handleQuoteSubmit}
                                style={{ backgroundColor: '#16a34a', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Submit Quote</Text>
                            </Pressable>
                        </View>
                    )}

                    {user.role === 'traveler' && quotes.map(q => (
                        <View key={q.id} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 10, opacity: q.status === 'withdrawn' ? 0.5 : 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: '600', color: colors.text }}>${q.amount} · {formatDate(q.delivery_date)}</Text>
                                    {q.withdrawal_reason && <Text style={{ color: '#ea580c', fontSize: 12 }}>Reason: {q.withdrawal_reason}</Text>}
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ backgroundColor: q.status === 'pending' ? '#fef9c3' : q.status === 'accepted' ? '#dcfce7' : q.status === 'withdrawn' ? '#ffedd5' : '#f3f4f6', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 }}>
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>{q.status}</Text>
                                    </View>
                                    {(q.status === 'pending' || q.status === 'accepted') && q.traveler_id === user.id && (
                                        <Pressable onPress={() => { setShowWithdrawForm(showWithdrawForm === q.id ? null : q.id); setWithdrawReason(''); }}
                                            style={{ borderWidth: 1, borderColor: '#fdba74', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                                            <Text style={{ color: '#ea580c', fontSize: 12, fontWeight: '600' }}>Withdraw</Text>
                                        </Pressable>
                                    )}
                                </View>
                            </View>
                            {showWithdrawForm === q.id && (
                                <View style={{ marginTop: 8, backgroundColor: '#fff7ed', borderRadius: 8, padding: 10 }}>
                                    <TextInput value={withdrawReason} onChangeText={setWithdrawReason} placeholder="Reason (required)"
                                        placeholderTextColor="#9ca3af" multiline style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 8, marginBottom: 8, minHeight: 50, color: '#1f2937' }} />
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <Pressable onPress={() => handleWithdraw(q.id)} style={{ backgroundColor: '#ea580c', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
                                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Confirm</Text>
                                        </Pressable>
                                        <Pressable onPress={() => setShowWithdrawForm(null)} style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
                                            <Text style={{ fontSize: 12 }}>Cancel</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            )}
                        </View>
                    ))}

                    {quotes.length === 0 && <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>No quotes yet.</Text>}
                </View>

                <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: colors.text }}>Tracking History</Text>
                    {shipment.History?.length > 0 ? shipment.History.map((h, i) => (
                        <View key={i} style={{ flexDirection: 'row', marginBottom: 16 }}>
                            <View style={{ width: 12, alignItems: 'center', marginRight: 12 }}>
                                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#3b82f6' }} />
                                {i < shipment.History.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: '#bfdbfe', marginTop: 2 }} />}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: '600', textTransform: 'capitalize', color: colors.text }}>{h.status?.replace('_', ' ')}</Text>
                                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{new Date(h.timestamp).toLocaleString()}</Text>
                                {h.description && <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{h.description}</Text>}
                            </View>
                        </View>
                    )) : <Text style={{ color: colors.textSecondary }}>No tracking updates.</Text>}
                </View>
            </ScrollView>
        </View>
    );
};

const Detail = ({ label, value, colors }) => (
    <View style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' }}>{label}</Text>
        <Text style={{ fontWeight: 'bold', color: colors.text }}>{value}</Text>
    </View>
);

export default ShipmentDetailsScreen;
