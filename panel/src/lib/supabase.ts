import { createClient } from '@supabase/supabase-js';

// Supabase Bağlantı Parametreleri
// Ortam değişkenlerinden (environment variables) okunur, yoksa yerel geliştirme için varsayılan değerleri kullanır.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tcigxuhsaizzfukfbtxi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaWd4dWhzYWl6emZ1a2ZidHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDMyODUsImV4cCI6MjA5NTkxOTI4NX0.e5lPqRAwPaIOqFoDtKQIFCj-Q6DXDNWBbZcdmqAd0g0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simülasyon modunda çalışıp çalışmadığımızı kontrol eden yardımcı metot
export const isMockMode = () => {
  return import.meta.env.VITE_MOCK_MODE === 'true';
};

// Mock Veri Seti (Geliştirme ve Test Sürecinde Veritabanı Olmadan Çalışmak İçin)
export const mockData = {
  profile: {
    full_name: 'Fatih AKYILDIZ',
    email: 'fatih@isteyonetim.com',
    phone: '+90 532 123 45 67',
    role: 'admin',
    tenant_name: 'Bulut Grup A.Ş.',
    slug: 'bulut-grup'
  },
  tasks: [
    { id: '1', title: 'Teklif Hazırlanacak', description: 'Otantik Kumpir için teklif dökümanı taslağı hazırlanacak.', status: 'todo', priority: 'high', due_date: '2026-06-05' },
    { id: '2', title: 'Sipariş Listesi Hazırla', description: 'Haziran ayı toptancı siparişleri listelenecek.', status: 'in_progress', priority: 'medium', due_date: '2026-06-10' },
    { id: '3', title: 'Raporları Düzenle', description: 'Mayıs ayı mali raporu Excel çıktısı alınacak.', status: 'done', priority: 'low', due_date: '2026-05-30' }
  ],
  projects: [
    { id: '1', name: 'Web Arayüz Tasarımı', description: 'İşteYönetim web paneli frontend kodlama işi.', status: 'active', start_date: '2026-05-01', end_date: '2026-06-15' },
    { id: '2', name: 'Mobil POS Uygulaması', description: 'React Native & Expo tabanlı POS tablet projesi.', status: 'pending', start_date: '2026-06-10', end_date: '2026-08-30' }
  ],
  customers: [
    { id: '1', company_name: 'Otantik Kumpir', contact_name: 'Ahmet Karaca', email: 'ahmet@otantikkumpir.com', phone: '+90 850 111 22 33', address: 'Maslak, İstanbul' },
    { id: '2', company_name: 'Şampiyon Kokoreç', contact_name: 'Murat Can', email: 'murat@sampiyon.com', phone: '+90 850 444 55 66', address: 'Kadıköy, İstanbul' }
  ],
  finance: [
    { id: '1', type: 'income', category: 'bank', amount: 51642.00, description: 'Haziran Sipariş Tahsilatı', transaction_date: '2026-06-01' },
    { id: '2', type: 'expense', category: 'check', amount: 5354.00, description: 'KDV Ödemesi', transaction_date: '2026-05-28' },
    { id: '3', type: 'income', category: 'invoice', amount: 1642.00, description: 'Teknik Servis Hakedişi', transaction_date: '2026-05-25' }
  ],
  serviceTickets: [
    { id: '5010', customer_name: 'Otantik Kumpir', status: 'unresolved', issue_description: 'Yazıcı bağlantısı koptu, sipariş basılamıyor.', created_at: '2026-06-01' },
    { id: '5013', customer_name: 'Şampiyon Kokoreç', status: 'resolved', issue_description: 'Tablet POS uygulaması donma sorunu giderildi.', created_at: '2026-05-29' }
  ]
};

export const formatTRY = (val: number) => {
  return val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
};

export const addNotification = (title: string, description: string, icon: string, link: string, linkState?: any) => {
  const saved = localStorage.getItem('sb-notifications');
  const notifications = saved ? JSON.parse(saved) : [];
  notifications.unshift({
    id: String(Date.now()),
    title,
    description,
    icon,
    link,
    linkState,
    read: false,
    created_at: new Date().toISOString()
  });
  localStorage.setItem('sb-notifications', JSON.stringify(notifications));
};
