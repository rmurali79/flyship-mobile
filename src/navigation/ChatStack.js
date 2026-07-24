import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConversationsScreen from '../screens/main/ConversationsScreen';
import ChatScreen from '../screens/main/ChatScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator();

const ChatStack = () => {
    const { colors } = useTheme();

    return (
        <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text }}>
            <Stack.Screen name="Conversations" component={ConversationsScreen} options={{ title: 'Messages' }} />
            <Stack.Screen name="ChatRoom" component={ChatScreen} options={{ title: 'Chat' }} />
        </Stack.Navigator>
    );
};

export default ChatStack;
