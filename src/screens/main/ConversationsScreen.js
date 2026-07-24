import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import API_BASE from '../../config/api';
import { useTheme } from '../../context/ThemeContext';

const ConversationsScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [conversations, setConversations] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetch = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/chat/conversations`);
            setConversations(res.data);
        } catch (e) {}
    };

    useFocusEffect(useCallback(() => { fetch(); }, []));

    const onRefresh = async () => { setRefreshing(true); await fetch(); setRefreshing(false); };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'now';
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        return `${Math.floor(hrs / 24)}d`;
    };

    const renderItem = ({ item }) => (
        <Pressable
            onPress={() => navigation.navigate('ChatRoom', { shipmentId: item.shipment_id })}
            style={{
                backgroundColor: colors.card, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
                flexDirection: 'row', alignItems: 'center',
            }}>
            <View style={{
                width: 48, height: 48, borderRadius: 24, backgroundColor: '#2563eb',
                justifyContent: 'center', alignItems: 'center', marginRight: 12,
            }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    {item.other_user_name?.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
            </View>
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={{ fontWeight: 'bold', color: colors.text, fontSize: 15 }}>{item.other_user_name}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{timeAgo(item.last_message_time)}</Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 2 }}>{item.route}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }} numberOfLines={1}>
                        {item.is_mine ? 'You: ' : ''}{item.last_message}
                    </Text>
                    {item.unread_count > 0 && (
                        <View style={{ backgroundColor: '#2563eb', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 }}>
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{item.unread_count}</Text>
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <FlatList
                data={conversations}
                keyExtractor={item => String(item.shipment_id)}
                renderItem={renderItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 80 }}>
                        <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>No conversations yet</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                            Chats appear after a quote is accepted
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

export default ConversationsScreen;
