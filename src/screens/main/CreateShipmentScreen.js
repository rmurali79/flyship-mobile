import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import axios from 'axios';
import API_BASE from '../../config/api';
import { useSnackbar } from '../../context/SnackbarContext';
import { useTheme } from '../../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import DatePicker from '../../components/DatePicker';

const CreateShipmentScreen = ({ navigation }) => {
    const snackbar = useSnackbar();
    const { colors } = useTheme();
    const [cities, setCities] = useState([]);
    const [form, setForm] = useState({
        origin: '', destination: '', item_description: '', photo_url: '',
        weight: '', max_budget: '', reach_latest_by: '',
        shipment_arrangement: 'self_handover', collection_point: '',
        delivery_recipient_name: '', delivery_address: '', delivery_arrangement: 'deliver',
        escrow_amount: '', escrow_currency: 'USD',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => { axios.get(API_BASE + '/api/cities').then(r => setCities(r.data)).catch(() => {}); }, []);
    const update = (key, val) => setForm({ ...form, [key]: val });

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
        if (result.canceled) return;
        const asset = result.assets[0];
        const data = new FormData();
        data.append('photo', { uri: asset.uri, type: 'image/jpeg', name: 'photo.jpg' });
        try {
            const res = await axios.post(API_BASE + '/api/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            const url = res.data.url.startsWith('http') ? res.data.url : API_BASE + res.data.url;
            update('photo_url', url);
            snackbar.success('Photo uploaded');
        } catch (e) { snackbar.error('Upload failed'); }
    };

    const handleSubmit = async () => {
        if (!form.origin || !form.destination || !form.item_description) { snackbar.warn('Fill required fields'); return; }
        setLoading(true);
        try {
            await axios.post(API_BASE + '/api/shipments', form);
            snackbar.success('Shipment created');
            navigation.goBack();
        } catch (e) { snackbar.error(e.response?.data?.error || 'Failed'); }
        finally { setLoading(false); }
    };

    const inputStyle = { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 12, marginBottom: 8, backgroundColor: colors.inputBg, color: colors.text, fontSize: 15 };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: colors.bg }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: colors.text }}>Create Shipment</Text>

                <Label text="Origin" colors={colors} />
                <CitySelect cities={cities} value={form.origin} onChange={v => update('origin', v)} colors={colors} />
                <Label text="Destination" colors={colors} />
                <CitySelect cities={cities} value={form.destination} onChange={v => update('destination', v)} colors={colors} />

                <Label text="Item Description" colors={colors} />
                <TextInput value={form.item_description} onChangeText={v => update('item_description', v)}
                    multiline placeholder="What are you shipping?" placeholderTextColor={colors.textSecondary} style={inputStyle} />

                <Label text="Photo" colors={colors} />
                <Pressable onPress={pickImage} style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: '#2563eb', fontWeight: '600' }}>Choose Photo</Text>
                </Pressable>
                {form.photo_url ? <Image source={{ uri: form.photo_url }} style={{ height: 120, borderRadius: 8, marginBottom: 12 }} resizeMode="cover" /> : null}

                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}><Label text="Weight (kg)" colors={colors} /><TextInput value={form.weight} onChangeText={v => update('weight', v)} keyboardType="decimal-pad" placeholderTextColor={colors.textSecondary} style={inputStyle} /></View>
                    <View style={{ flex: 1 }}><Label text="Max Budget ($)" colors={colors} /><TextInput value={form.max_budget} onChangeText={v => update('max_budget', v)} keyboardType="decimal-pad" placeholderTextColor={colors.textSecondary} style={inputStyle} /></View>
                </View>

                <Label text="Reach Latest By" colors={colors} />
                <DatePicker value={form.reach_latest_by} onChange={v => update('reach_latest_by', v)} placeholder="Select deadline" minimumDate={new Date()} />

                <Label text="Collection Point" colors={colors} />
                <TextInput value={form.collection_point} onChangeText={v => update('collection_point', v)} placeholder="Pickup location" placeholderTextColor={colors.textSecondary} style={inputStyle} />

                <Label text="Recipient Name" colors={colors} />
                <TextInput value={form.delivery_recipient_name} onChangeText={v => update('delivery_recipient_name', v)} placeholderTextColor={colors.textSecondary} style={inputStyle} />

                <Label text="Delivery Address" colors={colors} />
                <TextInput value={form.delivery_address} onChangeText={v => update('delivery_address', v)} placeholderTextColor={colors.textSecondary} style={inputStyle} />

                <Label text="Escrow Amount (optional)" colors={colors} />
                <TextInput value={form.escrow_amount} onChangeText={v => update('escrow_amount', v)} keyboardType="decimal-pad" placeholderTextColor={colors.textSecondary} style={inputStyle} />

                <Pressable onPress={handleSubmit} disabled={loading}
                    style={{ backgroundColor: loading ? '#93c5fd' : '#2563eb', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 40 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{loading ? 'Creating...' : 'Create Shipment'}</Text>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const Label = ({ text, colors }) => <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 4, marginTop: 8 }}>{text}</Text>;

const CitySelect = ({ cities, value, onChange, colors }) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {cities.map(c => (
            <Pressable key={c.id} onPress={() => onChange(c.name)}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: value === c.name ? '#2563eb' : colors.border, backgroundColor: value === c.name ? '#eff6ff' : colors.card }}>
                <Text style={{ fontSize: 13, fontWeight: value === c.name ? 'bold' : 'normal', color: value === c.name ? '#2563eb' : colors.text }}>{c.name}</Text>
            </Pressable>
        ))}
    </View>
);

export default CreateShipmentScreen;
