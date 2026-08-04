import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/main/DashboardScreen';
import ShipmentDetailsScreen from '../screens/main/ShipmentDetailsScreen';
import CreateShipmentScreen from '../screens/main/CreateShipmentScreen';
import CreateTravelPlanScreen from '../screens/main/CreateTravelPlanScreen';
import { useTheme } from '../context/ThemeContext';
import FlyshipMark from '../components/FlyshipMark';

const Stack = createNativeStackNavigator();

const DashboardStack = () => {
    const { colors, isDark } = useTheme();

    return (
        <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text }}>
            <Stack.Screen
                name="DashboardHome"
                component={DashboardScreen}
                options={{
                    headerTitle: () => (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <FlyshipMark size={22} dark={isDark} />
                            <Text style={{ fontSize: 17, fontWeight: 'bold', color: colors.text }}>Flyship</Text>
                        </View>
                    ),
                }}
            />
            <Stack.Screen name="ShipmentDetails" component={ShipmentDetailsScreen} options={{ title: 'Shipment' }} />
            <Stack.Screen name="CreateShipment" component={CreateShipmentScreen} options={{ title: 'New Shipment' }} />
            <Stack.Screen name="CreateTravelPlan" component={CreateTravelPlanScreen} options={{ title: 'New Travel Plan' }} />
        </Stack.Navigator>
    );
};

export default DashboardStack;
