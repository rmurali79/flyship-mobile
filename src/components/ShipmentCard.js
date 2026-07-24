import React, { useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { formatDate } from '../utils/date';
import { resolveImageUrl } from '../utils/image';
import { useTheme } from '../context/ThemeContext';

const statusColors = {
    pending: { bg: '#fef9c3', text: '#854d0e' },
    accepted: { bg: '#dbeafe', text: '#1e40af' },
    in_transit: { bg: '#dcfce7', text: '#166534' },
    delivered: { bg: '#dcfce7', text: '#166534' },
};

const ShipmentCard = ({ shipment, cityMap, onPress }) => {
    const { colors } = useTheme();
    const [imgError, setImgError] = useState(false);

    const getCityImage = (name) => {
        if (!name || !cityMap) return null;
        const lower = name.toLowerCase();
        if (cityMap[lower]) return cityMap[lower];
        const found = Object.keys(cityMap).find(k => lower.includes(k));
        return found ? cityMap[found] : null;
    };

    const sc = statusColors[shipment.status] || { bg: '#f3f4f6', text: '#374151' };
    const originImg = getCityImage(shipment.origin);
    const destImg = getCityImage(shipment.destination);
    const itemImg = resolveImageUrl(shipment.photo_url);

    return (
        <Pressable onPress={onPress} style={{
            backgroundColor: colors.card, borderRadius: 12,
            marginBottom: 12, borderWidth: 1, borderColor: colors.border,
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, overflow: 'hidden',
        }}>
            {itemImg && !imgError && (
                <Image
                    source={{ uri: itemImg }}
                    style={{ width: '100%', height: 140, backgroundColor: '#e5e7eb' }}
                    resizeMode="cover"
                    onError={() => setImgError(true)}
                />
            )}

            <View style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                        {originImg ? (
                            <Image source={{ uri: originImg }} style={{ width: 72, height: 48, borderRadius: 8, marginBottom: 4, backgroundColor: '#e5e7eb' }} />
                        ) : (
                            <View style={{ width: 72, height: 48, borderRadius: 8, marginBottom: 4, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ fontSize: 10, color: colors.textSecondary }}>📍</Text>
                            </View>
                        )}
                        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' }} numberOfLines={1}>{shipment.origin}</Text>
                    </View>
                    <Text style={{ fontSize: 18, color: '#9ca3af', marginHorizontal: 6 }}>✈️</Text>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                        {destImg ? (
                            <Image source={{ uri: destImg }} style={{ width: 72, height: 48, borderRadius: 8, marginBottom: 4, backgroundColor: '#e5e7eb' }} />
                        ) : (
                            <View style={{ width: 72, height: 48, borderRadius: 8, marginBottom: 4, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ fontSize: 10, color: colors.textSecondary }}>📍</Text>
                            </View>
                        )}
                        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' }} numberOfLines={1}>{shipment.destination}</Text>
                    </View>
                </View>

                <Text style={{ color: colors.text, fontWeight: '500', fontSize: 13, marginBottom: 4 }} numberOfLines={1}>
                    {shipment.item_description || 'No description'}
                </Text>
                {shipment.weight && (
                    <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>⚖️ {shipment.weight} kg</Text>
                )}

                {shipment.reach_latest_by ? (
                    <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '600', marginBottom: 8 }}>
                        Reach by: {formatDate(shipment.reach_latest_by)}
                    </Text>
                ) : (
                    <View style={{ marginBottom: 8 }} />
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
                    <View style={{ backgroundColor: sc.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                        <Text style={{ color: sc.text, fontSize: 10, fontWeight: 'bold' }}>{shipment.status?.toUpperCase()}</Text>
                    </View>
                    {shipment.max_budget && (
                        <Text style={{ fontWeight: 'bold', color: colors.text, fontSize: 14 }}>${shipment.max_budget}</Text>
                    )}
                </View>
            </View>
        </Pressable>
    );
};

export default ShipmentCard;
