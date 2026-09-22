import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ConnectStackParamList } from './types';
import { screenOptions } from './navOptions';
import ConnectHomeScreen from '../screens/connect/ConnectHomeScreen';
import InstructorDetailScreen from '../screens/connect/InstructorDetailScreen';
import BecomeInstructorScreen from '../screens/connect/BecomeInstructorScreen';
import BookTrainingScreen from '../screens/connect/BookTrainingScreen';
import InstructorProfileDetailScreen from '../screens/connect/InstructorProfileDetailScreen';
import SelectSlotScreen from '../screens/connect/SelectSlotScreen';
import BookingConfirmedScreen from '../screens/connect/BookingConfirmedScreen';

const Stack = createNativeStackNavigator<ConnectStackParamList>();

export function ConnectStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ConnectHome" component={ConnectHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="InstructorDetail" component={InstructorDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="BecomeInstructor" component={BecomeInstructorScreen} options={{ title: 'Become an Instructor' }} />
      <Stack.Screen name="BookTraining" component={BookTrainingScreen} options={{ title: 'Book Training' }} />
      <Stack.Screen name="InstructorProfileDetail" component={InstructorProfileDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="SelectSlot" component={SelectSlotScreen} options={{ title: 'Book a Slot' }} />
      <Stack.Screen name="BookingConfirmed" component={BookingConfirmedScreen} options={{ title: '', headerBackVisible: false }} />
    </Stack.Navigator>
  );
}
