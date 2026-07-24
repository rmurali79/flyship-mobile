import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/main/DashboardScreen';
import ShipmentDetailsScreen from '../screens/main/ShipmentDetailsScreen';
import CreateShipmentScreen from '../screens/main/CreateShipmentScreen';
import CreateTravelPlanScreen from '../screens/main/CreateTravelPlanScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator();

const DashboardStack = () => {
    const { colors } = useTheme();

    return (
        <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text }}>
            <Stack.Screen name="DashboardHome" component={DashboardScreen} options={{ title: 'JetRunner' }} />
            <Stack.Screen name="ShipmentDetails" component={ShipmentDetailsScreen} options={{ title: 'Shipment' }} />
            <Stack.Screen name="CreateShipment" component={CreateShipmentScreen} options={{ title: 'New Shipment' }} />
            <Stack.Screen name="CreateTravelPlan" component={CreateTravelPlanScreen} options={{ title: 'New Travel Plan' }} />
        </Stack.Navigator>
    );
};

export default DashboardStack;
