import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { CustomTabBar } from './CustomTabBar';
import { HomeStack } from './HomeStack';
import { ModelsStack } from './ModelsStack';
import { ConnectStack } from './ConnectStack';
import { BlogStack } from './BlogStack';
import { DashboardStack } from './DashboardStack';
import { ProfileStack } from './ProfileStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="ConnectTab" component={ConnectStack} />
      <Tab.Screen name="ModelsTab" component={ModelsStack} />
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="BlogTab" component={BlogStack} />
      <Tab.Screen name="DashboardTab" component={DashboardStack} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} />
    </Tab.Navigator>
  );
}
