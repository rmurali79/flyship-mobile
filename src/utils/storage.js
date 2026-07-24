import AsyncStorage from '@react-native-async-storage/async-storage';

export const getToken = () => AsyncStorage.getItem('token');
export const setToken = (token) => AsyncStorage.setItem('token', token);
export const removeToken = () => AsyncStorage.removeItem('token');

export const getUser = async () => {
    const raw = await AsyncStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
};
export const setUser = (user) => AsyncStorage.setItem('user', JSON.stringify(user));
export const removeUser = () => AsyncStorage.removeItem('user');
