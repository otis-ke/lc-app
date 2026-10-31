import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BlogStackParamList } from './types';
import { useScreenOptions } from './navOptions';
import BlogListScreen from '../screens/blog/BlogListScreen';
import BlogDetailScreen from '../screens/blog/BlogDetailScreen';

const Stack = createNativeStackNavigator<BlogStackParamList>();

export function BlogStack() {
  return (
    <Stack.Navigator screenOptions={useScreenOptions()}>
      <Stack.Screen name="BlogList" component={BlogListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BlogDetail" component={BlogDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
