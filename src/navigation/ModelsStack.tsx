import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ModelsStackParamList } from './types';
import { useScreenOptions } from './navOptions';
import ModelsHubScreen from '../screens/models/ModelsHubScreen';
import ModelDetailScreen from '../screens/models/ModelDetailScreen';
import GetScoutedScreen from '../screens/models/GetScoutedScreen';
import BookModelScreen from '../screens/models/BookModelScreen';
import OnlineClassSignupScreen from '../screens/models/OnlineClassSignupScreen';

const Stack = createNativeStackNavigator<ModelsStackParamList>();

export function ModelsStack() {
  return (
    <Stack.Navigator screenOptions={useScreenOptions()}>
      <Stack.Screen name="ModelsHub" component={ModelsHubScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ModelDetail" component={ModelDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="GetScouted" component={GetScoutedScreen} options={{ title: 'Get Scouted' }} />
      <Stack.Screen name="BookModel" component={BookModelScreen} options={{ title: 'Book a Model' }} />
      <Stack.Screen name="OnlineClassSignup" component={OnlineClassSignupScreen} options={{ title: 'Online Classes' }} />
    </Stack.Navigator>
  );
}
