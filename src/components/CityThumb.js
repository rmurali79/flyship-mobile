import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { resolveImageUrl } from '../utils/image';

// Resolves a city name to its photo via cityMap; falls back to a code tile
// (e.g. "BER") when there's no photo on file, or if the photo fails to load.
const CityThumb = ({ name, cityMap, width = 72, height = 48, style }) => {
    const [errored, setErrored] = useState(false);
    if (!name) return null;

    const lower = name.toLowerCase();
    const key = cityMap[lower] ? lower : Object.keys(cityMap).find(k => lower.includes(k));
    const entry = key ? cityMap[key] : null;
    const resolvedUrl = entry?.imageUrl ? resolveImageUrl(entry.imageUrl) : null;
    const code = entry?.code || name.slice(0, 3).toUpperCase();

    if (resolvedUrl && !errored) {
        return (
            <Image
                source={{ uri: resolvedUrl }}
                style={[{ width, height, borderRadius: 8, backgroundColor: '#e5e7eb' }, style]}
                onError={() => setErrored(true)}
            />
        );
    }

    return (
        <View style={[{ width, height, borderRadius: 8, backgroundColor: '#0B1B2E', justifyContent: 'center', alignItems: 'center' }, style]}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 }}>{code}</Text>
        </View>
    );
};

export default CityThumb;
