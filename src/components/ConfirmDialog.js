import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';

const ConfirmDialog = ({ open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, variant = 'danger' }) => {
    const btnBg = variant === 'danger' ? '#dc2626' : '#2563eb';

    return (
        <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>{title}</Text>
                    <Text style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 20 }}>{message}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                        <Pressable onPress={onCancel} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' }}>
                            <Text style={{ color: '#666' }}>{cancelText}</Text>
                        </Pressable>
                        <Pressable onPress={onConfirm} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: btnBg }}>
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{confirmText}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ConfirmDialog;
