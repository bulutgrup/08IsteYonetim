import React, { useEffect, useState } from 'react';
import { supabase, isMockMode, cpMockData } from './lib/supabase';

export const App: React.FC = () => {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Navigation state
  const [activeView, setActiveView] = useState<'dashboard' | 'tenants' | 'transactions' | 'support' | 'settings' | 'tenant-detail'>('dashboard');
  
  // Data states
  const [tenants, setTenants] = useState<any[]>([]);
  const [iyzicoPayments, setIyzicoPayments] = useState<any[]>([]);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'suspended'>('all');
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

  // Gift modal states
  const [giftTenant, setGiftTenant] = useState<any>(null);
  const [giftMonths, setGiftMonths] = useState<number>(3);
  const [giftModalOpen, setGiftModalOpen] = useState(false);

  // Tenant detail view states
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'projects' | 'tasks' | 'offers' | 'customers' | 'finance'>('projects');
  
  // Tenant detail sub-data
  const [tenantProjects, setTenantProjects] = useState<any[]>([]);
  const [tenantTasks, setTenantTasks] = useState<any[]>([]);
  const [tenantOffers, setTenantOffers] = useState<any[]>([]);
  const [tenantCustomers, setTenantCustomers] = useState<any[]>([]);
  const [tenantTransactions, setTenantTransactions] = useState<any[]>([]);

  // Check login on mount
  useEffect(() => {
    const checkUser = async () => {
      const savedEmail = localStorage.getItem('cp-logged-in-admin-email');
      if (savedEmail && (savedEmail === 'admin@bulutgrup.tr' || savedEmail === 'root@bulutgrup.tr')) {
        setIsLoggedIn(true);
        setAdminEmail(savedEmail);
        return;
      }

      if (!isMockMode()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email && (user.email === 'admin@bulutgrup.tr' || user.email === 'root@bulutgrup.tr')) {
          setIsLoggedIn(true);
          setAdminEmail(user.email);
        }
      }
    };
    checkUser();
  }, []);

  // Fetch all core data
  const fetchData = async () => {
    setLoading(true);
    
    // 1. Fetch Tenants
    if (isMockMode()) {
      const savedTenants = localStorage.getItem('sb-mock-tenants');
      if (savedTenants) {
        setTenants(JSON.parse(savedTenants));
      } else {
        setTenants(cpMockData.tenants);
        localStorage.setItem('sb-mock-tenants', JSON.stringify(cpMockData.tenants));
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setTenants(data || []);
      } catch (e) {
        console.error("Tenant listesi yüklenemedi:", e);
      }
    }

    // 2. Fetch iyzico payments
    if (isMockMode()) {
      const savedPayments = localStorage.getItem('sb-mock-iyzico-payments');
      if (savedPayments) {
        setIyzicoPayments(JSON.parse(savedPayments));
      } else {
        setIyzicoPayments(cpMockData.iyzico_payments);
        localStorage.setItem('sb-mock-iyzico-payments', JSON.stringify(cpMockData.iyzico_payments));
      }
    } else {
      try {
        // Not: finance_transactions tablosunda iyzico ödemeleri de tutulabiliyorsa çekilir,
        // yoksa genel bir işlem geçmişi veya mock veri ile desteklenir.
        const { data, error } = await supabase
          .from('finance_transactions')
          .select('*')
          .eq('category', 'invoice')
          .order('transaction_date', { ascending: false });
        if (error) throw error;
        setIyzicoPayments(data || []);
      } catch (e) {
        console.error("iyzico ödemeleri yüklenemedi:", e);
      }
    }

    // 3. Fetch Support Requests
    if (isMockMode()) {
      const savedMessages = localStorage.getItem('sb-support-messages');
      if (savedMessages) {
        setSupportMessages(JSON.parse(savedMessages));
      } else {
        setSupportMessages([]);
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*, profiles(full_name, email), tenants(name)')
          .is('receiver_id', null)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setSupportMessages(data || []);
      } catch (e) {
        console.error("Destek talepleri yüklenemedi:", e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  // Fetch tenant-specific detailed data
  const fetchTenantDetails = async (tenantId: string) => {
    if (isMockMode()) {
      setTenantProjects(cpMockData.projects.filter(p => p.tenant_id === tenantId));
      setTenantTasks(cpMockData.tasks.filter(t => t.tenant_id === tenantId));
      setTenantOffers(cpMockData.offers.filter(o => o.tenant_id === tenantId));
      setTenantCustomers(cpMockData.customers.filter(c => c.tenant_id === tenantId));
      setTenantTransactions(cpMockData.finance_transactions.filter(f => f.tenant_id === tenantId));
    } else {
      try {
        const [projRes, taskRes, offerRes, custRes, finRes] = await Promise.all([
          supabase.from('projects').select('*').eq('tenant_id', tenantId),
          supabase.from('tasks').select('*').eq('tenant_id', tenantId),
          supabase.from('offers').select('*').eq('tenant_id', tenantId),
          supabase.from('customers').select('*').eq('tenant_id', tenantId),
          supabase.from('finance_transactions').select('*').eq('tenant_id', tenantId)
        ]);
        
        setTenantProjects(projRes.data || []);
        setTenantTasks(taskRes.data || []);
        setTenantOffers(offerRes.data || []);
        setTenantCustomers(custRes.data || []);
        setTenantTransactions(finRes.data || []);
      } catch (e) {
        console.error("İşletme detayları Supabase'den çekilemedi:", e);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    // Strict admin authorization checks
    const targetEmail = loginEmail.trim().toLowerCase();
    if (targetEmail !== 'admin@bulutgrup.tr' && targetEmail !== 'root@bulutgrup.tr') {
      setLoginError('Hatalı giriş yetkisi. Bu panele sadece admin@bulutgrup.tr veya root@bulutgrup.tr erişebilir.');
      return;
    }

    setLoginLoading(true);
    if (isMockMode()) {
      // Simulation mode
      localStorage.setItem('cp-logged-in-admin-email', targetEmail);
      setAdminEmail(targetEmail);
      setIsLoggedIn(true);
      setLoginLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: loginPassword
      });

      if (error) throw error;

      if (data.user && data.user.email === targetEmail) {
        localStorage.setItem('cp-logged-in-admin-email', targetEmail);
        setAdminEmail(targetEmail);
        setIsLoggedIn(true);
      } else {
        await supabase.auth.signOut();
        setLoginError('Bu hesaba erişim yetkiniz bulunmamaktadır.');
      }
    } catch (e: any) {
      setLoginError(e.message || 'Giriş yapılırken bir hata oluştu.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('cp-logged-in-admin-email');
    setIsLoggedIn(false);
    setAdminEmail('');
    if (!isMockMode()) {
      await supabase.auth.signOut();
    }
  };

  const handleStatusChange = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    
    if (isMockMode()) {
      const updated = tenants.map(t => t.id === tenantId ? { ...t, status: newStatus } : t);
      setTenants(updated);
      localStorage.setItem('sb-mock-tenants', JSON.stringify(updated));
      return;
    }

    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: newStatus })
        .eq('id', tenantId);
      if (error) throw error;
      fetchData();
    } catch (e) {
      console.error("İşletme durumu güncellenirken hata:", e);
    }
  };

  const handleAddGift = async () => {
    if (!giftTenant) return;
    
    const tenantId = giftTenant.id;
    const currentEndsAt = new Date(giftTenant.subscription_ends_at || new Date());
    
    // Add gift months to target subscription expiration date
    currentEndsAt.setMonth(currentEndsAt.getMonth() + giftMonths);
    const newEndsAtISO = currentEndsAt.toISOString();
    const newGiftTotal = (giftTenant.gift_months || 0) + giftMonths;

    if (isMockMode()) {
      const updated = tenants.map(t => t.id === tenantId ? { 
        ...t, 
        subscription_ends_at: newEndsAtISO, 
        gift_months: newGiftTotal,
        status: t.status === 'suspended' ? 'active' : t.status
      } : t);
      setTenants(updated);
      localStorage.setItem('sb-mock-tenants', JSON.stringify(updated));
      setGiftModalOpen(false);
      setGiftTenant(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('tenants')
        .update({ 
          subscription_ends_at: newEndsAtISO,
          gift_months: newGiftTotal,
          status: giftTenant.status === 'suspended' ? 'active' : giftTenant.status
        })
        .eq('id', tenantId);

      if (error) throw error;
      setGiftModalOpen(false);
      setGiftTenant(null);
      fetchData();
    } catch (e) {
      console.error("Hediye ay tanımlanırken hata oluştu:", e);
    }
  };

  const handleDeleteSupport = async (msgId: string) => {
    if (!window.confirm("Bu destek talebini kapatıp silmek istediğinizden emin misiniz?")) return;
    
    if (isMockMode()) {
      const saved = localStorage.getItem('sb-support-messages');
      const current = saved ? JSON.parse(saved) : [];
      const updated = current.filter((m: any) => m.id !== msgId);
      setSupportMessages(updated);
      localStorage.setItem('sb-support-messages', JSON.stringify(updated));
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', msgId);
      if (error) throw error;
      fetchData();
    } catch (e) {
      console.error("Destek talebi silinemedi:", e);
    }
  };

  // Calculations for stats
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'active').length;
  
  // Calculate dynamic Monthly Recurring Revenue (MRR)
  const monthlyRevenue = tenants.reduce((acc, t) => {
    if (t.status !== 'active') return acc;
    // kobi = 299 TL, profesyonel = 499 TL, kurumsal = 999 TL
    let price = 299;
    if (t.plan_type === 'profesyonel') price = 499;
    else if (t.plan_type === 'kurumsal') price = 999;

    // Yıllık ise aylık oranını alalım
    if (t.billing_cycle === 'yearly') {
      price = Math.round(price * 10 / 12); // Yıllık pakette 2 ay hediye düştüğümüz için
    }
    return acc + price;
  }, 0);

  // Toplam ödeme tutarı (iyzico payments sum)
  const totalPaymentsAmount = iyzicoPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  // Expiring in 30 days
  const expiringTenants = tenants.filter(t => {
    if (t.status === 'suspended') return false;
    const diff = new Date(t.subscription_ends_at).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 30;
  }).map(t => {
    const diff = new Date(t.subscription_ends_at).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return { ...t, daysLeft: days };
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  // Render Functions

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f6f8 0%, #dce3eb 100%)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}>
        <form onSubmit={handleLogin} style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '45px 40px',
          width: '430px',
          boxShadow: '0 15px 35px rgba(20, 27, 38, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e2e8f0'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px', justifyContent: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '11px',
              background: '#2A6FDB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '800',
              fontSize: '18px',
              boxShadow: '0 4px 12px rgba(42,111,219,.32)'
            }}>CP</div>
            <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
              <div style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '-0.4px', color: '#1A1D23' }}>İşteYönetim</div>
              <div style={{ fontSize: '12px', color: '#8A929E', fontWeight: '600' }}>Merkezi Yönetim Konsolu</div>
            </div>
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1D23', marginBottom: '8px', textAlign: 'center' }}>Yönetici Girişi</h3>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px', textAlign: 'center', lineHeight: '1.5' }}>
            Yetkisiz erişimler güvenlik nedeniyle kaydedilmektedir.
          </p>

          {loginError && (
            <div style={{
              background: '#FDF2F2',
              border: '1px solid #F8D7DA',
              borderRadius: '10px',
              padding: '12px 14px',
              color: '#D8000C',
              fontSize: '12.5px',
              lineHeight: '1.5',
              marginBottom: '20px',
              fontWeight: '500'
            }}>
              {loginError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#46505C', marginBottom: '6px' }}>E-posta Adresi</label>
              <input 
                type="email" 
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@bulutgrup.tr"
                style={{
                  width: '100%',
                  height: '42px',
                  border: '1px solid #E2E5EA',
                  borderRadius: '10px',
                  padding: '0 14px',
                  fontSize: '14px',
                  color: '#1A1D23',
                  outline: 'none',
                  background: '#F9FAFB'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#46505C', marginBottom: '6px' }}>Parola</label>
              <input 
                type="password" 
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  height: '42px',
                  border: '1px solid #E2E5EA',
                  borderRadius: '10px',
                  padding: '0 14px',
                  fontSize: '14px',
                  color: '#1A1D23',
                  outline: 'none',
                  background: '#F9FAFB'
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loginLoading}
              style={{
                background: '#2A6FDB',
                border: 'none',
                height: '45px',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                marginTop: '10px',
                boxShadow: '0 4px 10px rgba(42,111,219,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {loginLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Get active navigation labels
  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Genel Bakış';
      case 'tenants': return 'İşletmeler';
      case 'transactions': return 'İşlem Kayıtları';
      case 'support': return 'Destek Talepleri';
      case 'settings': return 'Ayarlar';
      case 'tenant-detail': return `İşletme Detayı: ${selectedTenant?.name || ''}`;
      default: return 'CP Panel';
    }
  };

  const getViewSubtitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Sistem genel durum, üyelikler ve son ödeme hacmi';
      case 'tenants': return 'Kayıtlı KOBİ/Profesyonel işletmeler ve abonelik yönetimi';
      case 'transactions': return 'iyzico ile tahsil edilen lisans ödemelerinin kayıtları';
      case 'support': return 'İşletmelerden iletilen teknik destek talepleri';
      case 'settings': return 'Yönetici tercihleri, güvenlik ayarları ve personel listesi';
      case 'tenant-detail': return 'İşletmeye ait projeler, görevler, teklifler, müşteriler ve finans verileri';
      default: return 'Yönetici konsolu';
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: '#F5F6F8' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '252px', flexShrink: 0, background: '#fff', borderRight: '1px solid #E7E9ED', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Sidebar Header Logo */}
        <div style={{ padding: '22px 22px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            background: '#2A6FDB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '800',
            fontSize: '17px',
            letterSpacing: '-.5px',
            boxShadow: '0 4px 12px rgba(42,111,219,.32)'
          }}>CP</div>
          <div style={{ lineHeight: '1.15' }}>
            <div style={{ fontWeight: '800', fontSize: '15.5px', letterSpacing: '-.3px', color: '#1A1D23' }}>İşteYönetim</div>
            <div style={{ fontSize: '11.5px', color: '#8A929E', fontWeight: '500' }}>Yönetim Konsolu</div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div style={{ padding: '6px 14px', fontSize: '10.5px', fontWeight: '700', color: '#A4ABB5', letterSpacing: '.8px', textTransform: 'uppercase', marginTop: '6px' }}>Menü</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 12px' }}>
          
          <button 
            onClick={() => setActiveView('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              border: 'none',
              padding: '9px 12px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: '0.2s',
              textAlign: 'left',
              background: activeView === 'dashboard' ? '#EAF1FC' : 'transparent',
              color: activeView === 'dashboard' ? '#2A6FDB' : '#46505C'
            }}
          >
            <span className="material-symbols-outlined material-icons-valign" style={{ fontSize: '21px', color: activeView === 'dashboard' ? '#2A6FDB' : '#6B7280' }}>dashboard</span>
            <span style={{ flex: 1 }}>Genel Bakış</span>
          </button>

          <button 
            onClick={() => setActiveView('tenants')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              border: 'none',
              padding: '9px 12px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: '0.2s',
              textAlign: 'left',
              background: activeView === 'tenants' || activeView === 'tenant-detail' ? '#EAF1FC' : 'transparent',
              color: activeView === 'tenants' || activeView === 'tenant-detail' ? '#2A6FDB' : '#46505C'
            }}
          >
            <span className="material-symbols-outlined material-icons-valign" style={{ fontSize: '21px', color: activeView === 'tenants' || activeView === 'tenant-detail' ? '#2A6FDB' : '#6B7280' }}>business</span>
            <span style={{ flex: 1 }}>İşletmeler</span>
            <span style={{ background: '#F0F1F4', color: '#46505C', fontSize: '11px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px' }}>{tenants.length}</span>
          </button>

          <button 
            onClick={() => setActiveView('transactions')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              border: 'none',
              padding: '9px 12px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: '0.2s',
              textAlign: 'left',
              background: activeView === 'transactions' ? '#EAF1FC' : 'transparent',
              color: activeView === 'transactions' ? '#2A6FDB' : '#46505C'
            }}
          >
            <span className="material-symbols-outlined material-icons-valign" style={{ fontSize: '21px', color: activeView === 'transactions' ? '#2A6FDB' : '#6B7280' }}>receipt_long</span>
            <span style={{ flex: 1 }}>İşlem Kayıtları</span>
          </button>

          <button 
            onClick={() => setActiveView('support')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              border: 'none',
              padding: '9px 12px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: '0.2s',
              textAlign: 'left',
              background: activeView === 'support' ? '#EAF1FC' : 'transparent',
              color: activeView === 'support' ? '#2A6FDB' : '#46505C'
            }}
          >
            <span className="material-symbols-outlined material-icons-valign" style={{ fontSize: '21px', color: activeView === 'support' ? '#2A6FDB' : '#6B7280' }}>support_agent</span>
            <span style={{ flex: 1 }}>Destek Talepleri</span>
            {supportMessages.length > 0 && (
              <span style={{ background: '#FDE8E8', color: '#E5484D', fontSize: '11px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px' }}>{supportMessages.length}</span>
            )}
          </button>

          <button 
            onClick={() => setActiveView('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              border: 'none',
              padding: '9px 12px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: '0.2s',
              textAlign: 'left',
              background: activeView === 'settings' ? '#EAF1FC' : 'transparent',
              color: activeView === 'settings' ? '#2A6FDB' : '#46505C'
            }}
          >
            <span className="material-symbols-outlined material-icons-valign" style={{ fontSize: '21px', color: activeView === 'settings' ? '#2A6FDB' : '#6B7280' }}>settings</span>
            <span style={{ flex: 1 }}>Ayarlar</span>
          </button>

        </nav>

        {/* System Status Box */}
        <div style={{ marginTop: 'auto', padding: '14px' }}>
          <div style={{ background: 'linear-gradient(150deg,#F0F5FE,#EAF1FC)', border: '1px solid #DCE7F8', borderRadius: '14px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '8px' }}>
              <span className="material-symbols-outlined material-icons-valign" style={{ fontSize: '19px', color: '#2A6FDB' }}>shield_person</span>
              <span style={{ fontWeight: '700', fontSize: '13px', color: '#1A1D23' }}>Sistem Durumu</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: '#46505C' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#1F8A5B',
                boxShadow: '0 0 0 3px rgba(31,138,91,.16)',
                display: 'inline-block'
              }}></span>
              Tüm servisler çalışıyor
            </div>
          </div>

          {/* Active Admin Info & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 6px 4px', marginTop: '10px', borderTop: '1px solid #F0F1F4' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#1A1D23',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '13px',
              flexShrink: 0
            }}>
              {adminEmail === 'admin@bulutgrup.tr' ? 'AD' : 'RT'}
            </div>
            <div style={{ lineHeight: '1.2', flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#1A1D23' }}>
                {adminEmail === 'admin@bulutgrup.tr' ? 'Bulut Admin' : 'Root Yetkilisi'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#8A929E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminEmail}</div>
            </div>
            <button 
              onClick={handleLogout}
              title="Çıkış Yap"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#A4ABB5' }}>logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
        
        {/* HEADER */}
        <header style={{ height: '66px', flexShrink: 0, borderBottom: '1px solid #E7E9ED', background: '#fff', display: 'flex', alignItems: 'center', gap: '18px', padding: '0 26px' }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '-.4px', color: '#1A1D23' }}>{getViewTitle()}</div>
            <div style={{ fontSize: '12px', color: '#8A929E', fontWeight: '500' }}>{getViewSubtitle()}</div>
          </div>
          
          <div style={{ flex: 1, maxWidth: '420px', marginLeft: '14px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '19px', color: '#9AA1AC', position: 'absolute', left: '12px' }}>search</span>
            <input 
              placeholder="İşletme, ödeme veya destek ara..." 
              value={activeView === 'transactions' ? txSearchQuery : searchQuery}
              onChange={(e) => {
                if (activeView === 'transactions') {
                  setTxSearchQuery(e.target.value);
                } else {
                  setSearchQuery(e.target.value);
                }
              }}
              style={{
                width: '100%',
                height: '40px',
                border: '1px solid #E2E5EA',
                borderRadius: '10px',
                background: '#F7F8FA',
                padding: '0 14px 0 38px',
                fontSize: '13.5px',
                color: '#1A1D23',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button style={{ height: '40px', padding: '0 14px', border: '1px solid #E2E5EA', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#46505C', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6B7280' }}>calendar_today</span>
              Haziran 2026
            </button>
            <button style={{ width: '40px', height: '40px', border: '1px solid #E2E5EA', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#46505C', margin: '0 auto' }}>notifications</span>
              <span style={{ position: 'absolute', top: '9px', right: '10px', width: '7px', height: '7px', borderRadius: '50%', background: '#E5484D', border: '1.5px solid #fff' }}></span>
            </button>
          </div>
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '26px' }}>

          {/* ===================== VIEW: GENEL BAKIŞ (DASHBOARD) ===================== */}
          {activeView === 'dashboard' && (
            <div style={{ maxWidth: '1320px', animation: 'fadeUp 0.3s ease both' }}>
              {/* KPI DURUM KARTLARI */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
                
                {/* KPI: Toplam İşletme */}
                <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '16px', padding: '18px 18px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EBF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '23px', color: '#2A6FDB' }}>business</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12.5px', fontWeight: '700', color: '#1F8A5B', background: '#E8F5E9', padding: '3px 8px', borderRadius: '20px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>trending_up</span>+%12
                    </div>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-.8px', marginTop: '14px', color: '#1A1D23' }}>{totalTenants}</div>
                  <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginTop: '1px' }}>Toplam İşletme</div>
                  <div style={{ fontSize: '11.5px', color: '#9AA1AC', marginTop: '8px', paddingTop: '9px', borderTop: '1px solid #F0F1F4' }}>Kaydolmuş tüm multi-tenant şirketleri</div>
                </div>

                {/* KPI: Aktif Üye */}
                <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '16px', padding: '18px 18px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '23px', color: '#1F8A5B' }}>check_circle</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12.5px', fontWeight: '700', color: '#1F8A5B', background: '#E8F5E9', padding: '3px 8px', borderRadius: '20px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>trending_up</span>+%8
                    </div>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-.8px', marginTop: '14px', color: '#1A1D23' }}>{activeTenants}</div>
                  <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginTop: '1px' }}>Aktif Üye Sayısı</div>
                  <div style={{ fontSize: '11.5px', color: '#9AA1AC', marginTop: '8px', paddingTop: '9px', borderTop: '1px solid #F0F1F4' }}>Abonelik süresi devam eden şirketler</div>
                </div>

                {/* KPI: Aylık Gelir */}
                <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '16px', padding: '18px 18px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '23px', color: '#E65100' }}>payments</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12.5px', fontWeight: '700', color: '#1F8A5B', background: '#E8F5E9', padding: '3px 8px', borderRadius: '20px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>trending_up</span>+%24
                    </div>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-.8px', marginTop: '14px', color: '#1A1D23' }}>{monthlyRevenue.toLocaleString('tr-TR')} ₺</div>
                  <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginTop: '1px' }}>Aylık Gelir (MRR)</div>
                  <div style={{ fontSize: '11.5px', color: '#9AA1AC', marginTop: '8px', paddingTop: '9px', borderTop: '1px solid #F0F1F4' }}>Aktif paketlerden elde edilen aylık ciro</div>
                </div>

                {/* KPI: Toplam Ödeme */}
                <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '16px', padding: '18px 18px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#F3E5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '23px', color: '#7B1FA2' }}>account_balance_wallet</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12.5px', fontWeight: '700', color: '#1F8A5B', background: '#E8F5E9', padding: '3px 8px', borderRadius: '20px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>trending_up</span>+%38
                    </div>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-.8px', marginTop: '14px', color: '#1A1D23' }}>{totalPaymentsAmount.toLocaleString('tr-TR')} ₺</div>
                  <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginTop: '1px' }}>Toplam Ödeme Rakamı</div>
                  <div style={{ fontSize: '11.5px', color: '#9AA1AC', marginTop: '8px', paddingTop: '9px', borderTop: '1px solid #F0F1F4' }}>iyzico ile tahsil edilen toplam ciro</div>
                </div>

              </div>

              {/* SECOND ROW: GELİR GRAPH & HEDİYE DAĞITIMI */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.65fr 1fr', gap: '16px', marginTop: '16px' }}>
                
                {/* Gelir Grafiği Card */}
                <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#1A1D23' }}>Gelir Trendi</div>
                      <div style={{ fontSize: '12px', color: '#8A929E' }}>Son 6 ay · iyzico üzerinden alınan ödemeler</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-.5px', color: '#1A1D23' }}>{totalPaymentsAmount.toLocaleString('tr-TR')} ₺</div>
                      <div style={{ fontSize: '12px', color: '#1F8A5B', fontWeight: '700' }}>↑ %38 yıllık artış</div>
                    </div>
                  </div>
                  
                  {/* Dynamic SVG Area & Line Chart */}
                  <div style={{ width: '100%', height: '236px', marginTop: '8px' }}>
                    <svg viewBox="0 0 760 240" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                      <defs>
                        <linearGradient id="revg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2A6FDB" stopOpacity="0.20"></stop>
                          <stop offset="100%" stopColor="#2A6FDB" stopOpacity="0"></stop>
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="52" x2="760" y2="52" stroke="#EEF0F3" strokeWidth="1"></line>
                      <line x1="0" y1="104" x2="760" y2="104" stroke="#EEF0F3" strokeWidth="1"></line>
                      <line x1="0" y1="156" x2="760" y2="156" stroke="#EEF0F3" strokeWidth="1"></line>
                      <line x1="0" y1="208" x2="760" y2="208" stroke="#EEF0F3" strokeWidth="1"></line>
                      
                      {/* Area Fill path (drawn dynamically based on monthly iyzico data) */}
                      <path d="M 10 208 L 10 200 L 150 180 L 300 190 L 450 160 L 600 50 L 750 40 L 750 208 Z" fill="url(#revg)"></path>
                      
                      {/* Line path */}
                      <path d="M 10 200 L 150 180 L 300 190 L 450 160 L 600 50 L 750 40" fill="none" stroke="#2A6FDB" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"></path>
                    </svg>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    {['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'].map((m) => (
                      <span key={m} style={{ fontSize: '11px', color: '#A4ABB5', fontWeight: '600' }}>{m}</span>
                    ))}
                  </div>
                </div>

                {/* Hediye Dağıtımı Card */}
                <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#1A1D23' }}>Hediye Verilen Süre Dağılımı</div>
                  <div style={{ fontSize: '12px', color: '#8A929E', marginBottom: '16px' }}>Tanımlı süre hediyeleri (aktif)</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {[
                      { label: '1 Ay Hediye', count: tenants.filter(t => t.gift_months === 1).length, pct: '25%', color: '#2A6FDB' },
                      { label: '3 Ay Hediye', count: tenants.filter(t => t.gift_months > 1 && t.gift_months <= 3).length, pct: '50%', color: '#1F8A5B' },
                      { label: '6 Ay Hediye', count: tenants.filter(t => t.gift_months > 3 && t.gift_months <= 6).length, pct: '15%', color: '#E65100' },
                      { label: '12 Ay Hediye', count: tenants.filter(t => t.gift_months >= 12).length, pct: '10%', color: '#7B1FA2' }
                    ].map((g, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#46505C' }}>{g.label}</span>
                          <span style={{ fontSize: '14px', fontWeight: '800' }}>{g.count} Adet</span>
                        </div>
                        <div style={{ height: '9px', background: '#F0F1F4', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: g.pct, background: g.color, borderRadius: '6px', transition: 'width .6s' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ marginTop: '18px', paddingTop: '15px', borderTop: '1px solid #F0F1F4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '12.5px', color: '#6B7280' }}>Toplam dağıtılan hediye süresi</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#1A1D23' }}>
                      {tenants.reduce((acc, t) => acc + (t.gift_months || 0), 0)} Ay
                    </div>
                  </div>
                </div>

              </div>

              {/* THIRD ROW: SON İŞLEMLER & YAKLAŞAN BİTİŞLER */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.65fr 1fr', gap: '16px', marginTop: '16px' }}>
                
                {/* Son İşlemler (iyzico payments list) */}
                <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '16px', padding: '20px 20px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#1A1D23' }}>Son iyzico Ödemeleri</div>
                    <button 
                      onClick={() => setActiveView('transactions')}
                      style={{ fontSize: '12.5px', fontWeight: '700', color: '#2A6FDB', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      Tümünü gör<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                    </button>
                  </div>
                  
                  {iyzicoPayments.slice(0, 5).map((t) => {
                    const tenantName = tenants.find(x => x.id === t.tenant_id)?.name || 'Bilinmeyen Şirket';
                    return (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '10px 0', borderTop: '1px solid #F2F3F5' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: '#2A6FDB',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '13px',
                          flexShrink: 0
                        }}>{tenantName.slice(0, 2).toUpperCase()}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '13.5px', color: '#1A1D23', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tenantName}</div>
                          <div style={{ fontSize: '11.5px', color: '#9AA1AC', fontFamily: "'JetBrains Mono', monospace" }}>{t.id} · {t.method || 'Kredi Kartı'}</div>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#9AA1AC', fontWeight: '600', width: '90px' }}>
                          {new Date(t.date || t.transaction_date).toLocaleDateString('tr-TR')}
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: t.status === 'success' ? '#1F8A5B' : '#E5484D',
                          background: t.status === 'success' ? '#E8F5E9' : '#FDF2F2',
                          padding: '3px 9px',
                          borderRadius: '20px',
                          flexShrink: 0
                        }}>{t.status === 'success' ? 'Başarılı' : 'Başarısız'}</span>
                        <div style={{ fontWeight: '700', fontSize: '13.5px', width: '90px', textAlign: 'right', color: '#1A1D23' }}>
                          {t.amount.toLocaleString('tr-TR')} ₺
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Yaklaşan Bitişler Card */}
                <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#B26A00' }}>schedule</span>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#1A1D23' }}>Yaklaşan Bitişler</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#8A929E', marginBottom: '14px' }}>Üyeliği 30 gün içinde dolacaklar</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {expiringTenants.length === 0 ? (
                      <div style={{ fontSize: '13px', color: '#8A929E', textAlign: 'center', padding: '20px 0' }}>Bitişi yaklaşan abonelik bulunmuyor.</div>
                    ) : expiringTenants.slice(0, 5).map((e) => (
                      <div 
                        key={e.id}
                        onClick={() => {
                          setSelectedTenant(e);
                          fetchTenantDetails(e.id);
                          setActiveView('tenant-detail');
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '10px 11px', border: '1px solid #F0E6CE', background: '#FDF8EC', borderRadius: '11px', cursor: 'pointer' }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '13px', color: '#1A1D23', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                          <div style={{ fontSize: '11.5px', color: '#9AA1AC' }}>{e.plan_type.toUpperCase()} · {new Date(e.subscription_ends_at).toLocaleDateString('tr-TR')}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#B26A00', lineHeight: 1 }}>{e.daysLeft}</div>
                          <div style={{ fontSize: '10.5px', color: '#B26A00', fontWeight: '600' }}>gün</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ===================== VIEW: İŞLETMELER (TENANTS) ===================== */}
          {activeView === 'tenants' && (
            <div style={{ maxWidth: '1320px', animation: 'fadeUp 0.3s ease both' }}>
              {/* Filter controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '6px', background: '#EEF0F3', padding: '4px', borderRadius: '11px' }}>
                  {[
                    { label: 'Tümü', id: 'all', count: tenants.length },
                    { label: 'Aktif', id: 'active', count: tenants.filter(t => t.status === 'active').length },
                    { label: 'Deneme', id: 'trial', count: tenants.filter(t => t.status === 'trial').length },
                    { label: 'Askıda', id: 'suspended', count: tenants.filter(t => t.status === 'suspended').length }
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => setStatusFilter(chip.id as any)}
                      style={{
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: '0.15s',
                        background: statusFilter === chip.id ? '#fff' : 'transparent',
                        color: statusFilter === chip.id ? '#2A6FDB' : '#6B7280',
                        boxShadow: statusFilter === chip.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                      }}
                    >
                      {chip.label} <span style={{ opacity: 0.6 }}>{chip.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Container */}
              <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2.2fr 0.9fr 1.05fr 1.05fr 0.95fr 0.95fr 1fr 2.1fr',
                  gap: '12px',
                  padding: '13px 20px',
                  background: '#FAFBFC',
                  borderBottom: '1px solid #EBEDF0',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#8A929E',
                  letterSpacing: '.4px',
                  textTransform: 'uppercase'
                }}>
                  <div>İşletme</div>
                  <div>Plan</div>
                  <div>Başlangıç</div>
                  <div>Bitiş</div>
                  <div>Kalan Süre</div>
                  <div>Hediye</div>
                  <div>Durum</div>
                  <div style={{ textAlign: 'right' }}>İşlemler</div>
                </div>

                {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#8A929E' }}>Veriler yükleniyor...</div>
                ) : tenants.filter(t => {
                  const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                      t.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      t.city?.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
                  return matchesSearch && matchesStatus;
                }).length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#8A929E' }}>Aranan kriterde işletme bulunamadı.</div>
                ) : tenants.filter(t => {
                  const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                      t.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      t.city?.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
                  return matchesSearch && matchesStatus;
                }).map((t) => {
                  const startStr = new Date(t.created_at).toLocaleDateString('tr-TR');
                  const endStr = new Date(t.subscription_ends_at).toLocaleDateString('tr-TR');
                  
                  const diff = new Date(t.subscription_ends_at).getTime() - new Date().getTime();
                  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
                  const daysLabel = daysLeft > 0 ? `${daysLeft} gün` : 'Süresi Doldu';
                  const daysColor = daysLeft > 15 ? '#1F8A5B' : daysLeft > 0 ? '#B26A00' : '#E5484D';

                  return (
                    <div 
                      key={t.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2.2fr 0.9fr 1.05fr 1.05fr 0.95fr 0.95fr 1fr 2.1fr',
                        gap: '12px',
                        padding: '14px 20px',
                        borderBottom: '1px solid #F2F3F5',
                        alignItems: 'center',
                        fontSize: '13.5px',
                        color: '#46505C'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '11px',
                          background: '#EBF3FF',
                          color: '#2A6FDB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '13px',
                          flexShrink: 0
                        }}>{t.name.slice(0, 2).toUpperCase()}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#1A1D23', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                          <div style={{ fontSize: '11.5px', color: '#9AA1AC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.owner_name || 'Bilinmiyor'} · {t.city || 'Belirtilmedi'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          background: t.plan_type === 'kobi' ? '#EBF3FF' : t.plan_type === 'profesyonel' ? '#E8F5E9' : '#F3E5F5',
                          color: t.plan_type === 'kobi' ? '#2A6FDB' : t.plan_type === 'profesyonel' ? '#1F8A5B' : '#7B1FA2'
                        }}>{t.plan_type}</span>
                      </div>

                      <div style={{ fontFeatureSettings: "'tnum'" }}>{startStr}</div>
                      <div style={{ fontFeatureSettings: "'tnum'" }}>{endStr}</div>
                      
                      <div style={{ fontWeight: '600', color: daysColor, fontFeatureSettings: "'tnum'" }}>{daysLabel}</div>
                      
                      <div>
                        {t.gift_months > 0 ? (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: '#7C5CFC',
                            background: '#F0EBFE',
                            padding: '3px 8px',
                            borderRadius: '7px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>redeem</span>
                            +{t.gift_months} Ay
                          </span>
                        ) : <span style={{ color: '#C4C9D0' }}>—</span>}
                      </div>

                      <div>
                        <span style={{
                          fontSize: '11.5px',
                          fontWeight: '700',
                          padding: '3px 9px',
                          borderRadius: '20px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: t.status === 'active' ? '#1F8A5B' : t.status === 'trial' ? '#E65100' : '#E5484D',
                          background: t.status === 'active' ? '#E8F5E9' : t.status === 'trial' ? '#FFF3E0' : '#FDF2F2'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: t.status === 'active' ? '#1F8A5B' : t.status === 'trial' ? '#E65100' : '#E5484D'
                          }}></span>
                          {t.status === 'active' ? 'Aktif' : t.status === 'trial' ? 'Deneme' : 'Askıda'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setSelectedTenant(t);
                            fetchTenantDetails(t.id);
                            setActiveView('tenant-detail');
                          }}
                          style={{
                            border: '1px solid #E2E5EA',
                            background: '#fff',
                            color: '#2A6FDB',
                            borderRadius: '6px',
                            padding: '5px 9px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Toplam Veriler
                        </button>
                        <button 
                          onClick={() => { setGiftTenant(t); setGiftModalOpen(true); }}
                          style={{ background: '#F0EBFE', border: 'none', color: '#7C5CFC', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                        >
                          Hediye Ver
                        </button>
                        <button 
                          onClick={() => handleStatusChange(t.id, t.status)}
                          style={{
                            background: t.status === 'suspended' ? '#E8F5E9' : '#FDF2F2',
                            border: 'none',
                            color: t.status === 'suspended' ? '#1F8A5B' : '#E5484D',
                            padding: '5px 9px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}
                        >
                          {t.status === 'suspended' ? 'Aktifleştir' : 'Askıya Al'}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================== VIEW: İŞLETME DETAYI (TENANT DETAIL / TOPLAM VERİLER) ===================== */}
          {activeView === 'tenant-detail' && selectedTenant && (
            <div style={{ maxWidth: '1320px', animation: 'fadeUp 0.3s ease both' }}>
              {/* Back Button & Title banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <button 
                  onClick={() => { setSelectedTenant(null); setActiveView('tenants'); }}
                  style={{
                    background: '#fff',
                    border: '1px solid #E2E5EA',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#46505C',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
                  İşletmelere Dön
                </button>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1A1D23' }}>
                  {selectedTenant.name} Kullanım & Veri Özeti
                </h3>
              </div>

              {/* Company Metadata Info panel */}
              <div style={{
                background: '#fff',
                border: '1px solid #E7E9ED',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px'
              }}>
                <div>
                  <small style={{ display: 'block', color: '#8A929E', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Firma Yetkilisi</small>
                  <div style={{ fontSize: '14.5px', fontWeight: '700', color: '#1A1D23', marginTop: '4px' }}>{selectedTenant.owner_name || 'Belirtilmedi'}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{selectedTenant.owner_email}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{selectedTenant.owner_phone}</div>
                </div>

                <div>
                  <small style={{ display: 'block', color: '#8A929E', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Abonelik Paketi</small>
                  <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      background: selectedTenant.plan_type === 'kobi' ? '#EBF3FF' : selectedTenant.plan_type === 'profesyonel' ? '#E8F5E9' : '#F3E5F5',
                      color: selectedTenant.plan_type === 'kobi' ? '#2A6FDB' : selectedTenant.plan_type === 'profesyonel' ? '#1F8A5B' : '#7B1FA2'
                    }}>{selectedTenant.plan_type}</span>
                    <span style={{ fontSize: '13px', color: '#46505C', fontWeight: '500' }}>
                      ({selectedTenant.billing_cycle === 'yearly' ? 'Yıllık' : 'Aylık'})
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#8A929E', marginTop: '4px' }}>Bitiş: {new Date(selectedTenant.subscription_ends_at).toLocaleDateString('tr-TR')}</div>
                </div>

                <div>
                  <small style={{ display: 'block', color: '#8A929E', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Kayıt Bilgileri</small>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A1D23', marginTop: '4px' }}>
                    Slug: <strong>{selectedTenant.slug}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#8A929E', marginTop: '2px' }}>Kurulum: {new Date(selectedTenant.created_at).toLocaleDateString('tr-TR')}</div>
                  <div style={{ fontSize: '12px', color: '#8A929E' }}>Konum: {selectedTenant.city || 'Bilinmiyor'}</div>
                </div>

                <div>
                  <small style={{ display: 'block', color: '#8A929E', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Sistem Durumu</small>
                  <div style={{ marginTop: '6px' }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      color: selectedTenant.status === 'active' ? '#1F8A5B' : selectedTenant.status === 'trial' ? '#E65100' : '#E5484D',
                      background: selectedTenant.status === 'active' ? '#E8F5E9' : selectedTenant.status === 'trial' ? '#FFF3E0' : '#FDF2F2'
                    }}>{selectedTenant.status === 'active' ? 'Aktif Üye' : selectedTenant.status === 'trial' ? 'Deneme Süresi' : 'Askıya Alınmış'}</span>
                  </div>
                  {selectedTenant.gift_months > 0 && (
                    <div style={{ fontSize: '12px', color: '#7C5CFC', marginTop: '6px', fontWeight: '600' }}>
                      🎁 Dağıtılan Hediye: {selectedTenant.gift_months} Ay
                    </div>
                  )}
                </div>
              </div>

              {/* Sub Navigation Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #E7E9ED', paddingBottom: '2px' }}>
                {[
                  { label: 'Projeler', tab: 'projects', count: tenantProjects.length, icon: 'folder' },
                  { label: 'Görevler', tab: 'tasks', count: tenantTasks.length, icon: 'assignment' },
                  { label: 'Teklifler', tab: 'offers', count: tenantOffers.length, icon: 'request_quote' },
                  { label: 'Müşteriler', tab: 'customers', count: tenantCustomers.length, icon: 'groups' },
                  { label: 'Finansal Durum', tab: 'finance', count: tenantTransactions.length, icon: 'account_balance' }
                ].map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => setDetailTab(item.tab as any)}
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: detailTab === item.tab ? '#2A6FDB' : '#6B7280',
                      borderBottom: detailTab === item.tab ? '3px solid #2A6FDB' : '3px solid transparent',
                      marginBottom: '-5px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
                    {item.label}
                    <span style={{
                      fontSize: '11px',
                      background: detailTab === item.tab ? '#EAF1FC' : '#F0F1F4',
                      color: detailTab === item.tab ? '#2A6FDB' : '#6B7280',
                      padding: '2px 6px',
                      borderRadius: '10px'
                    }}>{item.count}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content Tables */}
              <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '16px', overflow: 'hidden' }}>
                
                {/* 1. Projects tab */}
                {detailTab === 'projects' && (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '2.5fr 3.5fr 1.2fr 1.2fr 1.2fr',
                      gap: '12px',
                      padding: '12px 20px',
                      background: '#FAFBFC',
                      borderBottom: '1px solid #EBEDF0',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#8A929E',
                      textTransform: 'uppercase'
                    }}>
                      <div>Proje Adı</div>
                      <div>Açıklama</div>
                      <div>Başlangıç</div>
                      <div>Bitiş</div>
                      <div style={{ textAlign: 'right' }}>Durum</div>
                    </div>
                    {tenantProjects.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#8A929E' }}>İşletmeye ait proje kaydı bulunmuyor.</div>
                    ) : tenantProjects.map((p) => (
                      <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 3.5fr 1.2fr 1.2fr 1.2fr', gap: '12px', padding: '14px 20px', borderBottom: '1px solid #F2F3F5', fontSize: '13.5px', color: '#46505C', alignItems: 'center' }}>
                        <div style={{ fontWeight: '700', color: '#1A1D23' }}>{p.name}</div>
                        <div style={{ fontSize: '12.5px', color: '#6B7280' }}>{p.description || 'Açıklama girilmemiş.'}</div>
                        <div>{p.start_date ? new Date(p.start_date).toLocaleDateString('tr-TR') : '—'}</div>
                        <div>{p.end_date ? new Date(p.end_date).toLocaleDateString('tr-TR') : '—'}</div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '20px',
                            color: p.status === 'completed' ? '#1F8A5B' : p.status === 'active' ? '#2A6FDB' : '#E65100',
                            background: p.status === 'completed' ? '#E8F5E9' : p.status === 'active' ? '#EBF3FF' : '#FFF3E0'
                          }}>{p.status === 'completed' ? 'Tamamlandı' : p.status === 'active' ? 'Aktif' : 'Beklemede'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Tasks tab */}
                {detailTab === 'tasks' && (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '2.5fr 2fr 1.5fr 1.2fr 1.2fr 1.2fr',
                      gap: '12px',
                      padding: '12px 20px',
                      background: '#FAFBFC',
                      borderBottom: '1px solid #EBEDF0',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#8A929E',
                      textTransform: 'uppercase'
                    }}>
                      <div>Görev Tanımı</div>
                      <div>Proje</div>
                      <div>Sorumlu</div>
                      <div>Öncelik</div>
                      <div>Son Tarih</div>
                      <div style={{ textAlign: 'right' }}>Durum</div>
                    </div>
                    {tenantTasks.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#8A929E' }}>İşletmeye ait görev kaydı bulunmuyor.</div>
                    ) : tenantTasks.map((t) => {
                      const projName = tenantProjects.find(p => p.id === t.project_id)?.name || 'Bağımsız';
                      return (
                        <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 1.5fr 1.2fr 1.2fr 1.2fr', gap: '12px', padding: '14px 20px', borderBottom: '1px solid #F2F3F5', fontSize: '13.5px', color: '#46505C', alignItems: 'center' }}>
                          <div style={{ fontWeight: '700', color: '#1A1D23' }}>{t.title}</div>
                          <div style={{ fontSize: '12.5px' }}>{projName}</div>
                          <div>{t.assigned_to || 'Atanmadı'}</div>
                          <div>
                            <span style={{
                              fontWeight: '600',
                              color: t.priority === 'high' ? '#E5484D' : t.priority === 'medium' ? '#B26A00' : '#6B7280'
                            }}>{t.priority === 'high' ? 'Yüksek' : t.priority === 'medium' ? 'Orta' : 'Düşük'}</span>
                          </div>
                          <div>{t.due_date ? new Date(t.due_date).toLocaleDateString('tr-TR') : '—'}</div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '3px 8px',
                              borderRadius: '20px',
                              color: t.status === 'done' || t.status === 'approved' ? '#1F8A5B' : t.status === 'in_progress' ? '#2A6FDB' : '#6B7280',
                              background: t.status === 'done' || t.status === 'approved' ? '#E8F5E9' : t.status === 'in_progress' ? '#EBF3FF' : '#F0F1F4'
                            }}>{t.status === 'approved' ? 'Onaylandı' : t.status === 'done' ? 'Tamamlandı' : t.status === 'in_progress' ? 'İşlemde' : 'Yapılacak'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. Offers tab */}
                {detailTab === 'offers' && (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '3fr 2.5fr 1.5fr 1.5fr 1.2fr',
                      gap: '12px',
                      padding: '12px 20px',
                      background: '#FAFBFC',
                      borderBottom: '1px solid #EBEDF0',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#8A929E',
                      textTransform: 'uppercase'
                    }}>
                      <div>Teklif Konusu</div>
                      <div>Müşteri</div>
                      <div>Tutar</div>
                      <div>Tarih</div>
                      <div style={{ textAlign: 'right' }}>Durum</div>
                    </div>
                    {tenantOffers.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#8A929E' }}>İşletmeye ait teklif kaydı bulunmuyor.</div>
                    ) : tenantOffers.map((o) => (
                      <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '3fr 2.5fr 1.5fr 1.5fr 1.2fr', gap: '12px', padding: '14px 20px', borderBottom: '1px solid #F2F3F5', fontSize: '13.5px', color: '#46505C', alignItems: 'center' }}>
                        <div style={{ fontWeight: '700', color: '#1A1D23' }}>{o.title}</div>
                        <div>{o.customer_name}</div>
                        <div style={{ fontWeight: '700', color: '#1A1D23' }}>{o.amount.toLocaleString('tr-TR')} ₺</div>
                        <div>{new Date(o.created_at).toLocaleDateString('tr-TR')}</div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '20px',
                            color: o.status === 'accepted' ? '#1F8A5B' : o.status === 'rejected' ? '#E5484D' : o.status === 'sent' ? '#2A6FDB' : '#6B7280',
                            background: o.status === 'accepted' ? '#E8F5E9' : o.status === 'rejected' ? '#FDF2F2' : o.status === 'sent' ? '#EBF3FF' : '#F0F1F4'
                          }}>{o.status === 'accepted' ? 'Kabul' : o.status === 'rejected' ? 'Red' : o.status === 'sent' ? 'Gönderildi' : 'Taslak'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Customers tab */}
                {detailTab === 'customers' && (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr 3.5fr',
                      gap: '12px',
                      padding: '12px 20px',
                      background: '#FAFBFC',
                      borderBottom: '1px solid #EBEDF0',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#8A929E',
                      textTransform: 'uppercase'
                    }}>
                      <div>Firma Adı</div>
                      <div>Yetkili Kişi</div>
                      <div>Telefon</div>
                      <div>E-posta</div>
                      <div>Adres</div>
                    </div>
                    {tenantCustomers.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#8A929E' }}>İşletmeye ait müşteri kaydı bulunmuyor.</div>
                    ) : tenantCustomers.map((c) => (
                      <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr 3.5fr', gap: '12px', padding: '14px 20px', borderBottom: '1px solid #F2F3F5', fontSize: '13.5px', color: '#46505C', alignItems: 'center' }}>
                        <div style={{ fontWeight: '700', color: '#1A1D23' }}>{c.company_name}</div>
                        <div>{c.contact_name || '—'}</div>
                        <div>{c.phone || '—'}</div>
                        <div>{c.email || '—'}</div>
                        <div style={{ fontSize: '12.5px', color: '#6B7280' }}>{c.address || '—'}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. Finance Transactions tab */}
                {detailTab === 'finance' && (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 4fr 1.5fr 1.5fr 1.5fr',
                      gap: '12px',
                      padding: '12px 20px',
                      background: '#FAFBFC',
                      borderBottom: '1px solid #EBEDF0',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#8A929E',
                      textTransform: 'uppercase'
                    }}>
                      <div>İşlem Tarihi</div>
                      <div>Açıklama</div>
                      <div>Kategori</div>
                      <div>Tür</div>
                      <div style={{ textAlign: 'right' }}>Tutar</div>
                    </div>
                    {tenantTransactions.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#8A929E' }}>İşletmeye ait finansal hareket bulunmuyor.</div>
                    ) : tenantTransactions.map((ft) => (
                      <div key={ft.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 4fr 1.5fr 1.5fr 1.5fr', gap: '12px', padding: '14px 20px', borderBottom: '1px solid #F2F3F5', fontSize: '13.5px', color: '#46505C', alignItems: 'center' }}>
                        <div>{new Date(ft.transaction_date).toLocaleDateString('tr-TR')}</div>
                        <div style={{ fontWeight: '600', color: '#1A1D23' }}>{ft.description}</div>
                        <div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#F0F1F4',
                            color: '#46505C'
                          }}>{ft.category === 'bank' ? 'Banka' : ft.category === 'cash' ? 'Nakit' : ft.category === 'check' ? 'Çek' : 'Fatura'}</span>
                        </div>
                        <div>
                          <span style={{
                            fontWeight: '700',
                            color: ft.type === 'income' ? '#1F8A5B' : '#E5484D'
                          }}>{ft.type === 'income' ? 'Gelir' : 'Gider'}</span>
                        </div>
                        <div style={{
                          textAlign: 'right',
                          fontWeight: '800',
                          color: ft.type === 'income' ? '#1F8A5B' : '#E5484D',
                          fontFeatureSettings: "'tnum'"
                        }}>
                          {ft.type === 'income' ? '+' : '-'}{ft.amount.toLocaleString('tr-TR')} ₺
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ===================== VIEW: İŞLEM KAYITLARI (TRANSACTIONS) ===================== */}
          {activeView === 'transactions' && (
            <div style={{ maxWidth: '1320px', animation: 'fadeUp 0.3s ease both' }}>
              {/* Header stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '16px' }}>
                <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '14px', padding: '16px 18px' }}>
                  <div style={{ fontSize: '12.5px', color: '#6B7280', fontWeight: '600' }}>Ödeme Yöntemi</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-.6px', marginTop: '6px', color: '#2A6FDB' }}>iyzico POS</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '14px', padding: '16px 18px' }}>
                  <div style={{ fontSize: '12.5px', color: '#6B7280', fontWeight: '600' }}>Toplam İşlem Sayısı</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-.6px', marginTop: '6px', color: '#1A1D23', fontFeatureSettings: "'tnum'" }}>{iyzicoPayments.length}</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '14px', padding: '16px 18px' }}>
                  <div style={{ fontSize: '12.5px', color: '#6B7280', fontWeight: '600' }}>Başarılı Ödeme</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-.6px', marginTop: '6px', color: '#1F8A5B', fontFeatureSettings: "'tnum'" }}>
                    {iyzicoPayments.filter(p => p.status === 'success').length}
                  </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '14px', padding: '16px 18px' }}>
                  <div style={{ fontSize: '12.5px', color: '#6B7280', fontWeight: '600' }}>Başarısız Ödeme</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-.6px', marginTop: '6px', color: '#E5484D', fontFeatureSettings: "'tnum'" }}>
                    {iyzicoPayments.filter(p => p.status === 'failed').length}
                  </div>
                </div>
              </div>

              {/* Filter controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '6px', background: '#EEF0F3', padding: '4px', borderRadius: '11px' }}>
                  {[
                    { label: 'Tümü', id: 'all' },
                    { label: 'Başarılı', id: 'success' },
                    { label: 'Başarısız', id: 'failed' }
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => setTxStatusFilter(chip.id as any)}
                      style={{
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: '0.15s',
                        background: txStatusFilter === chip.id ? '#fff' : 'transparent',
                        color: txStatusFilter === chip.id ? '#2A6FDB' : '#6B7280',
                        boxShadow: txStatusFilter === chip.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transactions Table */}
              <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 2fr 1.2fr 1.2fr 1.2fr 1.2fr',
                  gap: '12px',
                  padding: '13px 20px',
                  background: '#FAFBFC',
                  borderBottom: '1px solid #EBEDF0',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#8A929E',
                  letterSpacing: '.4px',
                  textTransform: 'uppercase'
                }}>
                  <div>İşlem No</div>
                  <div>İşletme</div>
                  <div>Tür / Plan</div>
                  <div>Yöntem</div>
                  <div>Ödeme Tarihi</div>
                  <div style={{ textAlign: 'right' }}>Tutar / Durum</div>
                </div>

                {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#8A929E' }}>Yükleniyor...</div>
                ) : iyzicoPayments.filter(p => {
                  const tenantName = tenants.find(x => x.id === p.tenant_id)?.name || '';
                  const matchesSearch = p.id.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
                                      tenantName.toLowerCase().includes(txSearchQuery.toLowerCase());
                  const matchesStatus = txStatusFilter === 'all' || p.status === txStatusFilter;
                  return matchesSearch && matchesStatus;
                }).length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#8A929E' }}>Ödeme kaydı bulunamadı.</div>
                ) : iyzicoPayments.filter(p => {
                  const tenantName = tenants.find(x => x.id === p.tenant_id)?.name || '';
                  const matchesSearch = p.id.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
                                      tenantName.toLowerCase().includes(txSearchQuery.toLowerCase());
                  const matchesStatus = txStatusFilter === 'all' || p.status === txStatusFilter;
                  return matchesSearch && matchesStatus;
                }).map((t) => {
                  const tenantName = tenants.find(x => x.id === t.tenant_id)?.name || 'Bilinmeyen Şirket';
                  const dateStr = new Date(t.date || t.transaction_date).toLocaleDateString('tr-TR');
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 2fr 1.2fr 1.2fr 1.2fr 1.2fr',
                        gap: '12px',
                        padding: '14px 20px',
                        borderBottom: '1px solid #F2F3F5',
                        alignItems: 'center',
                        fontSize: '13.5px',
                        color: '#46505C'
                      }}
                    >
                      <div style={{ fontWeight: '600', color: '#1A1D23', fontFamily: "'JetBrains Mono', monospace" }}>{t.id}</div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '9px',
                          background: '#EBF3FF',
                          color: '#2A6FDB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '12px',
                          flexShrink: 0
                        }}>{tenantName.slice(0, 2).toUpperCase()}</div>
                        <span style={{ fontWeight: '600', color: '#1A1D23', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tenantName}</span>
                      </div>

                      <div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          background: t.plan_type === 'kobi' ? '#EBF3FF' : t.plan_type === 'profesyonel' ? '#E8F5E9' : '#F3E5F5',
                          color: t.plan_type === 'kobi' ? '#2A6FDB' : t.plan_type === 'profesyonel' ? '#1F8A5B' : '#7B1FA2'
                        }}>
                          {t.plan_type}
                        </span>
                        <span style={{ fontSize: '11.5px', color: '#8A929E', marginLeft: '5px' }}>
                          ({t.billing_cycle === 'yearly' ? 'Yıllık' : 'Aylık'})
                        </span>
                      </div>

                      <div style={{ color: '#6B7280' }}>{t.method || 'Kredi Kartı'}</div>
                      <div style={{ color: '#6B7280', fontFeatureSettings: "'tnum'" }}>{dateStr}</div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '11px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: t.status === 'success' ? '#1F8A5B' : '#E5484D',
                          background: t.status === 'success' ? '#E8F5E9' : '#FDF2F2',
                          padding: '3px 9px',
                          borderRadius: '20px'
                        }}>{t.status === 'success' ? 'Başarılı' : 'Başarısız'}</span>
                        <span style={{ fontWeight: '700', color: '#1A1D23', fontSize: '13.5px', width: '88px', textAlign: 'right', fontFeatureSettings: "'tnum'" }}>
                          {t.amount.toLocaleString('tr-TR')} ₺
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================== VIEW: DESTEK TALEPLERİ ===================== */}
          {activeView === 'support' && (
            <div style={{ maxWidth: '1320px', animation: 'fadeUp 0.3s ease both' }}>
              <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 2fr 2fr 2fr 3.5fr 1.2fr',
                  gap: '12px',
                  padding: '13px 20px',
                  background: '#FAFBFC',
                  borderBottom: '1px solid #EBEDF0',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#8A929E',
                  letterSpacing: '.4px',
                  textTransform: 'uppercase'
                }}>
                  <div>Tarih</div>
                  <div>İşletme</div>
                  <div>Gönderen Yetkili</div>
                  <div>Talep Konusu</div>
                  <div>Mesaj Detayı</div>
                  <div style={{ textAlign: 'right' }}>İşlemler</div>
                </div>

                {supportMessages.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#8A929E' }}>İşletmelerden iletilen güncel destek talebi bulunmamaktadır.</div>
                ) : supportMessages.map((m) => {
                  const companyName = m.tenants?.name || m.tenant_name || 'Bilinmeyen Firma';
                  const senderName = m.profiles?.full_name || m.sender_name || 'Bilinmeyen Yetkili';
                  const senderEmail = m.profiles?.email || m.sender_email || '';
                  const cleanSubject = m.subject?.replace('Destek Talebi: ', '') || '';
                  
                  return (
                    <div 
                      key={m.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 2fr 2fr 2fr 3.5fr 1.2fr',
                        gap: '12px',
                        padding: '14px 20px',
                        borderBottom: '1px solid #F2F3F5',
                        alignItems: 'center',
                        fontSize: '13.5px',
                        color: '#46505C'
                      }}
                    >
                      <div style={{ color: '#8A929E', fontFeatureSettings: "'tnum'" }}>
                        {new Date(m.created_at).toLocaleDateString('tr-TR')}
                      </div>

                      <div style={{ fontWeight: '700', color: '#1A1D23' }}>{companyName}</div>
                      
                      <div>
                        <span style={{ display: 'block', fontWeight: '600' }}>{senderName}</span>
                        <small style={{ color: '#8A929E' }}>{senderEmail}</small>
                      </div>

                      <div style={{ color: '#E65100', fontWeight: '600' }}>{cleanSubject}</div>
                      
                      <div style={{ fontSize: '13px', color: '#6B7280', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>
                        {m.body}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleDeleteSupport(m.id)}
                          style={{
                            background: '#FDF2F2',
                            border: 'none',
                            color: '#E5484D',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}
                        >
                          Talebi Kapat
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================== VIEW: AYARLAR ===================== */}
          {activeView === 'settings' && (
            <div style={{ maxWidth: '840px', animation: 'fadeUp 0.3s ease both' }}>
              <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '16px', padding: '22px', marginBottom: '16px' }}>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#1A1D23', marginBottom: '16px' }}>Yönetici Profili</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: '#1A1D23', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '22px' }}>
                    <span style={{ margin: 'auto' }}>{adminEmail === 'admin@bulutgrup.tr' ? 'AD' : 'RT'}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800', fontSize: '17px', color: '#1A1D23' }}>
                      {adminEmail === 'admin@bulutgrup.tr' ? 'Bulut Admin' : 'Root Yetkilisi'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#8A929E' }}>{adminEmail} · Tam yetkili</div>
                  </div>
                  <button style={{ height: '38px', padding: '0 16px', border: '1px solid #E2E5EA', background: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#46505C', cursor: 'pointer' }}>Düzenle</button>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ background: '#fff', border: '1px solid #E7E9ED', borderRadius: '16px', padding: '22px', marginBottom: '16px' }}>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#1A1D23', marginBottom: '6px' }}>Konsol Tercihleri</div>
                
                {[
                  { icon: 'notifications', label: 'E-posta Bildirimleri', desc: 'Yeni işletme kayıtlarında ve ödemelerde anlık bilgilendir.' },
                  { icon: 'security', label: 'İki Aşamalı Doğrulama (2FA)', desc: 'Girişlerde tek kullanımlık SMS kodu veya Authenticator zorunlu kıl.' },
                  { icon: 'database', label: 'Otomatik Veritabanı Yedeği', desc: 'Sistem tablolarını her pazar gecesi otomatik yedekle.' }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0', borderTop: '1px solid #F2F3F5' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: '#F3F5F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '21px', color: '#46505C', margin: 'auto' }}>{item.icon}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '13.5px', color: '#1A1D23' }}>{item.label}</div>
                      <div style={{ fontSize: '12px', color: '#9AA1AC' }}>{item.desc}</div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#8A929E', fontWeight: '600' }}>Aktif</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ===================== MODAL: HEDİYE SÜRE TANIMLAMA ARAYÜZÜ ===================== */}
      {giftModalOpen && giftTenant && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(20,27,38,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '400px', border: '1px solid #E7E9ED', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#1A1D23', fontWeight: '800' }}>Hediye Kullanım Süresi Tanımla</h4>
            <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#6B7280', lineHeight: '1.5' }}>
              <strong>{giftTenant.name}</strong> işletmesi için abonelik bitiş tarihine hediye kullanım süresi ekleyin.
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#46505C', marginBottom: '8px' }}>Eklenecek Süre (Ay)</label>
              <select 
                value={giftMonths} 
                onChange={(e) => setGiftMonths(Number(e.target.value))}
                style={{ width: '100%', background: '#F7F8FA', border: '1px solid #E2E5EA', color: '#1A1D23', padding: '10px', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
              >
                <option value={1}>1 Ay Hediye</option>
                <option value={3}>3 Ay Hediye</option>
                <option value={6}>6 Ay Hediye</option>
                <option value={12}>1 Yıl (12 Ay) Hediye</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setGiftModalOpen(false); setGiftTenant(null); }}
                style={{ background: '#F0F1F4', border: 'none', color: '#46505C', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13.5px' }}
              >
                İptal
              </button>
              <button 
                onClick={handleAddGift}
                style={{ background: '#2A6FDB', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13.5px', boxShadow: '0 4px 10px rgba(42,111,219,0.25)' }}
              >
                Süreyi Uzat (Hediye Et)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
