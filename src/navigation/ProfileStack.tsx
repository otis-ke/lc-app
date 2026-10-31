import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import { useScreenOptions } from './navOptions';
import ProfileScreen from '../screens/main/ProfileScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={useScreenOptions()}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In' }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Create Account' }} />
      {/* AdminHomeScreen renders its own top bar (with a WebView back/forward-aware
          back button), so the native stack header is hidden here. */}
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
