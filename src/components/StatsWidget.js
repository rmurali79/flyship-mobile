import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import axios from 'axios';
import API_BASE from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const StatsWidget = () => {
    const { user } = useAuth();
    const { colors } = useTheme();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        axios.get(API_BASE + '/api/users/stats').then(res => setStats(res.data)).catch(() => {});
    }, []);

    if (!stats) return null;

    const cards = user.role === 'shipper' || user.role === 'both'
        ? [{ label: 'Total Spent', value: `$${stats.totalSpends || 0}` }, { label: 'Items Shipped', value: stats.itemsShipped || 0 }]
        : [{ label: 'Total Earned', value: `$${stats.totalEarnings || 0}` }, { label: 'Trips Done', value: stats.tripsDone || 0 }];

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {cards.map((card, i) => (
                <View key={i} style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginRight: 12, minWidth: 140, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#2563eb' }}>{card.value}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{card.label}</Text>
                </View>
            ))}
        </ScrollView>
    );
};

export default StatsWidget;
