import { Ionicons } from '@expo/vector-icons'; // Expo'nun kendi ikon kütüphanesi
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Üstteki varsayılan başlığı gizler (tasarımı biz yapıyoruz)
        tabBarStyle: { 
          backgroundColor: '#0A0A0A', 
          borderTopWidth: 1,
          borderTopColor: '#222',
          height: 60,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: '#39FF14', // Aktif sekme neon yeşil
        tabBarInactiveTintColor: '#555',  // Pasif sekmeler sönük gri
      }}
    >
      {/* 1. Sekme: Ana Sayfa (Reels) */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Akış',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={26} color={color} />,
        }}
      />
      {/* 2. Sekme: Radar (Harita) */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'Radar',
          tabBarIcon: ({ color }) => <Ionicons name="map" size={26} color={color} />,
        }}
      />
      {/* 3. Sekme: Profil (Kadro) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Kadro',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
