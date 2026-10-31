import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';
import { useScreenOptions } from './navOptions';
import HomeScreen from '../screens/main/HomeScreen';
import ProgramsScreen from '../screens/main/ProgramsScreen';
import EnrollScreen from '../screens/main/EnrollScreen';
import HomeCoachingScreen from '../screens/main/HomeCoachingScreen';
import ContactScreen from '../screens/main/ContactScreen';
import PartnerScreen from '../screens/main/PartnerScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={useScreenOptions()}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Programs" component={ProgramsScreen} options={{ title: 'Programs' }} />
      <Stack.Screen name="Enroll" component={EnrollScreen} options={{ title: 'Enroll Now' }} />
      <Stack.Screen name="HomeCoaching" component={HomeCoachingScreen} options={{ title: 'Home Coaching' }} />
      <Stack.Screen name="Contact" component={ContactScreen} options={{ title: 'Contact Us' }} />
      <Stack.Screen name="Partner" component={PartnerScreen} options={{ title: 'Partner With Us' }} />
    </Stack.Navigator>
  );
}
