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
import * as ImagePicker from 'expo-image-picker';

export const DISPUTE_REASONS = [
    { value: 'item_damaged', label: 'Item damaged' },
    { value: 'item_lost', label: 'Item lost' },
    { value: 'item_not_as_described', label: 'Not as described' },
    { value: 'late_delivery', label: 'Late delivery' },
    { value: 'no_show', label: 'No show' },
    { value: 'communication_issue', label: 'Communication issue' },
    { value: 'price_disagreement', label: 'Price disagreement' },
    { value: 'schedule_change', label: 'Schedule change' },
    { value: 'found_alternative', label: 'Found an alternative' },
    { value: 'other', label: 'Other' },
];

const reasonLabel = (value) => DISPUTE_REASONS.find(r => r.value === value)?.label || value;

const ReasonPicker = ({ value, onChange, colors }) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {DISPUTE_REASONS.map(r => (
            <Pressable key={r.value} onPress={() => onChange(r.value)}
                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: value === r.value ? '#2563eb' : colors.border }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: value === r.value ? '#fff' : colors.text }}>{r.label}</Text>
            </Pressable>
        ))}
    </View>
);

const ShipmentDetailsScreen = ({ route, navigation }) => {
    const { id } = route.params;
    const { user } = useAuth();
    const snackbar = useSnackbar();
    const { colors } = useTheme();
    const [shipment, setShipment] = useState(null);
    const [quotes, setQuotes] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [newQuote, setNewQuote] = useState({ amount: '', delivery_date: '', currency: 'USD', message: '' });
    const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
    const [deleteReasonCategory, setDeleteReasonCategory] = useState('');
    const [deleteReason, setDeleteReason] = useState('');
    const [showDeleteForm, setShowDeleteForm] = useState(false);
    const [withdrawReasonCategory, setWithdrawReasonCategory] = useState('');
    const [withdrawReason, setWithdrawReason] = useState('');
    const [showWithdrawForm, setShowWithdrawForm] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ open: false });
    const [refreshing, setRefreshing] = useState(false);
    const [disputes, setDisputes] = useState([]);
    const [showDisputeForm, setShowDisputeForm] = useState(false);
    const [newDispute, setNewDispute] = useState({ reason_category: '', description: '', evidence_photo_urls: [] });
    const [disputeNotes, setDisputeNotes] = useState({});

    const refreshData = async () => {
        try {
            const [res, qRes, rRes, dRes] = await Promise.all([
                axios.get(`${API_BASE}/api/shipments/${id}`),
                axios.get(`${API_BASE}/api/quotes/shipment/${id}`),
                axios.get(`${API_BASE}/api/reviews/shipment/${id}`),
                axios.get(`${API_BASE}/api/disputes`, { params: { subject_type: 'shipment', subject_id: id } }),
            ]);
            setShipment(res.data);
            setQuotes(qRes.data);
            setReviews(rRes.data);
            setDisputes(dRes.data);
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

    const handleUpdateStatus = async (newStatus) => {
        try {
            await axios.post(`${API_BASE}/api/shipments/${id}/status`, { status: newStatus });
            await refreshData();
            snackbar.success(newStatus === 'in_transit' ? 'Marked as picked up' : 'Marked as delivered');
        } catch (e) { snackbar.error(e.response?.data?.error || 'Failed'); }
    };

    const handleReviewSubmit = async () => {
        if (!newReview.rating) { snackbar.warn('Please select a rating'); return; }
        try {
            await axios.post(`${API_BASE}/api/reviews`, { shipment_id: id, rating: newReview.rating, comment: newReview.comment });
            await refreshData();
            setNewReview({ rating: 0, comment: '' });
            snackbar.success('Review submitted');
        } catch (e) { snackbar.error(e.response?.data?.error || 'Failed'); }
    };

    const handleDelete = () => {
        if (!deleteReasonCategory) { snackbar.warn('Select a reason'); return; }
        setConfirmDialog({
            open: true, title: 'Delete Shipment', message: 'This cannot be undone.',
            confirmText: 'Delete', variant: 'danger',
            onConfirm: async () => {
                setConfirmDialog({ open: false });
                try {
                    await axios.post(`${API_BASE}/api/shipments/${id}/delete`, {
                        reason_category: deleteReasonCategory, reason: deleteReason,
                    });
                    snackbar.success('Shipment deleted');
                    navigation.goBack();
                } catch (e) { snackbar.error(e.response?.data?.error || 'Failed'); }
            },
        });
    };

    const handleWithdraw = (quoteId) => {
        if (!withdrawReasonCategory) { snackbar.warn('Select a reason'); return; }
        setConfirmDialog({
            open: true, title: 'Withdraw Quote', message: 'Your locked funds will be released.',
            confirmText: 'Withdraw', variant: 'danger',
            onConfirm: async () => {
                setConfirmDialog({ open: false });
                try {
                    await axios.post(`${API_BASE}/api/quotes/${quoteId}/withdraw`, {
                        reason_category: withdrawReasonCategory, reason: withdrawReason,
                    });
                    setShowWithdrawForm(null); setWithdrawReasonCategory(''); setWithdrawReason('');
                    await refreshData();
                    snackbar.success('Quote withdrawn');
                } catch (e) { snackbar.error(e.response?.data?.error || 'Failed'); }
            },
        });
    };

    const handleEvidenceUpload = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
        if (result.canceled) return;
        const asset = result.assets[0];
        const data = new FormData();
        data.append('photo', { uri: asset.uri, type: 'image/jpeg', name: 'evidence.jpg' });
        try {
            const res = await axios.post(API_BASE + '/api/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            const url = res.data.url.startsWith('http') ? res.data.url : API_BASE + res.data.url;
            setNewDispute(d => ({ ...d, evidence_photo_urls: [...d.evidence_photo_urls, url] }));
        } catch (e) { snackbar.error('Evidence upload failed'); }
    };

    const handleFileDispute = async () => {
        if (!newDispute.reason_category) { snackbar.warn('Select a reason'); return; }
        try {
            await axios.post(`${API_BASE}/api/disputes`, {
                subject_type: 'shipment', subject_id: id,
                reason_category: newDispute.reason_category,
                description: newDispute.description,
                evidence_photo_urls: newDispute.evidence_photo_urls,
            });
            setShowDisputeForm(false);
            setNewDispute({ reason_category: '', description: '', evidence_photo_urls: [] });
            await refreshData();
            snackbar.success('Dispute filed');
        } catch (e) { snackbar.error(e.response?.data?.error || 'Failed to file dispute'); }
    };

    const handleDisputeAction = async (disputeId, action) => {
        const notes = disputeNotes[disputeId] || '';
        if (action === 'reject' && !notes.trim()) { snackbar.warn('Explain why you are rejecting this dispute'); return; }
        try {
            await axios.post(`${API_BASE}/api/disputes/${disputeId}/${action}`,
                (action === 'withdraw' || action === 'review') ? undefined : { resolution_notes: notes });
            await refreshData();
            snackbar.success('Dispute updated');
        } catch (e) { snackbar.error(e.response?.data?.error || 'Failed to update dispute'); }
    };

    if (!shipment) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}><Text style={{ color: colors.text }}>Loading...</Text></View>;

    const isOwner = user.role === 'shipper' && shipment.shipperId === user.id;
    const canDelete = isOwner && shipment.status !== 'delivered' && shipment.status !== 'deleted';
    const inputStyle = { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: colors.inputBg, color: colors.text };

    const acceptedQuote = quotes.find(q => q.status === 'accepted');
    const isAcceptedTraveler = user.id === acceptedQuote?.traveler_id;
    const isReviewParticipant = shipment.status === 'delivered' && acceptedQuote &&
        (user.id === shipment.shipperId || user.id === acceptedQuote.traveler_id);
    const myReview = reviews.find(r => r.reviewer_id === user.id);
    const otherReview = reviews.find(r => r.reviewer_id !== user.id);
    const otherPartyLabel = user.id === shipment.shipperId ? 'the traveler' : 'the shipper';
    const canFileDispute = !!acceptedQuote && (user.id === shipment.shipperId || isAcceptedTraveler);

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

                    {isAcceptedTraveler && (shipment.status === 'accepted' || shipment.status === 'in_transit') && (
                        <Pressable
                            onPress={() => handleUpdateStatus(shipment.status === 'accepted' ? 'in_transit' : 'delivered')}
                            style={{
                                marginTop: 16, borderRadius: 10, paddingVertical: 12, alignItems: 'center',
                                backgroundColor: shipment.status === 'accepted' ? '#2563eb' : '#16a34a',
                            }}>
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                                {shipment.status === 'accepted' ? 'Mark as Picked Up' : 'Mark as Delivered'}
                            </Text>
                        </Pressable>
                    )}

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
                                    <ReasonPicker value={deleteReasonCategory} onChange={setDeleteReasonCategory} colors={colors} />
                                    <TextInput value={deleteReason} onChangeText={setDeleteReason} placeholder="Additional details (optional)"
                                        placeholderTextColor={colors.textSecondary} multiline style={{ ...inputStyle, minHeight: 60 }} />
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <Pressable onPress={handleDelete} style={{ backgroundColor: '#dc2626', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
                                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirm</Text>
                                        </Pressable>
                                        <Pressable onPress={() => { setShowDeleteForm(false); setDeleteReasonCategory(''); setDeleteReason(''); }} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
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
                                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                                        by {q.Traveler?.name}
                                        {q.Traveler?.review_count > 0 && (
                                            <Text style={{ color: '#ca8a04', fontWeight: 'bold' }}> · ★ {q.Traveler.average_rating.toFixed(1)} ({q.Traveler.review_count})</Text>
                                        )}
                                        {' · '}{formatDate(q.delivery_date)}
                                    </Text>
                                    {q.message && <Text style={{ color: colors.textSecondary, fontSize: 12, fontStyle: 'italic', marginTop: 2 }}>"{q.message}"</Text>}
                                    {q.status === 'withdrawn' && q.withdrawal_reason_category && (
                                        <Text style={{ color: '#ea580c', fontSize: 12, marginTop: 2 }}>
                                            Withdrawn: {reasonLabel(q.withdrawal_reason_category)}{q.withdrawal_reason ? ` — ${q.withdrawal_reason}` : ''}
                                        </Text>
                                    )}
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
                                    {q.withdrawal_reason_category && (
                                        <Text style={{ color: '#ea580c', fontSize: 12 }}>
                                            Reason: {reasonLabel(q.withdrawal_reason_category)}{q.withdrawal_reason ? ` — ${q.withdrawal_reason}` : ''}
                                        </Text>
                                    )}
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ backgroundColor: q.status === 'pending' ? '#fef9c3' : q.status === 'accepted' ? '#dcfce7' : q.status === 'withdrawn' ? '#ffedd5' : '#f3f4f6', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 }}>
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>{q.status}</Text>
                                    </View>
                                    {(q.status === 'pending' || q.status === 'accepted') && q.traveler_id === user.id && (
                                        <Pressable onPress={() => { setShowWithdrawForm(showWithdrawForm === q.id ? null : q.id); setWithdrawReasonCategory(''); setWithdrawReason(''); }}
                                            style={{ borderWidth: 1, borderColor: '#fdba74', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                                            <Text style={{ color: '#ea580c', fontSize: 12, fontWeight: '600' }}>Withdraw</Text>
                                        </Pressable>
                                    )}
                                </View>
                            </View>
                            {showWithdrawForm === q.id && (
                                <View style={{ marginTop: 8, backgroundColor: '#fff7ed', borderRadius: 8, padding: 10 }}>
                                    <ReasonPicker value={withdrawReasonCategory} onChange={setWithdrawReasonCategory} colors={colors} />
                                    <TextInput value={withdrawReason} onChangeText={setWithdrawReason} placeholder="Additional details (optional)"
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

                {canFileDispute && (
                    <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>Disputes</Text>
                            <Pressable onPress={() => setShowDisputeForm(!showDisputeForm)}
                                style={{ backgroundColor: '#dc2626', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>File a Dispute</Text>
                            </Pressable>
                        </View>

                        {showDisputeForm && (
                            <View style={{ backgroundColor: colors.bg, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                                <ReasonPicker value={newDispute.reason_category} onChange={v => setNewDispute({ ...newDispute, reason_category: v })} colors={colors} />
                                <TextInput value={newDispute.description} onChangeText={v => setNewDispute({ ...newDispute, description: v })}
                                    placeholder="Describe what happened (optional)" placeholderTextColor={colors.textSecondary}
                                    multiline style={{ ...inputStyle, minHeight: 60 }} />
                                <Pressable onPress={handleEvidenceUpload} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginBottom: 8 }}>
                                    <Text style={{ color: colors.text, fontWeight: '600' }}>Add Evidence Photo</Text>
                                </Pressable>
                                {newDispute.evidence_photo_urls.length > 0 && (
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                        {newDispute.evidence_photo_urls.map((url, i) => (
                                            <Image key={i} source={{ uri: resolveImageUrl(url) }} style={{ width: 56, height: 56, borderRadius: 6, backgroundColor: '#e5e7eb' }} />
                                        ))}
                                    </View>
                                )}
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <Pressable onPress={handleFileDispute} style={{ backgroundColor: '#dc2626', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
                                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Submit</Text>
                                    </Pressable>
                                    <Pressable onPress={() => { setShowDisputeForm(false); setNewDispute({ reason_category: '', description: '', evidence_photo_urls: [] }); }}
                                        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
                                        <Text style={{ color: colors.text }}>Cancel</Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}

                        {disputes.length === 0 ? (
                            <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>No disputes filed for this shipment.</Text>
                        ) : disputes.map(dispute => {
                            const isRespondent = dispute.respondent_user_id === user.id;
                            const isFiler = dispute.filed_by_user_id === user.id;
                            const isActionable = dispute.status === 'open' || dispute.status === 'under_review';
                            return (
                                <View key={dispute.id} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontWeight: 'bold', color: colors.text }}>{reasonLabel(dispute.reason_category)}</Text>
                                            {dispute.description && <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{dispute.description}</Text>}
                                        </View>
                                        <View style={{ backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                            <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>{dispute.status.replace('_', ' ')}</Text>
                                        </View>
                                    </View>
                                    {dispute.evidence?.length > 0 && (
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                            {dispute.evidence.map(ev => (
                                                <Image key={ev.id} source={{ uri: resolveImageUrl(ev.photo_url) }} style={{ width: 56, height: 56, borderRadius: 6, backgroundColor: '#e5e7eb' }} />
                                            ))}
                                        </View>
                                    )}
                                    {dispute.resolution_notes && (
                                        <Text style={{ color: colors.textSecondary, fontSize: 12, fontStyle: 'italic', marginTop: 8 }}>Resolution: {dispute.resolution_notes}</Text>
                                    )}
                                    {isActionable && (isFiler || isRespondent) && (
                                        <View style={{ marginTop: 8 }}>
                                            {isRespondent && (
                                                <>
                                                    <TextInput value={disputeNotes[dispute.id] || ''} onChangeText={v => setDisputeNotes({ ...disputeNotes, [dispute.id]: v })}
                                                        placeholder="Notes (required to reject, optional to accept)" placeholderTextColor={colors.textSecondary}
                                                        multiline style={{ ...inputStyle, minHeight: 50 }} />
                                                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                                                        {dispute.status === 'open' && (
                                                            <Pressable onPress={() => handleDisputeAction(dispute.id, 'review')} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
                                                                <Text style={{ color: colors.text, fontSize: 12 }}>Mark Under Review</Text>
                                                            </Pressable>
                                                        )}
                                                        <Pressable onPress={() => handleDisputeAction(dispute.id, 'accept')} style={{ backgroundColor: '#16a34a', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
                                                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Accept</Text>
                                                        </Pressable>
                                                        <Pressable onPress={() => handleDisputeAction(dispute.id, 'reject')} style={{ backgroundColor: '#4b5563', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
                                                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Reject</Text>
                                                        </Pressable>
                                                    </View>
                                                </>
                                            )}
                                            {isFiler && (
                                                <Pressable onPress={() => handleDisputeAction(dispute.id, 'withdraw')}
                                                    style={{ marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' }}>
                                                    <Text style={{ color: colors.text, fontSize: 12 }}>Withdraw Dispute</Text>
                                                </Pressable>
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}

                {isReviewParticipant && (
                    <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: colors.text }}>Delivery Review</Text>

                        {myReview ? (
                            <View style={{ marginBottom: otherReview ? 16 : 0 }}>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Your review</Text>
                                <StarRow rating={myReview.rating} />
                                {myReview.comment && <Text style={{ color: colors.text, fontStyle: 'italic', marginTop: 6 }}>"{myReview.comment}"</Text>}
                            </View>
                        ) : (
                            <View style={{ backgroundColor: colors.bg, borderRadius: 8, padding: 12, marginBottom: otherReview ? 16 : 0 }}>
                                <Text style={{ fontWeight: 'bold', marginBottom: 10, color: colors.text }}>Rate {otherPartyLabel}</Text>
                                <View style={{ marginBottom: 10 }}>
                                    <StarRow rating={newReview.rating} onRate={(n) => setNewReview({ ...newReview, rating: n })} size={28} />
                                </View>
                                <TextInput value={newReview.comment} onChangeText={v => setNewReview({ ...newReview, comment: v })}
                                    placeholder="Leave a comment (optional)" placeholderTextColor={colors.textSecondary} multiline style={{ ...inputStyle, minHeight: 60 }} />
                                <Pressable onPress={handleReviewSubmit} style={{ backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}>
                                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Submit Review</Text>
                                </Pressable>
                            </View>
                        )}

                        {otherReview && (
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>
                                    {user.id === shipment.shipperId ? "Traveler's" : "Shipper's"} review of this delivery
                                </Text>
                                <StarRow rating={otherReview.rating} />
                                {otherReview.comment && <Text style={{ color: colors.text, fontStyle: 'italic', marginTop: 6 }}>"{otherReview.comment}"</Text>}
                            </View>
                        )}
                    </View>
                )}

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

const StarRow = ({ rating, onRate, size = 22 }) => (
    <View style={{ flexDirection: 'row', gap: 4 }}>
        {[1, 2, 3, 4, 5].map(n => {
            const filled = n <= rating;
            const star = <Text style={{ fontSize: size, color: filled ? '#ca8a04' : '#d1d5db' }}>{filled ? '★' : '☆'}</Text>;
            return onRate ? (
                <Pressable key={n} onPress={() => onRate(n)}>{star}</Pressable>
            ) : (
                <View key={n}>{star}</View>
            );
        })}
    </View>
);

export default ShipmentDetailsScreen;
