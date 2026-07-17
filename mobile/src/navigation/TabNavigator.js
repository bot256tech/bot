import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

import HomeScreen from '../screens/HomeScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import AIAdvisorScreen from '../screens/AIAdvisorScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import PassportScreen from '../screens/PassportScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MarketplaceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MarketplaceList" component={MarketplaceScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: true, title: 'Product Details', headerStyle: { backgroundColor: COLORS.cream }, headerTintColor: COLORS.green }} />
      <Stack.Screen name="Passport" component={PassportScreen} options={{ headerShown: true, title: 'Quality Passport', headerStyle: { backgroundColor: COLORS.cream }, headerTintColor: COLORS.green }} />
    </Stack.Navigator>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Market: focused ? 'storefront' : 'storefront-outline',
            Advisor: focused ? 'chatbubbles' : 'chatbubbles-outline',
            Scan: focused ? 'scan' : 'scan-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.green,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.gray200,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Market" component={MarketplaceStack} />
      <Tab.Screen name="Advisor" component={AIAdvisorScreen} options={{ tabBarLabel: 'AI Advisor' }} />
      <Tab.Screen name="Scan" component={ScannerScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
