import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import axios from 'axios';
import API_BASE from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { useTheme } from '../../context/ThemeContext';

const ChatScreen = ({ route, navigation }) => {
    const { shipmentId } = route.params;
    const { user } = useAuth();
    const snackbar = useSnackbar();
    const { colors } = useTheme();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [chatInfo, setChatInfo] = useState(null);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef(null);
    const pollRef = useRef(null);

    const fetchMessages = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/chat/shipment/${shipmentId}`);
            setMessages(res.data);
        } catch (e) {}
    };

    const fetchInfo = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/chat/shipment/${shipmentId}/info`);
            setChatInfo(res.data);
            navigation.setOptions({ title: res.data.other_user_name || 'Chat' });
        } catch (e) {
            snackbar.error('Chat not available for this shipment');
            navigation.goBack();
        }
    };

    useEffect(() => {
        fetchInfo();
        fetchMessages();
        pollRef.current = setInterval(fetchMessages, 3000);
        return () => clearInterval(pollRef.current);
    }, [shipmentId]);

    const sendMessage = async () => {
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            await axios.post(`${API_BASE}/api/chat/shipment/${shipmentId}`, { content: text.trim() });
            setText('');
            await fetchMessages();
        } catch (e) {
            snackbar.error('Failed to send');
        } finally { setSending(false); }
    };

    const handleCall = () => {
        if (!chatInfo?.other_user_phone) {
            snackbar.warn('Phone number not available');
            return;
        }
        const phone = (chatInfo.other_user_country_code || '') + chatInfo.other_user_phone;
        Linking.openURL(`tel:${phone}`);
    };

    const renderMessage = ({ item }) => {
        const isMine = item.sender_id === user.id;
        return (
            <View style={{
                alignSelf: isMine ? 'flex-end' : 'flex-start',
                maxWidth: '78%', marginBottom: 8,
            }}>
                <View style={{
                    backgroundColor: isMine ? '#2563eb' : colors.card,
                    borderRadius: 16,
                    borderBottomRightRadius: isMine ? 4 : 16,
                    borderBottomLeftRadius: isMine ? 16 : 4,
                    paddingHorizontal: 14, paddingVertical: 10,
                    borderWidth: isMine ? 0 : 1, borderColor: colors.border,
                }}>
                    <Text style={{ color: isMine ? '#fff' : colors.text, fontSize: 15, lineHeight: 20 }}>{item.content}</Text>
                </View>
                <Text style={{
                    fontSize: 10, color: colors.textSecondary, marginTop: 2,
                    alignSelf: isMine ? 'flex-end' : 'flex-start', marginHorizontal: 4,
                }}>
                    {new Date(item.createdAt || item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>

            {chatInfo && (
                <View style={{
                    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
                    paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{chatInfo.shipment_route}</Text>
                    </View>
                    <Pressable onPress={handleCall} style={{
                        backgroundColor: '#16a34a', width: 40, height: 40, borderRadius: 20,
                        justifyContent: 'center', alignItems: 'center',
                    }}>
                        <Text style={{ fontSize: 18 }}>📞</Text>
                    </Pressable>
                </View>
            )}

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => String(item.id)}
                renderItem={renderMessage}
                contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 60 }}>
                        <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 15 }}>No messages yet</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Say hello to get started!</Text>
                    </View>
                }
            />

            <View style={{
                flexDirection: 'row', alignItems: 'center', padding: 10,
                backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
            }}>
                <TextInput
                    value={text} onChangeText={setText}
                    placeholder="Type a message..." placeholderTextColor={colors.textSecondary}
                    multiline maxLength={1000}
                    style={{
                        flex: 1, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
                        borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
                        color: colors.text, maxHeight: 100,
                    }}
                    onSubmitEditing={sendMessage}
                />
                <Pressable onPress={sendMessage} disabled={!text.trim() || sending}
                    style={{
                        width: 44, height: 44, borderRadius: 22, backgroundColor: text.trim() ? '#2563eb' : '#d1d5db',
                        justifyContent: 'center', alignItems: 'center', marginLeft: 8,
                    }}>
                    <Text style={{ color: '#fff', fontSize: 18 }}>➤</Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ChatScreen;
