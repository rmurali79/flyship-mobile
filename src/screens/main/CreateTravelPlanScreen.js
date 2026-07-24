import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import axios from 'axios';
import API_BASE from '../../config/api';
import { useSnackbar } from '../../context/SnackbarContext';
import { useTheme } from '../../context/ThemeContext';
import DatePicker from '../../components/DatePicker';

const CreateTravelPlanScreen = ({ navigation }) => {
    const snackbar = useSnackbar();
    const { colors } = useTheme();
    const [cities, setCities] = useState([]);
    const [form, setForm] = useState({ origin: '', destination: '', start_date: '', end_date: '', available_baggage_kg: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => { axios.get(API_BASE + '/api/cities').then(r => setCities(r.data)).catch(() => {}); }, []);
    const update = (key, val) => setForm({ ...form, [key]: val });

    const handleSubmit = async () => {
        if (!form.origin || !form.destination || !form.start_date || !form.end_date || !form.available_baggage_kg) { snackbar.warn('Fill all fields'); return; }
        setLoading(true);
        try {
            await axios.post(API_BASE + '/api/travel-plans', form);
            snackbar.success('Travel plan created');
            navigation.goBack();
        } catch (e) { snackbar.error(e.response?.data?.error || 'Failed'); }
        finally { setLoading(false); }
    };

    const inputStyle = { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 12, marginBottom: 8, backgroundColor: colors.inputBg, color: colors.text, fontSize: 15 };

    return (
        <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: colors.bg, flexGrow: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: colors.text }}>Create Travel Plan</Text>

            <Label text="Origin" colors={colors} />
            <CitySelect cities={cities} value={form.origin} onChange={v => update('origin', v)} colors={colors} />
            <Label text="Destination" colors={colors} />
            <CitySelect cities={cities} value={form.destination} onChange={v => update('destination', v)} colors={colors} />

            <Label text="Start Date" colors={colors} />
            <DatePicker value={form.start_date} onChange={v => update('start_date', v)} placeholder="Select start date" minimumDate={new Date()} />
            <Label text="End Date" colors={colors} />
            <DatePicker value={form.end_date} onChange={v => update('end_date', v)} placeholder="Select end date" minimumDate={form.start_date ? new Date(form.start_date + 'T00:00:00') : new Date()} />

            <Label text="Available Baggage (kg)" colors={colors} />
            <TextInput value={form.available_baggage_kg} onChangeText={v => update('available_baggage_kg', v)} keyboardType="decimal-pad" placeholder="e.g. 5.0" placeholderTextColor={colors.textSecondary} style={inputStyle} />
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: -4, marginBottom: 8 }}>Shipments heavier than this won't be shown to you as matches.</Text>

            <Pressable onPress={handleSubmit} disabled={loading}
                style={{ backgroundColor: loading ? '#93c5fd' : '#2563eb', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 16 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{loading ? 'Creating...' : 'Create Plan'}</Text>
            </Pressable>
        </ScrollView>
    );
};

const Label = ({ text, colors }) => <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 4, marginTop: 12 }}>{text}</Text>;

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

export default CreateTravelPlanScreen;
