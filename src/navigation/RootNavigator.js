import React from 'react';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';

const RootNavigator = () => {
    const { user } = useAuth();
    return user ? <AppTabs /> : <AuthStack />;
};

export default RootNavigator;
