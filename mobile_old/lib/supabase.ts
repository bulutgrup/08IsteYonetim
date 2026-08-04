import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase Bağlantı Parametreleri
// Expo ortamında geliştirme yaparken kendi Supabase URL ve Anon Key'inizi buraya girin.
const supabaseUrl = 'https://tcigxuhsaizzfukfbtxi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaWd4dWhzYWl6emZ1a2ZidHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDMyODUsImV4cCI6MjA5NTkxOTI4NX0.e5lPqRAwPaIOqFoDtKQIFCj-Q6DXDNWBbZcdmqAd0g0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const isMockMode = () => {
  return process.env.EXPO_PUBLIC_MOCK_MODE === 'true';
};

// Mobil POS Mock Veri Seti
export const mobileMockData = {
  profile: {
    full_name: 'Fatih AKYILDIZ',
    email: 'fatih@isteyonetim.com',
    phone: '+90 532 123 45 67',
    role: 'admin',
    tenant_name: 'Bulut Grup A.Ş.',
    plan_type: 'kobi',
    active_users: 2, // 1-3 KOBİ paketi sınırları içinde
    user_limit: 3
  },
  sales: [
    { id: '1', amount: 99.00, description: 'Simit & Çay POS Satışı', date: '18:15', customer: 'Ahmet Bey' },
    { id: '2', amount: 250.00, description: 'Sipariş #1042 Tahsilatı', date: '17:30', customer: 'Otantik Kumpir' },
    { id: '3', amount: 1200.00, description: 'Teknik Servis Hakedişi', date: '14:20', customer: 'Şampiyon Kokoreç' }
  ],
  stats: {
    dailyTotal: 1549.00,
    dailyCount: 3
  }
};
