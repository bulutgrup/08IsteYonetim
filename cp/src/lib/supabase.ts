import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tcigxuhsaizzfukfbtxi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaWd4dWhzYWl6emZ1a2ZidHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDMyODUsImV4cCI6MjA5NTkxOTI4NX0.e5lPqRAwPaIOqFoDtKQIFCj-Q6DXDNWBbZcdmqAd0g0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isMockMode = () => {
  return import.meta.env.VITE_MOCK_MODE === 'true';
};

// CP için Kapsamlı Mock Veri Seti
export const cpMockData = {
  tenants: [
    { 
      id: '1', 
      name: 'Otantik Kumpir', 
      slug: 'otantikkumpir', 
      owner_name: 'Ahmet Karaca', 
      owner_email: 'ahmet@otantikkumpir.com',
      owner_phone: '+90 532 111 22 33',
      city: 'İstanbul',
      status: 'active', 
      plan_type: 'kobi', 
      billing_cycle: 'monthly', 
      subscription_ends_at: '2026-07-28T12:00:00Z', 
      gift_months: 2,
      active_users: 3,
      created_at: '2026-05-01T10:00:00Z'
    },
    { 
      id: '2', 
      name: 'Şampiyon Kokoreç', 
      slug: 'sampiyon', 
      owner_name: 'Murat Can', 
      owner_email: 'murat@sampiyon.com',
      owner_phone: '+90 533 444 55 66',
      city: 'Ankara',
      status: 'active', 
      plan_type: 'profesyonel', 
      billing_cycle: 'yearly', 
      subscription_ends_at: '2027-05-20T12:00:00Z', 
      gift_months: 0,
      active_users: 8,
      created_at: '2026-05-20T11:30:00Z'
    },
    { 
      id: '3', 
      name: 'Bulut Yapı Sanayi', 
      slug: 'bulutyapi', 
      owner_name: 'Selim Bulut', 
      owner_email: 'selim@bulutyapi.com',
      owner_phone: '+90 544 999 88 77',
      city: 'İzmir',
      status: 'trial', 
      plan_type: 'kobi', 
      billing_cycle: 'monthly', 
      subscription_ends_at: '2026-06-25T12:00:00Z', 
      gift_months: 0,
      active_users: 1,
      created_at: '2026-06-01T09:00:00Z'
    }
  ],
  stats: {
    totalTenants: 3,
    activeTenants: 2,
    trialTenants: 1,
    totalMonthlyRevenue: 798.00 // 299 KOBİ + 499 Profesyonel
  },
  
  // İyzipay Abonelik Ödemeleri
  iyzico_payments: [
    { id: 'iyz-998877', tenant_id: '1', amount: 299, status: 'success', method: 'Kredi Kartı', date: '2026-05-01T10:00:00Z', plan_type: 'kobi', billing_cycle: 'monthly' },
    { id: 'iyz-445566', tenant_id: '2', amount: 4999, status: 'success', method: 'Kredi Kartı', date: '2026-05-20T11:30:00Z', plan_type: 'profesyonel', billing_cycle: 'yearly' },
    { id: 'iyz-112233', tenant_id: '1', amount: 299, status: 'success', method: 'Kredi Kartı', date: '2026-06-01T12:00:00Z', plan_type: 'kobi', billing_cycle: 'monthly' }
  ],

  // 1. Projeler Mocks
  projects: [
    { id: 'p1', tenant_id: '1', name: 'Mobil Sipariş Arayüzü', description: 'Müşterilerin masadan sipariş verebileceği web arayüzü', status: 'active', start_date: '2026-05-10', end_date: '2026-06-30' },
    { id: 'p2', tenant_id: '1', name: 'QR Menü Tasarımı', description: 'Masalar için QR kodlu menülerin tasarımı ve basımı', status: 'completed', start_date: '2026-05-01', end_date: '2026-05-20' },
    { id: 'p3', tenant_id: '2', name: 'Yeni Şube Altyapısı', description: 'Beşiktaş şubesi ağ ve POS altyapısı kurulumu', status: 'active', start_date: '2026-06-01', end_date: '2026-07-15' },
    { id: 'p4', tenant_id: '3', name: 'Katalog Web Sitesi', description: 'Şirket ürünlerinin sergileneceği web sitesi', status: 'pending', start_date: '2026-06-15', end_date: '2026-07-30' }
  ],

  // 2. Görevler Mocks
  tasks: [
    { id: 't1', tenant_id: '1', project_id: 'p1', title: 'Veritabanı Şeması Tasarla', description: 'Siparişler tablosunun hazırlanması', assigned_to: 'Ahmet Karaca', status: 'done', priority: 'high', due_date: '2026-05-15' },
    { id: 't2', tenant_id: '1', project_id: 'p1', title: 'API Uç Noktalarını Yaz', description: 'Node.js Express rotalarının yazılması', assigned_to: 'Mehmet Yılmaz', status: 'in_progress', priority: 'medium', due_date: '2026-06-25' },
    { id: 't3', tenant_id: '2', project_id: 'p3', title: 'Kablolama ve Access Point kurulumu', description: 'Şube içi kabloların çekilmesi', assigned_to: 'Murat Can', status: 'todo', priority: 'high', due_date: '2026-06-20' },
    { id: 't4', tenant_id: '3', project_id: 'p4', title: 'Tasarım Şablonunu Seç', description: 'Müşteri onayı için 3 farklı tasarım seçilmesi', assigned_to: 'Selim Bulut', status: 'todo', priority: 'low', due_date: '2026-06-18' }
  ],

  // 3. Teklifler Mocks
  offers: [
    { id: 'o1', tenant_id: '1', title: 'Catering Hizmet Paketi', customer_name: 'Dilek Pastaneleri', amount: 45000, status: 'accepted', created_at: '2026-05-05T09:00:00Z' },
    { id: 'o2', tenant_id: '1', title: 'Düğün Menü Teklifi', customer_name: 'Hilton Otel', amount: 120000, status: 'sent', created_at: '2026-06-02T14:30:00Z' },
    { id: 'o3', tenant_id: '2', title: 'Grup Menü Anlaşması', customer_name: 'Gazi Üniversitesi', amount: 35000, status: 'draft', created_at: '2026-06-10T11:00:00Z' }
  ],

  // 4. Müşteriler Mocks
  customers: [
    { id: 'c1', tenant_id: '1', company_name: 'Dilek Pastaneleri', contact_name: 'Hasan Dilek', email: 'hasan@dilek.com', phone: '+90 532 999 88 77', address: 'Kadıköy, İstanbul' },
    { id: 'c2', tenant_id: '1', company_name: 'Hilton Otel Ankara', contact_name: 'Aylin Çelik', email: 'aylin@hilton.com', phone: '+90 312 888 77 66', address: 'GOP, Ankara' },
    { id: 'c3', tenant_id: '2', company_name: 'Gazi Üniversitesi Rek.', contact_name: 'Kemal Yılmaz', email: 'kemal@gazi.edu.tr', phone: '+90 312 777 66 55', address: 'Beşevler, Ankara' }
  ],

  // 5. Finans Hareketleri Mocks
  finance_transactions: [
    { id: 'ft1', tenant_id: '1', type: 'income', category: 'bank', amount: 15000, description: 'Dilek Pastaneleri Kumpir Satış Bedeli', transaction_date: '2026-05-25' },
    { id: 'ft2', tenant_id: '1', type: 'expense', category: 'invoice', amount: 4500, description: 'Elektrik & Su Faturaları', transaction_date: '2026-05-28' },
    { id: 'ft3', tenant_id: '2', type: 'income', category: 'cash', amount: 12800, description: 'Kokoreç Satış Günlük Z Raporu', transaction_date: '2026-06-12' },
    { id: 'ft4', tenant_id: '2', type: 'expense', category: 'check', amount: 6000, description: 'Toptancı Tursu Alımı Ödemesi', transaction_date: '2026-06-14' }
  ]
};
