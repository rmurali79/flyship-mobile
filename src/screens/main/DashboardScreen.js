import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import axios from 'axios';
import API_BASE from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { useTheme } from '../../context/ThemeContext';
import { formatDate } from '../../utils/date';
import StatsWidget from '../../components/StatsWidget';
import ShipmentCard from '../../components/ShipmentCard';
import ConfirmDialog from '../../components/ConfirmDialog';
import CityThumb from '../../components/CityThumb';

const DashboardScreen = ({ navigation }) => {
    const { user } = useAuth();
    const snackbar = useSnackbar();
    const { colors } = useTheme();
    const [shipments, setShipments] = useState([]);
    const [travelPlans, setTravelPlans] = useState([]);
    const [acceptedDeliveries, setAcceptedDeliveries] = useState([]);
    const [myListings, setMyListings] = useState([]);
    const [cityMap, setCityMap] = useState({});
    const [viewMode, setViewMode] = useState('matched');
    const [refreshing, setRefreshing] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false });

    const isShipper = user.role === 'shipper' || user.role === 'both';
    const isTraveler = user.role === 'traveler' || user.role === 'both';

    const fetchData = useCallback(async () => {
        try {
            const citiesRes = await axios.get(API_BASE + '/api/cities');
            const map = {};
            citiesRes.data.forEach(c => { map[c.name.toLowerCase()] = { imageUrl: c.image_url || null, code: c.code }; });
            setCityMap(map);

            let endpoint = '/api/shipments';
            if (isTraveler && viewMode === 'matched') endpoint = '/api/shipments?matched=true';
            else if (user.role === 'shipper') endpoint = '/api/shipments/my-shipments';

            const res = await axios.get(API_BASE + endpoint);
            setShipments(res.data.filter(s => s.status !== 'deleted'));

            if (isTraveler) {
                const plans = await axios.get(API_BASE + '/api/travel-plans/my-plans');
                setTravelPlans(plans.data);
                const deliveries = await axios.get(API_BASE + '/api/shipments/my-deliveries');
                setAcceptedDeliveries(deliveries.data);
            }
            if (user.role === 'both') {
                const my = await axios.get(API_BASE + '/api/shipments/my-shipments');
                setMyListings(my.data.filter(s => s.status !== 'deleted'));
            }
        } catch (e) { console.error(e); }
    }, [viewMode, user.role]);

    useEffect(() => { fetchData(); }, [fetchData]);
    const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

    const handleCancelPlan = (planId) => {
        setConfirmDialog({
            open: true, title: 'Cancel Travel Plan',
            message: 'Are you sure? Cancellation penalties may apply for accepted shipments.',
            confirmText: 'Cancel Plan', variant: 'danger',
            onConfirm: async () => {
                setConfirmDialog({ open: false });
                try {
                    await axios.post(API_BASE + `/api/travel-plans/${planId}/cancel`);
                    snackbar.success('Travel plan cancelled');
                    fetchData();
                } catch (e) { snackbar.error(e.response?.data?.error || 'Failed'); }
            },
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog({ open: false })} />
            <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                <StatsWidget />

                {isTraveler && (
                    <View style={{ marginBottom: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>My Travel Plans</Text>
                            <Pressable onPress={() => navigation.navigate('CreateTravelPlan')}
                                style={{ backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>+ Add Plan</Text>
                            </Pressable>
                        </View>
                        {travelPlans.length === 0 ? (
                            <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>No travel plans yet.</Text>
                        ) : travelPlans.map(plan => (
                            <View key={plan.id} style={{ backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <View style={{ alignItems: 'center' }}>
                                        <CityThumb name={plan.origin} cityMap={cityMap} width={60} height={40} style={{ marginBottom: 2 }} />
                                        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text }}>{plan.origin}</Text>
                                    </View>
                                    <Text style={{ fontSize: 18, color: '#9ca3af' }}>✈️</Text>
                                    <View style={{ alignItems: 'center' }}>
                                        <CityThumb name={plan.destination} cityMap={cityMap} width={60} height={40} style={{ marginBottom: 2 }} />
                                        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text }}>{plan.destination}</Text>
                                    </View>
                                </View>
                                <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
                                    {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                                </Text>
                                {plan.available_baggage_kg && (
                                    <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 2 }}>
                                        🧳 {plan.available_baggage_kg} kg available
                                    </Text>
                                )}
                                <Pressable onPress={() => handleCancelPlan(plan.id)}
                                    style={{ marginTop: 8, alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#fca5a5' }}>
                                    <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '600' }}>Cancel</Text>
                                </Pressable>
                            </View>
                        ))}
                    </View>
                )}

                {isTraveler && acceptedDeliveries.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: colors.text }}>Accepted Deliveries</Text>
                        {acceptedDeliveries.map(s => (
                            <ShipmentCard key={s.id} shipment={s} cityMap={cityMap} onPress={() => navigation.navigate('ShipmentDetails', { id: s.id })} />
                        ))}
                    </View>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
                        {user.role === 'shipper' ? 'My Shipments' : 'Available Shipments'}
                    </Text>
                    {isShipper && (
                        <Pressable onPress={() => navigation.navigate('CreateShipment')}
                            style={{ backgroundColor: '#16a34a', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>+ Create</Text>
                        </Pressable>
                    )}
                </View>

                {isTraveler && (
                    <View style={{ flexDirection: 'row', backgroundColor: colors.border, borderRadius: 8, padding: 3, marginBottom: 12 }}>
                        {['matched', 'all'].map(mode => (
                            <Pressable key={mode} onPress={() => setViewMode(mode)}
                                style={{ flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', backgroundColor: viewMode === mode ? colors.card : 'transparent' }}>
                                <Text style={{ fontWeight: viewMode === mode ? 'bold' : 'normal', fontSize: 13, color: colors.text }}>
                                    {mode === 'matched' ? 'Matched' : 'All'}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                )}

                {shipments.filter(s => user.role === 'shipper' ? s.status !== 'accepted' : true).map(s => (
                    <ShipmentCard key={s.id} shipment={s} cityMap={cityMap} onPress={() => navigation.navigate('ShipmentDetails', { id: s.id })} />
                ))}

                {shipments.length === 0 && (
                    <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 40 }}>No shipments found.</Text>
                )}
            </ScrollView>
        </View>
    );
};

export default DashboardScreen;
