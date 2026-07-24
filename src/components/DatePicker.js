import React, { useState } from 'react';
import { View, Text, Pressable, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';

const DatePicker = ({ value, onChange, placeholder = 'Select date', minimumDate, maximumDate }) => {
    const { colors } = useTheme();
    const [show, setShow] = useState(false);

    const parsed = value ? new Date(value + 'T00:00:00') : null;
    const display = parsed ? parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

    const handleChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShow(false);
        if (event.type === 'dismissed') return;
        if (selectedDate) {
            const y = selectedDate.getFullYear();
            const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const d = String(selectedDate.getDate()).padStart(2, '0');
            onChange(`${y}-${m}-${d}`);
        }
    };

    if (Platform.OS === 'android') {
        return (
            <View>
                <Pressable onPress={() => setShow(true)} style={{
                    borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8,
                    padding: 12, marginBottom: 8, backgroundColor: colors.inputBg,
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <Text style={{ color: display ? colors.text : colors.textSecondary, fontSize: 15 }}>
                        {display || placeholder}
                    </Text>
                    <Text style={{ fontSize: 16 }}>📅</Text>
                </Pressable>
                {show && (
                    <DateTimePicker
                        value={parsed || new Date()}
                        mode="date"
                        display="calendar"
                        onChange={handleChange}
                        minimumDate={minimumDate}
                        maximumDate={maximumDate}
                    />
                )}
            </View>
        );
    }

    return (
        <View>
            <Pressable onPress={() => setShow(true)} style={{
                borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8,
                padding: 12, marginBottom: 8, backgroundColor: colors.inputBg,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <Text style={{ color: display ? colors.text : colors.textSecondary, fontSize: 15 }}>
                    {display || placeholder}
                </Text>
                <Text style={{ fontSize: 16 }}>📅</Text>
            </Pressable>
            <Modal visible={show} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                            <Pressable onPress={() => setShow(false)}>
                                <Text style={{ color: '#dc2626', fontSize: 16, fontWeight: '600' }}>Cancel</Text>
                            </Pressable>
                            <Pressable onPress={() => setShow(false)}>
                                <Text style={{ color: '#2563eb', fontSize: 16, fontWeight: '600' }}>Done</Text>
                            </Pressable>
                        </View>
                        <DateTimePicker
                            value={parsed || new Date()}
                            mode="date"
                            display="spinner"
                            onChange={handleChange}
                            minimumDate={minimumDate}
                            maximumDate={maximumDate}
                            style={{ height: 200 }}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default DatePicker;
