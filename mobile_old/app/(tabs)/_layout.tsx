import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#e85c46',
        tabBarInactiveTintColor: '#6a7686',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e7decb',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: '#e7decb',
        },
        headerTitleStyle: {
          fontWeight: '800',
          color: '#14304d',
          fontSize: 18,
        },
      }}>
      
      {/* 1. SEKME: ANA SAYFA (DASHBOARD) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'İş Panosu',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'house.fill',
                android: 'home',
                web: 'home',
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />

      {/* 2. SEKME: MOBİL POS */}
      <Tabs.Screen
        name="pos"
        options={{
          title: 'Hızlı POS',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'creditcard.fill',
                android: 'credit-card',
                web: 'credit-card',
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />

      {/* 3. SEKME: ABONELİK (LİMİTLER) */}
      <Tabs.Screen
        name="billing"
        options={{
          title: 'Abonelik',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'shield.lefthalf.filled',
                android: 'shield',
                web: 'shield',
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />

      {/* Kullanılmayan varsayılan sekmeleri devre dışı bırakıyoruz */}
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
