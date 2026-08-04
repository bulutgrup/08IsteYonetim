import React, { useState, useEffect } from 'react';
import { supabase, isMockMode, mockData } from './lib/supabase';

const badge = (label: string, tone: string) => {
  const t = { 
    ok: ['#E7F6EF', '#1F8A5F'], 
    warn: ['#FEF3E2', '#B87514'], 
    hot: ['#FDECEA', '#C7422F'],
    info: ['#E9F0FD', '#2C5AA8'], 
    mute: ['#EFF2F7', '#6B778C'], 
    brand: ['#FEF0EC', '#D8503D'] 
  }[tone] || ['#EFF2F7', '#6B778C'];
  return { badge: label, badgeBg: t[0], badgeFg: t[1] };
};

const formatTRYRight = (val: number) => {
  return val.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺';
};

const MENU = [
  { mark: 'GP', label: 'Giriş Paneli', screen: 'home' },
  { mark: 'MS', label: 'Mesajlar', children: [['Gelen Mesajlar', 'msgInbox'], ['Giden Mesajlar', 'msgSent'], ['Mesaj Yaz', 'msgNew']] },
  { mark: 'GÖ', label: 'Görev Paneli', children: [['Yeni Görev', 'taskNew'], ['Görev Listesi', 'taskList']] },
  { mark: 'PR', label: 'Proje Paneli', children: [['Yeni Proje', 'projNew'], ['Proje Listesi', 'projList']] },
  { mark: 'TK', label: 'Teklif Paneli', children: [['Yeni Teklif', 'offerNew'], ['Verilen Teklifler', 'offerList']] },
  { mark: 'MŞ', label: 'Müşteri Paneli', children: [['Yeni Müşteri', 'custNew'], ['Müşteri Listesi', 'custList']] },
  { mark: 'FN', label: 'Finans Paneli', children: [['Hareket Ekle / Rapor', 'finNew']] },
  { mark: 'TS', label: 'Teknik Servis', children: [['Yeni Servis Kaydı', 'servNew'], ['Servis Listesi', 'servList']] },
  { mark: 'SA', label: 'Sistem Ayarları', children: [['Personel Yönetimi', 'staff'], ['Hesap Ayarları', 'account']] }
];

const SCREENS: Record<string, { kind: string; title: string; eyebrow: string }> = {
  home:      { kind: 'home', title: 'Giriş Paneli', eyebrow: 'Genel bakış' },
  msgInbox:  { kind: 'list', title: 'Gelen Mesajlar', eyebrow: 'Mesajlar' },
  msgSent:   { kind: 'list', title: 'Giden Mesajlar', eyebrow: 'Mesajlar' },
  msgNew:    { kind: 'form', title: 'Mesaj Yaz', eyebrow: 'Mesajlar' },
  msgDetail: { kind: 'detail', title: 'Mesaj Detayı', eyebrow: 'Mesajlar' },
  taskNew:   { kind: 'form', title: 'Görev Oluştur', eyebrow: 'Görev Paneli' },
  taskList:  { kind: 'list', title: 'Görev Listesi', eyebrow: 'Görev Paneli' },
  projNew:   { kind: 'form', title: 'Proje Oluştur', eyebrow: 'Proje Paneli' },
  projList:  { kind: 'list', title: 'Proje Listesi', eyebrow: 'Proje Paneli' },
  offerNew:  { kind: 'form', title: 'Teklif Oluştur', eyebrow: 'Teklif Paneli' },
  offerList: { kind: 'list', title: 'Verilen Teklifler', eyebrow: 'Teklif Paneli' },
  offerDetail:{ kind: 'detail', title: 'Teklif Detayı', eyebrow: 'Teklif Paneli' },
  custNew:   { kind: 'form', title: 'Müşteri Oluştur', eyebrow: 'Müşteri Paneli' },
  custList:  { kind: 'list', title: 'Müşteri Listesi', eyebrow: 'Müşteri Paneli' },
  finNew:    { kind: 'form', title: 'Hareket Ekle & Finans Raporu', eyebrow: 'Finans Paneli' },
  servNew:   { kind: 'form', title: 'Servis Kaydı Aç', eyebrow: 'Teknik Servis' },
  servList:  { kind: 'list', title: 'Servis Listesi', eyebrow: 'Teknik Servis' },
  staff:     { kind: 'list', title: 'Personel Yönetimi', eyebrow: 'Sistem Ayarları' },
  staffNew:  { kind: 'form', title: 'Personel Kaydı', eyebrow: 'Sistem Ayarları' },
  account:   { kind: 'rows', title: 'Hesap Ayarları', eyebrow: 'Sistem Ayarları' }
};

interface OfferItem {
  product: string;
  description: string;
  qty: number;
  price: number;
  vat: number;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [screen, setScreen] = useState<string>('home');
  const [prevScreen, setPrevScreen] = useState<string>('home');
  const [authEmail, setAuthEmail] = useState<string>('demo@isteyonetim.com');
  const [authPassword, setAuthPassword] = useState<string>('123456');
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [registerCompany, setRegisterCompany] = useState<string>('');
  const [registerName, setRegisterName] = useState<string>('');

  // Interactive UI Dropdowns
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Mesajlar': true,
    'Görev Paneli': true
  });

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);

  // Live Database Arrays
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [finance, setFinance] = useState<any[]>([]);
  const [serviceTickets, setServiceTickets] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  // Sub-settings modals/forms
  const [subSettingView, setSubSettingView] = useState<string | null>(null);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profilePhoneInput, setProfilePhoneInput] = useState('');
  const [profileCompanyInput, setProfileCompanyInput] = useState('');
  const [profilePasswordInput, setProfilePasswordInput] = useState('');
  
  // Custom Settings Toggles
  const [toggleNotify, setToggleNotify] = useState(true);
  const [toggleEmailSummary, setToggleEmailSummary] = useState(true);
  const [toggleDarkTheme, setToggleDarkTheme] = useState(false);

  // Real Fields form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskProjId, setTaskProjId] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projStartDate, setProjStartDate] = useState('');
  const [projEndDate, setProjEndDate] = useState('');
  const [projStatus, setProjStatus] = useState('pending');

  const [custCompany, setCustCompany] = useState('');
  const [custContact, setCustContact] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Invoice / dynamic Offer state
  const [offerTitle, setOfferTitle] = useState('');
  const [offerCustId, setOfferCustId] = useState('');
  const [offerStatus, setOfferStatus] = useState('draft');
  const [offerDate, setOfferDate] = useState(new Date().toISOString().substring(0, 10));
  const [offerValidDate, setOfferValidDate] = useState(new Date(Date.now() + 15*24*60*60*1000).toISOString().substring(0, 10));
  const [offerItems, setOfferItems] = useState<OfferItem[]>([
    { product: '', description: '', qty: 1, price: 0, vat: 20 }
  ]);
  const [viewingOffer, setViewingOffer] = useState<any>(null);

  const [finType, setFinType] = useState('expense');
  const [finCategory, setFinCategory] = useState('other');
  const [finAmount, setFinAmount] = useState('');
  const [finDesc, setFinDesc] = useState('');
  const [finDate, setFinDate] = useState(new Date().toISOString().substring(0, 10));

  const [servCustId, setServCustId] = useState('');
  const [servStaffId, setServStaffId] = useState('');
  const [servDesc, setServDesc] = useState('');
  const [servStatus, setServStatus] = useState('unresolved');

  const [msgReceiverId, setMsgReceiverId] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [viewingMsg, setViewingMsg] = useState<any>(null);

  // Staff creation form
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState('staff');
  const [staffActive, setStaffActive] = useState('true');

  // Search and filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeChip, setActiveChip] = useState<string>('Tümü');

  useEffect(() => {
    // Check local storage for session
    if (isMockMode()) {
      const logged = localStorage.getItem('sb-mock-logged-in');
      if (logged === 'true') {
        setIsLoggedIn(true);
        setCurrentUserProfile(mockData.profile);
      }
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsLoggedIn(true);
          loadUserProfile(session.user.id);
        }
      });
    }
  }, []);

  const loadUserProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setCurrentUserProfile(data);
      setProfileNameInput(data.full_name || '');
      setProfilePhoneInput(data.phone || '');
      const { data: tenant } = await supabase.from('tenants').select('name').eq('id', data.tenant_id).single();
      if (tenant) {
        setProfileCompanyInput(tenant.name);
        setCurrentUserProfile((prev: any) => ({ ...prev, company_name: tenant.name }));
      }
    }
  };

  const loadData = async () => {
    if (isMockMode()) {
      const localTasks = localStorage.getItem('sb-mock-tasks') ? JSON.parse(localStorage.getItem('sb-mock-tasks')!) : mockData.tasks;
      const localProjects = localStorage.getItem('sb-mock-projects') ? JSON.parse(localStorage.getItem('sb-mock-projects')!) : mockData.projects;
      const localCustomers = localStorage.getItem('sb-mock-customers') ? JSON.parse(localStorage.getItem('sb-mock-customers')!) : mockData.customers;
      const localFinance = localStorage.getItem('sb-mock-finance') ? JSON.parse(localStorage.getItem('sb-mock-finance')!) : mockData.finance;
      const localService = localStorage.getItem('sb-mock-service') ? JSON.parse(localStorage.getItem('sb-mock-service')!) : mockData.serviceTickets;
      const localOffers = localStorage.getItem('sb-mock-offers') ? JSON.parse(localStorage.getItem('sb-mock-offers')!) : [
        { id: '1', title: 'Web Tasarım Sözleşmesi', customer_id: '1', customer_name: 'Kule Plaza A.Ş.', total_amount: 18000, status: 'sent', created_at: '2026-07-24', items: [{ product: 'Arayüz Kodlama', description: 'React v2 arayüz teslimi', qty: 1, price: 15000, vat: 20 }] },
        { id: '2', title: 'POS Donanım Tedariği', customer_id: '2', customer_name: 'Beykoz Lojistik', total_amount: 10200, status: 'accepted', created_at: '2026-07-21', items: [{ product: 'Android El Terminali', description: 'Sunmi V2 PRO cihazı', qty: 1, price: 8500, vat: 20 }] }
      ];
      const localMessages = localStorage.getItem('sb-mock-messages') ? JSON.parse(localStorage.getItem('sb-mock-messages')!) : [
        { id: '1', sender_id: '1', sender_name: 'Ayşe Yıldırım', receiver_id: 'admin', body: 'Teklif revizyonu yapalım.', created_at: '2026-07-25T09:24:00Z', is_read: false, subject: 'Revizyon Talebi' },
        { id: '2', sender_id: 'admin', sender_name: 'Kemal Aydın', receiver_id: '1', body: 'Dosyaları sisteme yükledim.', created_at: '2026-07-24T18:00:00Z', is_read: true, subject: 'Saha Fotoğrafları' }
      ];
      const localStaff = localStorage.getItem('sb-mock-personnel') ? JSON.parse(localStorage.getItem('sb-mock-personnel')!) : [
        { id: 'admin', full_name: 'Kemal Aydın', role: 'admin', is_active: true, phone: '0533 000 00 00', email: 'kemal@isteyonetim.com' },
        { id: '1', full_name: 'Mert Tunç', role: 'staff', is_active: true, phone: '0533 111 22 33', email: 'mert@isteyonetim.com' },
        { id: '2', full_name: 'Deniz Koç', role: 'staff', is_active: true, phone: '0532 444 55 66', email: 'deniz@isteyonetim.com' }
      ];

      setTasks(localTasks);
      setProjects(localProjects);
      setCustomers(localCustomers);
      setFinance(localFinance);
      setServiceTickets(localService);
      setOffers(localOffers);
      setMessages(localMessages);
      setProfiles(localStaff);
    } else {
      try {
        const { data: t } = await supabase.from('tasks').select('*, profiles(full_name), projects(name)').order('created_at', { ascending: false });
        if (t) setTasks(t);

        const { data: p } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (p) setProjects(p);

        const { data: c } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (c) setCustomers(c);

        const { data: f } = await supabase.from('finance_transactions').select('*').order('transaction_date', { ascending: false });
        if (f) setFinance(f);

        const { data: s } = await supabase.from('service_tickets').select('*, customers(company_name), profiles(full_name)').order('created_at', { ascending: false });
        if (s) setServiceTickets(s);

        const { data: m } = await supabase.from('messages').select('*, profiles!messages_sender_id_fkey(full_name)').order('created_at', { ascending: false });
        if (m) setMessages(m);

        const { data: pr } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
        if (pr) setProfiles(pr);

        const { data: o } = await supabase.from('offers').select('*, customers(company_name)').order('created_at', { ascending: false });
        if (o) setOffers(o);
      } catch (err) {
        console.error("Data load error", err);
      }
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn, screen]);

  const go = (target: string) => {
    setPrevScreen(screen);
    setScreen(target);
    setEditingId(null);
    clearFormFields();
  };

  const clearFormFields = () => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskProjId('');
    setTaskAssignedTo('');
    setTaskPriority('medium');
    setTaskDueDate('');

    setProjName('');
    setProjDesc('');
    setProjStartDate('');
    setProjEndDate('');
    setProjStatus('pending');

    setCustCompany('');
    setCustContact('');
    setCustEmail('');
    setCustPhone('');
    setCustAddress('');

    setOfferTitle('');
    setOfferCustId('');
    setOfferStatus('draft');
    setOfferItems([{ product: '', description: '', qty: 1, price: 0, vat: 20 }]);

    setFinType('expense');
    setFinCategory('other');
    setFinAmount('');
    setFinDesc('');
    setFinDate(new Date().toISOString().substring(0, 10));

    setServCustId('');
    setServStaffId('');
    setServDesc('');
    setServStatus('unresolved');

    setMsgReceiverId('');
    setMsgSubject('');
    setMsgBody('');

    setStaffName('');
    setStaffEmail('');
    setStaffPhone('');
    setStaffRole('staff');
    setStaffActive('true');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMockMode()) {
      localStorage.setItem('sb-mock-logged-in', 'true');
      setIsLoggedIn(true);
      const adminProfile = { id: 'admin', full_name: 'Fatih Akyıldız', role: 'admin', company_name: 'Aydın Teknoloji A.Ş.', email: 'fatih@isteyonetim.com', phone: '0533 000 00 00' };
      setCurrentUserProfile(adminProfile);
      setProfileNameInput(adminProfile.full_name);
      setProfilePhoneInput(adminProfile.phone);
      setProfileCompanyInput(adminProfile.company_name);
      go('home');
    } else {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              full_name: registerName,
              company_name: registerCompany,
              role: 'admin'
            }
          }
        });
        if (error) {
          alert('Kayıt Hatası: ' + error.message);
        } else {
          alert('Kayıt başarılı! Giriş yapılıyor...');
          setIsLoggedIn(true);
          if (data.user) loadUserProfile(data.user.id);
          go('home');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword
        });
        if (error) {
          alert('Giriş Hatası: ' + error.message);
        } else {
          setIsLoggedIn(true);
          if (data.user) loadUserProfile(data.user.id);
          go('home');
        }
      }
    }
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    if (isMockMode()) {
      localStorage.setItem('sb-mock-logged-in', 'false');
      setIsLoggedIn(false);
    } else {
      await supabase.auth.signOut();
      setIsLoggedIn(false);
    }
  };

  const getTenantId = async () => {
    let tenantId = currentUserProfile?.tenant_id;
    if (!tenantId && !isMockMode()) {
      const { data: { user } } = await supabase.auth.getUser();
      tenantId = user?.user_metadata?.tenant_id;
      if (!tenantId) {
        const { data: profileData } = await supabase.from('profiles').select('tenant_id').eq('id', user?.id).single();
        tenantId = profileData?.tenant_id;
      }
    }
    return tenantId;
  };

  // Live itemized offer calculator
  const calculateOfferTotals = (items: OfferItem[]) => {
    let subTotal = 0;
    let vatTotal = 0;
    const vatRates: Record<number, number> = {};

    items.forEach(i => {
      const lineTotal = i.qty * i.price;
      const lineVat = lineTotal * (i.vat / 100);
      subTotal += lineTotal;
      vatTotal += lineVat;
      vatRates[i.vat] = (vatRates[i.vat] || 0) + lineVat;
    });

    return {
      subTotal,
      vatTotal,
      vatRates,
      grandTotal: subTotal + vatTotal
    };
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totals = calculateOfferTotals(offerItems);

    if (isMockMode()) {
      let updatedList = [];
      const idStr = editingId || Math.random().toString(36).substring(2, 9);
      if (screen === 'taskNew') {
        const saved = localStorage.getItem('sb-mock-tasks') ? JSON.parse(localStorage.getItem('sb-mock-tasks')!) : [...tasks];
        const assignedProfile = profiles.find(p => p.id === taskAssignedTo);
        const projectObj = projects.find(p => p.id === taskProjId);
        const newItem = {
          id: idStr,
          title: taskTitle,
          description: taskDesc,
          project_id: taskProjId,
          assigned_to: taskAssignedTo,
          priority: taskPriority,
          due_date: taskDueDate,
          status: 'todo',
          profiles: assignedProfile ? { full_name: assignedProfile.full_name } : null,
          projects: projectObj ? { name: projectObj.name } : null
        };
        updatedList = editingId ? saved.map((t: any) => t.id === editingId ? { ...t, ...newItem } : t) : [newItem, ...saved];
        localStorage.setItem('sb-mock-tasks', JSON.stringify(updatedList));
      } else if (screen === 'projNew') {
        const saved = localStorage.getItem('sb-mock-projects') ? JSON.parse(localStorage.getItem('sb-mock-projects')!) : [...projects];
        const newItem = { id: idStr, name: projName, description: projDesc, start_date: projStartDate, end_date: projEndDate, status: projStatus };
        updatedList = editingId ? saved.map((p: any) => p.id === editingId ? { ...p, ...newItem } : p) : [newItem, ...saved];
        localStorage.setItem('sb-mock-projects', JSON.stringify(updatedList));
      } else if (screen === 'custNew') {
        const saved = localStorage.getItem('sb-mock-customers') ? JSON.parse(localStorage.getItem('sb-mock-customers')!) : [...customers];
        const newItem = { id: idStr, company_name: custCompany, contact_name: custContact, email: custEmail, phone: custPhone, address: custAddress };
        updatedList = editingId ? saved.map((c: any) => c.id === editingId ? { ...c, ...newItem } : c) : [newItem, ...saved];
        localStorage.setItem('sb-mock-customers', JSON.stringify(updatedList));
      } else if (screen === 'offerNew') {
        const saved = localStorage.getItem('sb-mock-offers') ? JSON.parse(localStorage.getItem('sb-mock-offers')!) : [...offers];
        const selectedCust = customers.find(c => c.id === offerCustId);
        const newItem = { 
          id: idStr, 
          title: offerTitle, 
          customer_id: offerCustId, 
          customer_name: selectedCust ? selectedCust.company_name : 'Bilinmeyen Müşteri', 
          total_amount: totals.grandTotal, 
          status: offerStatus, 
          created_at: offerDate, 
          valid_until: offerValidDate,
          items: offerItems 
        };
        updatedList = editingId ? saved.map((o: any) => o.id === editingId ? { ...o, ...newItem } : o) : [newItem, ...saved];
        localStorage.setItem('sb-mock-offers', JSON.stringify(updatedList));
      } else if (screen === 'finNew') {
        const saved = localStorage.getItem('sb-mock-finance') ? JSON.parse(localStorage.getItem('sb-mock-finance')!) : [...finance];
        const newItem = { id: idStr, type: finType, category: finCategory, amount: parseFloat(finAmount) || 0, description: finDesc, transaction_date: finDate };
        updatedList = editingId ? saved.map((f: any) => f.id === editingId ? { ...f, ...newItem } : f) : [newItem, ...saved];
        localStorage.setItem('sb-mock-finance', JSON.stringify(updatedList));
      } else if (screen === 'servNew') {
        const saved = localStorage.getItem('sb-mock-service') ? JSON.parse(localStorage.getItem('sb-mock-service')!) : [...serviceTickets];
        const selectedCust = customers.find(c => c.id === servCustId);
        const selectedStaff = profiles.find(p => p.id === servStaffId);
        const newItem = {
          id: idStr,
          customer_id: servCustId,
          assigned_staff_id: servStaffId,
          issue_description: servDesc,
          status: servStatus,
          created_at: new Date().toISOString().substring(0, 10),
          customers: selectedCust ? { company_name: selectedCust.company_name } : null,
          profiles: selectedStaff ? { full_name: selectedStaff.full_name } : null
        };
        updatedList = editingId ? saved.map((s: any) => s.id === editingId ? { ...s, ...newItem } : s) : [newItem, ...saved];
        localStorage.setItem('sb-mock-service', JSON.stringify(updatedList));
      } else if (screen === 'msgNew') {
        const saved = localStorage.getItem('sb-mock-messages') ? JSON.parse(localStorage.getItem('sb-mock-messages')!) : [...messages];
        const targetStaff = profiles.find(p => p.id === msgReceiverId);
        const newItem = { id: idStr, sender_id: currentUserProfile?.id || 'admin', sender_name: currentUserProfile?.full_name || 'Kemal Aydın', receiver_id: msgReceiverId, receiver_name: targetStaff ? targetStaff.full_name : 'Herkes', subject: msgSubject, body: msgBody, created_at: new Date().toISOString(), is_read: false };
        updatedList = [newItem, ...saved];
        localStorage.setItem('sb-mock-messages', JSON.stringify(updatedList));
      } else if (screen === 'staffNew') {
        const saved = localStorage.getItem('sb-mock-personnel') ? JSON.parse(localStorage.getItem('sb-mock-personnel')!) : [...profiles];
        const newItem = { id: idStr, full_name: staffName, email: staffEmail, phone: staffPhone, role: staffRole, is_active: staffActive === 'true' };
        updatedList = editingId ? saved.map((p: any) => p.id === editingId ? { ...p, ...newItem } : p) : [newItem, ...saved];
        localStorage.setItem('sb-mock-personnel', JSON.stringify(updatedList));
      }
      alert('İşlem başarıyla kaydedildi.');
      loadData();
      go(prevScreen);
    } else {
      const tenantId = await getTenantId();
      if (!tenantId) {
        alert('Hata: Şirket kodunuz (tenant_id) bulunamadı.');
        return;
      }

      try {
        if (screen === 'taskNew') {
          if (editingId) {
            await supabase.from('tasks').update({ title: taskTitle, description: taskDesc, project_id: taskProjId || null, assigned_to: taskAssignedTo || null, priority: taskPriority, due_date: taskDueDate || null }).eq('id', editingId);
          } else {
            await supabase.from('tasks').insert({ tenant_id: tenantId, title: taskTitle, description: taskDesc, project_id: taskProjId || null, assigned_to: taskAssignedTo || null, priority: taskPriority, due_date: taskDueDate || null });
          }
        } else if (screen === 'projNew') {
          if (editingId) {
            await supabase.from('projects').update({ name: projName, description: projDesc, start_date: projStartDate || null, end_date: projEndDate || null, status: projStatus }).eq('id', editingId);
          } else {
            await supabase.from('projects').insert({ tenant_id: tenantId, name: projName, description: projDesc, start_date: projStartDate || null, end_date: projEndDate || null, status: projStatus });
          }
        } else if (screen === 'custNew') {
          if (editingId) {
            await supabase.from('customers').update({ company_name: custCompany, contact_name: custContact, email: custEmail, phone: custPhone, address: custAddress }).eq('id', editingId);
          } else {
            await supabase.from('customers').insert({ tenant_id: tenantId, company_name: custCompany, contact_name: custContact, email: custEmail, phone: custPhone, address: custAddress });
          }
        } else if (screen === 'offerNew') {
          if (editingId) {
            await supabase.from('offers').update({ title: offerTitle, customer_id: offerCustId || null, total_amount: totals.grandTotal, status: offerStatus, items: offerItems, created_at: offerDate, valid_until: offerValidDate }).eq('id', editingId);
          } else {
            await supabase.from('offers').insert({ tenant_id: tenantId, title: offerTitle, customer_id: offerCustId || null, total_amount: totals.grandTotal, status: offerStatus, items: offerItems, created_at: offerDate, valid_until: offerValidDate });
          }
        } else if (screen === 'finNew') {
          if (editingId) {
            await supabase.from('finance_transactions').update({ type: finType, category: finCategory, amount: parseFloat(finAmount) || 0, description: finDesc, transaction_date: finDate }).eq('id', editingId);
          } else {
            await supabase.from('finance_transactions').insert({ tenant_id: tenantId, type: finType, category: finCategory, amount: parseFloat(finAmount) || 0, description: finDesc, transaction_date: finDate });
          }
        } else if (screen === 'servNew') {
          if (editingId) {
            await supabase.from('service_tickets').update({ customer_id: servCustId || null, assigned_staff_id: servStaffId || null, issue_description: servDesc, status: servStatus }).eq('id', editingId);
          } else {
            await supabase.from('service_tickets').insert({ tenant_id: tenantId, customer_id: servCustId || null, assigned_staff_id: servStaffId || null, issue_description: servDesc, status: servStatus });
          }
        } else if (screen === 'msgNew') {
          await supabase.from('messages').insert({ tenant_id: tenantId, sender_id: currentUserProfile.id, receiver_id: msgReceiverId || null, subject: msgSubject, body: msgBody });
        } else if (screen === 'staffNew') {
          if (editingId) {
            await supabase.from('profiles').update({ full_name: staffName, email: staffEmail, phone: staffPhone, role: staffRole, is_active: staffActive === 'true' }).eq('id', editingId);
          } else {
            alert('Supabase daveti yoluyla kullanıcı davet edilmelidir.');
          }
        }
        alert('İşlem başarıyla kaydedildi.');
        loadData();
        go(prevScreen);
      } catch (err: any) {
        alert('Hata: ' + err.message);
      }
    }
  };

  const handleEditInit = (itemType: string, item: any) => {
    setEditingId(item.id);
    setPrevScreen(screen);
    if (itemType === 'task') {
      setTaskTitle(item.title);
      setTaskDesc(item.description || '');
      setTaskProjId(item.project_id || '');
      setTaskAssignedTo(item.assigned_to || '');
      setTaskPriority(item.priority);
      setTaskDueDate(item.due_date || '');
      setScreen('taskNew');
    } else if (itemType === 'project') {
      setProjName(item.name);
      setProjDesc(item.description || '');
      setProjStartDate(item.start_date || '');
      setProjEndDate(item.end_date || '');
      setProjStatus(item.status);
      setScreen('projNew');
    } else if (itemType === 'customer') {
      setCustCompany(item.company_name);
      setCustContact(item.contact_name || '');
      setCustEmail(item.email || '');
      setCustPhone(item.phone || '');
      setCustAddress(item.address || '');
      setScreen('custNew');
    } else if (itemType === 'offer') {
      setOfferTitle(item.title);
      setOfferCustId(item.customer_id || '');
      setOfferStatus(item.status);
      setOfferDate(item.created_at || new Date().toISOString().substring(0, 10));
      setOfferValidDate(item.valid_until || '');
      setOfferItems(item.items || [{ product: '', description: '', qty: 1, price: 0, vat: 20 }]);
      setScreen('offerNew');
    } else if (itemType === 'finance') {
      setFinType(item.type);
      setFinCategory(item.category);
      setFinAmount(String(item.amount || ''));
      setFinDesc(item.description || '');
      setFinDate(item.transaction_date || '');
      setScreen('finNew');
    } else if (itemType === 'service') {
      setServCustId(item.customer_id || '');
      setServStaffId(item.assigned_staff_id || '');
      setServDesc(item.issue_description || '');
      setServStatus(item.status);
      setScreen('servNew');
    } else if (itemType === 'staff') {
      setStaffName(item.full_name);
      setStaffEmail(item.email || '');
      setStaffPhone(item.phone || '');
      setStaffRole(item.role || 'staff');
      setStaffActive(String(item.is_active));
      setScreen('staffNew');
    }
  };

  const handleDeleteItem = async (table: string, id: string) => {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    if (isMockMode()) {
      let key = '';
      if (table === 'tasks') key = 'sb-mock-tasks';
      else if (table === 'projects') key = 'sb-mock-projects';
      else if (table === 'customers') key = 'sb-mock-customers';
      else if (table === 'offers') key = 'sb-mock-offers';
      else if (table === 'finance_transactions') key = 'sb-mock-finance';
      else if (table === 'service_tickets') key = 'sb-mock-service';
      else if (table === 'profiles') key = 'sb-mock-personnel';

      const saved = localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)!) : [];
      const updated = saved.filter((i: any) => i.id !== id);
      localStorage.setItem(key, JSON.stringify(updated));
      loadData();
    } else {
      try {
        await supabase.from(table).delete().eq('id', id);
        loadData();
      } catch (err: any) {
        alert('Silme hatası: ' + err.message);
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMockMode()) {
      const updatedProfile = { 
        ...currentUserProfile, 
        full_name: profileNameInput, 
        phone: profilePhoneInput, 
        company_name: profileCompanyInput 
      };
      setCurrentUserProfile(updatedProfile);
      mockData.profile = updatedProfile;
      alert('Kişisel/Firma bilgileri güncellendi.');
      setSubSettingView(null);
    } else {
      try {
        await supabase.from('profiles').update({ full_name: profileNameInput, phone: profilePhoneInput }).eq('id', currentUserProfile.id);
        await supabase.from('tenants').update({ name: profileCompanyInput }).eq('id', currentUserProfile.tenant_id);
        alert('Bilgiler Supabase üzerinde başarıyla güncellendi.');
        setSubSettingView(null);
        loadUserProfile(currentUserProfile.id);
      } catch (e: any) {
        alert('Güncelleme hatası: ' + e.message);
      }
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMockMode()) {
      alert('Şifre simüle olarak güncellendi.');
      setSubSettingView(null);
    } else {
      const { error } = await supabase.auth.updateUser({ password: profilePasswordInput });
      if (error) {
        alert('Şifre güncellenemedi: ' + error.message);
      } else {
        alert('Şifre başarıyla güncellendi.');
        setSubSettingView(null);
      }
    }
  };

  const toggleSubmenu = (label: string) => {
    setOpenMenus({
      [label]: !openMenus[label]
    });
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (isMockMode()) {
      const saved = localStorage.getItem('sb-mock-tasks') ? JSON.parse(localStorage.getItem('sb-mock-tasks')!) : [...tasks];
      const updated = saved.map((t: any) => t.id === taskId ? { ...t, status: newStatus } : t);
      localStorage.setItem('sb-mock-tasks', JSON.stringify(updated));
      loadData();
    } else {
      try {
        await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
        loadData();
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  const handleServiceStatusChange = async (ticketId: string, newStatus: string) => {
    if (isMockMode()) {
      const saved = localStorage.getItem('sb-mock-service') ? JSON.parse(localStorage.getItem('sb-mock-service')!) : [...serviceTickets];
      const updated = saved.map((t: any) => t.id === ticketId ? { ...t, status: newStatus } : t);
      localStorage.setItem('sb-mock-service', JSON.stringify(updated));
      loadData();
    } else {
      try {
        await supabase.from('service_tickets').update({ status: newStatus }).eq('id', ticketId);
        loadData();
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  // Dynamic filter lists using Search and Chips
  const filterBySearch = (arr: any[], fields: string[]) => {
    if (!searchQuery) return arr;
    return arr.filter(item => 
      fields.some(field => {
        const val = item[field];
        return val && String(val).toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
  };

  const currentThemeClass = toggleDarkTheme ? 'theme-dark' : '';

  // PDF Generator for Invoice/Offer
  const handlePrintPDF = (o: any) => {
    const calc = calculateOfferTotals(o.items || []);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${o.title}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #101E33; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #E7EBF2; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 800; color: #EE6C5A; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .details div { font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #FAFBFD; padding: 12px; font-size: 12px; text-transform: uppercase; color: #54617A; font-weight: 800; text-align: left; }
            td { padding: 12px; border-bottom: 1px solid #EEF1F6; font-size: 13.5px; }
            .totals { float: right; width: 300px; margin-top: 20px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .totals-row.grand { border-top: 2px solid #101E33; font-weight: 800; font-size: 16px; margin-top: 8px; }
            .footer { position: fixed; bottom: 30px; left: 40px; right: 40px; text-align: center; border-top: 1px solid #E7EBF2; padding-top: 15px; font-size: 11px; color: #94A0B4; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">İŞte Yönetim</div>
              <div style="font-size: 12px; color: #54617A; margin-top: 4px;">Fatura & Teklif Formu</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 16px; font-weight: 800;">TEKLİF: #${o.id}</div>
              <div style="font-size: 13px; color: #54617A; margin-top: 4px;">Tarih: ${o.created_at}</div>
            </div>
          </div>

          <div class="details">
            <div>
              <strong>TEKLİF VEREN</strong>
              <div style="margin-top: 6px;">${currentUserProfile?.company_name || 'Aydın Teknoloji A.Ş.'}</div>
              <div>Yetkili: ${currentUserProfile?.full_name || 'Fatih Akyıldız'}</div>
              <div>E-posta: ${currentUserProfile?.email || 'fatih@isteyonetim.com'}</div>
            </div>
            <div style="text-align: right;">
              <strong>MÜŞTERİ (ALICI)</strong>
              <div style="margin-top: 6px;">${o.customer_name || 'Bilinmeyen Müşteri'}</div>
              <div>Geçerlilik: ${o.valid_until || '-'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Ürün / Hizmet</th>
                <th>Açıklama</th>
                <th style="text-align: center;">Miktar</th>
                <th style="text-align: right;">Birim Fiyat</th>
                <th style="text-align: center;">KDV</th>
                <th style="text-align: right;">Toplam</th>
              </tr>
            </thead>
            <tbody>
              ${(o.items || []).map((i: any) => `
                <tr>
                  <td><strong>${i.product}</strong></td>
                  <td>${i.description || '-'}</td>
                  <td style="text-align: center;">${i.qty}</td>
                  <td style="text-align: right;">${i.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                  <td style="text-align: center;">%${i.vat}</td>
                  <td style="text-align: right;">${(i.qty * i.price * (1 + i.vat/100)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Ara Toplam (KDV Hariç)</span>
              <span>${calc.subTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
            </div>
            ${Object.entries(calc.vatRates).map(([rate, amount]) => `
              <div class="totals-row">
                <span>KDV (%${rate})</span>
                <span>${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
              </div>
            `).join('')}
            <div class="totals-row grand">
              <span>Genel Toplam</span>
              <span>${calc.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
            </div>
          </div>

          <div class="footer">
            Bu teklif İşteYönetim bulut portalı tarafından dijital olarak oluşturulmuştur.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleTriggerPayment = () => {
    alert('iyzico ödeme sayfasına yönlendiriliyorsunuz... (Simüle ödeme tamamlandı!)');
    alert('Ödeme başarıyla doğrulandı! Aboneliğiniz aktif edilmiştir.');
    setCurrentUserProfile((prev: any) => ({ ...prev, plan_type: 'premium' }));
  };

  const cur = SCREENS[screen] || SCREENS.home;
  const isHome = screen === 'home';
  const isForm = cur.kind === 'form';

  return (
    <div className={currentThemeClass} style={{ minHeight: '100vh', display: 'flex', width: '100vw', background: 'var(--bg-color, #F4F6FA)' }}>
      
      {/* Dark Theme Variables style sheet */}
      <style>{`
        .theme-dark {
          --bg-color: #0b132b;
          --card-bg: #1c2541;
          --border-color: #2b3a67;
          --text-color: #ffffff;
          --text-muted: #8da9c4;
          --input-bg: #1c2541;
          --th-bg: #101e33;
        }
        .theme-dark input, .theme-dark select, .theme-dark textarea {
          background-color: var(--input-bg) !important;
          color: var(--text-color) !important;
          border-color: var(--border-color) !important;
        }
        .theme-dark tr:hover {
          background-color: rgba(255,255,255,0.03) !important;
        }
        .theme-dark table th {
          background-color: var(--th-bg) !important;
          color: var(--text-muted) !important;
        }
        .theme-dark table td {
          border-color: var(--border-color) !important;
          color: var(--text-color) !important;
        }
        .theme-dark div, .theme-dark table, .theme-dark strong {
          color: var(--text-color);
        }
        .theme-dark span, .theme-dark label, .theme-dark p {
          color: var(--text-muted);
        }
        .theme-dark .sc-card {
          background-color: var(--card-bg) !important;
          border-color: var(--border-color) !important;
        }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: '264px', flex: 'none', background: '#101E33', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '22px 20px 18px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: '#fff', overflow: 'hidden', position: 'relative', flex: 'none' }}>
            <img src="uploads/isteyonetim_logo.png" alt="İŞte Yönetim" style={{ position: 'absolute', width: '114px', maxWidth: 'none', left: '-35px', top: '-4px' }} />
          </div>
          <div>
            <div style={{ fontSize: '15.5px', fontWeight: 800, color: '#fff', letterSpacing: '-.2px' }}>İŞte Yönetim</div>
            <div style={{ fontSize: '11px', color: '#8497B5', fontWeight: 600, marginTop: '2px' }}>Yönetim Paneli v2.5</div>
          </div>
        </div>

        <div className="sc" style={{ flex: 1, overflowY: 'auto', padding: '14px 12px 18px' }}>
          {MENU.map((m, idx) => {
            const hasSub = !!m.children;
            const isOpen = openMenus[m.label];
            const active = m.screen === screen || (m.children || []).some(c => c[1] === screen);

            return (
              <div key={idx} style={{ marginBottom: '3px' }}>
                <div 
                  onClick={() => hasSub ? toggleSubmenu(m.label) : go(m.screen!)} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '11px', 
                    padding: '10px 11px', 
                    borderRadius: '11px', 
                    cursor: 'pointer', 
                    background: active && !hasSub ? 'rgba(255,255,255,.09)' : 'transparent' 
                  }}
                >
                  <div style={{ width: '28px', height: '28px', flex: 'none', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11.5px', fontWeight: 800, background: active ? 'linear-gradient(135deg,#EE6C5A,#F5A05A)' : 'rgba(255,255,255,.07)', color: active ? '#fff' : '#8497B5' }}>{m.mark}</div>
                  <div style={{ flex: 1, fontSize: '13.5px', fontWeight: 700, color: active ? '#fff' : '#C6D1E2' }}>{m.label}</div>
                  {hasSub && (
                    <svg width="11" height="11" viewBox="0 0 12 12" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} fill="none">
                      <path d="m3 4.5 3 3 3-3" stroke="#5F7092" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                {hasSub && isOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', padding: '2px 0 5px 50px' }}>
                    {m.children!.map(([label, key]) => (
                      <div 
                        key={key}
                        onClick={() => go(key)} 
                        style={{ 
                          fontSize: '12.5px', 
                          fontWeight: 600, 
                          color: key === screen ? '#fff' : '#8497B5', 
                          padding: '7px 10px', 
                          borderRadius: '8px', 
                          cursor: 'pointer', 
                          background: key === screen ? 'rgba(238,108,90,.22)' : 'transparent' 
                        }}
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.09)', borderRadius: '14px', padding: '13px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#fff' }}>Profesyonel Plan</div>
            <div style={{ fontSize: '11px', color: '#8497B5', fontWeight: 600, marginTop: '3px' }}>{profiles.filter(p => p.is_active).length} aktif kullanıcı</div>
            <div style={{ height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,.12)', marginTop: '9px', overflow: 'hidden' }}>
              <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg,#EE6C5A,#F5A05A)' }}></div>
            </div>
          </div>
          <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px', marginTop: '8px', borderRadius: '11px', cursor: 'pointer', color: '#F58C78', fontSize: '13.5px', fontWeight: 700 }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M6 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H6M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Çıkış Yap
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ flex: 'none', height: '72px', background: 'var(--card-bg, #fff)', borderBottom: '1px solid var(--border-color, #E7EBF2)', display: 'flex', alignItems: 'center', gap: '16px', padding: '0 26px', position: 'relative' }}>
          <div style={{ flex: 'none', minWidth: '210px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A0B4', letterSpacing: '.7px', textTransform: 'uppercase' }}>{cur.eyebrow}</div>
            <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-color, #101E33)', letterSpacing: '-.4px' }}>{cur.title}</div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '380px', maxWidth: '100%', flexShrink: 1, minWidth: 0, height: '42px', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-color, #F4F6FA)', border: '1px solid var(--border-color, #E7EBF2)', borderRadius: '12px', padding: '0 14px' }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5.2" stroke="#94A0B4" strokeWidth="1.8"/><path d="m11 11 3.2 3.2" stroke="#94A0B4" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <input 
                placeholder="Ara..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '13.5px', color: 'var(--text-color, #101E33)', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Notifications Bell */}
            <div 
              onClick={() => setShowNotifications(!showNotifications)} 
              style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border-color, #E7EBF2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}
            >
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M9 2a5 5 0 0 0-5 5v3l-1.4 2.2A.5.5 0 0 0 3 13h12a.5.5 0 0 0 .4-.8L14 10V7a5 5 0 0 0-5-5Z" stroke="#54617A" strokeWidth="1.6" strokeLinejoin="round"/><path d="M7 15a2 2 0 0 0 4 0" stroke="#54617A" strokeWidth="1.6" strokeLinecap="round"/></svg>
              <div style={{ position: 'absolute', top: '8px', right: '9px', width: '8px', height: '8px', borderRadius: '50%', background: '#EE6C5A', border: '2px solid #fff' }}></div>
            </div>

            {/* Profile Dropdown */}
            <div 
              onClick={() => setShowProfileMenu(!showProfileMenu)} 
              style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '12px', borderLeft: '1px solid var(--border-color, #E7EBF2)', cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg,#EE6C5A,#F5A05A)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800 }}>
                {currentUserProfile?.full_name?.substring(0, 2).toUpperCase() || 'KA'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>{currentUserProfile?.full_name || 'Fatih Akyıldız'}</div>
                <div style={{ fontSize: '11px', color: '#94A0B4', fontWeight: 600 }}>{currentUserProfile?.role === 'admin' ? 'Yönetici' : 'Personel'}</div>
              </div>
            </div>
          </div>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div style={{ position: 'absolute', top: '72px', right: '26px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #E7EBF2)', borderRadius: '12px', boxShadow: '0 12px 30px rgba(16,30,51,0.1)', width: '180px', padding: '8px', zIndex: 10 }}>
              <div 
                onClick={() => { go('msgInbox'); setShowProfileMenu(false); }} 
                style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-color, #101E33)', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
              >
                📥 Gelen Mesajlar
              </div>
              <div 
                onClick={() => { go('account'); setShowProfileMenu(false); }} 
                style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-color, #101E33)', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
              >
                ⚙️ Hesap Ayarları
              </div>
              <div 
                onClick={() => { alert('Canlı destek merkezine hoş geldiniz. Bize destek@isteyonetim.com üzerinden ulaşabilirsiniz.'); setShowProfileMenu(false); }} 
                style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-color, #101E33)', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
              >
                ❓ Destek ve Yardım
              </div>
              <div style={{ height: '1px', background: 'var(--border-color, #EEF1F6)', margin: '6px 0' }} />
              <div 
                onClick={handleLogout} 
                style={{ padding: '10px 12px', fontSize: '13px', color: '#D8503D', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
              >
                🚪 Çıkış Yap
              </div>
            </div>
          )}

          {/* Notifications Popover */}
          {showNotifications && (
            <div style={{ position: 'absolute', top: '72px', right: '180px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #E7EBF2)', borderRadius: '16px', boxShadow: '0 12px 35px rgba(16,30,51,0.15)', width: '320px', padding: '16px', zIndex: 10 }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-color, #101E33)', marginBottom: '10px' }}>Bildirimler</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>Yeni Görev Atandı</div>
                  <div style={{ fontSize: '11px', color: '#7A8699', marginTop: '2px' }}>Kule Plaza klima bakımı görevi size atandı.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Body */}
        <div className="sc" style={{ flex: 1, overflowY: 'auto', padding: '22px 26px 30px' }}>
          
          {/* Giriş Paneli (Home) */}
          {isHome && (
            <div style={{ animation: 'fadeUp .3s ease' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {[
                  { mark: 'GÖ', value: String(tasks.filter(t => t.status !== 'done').length), label: 'Açık Görev', delta: 'Güncel', bg: '#FEF0EC', fg: '#D8503D', target: 'taskList' },
                  { mark: 'PR', value: String(projects.filter(p => p.status === 'active').length), label: 'Aktif Proje', delta: 'Devam Eden', bg: '#E9F0FD', fg: '#2C5AA8', target: 'projList' },
                  { mark: 'TK', value: formatTRYRight(offers.reduce((acc, o) => acc + (o.total_amount || 0), 0)), label: 'Toplam Teklif Hacmi', delta: 'Bekleyenler Dahil', bg: '#FEF3E2', fg: '#B87514', target: 'offerList' },
                  { mark: 'TS', value: String(serviceTickets.filter(s => s.status !== 'resolved').length), label: 'Açık Servis Kaydı', delta: 'Müdahale Bekleyen', bg: '#E7F6EF', fg: '#1F8A5F', target: 'servList' }
                ].map((s, idx) => (
                  <div key={idx} onClick={() => go(s.target)} className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '18px', padding: '18px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13.5px', fontWeight: 800, background: s.bg, color: s.fg }}>{s.mark}</div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#1F8A5F', background: '#E7F6EF', padding: '4px 8px', borderRadius: '8px' }}>{s.delta}</div>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-color, #101E33)', marginTop: '14px', letterSpacing: '-1px' }}>{s.value}</div>
                    <div style={{ fontSize: '12.5px', color: '#7A8699', fontWeight: 600, marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '16px', marginTop: '16px' }}>
                {/* Gelir / Gider Grafiği */}
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>Aylık Finansal Akış</div>
                      <div style={{ fontSize: '12px', color: '#94A0B4', fontWeight: 600, marginTop: '3px' }}>Son aylar nakit akış özeti</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '18px', height: '210px', marginTop: '22px', padding: '0 4px' }}>
                    {[
                      ['Şub', 55, 50], ['Mar', 84, 58], ['Nis', 76, 52], ['May', 92, 61], ['Haz', 88, 57], ['Tem', 100, 66]
                    ].map(([label, inc, exp], idx) => (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '9px' }}>
                        <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '5px', height: '180px' }}>
                          <div style={{ width: '14px', borderRadius: '5px 5px 0 0', background: '#101E33', height: inc + '%' }}></div>
                          <div style={{ width: '14px', borderRadius: '5px 5px 0 0', background: 'linear-gradient(180deg,#F5A05A,#EE6C5A)', height: exp + '%' }}></div>
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A0B4' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gelen Son Mesajlar */}
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-color, #101E33)', marginBottom: '12px' }}>Gelen Son Mesajlar</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {messages.slice(0, 3).map((m) => (
                      <div key={m.id} onClick={() => { setViewingMsg(m); go('msgDetail'); }} style={{ display: 'flex', gap: '11px', padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color, #EEF1F6)', cursor: 'pointer' }}>
                        <div style={{ width: '36px', height: '36px', flex: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 800, background: '#E9F0FD', color: '#2C5AA8' }}>
                          {m.sender_name?.substring(0, 2).toUpperCase() || 'MS'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>{m.sender_name || 'Ayşe Yıldırım'}</div>
                            <div style={{ fontSize: '10.5px', color: '#94A0B4' }}>{new Date(m.created_at).toLocaleDateString('tr-TR')}</div>
                          </div>
                          <div style={{ fontSize: '12px', color: '#7A8699', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{m.body}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div onClick={() => go('msgInbox')} style={{ marginTop: 'auto', textAlign: 'center', fontSize: '12.5px', fontWeight: 800, color: '#EE6C5A', cursor: 'pointer', paddingTop: '12px' }}>Tüm mesajlar</div>
                </div>
              </div>

              {/* Bugünün Görevleri ve Servis Talepleri (Dashboard) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>Bugünün Görevleri</div>
                    <div onClick={() => go('taskList')} style={{ fontSize: '12.5px', fontWeight: 800, color: '#EE6C5A', cursor: 'pointer' }}>Tümü</div>
                  </div>
                  {tasks.slice(0, 4).map((t, idx) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: idx < 3 ? '1px solid var(--border-color, #EEF1F6)' : 'none' }}>
                      <div style={{ width: '6px', height: '24px', borderRadius: '3px', background: t.priority === 'high' ? '#EE6C5A' : '#F5A05A' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>{t.title}</div>
                        <div style={{ fontSize: '11px', color: '#7A8699', marginTop: '2px' }}>{t.profiles?.full_name || 'Atanmadı'}</div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', ...badge(t.status === 'done' ? 'Tamamlandı' : 'Açık', t.status === 'done' ? 'ok' : 'info') }}>{t.status === 'done' ? 'Tamamlandı' : 'Açık'}</span>
                    </div>
                  ))}
                </div>

                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>Açık Servis Kayıtları</div>
                    <div onClick={() => go('servList')} style={{ fontSize: '12.5px', fontWeight: 800, color: '#EE6C5A', cursor: 'pointer' }}>Tümü</div>
                  </div>
                  {serviceTickets.slice(0, 4).map((s, idx) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: idx < 3 ? '1px solid var(--border-color, #EEF1F6)' : 'none' }}>
                      <div style={{ width: '6px', height: '24px', borderRadius: '3px', background: '#1F8A5F' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>{s.issue_description}</div>
                        <div style={{ fontSize: '11px', color: '#7A8699', marginTop: '2px' }}>{s.customers?.company_name || s.customer_name || 'Müşteri'}</div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', ...badge(s.status === 'resolved' ? 'Çözüldü' : 'Açık', s.status === 'resolved' ? 'ok' : 'hot') }}>{s.status === 'resolved' ? 'Çözüldü' : 'Açık'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Görev Listesi */}
          {screen === 'taskList' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A0B4' }}>Yapılacak Görevler</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#D8503D', marginTop: '6px' }}>{tasks.filter(t => t.status === 'todo').length}</div>
                </div>
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A0B4' }}>Devam Edenler</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#2C5AA8', marginTop: '6px' }}>{tasks.filter(t => t.status === 'in_progress').length}</div>
                </div>
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A0B4' }}>Tamamlanan / Onaylanan</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#1F8A5F', marginTop: '6px' }}>{tasks.filter(t => t.status === 'done' || t.status === 'approved').length}</div>
                </div>
              </div>
              <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                  <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    {['Tümü', 'Yapılacak', 'Devam Ediyor', 'Tamamlandı'].map((chip) => (
                      <div 
                        key={chip} 
                        onClick={() => setActiveChip(chip)}
                        style={{ padding: '8px 14px', borderRadius: '11px', fontSize: '12.5px', fontWeight: 700, border: `1px solid ${activeChip === chip ? '#101E33' : '#E4E9F1'}`, background: activeChip === chip ? '#101E33' : '#fff', color: activeChip === chip ? '#fff' : '#54617A', cursor: 'pointer' }}
                      >
                        {chip}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => go('taskNew')} style={{ height: '38px', padding: '0 16px', border: 'none', borderRadius: '11px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
                    + Yeni Görev Oluştur
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#FAFBFD', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                        <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Görev Adı</th>
                        <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Proje</th>
                        <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Sorumlu</th>
                        <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Son Tarih</th>
                        <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Öncelik</th>
                        <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Durum</th>
                        <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4', textAlign: 'right' }}>Aksiyon</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterBySearch(tasks, ['title', 'description']).filter(t => {
                        if (activeChip === 'Tümü') return true;
                        if (activeChip === 'Yapılacak') return t.status === 'todo';
                        if (activeChip === 'Devam Ediyor') return t.status === 'in_progress';
                        if (activeChip === 'Tamamlandı') return t.status === 'done' || t.status === 'approved';
                        return true;
                      }).map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color, #F3F5F9)' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <strong style={{ fontSize: '13.5px', color: 'var(--text-color, #101E33)', display: 'block' }}>{t.title}</strong>
                            <span style={{ fontSize: '11.5px', color: '#7A8699' }}>{t.description || 'Detay yok'}</span>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: '13px', color: '#54617A' }}>{t.projects?.name || 'Bağımsız'}</td>
                          <td style={{ padding: '14px 20px', fontSize: '13px', color: '#54617A' }}>{t.profiles?.full_name || 'Atanmadı'}</td>
                          <td style={{ padding: '14px 20px', fontSize: '13px', color: '#54617A' }}>{t.due_date ? new Date(t.due_date).toLocaleDateString('tr-TR') : 'Belirtilmedi'}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', ...badge(t.priority === 'high' ? 'Yüksek' : t.priority === 'medium' ? 'Orta' : 'Düşük', t.priority === 'high' ? 'hot' : t.priority === 'medium' ? 'warn' : 'info') }}>
                              {t.priority === 'high' ? 'Yüksek' : t.priority === 'medium' ? 'Orta' : 'Düşük'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <select 
                              value={t.status} 
                              onChange={(e) => handleStatusChange(t.id, e.target.value)}
                              style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--border-color, #E4E9F1)', background: 'var(--input-bg, #fff)', outline: 'none' }}
                            >
                              <option value="todo">Yapılacak</option>
                              <option value="in_progress">Devam Ediyor</option>
                              <option value="done">Tamamlandı</option>
                              <option value="approved">Onaylandı</option>
                            </select>
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <button onClick={() => handleEditInit('task', t)} style={{ background: '#FEF0EC', border: 'none', color: '#D8503D', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', marginRight: '6px' }}>Düzenle</button>
                            <button onClick={() => handleDeleteItem('tasks', t.id)} style={{ background: '#EFF2F7', border: 'none', color: '#6B778C', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Sil</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Proje Listesi */}
          {screen === 'projList' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A0B4' }}>Aktif Projeler</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#1F8A5F', marginTop: '6px' }}>{projects.filter(p => p.status === 'active').length}</div>
                </div>
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A0B4' }}>Beklemede olanlar</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#B87514', marginTop: '6px' }}>{projects.filter(p => p.status === 'pending').length}</div>
                </div>
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A0B4' }}>Tamamlananlar</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#2C5AA8', marginTop: '6px' }}>{projects.filter(p => p.status === 'completed').length}</div>
                </div>
              </div>
              <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => go('projNew')} style={{ height: '38px', padding: '0 16px', border: 'none', borderRadius: '11px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
                    + Yeni Proje Oluştur
                  </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#FAFBFD', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Proje Adı</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Başlangıç Tarihi</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Bitiş Tarihi</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Durum</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4', textAlign: 'right' }}>Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterBySearch(projects, ['name', 'description']).map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color, #F3F5F9)' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <strong style={{ fontSize: '13.5px', color: 'var(--text-color, #101E33)' }}>{p.name}</strong>
                          <div style={{ fontSize: '11.5px', color: '#7A8699', marginTop: '2px' }}>{p.description || 'Detay yok'}</div>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#54617A' }}>{p.start_date || '-'}</td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#54617A' }}>{p.end_date || '-'}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', ...badge(p.status === 'completed' ? 'Tamamlandı' : p.status === 'active' ? 'Aktif' : 'Beklemede', p.status === 'completed' ? 'ok' : p.status === 'active' ? 'info' : 'warn') }}>
                            {p.status === 'completed' ? 'Tamamlandı' : p.status === 'active' ? 'Aktif' : 'Beklemede'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button onClick={() => handleEditInit('project', p)} style={{ background: '#FEF0EC', border: 'none', color: '#D8503D', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', marginRight: '6px' }}>Düzenle</button>
                          <button onClick={() => handleDeleteItem('projects', p.id)} style={{ background: '#EFF2F7', border: 'none', color: '#6B778C', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Sil</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Müşteri Listesi */}
          {screen === 'custList' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A0B4' }}>Kayıtlı Müşteri</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#2C5AA8', marginTop: '6px' }}>{customers.length}</div>
                </div>
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A0B4' }}>Aktif Servis Talebi Olan</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#EE6C5A', marginTop: '6px' }}>{Array.from(new Set(serviceTickets.filter(s => s.status === 'unresolved').map(s => s.customer_id))).length}</div>
                </div>
              </div>
              <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => go('custNew')} style={{ height: '38px', padding: '0 16px', border: 'none', borderRadius: '11px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
                    + Yeni Müşteri Ekle
                  </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#FAFBFD', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Firma Adı</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Yetkili Kişi</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>E-posta / Tel</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Adres</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4', textAlign: 'right' }}>Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterBySearch(customers, ['company_name', 'contact_name', 'email', 'phone']).map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color, #F3F5F9)' }}>
                        <td style={{ padding: '14px 20px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-color, #101E33)' }}>{c.company_name}</td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#54617A' }}>{c.contact_name || '-'}</td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#54617A' }}>
                          <div>{c.email}</div>
                          <div style={{ fontSize: '11.5px', color: '#94A0B4', marginTop: '2px' }}>{c.phone}</div>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '12.5px', color: '#7A8699' }}>{c.address || '-'}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button onClick={() => handleEditInit('customer', c)} style={{ background: '#FEF0EC', border: 'none', color: '#D8503D', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', marginRight: '6px' }}>Düzenle</button>
                          <button onClick={() => handleDeleteItem('customers', c.id)} style={{ background: '#EFF2F7', border: 'none', color: '#6B778C', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Sil</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Teklif Listesi */}
          {screen === 'offerList' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A0B4' }}>Kabul Edilen Teklifler</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#1F8A5F', marginTop: '6px' }}>{offers.filter(o => o.status === 'accepted').length}</div>
                </div>
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A0B4' }}>Bekleyenler</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#B87514', marginTop: '6px' }}>{offers.filter(o => o.status === 'sent').length}</div>
                </div>
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A0B4' }}>Taslak Durumunda</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#6B778C', marginTop: '6px' }}>{offers.filter(o => o.status === 'draft').length}</div>
                </div>
              </div>
              <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => go('offerNew')} style={{ height: '38px', padding: '0 16px', border: 'none', borderRadius: '11px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
                    + Yeni Teklif Oluştur
                  </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#FAFBFD', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Teklif Başlığı</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Müşteri</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Tarih</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Tutar</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Durum</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4', textAlign: 'right' }}>Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterBySearch(offers, ['title', 'customer_name']).map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid var(--border-color, #F3F5F9)' }}>
                        <td style={{ padding: '14px 20px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-color, #101E33)' }}>
                          <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setViewingOffer(o); go('offerDetail'); }}>{o.title}</span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#54617A' }}>{o.customers?.company_name || o.customer_name || 'Bilinmeyen'}</td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#54617A' }}>{o.created_at}</td>
                        <td style={{ padding: '14px 20px', fontSize: '13.5px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>{formatTRYRight(o.total_amount || o.amount || 0)}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', ...badge(o.status === 'accepted' ? 'Kabul Edildi' : o.status === 'sent' ? 'Gönderildi' : 'Taslak', o.status === 'accepted' ? 'ok' : o.status === 'sent' ? 'info' : 'mute') }}>
                            {o.status === 'accepted' ? 'Kabul Edildi' : o.status === 'sent' ? 'Gönderildi' : 'Taslak'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button onClick={() => handlePrintPDF(o)} style={{ background: '#E9F0FD', border: 'none', color: '#2C5AA8', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', marginRight: '6px' }}>PDF İndir</button>
                          <button onClick={() => handleEditInit('offer', o)} style={{ background: '#FEF0EC', border: 'none', color: '#D8503D', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', marginRight: '6px' }}>Düzenle</button>
                          <button onClick={() => handleDeleteItem('offers', o.id)} style={{ background: '#EFF2F7', border: 'none', color: '#6B778C', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Sil</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Teklif Detay View (PDF gibi gösterir) */}
          {screen === 'offerDetail' && viewingOffer && (
            <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '30px', animation: 'fadeUp .25s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #E7EBF2', paddingBottom: '20px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-color, #101E33)', margin: 0 }}>{viewingOffer.title}</h3>
                  <div style={{ fontSize: '12px', color: '#7A8699', marginTop: '4px' }}>Teklif Kodu: #${viewingOffer.id}</div>
                </div>
                <button onClick={() => handlePrintPDF(viewingOffer)} style={{ height: '38px', padding: '0 16px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Yazdır / PDF İndir</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div>
                  <strong>Müşteri Bilgileri</strong>
                  <div style={{ fontSize: '14px', color: 'var(--text-color, #101E33)', marginTop: '6px' }}>{viewingOffer.customer_name}</div>
                  <div style={{ fontSize: '13px', color: '#7A8699' }}>Teklif Tarihi: {viewingOffer.created_at}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>Geçerlilik Tarihi</strong>
                  <div style={{ fontSize: '14px', color: '#D8503D', marginTop: '6px', fontWeight: 700 }}>{viewingOffer.valid_until || 'Belirtilmedi'}</div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ background: '#FAFBFD', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                    <th style={{ padding: '10px', fontSize: '11px', color: '#94A0B4' }}>Ürün / Hizmet</th>
                    <th style={{ padding: '10px', fontSize: '11px', color: '#94A0B4' }}>Açıklama</th>
                    <th style={{ padding: '10px', fontSize: '11px', color: '#94A0B4', textAlign: 'center' }}>Miktar</th>
                    <th style={{ padding: '10px', fontSize: '11px', color: '#94A0B4', textAlign: 'right' }}>Birim Fiyat</th>
                    <th style={{ padding: '10px', fontSize: '11px', color: '#94A0B4', textAlign: 'center' }}>KDV</th>
                    <th style={{ padding: '10px', fontSize: '11px', color: '#94A0B4', textAlign: 'right' }}>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewingOffer.items || []).map((item: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F3F5F9' }}>
                      <td style={{ padding: '12px' }}><strong>{item.product}</strong></td>
                      <td style={{ padding: '12px', fontSize: '12.5px', color: '#7A8699' }}>{item.description}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{item.qty}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{formatTRYRight(item.price)}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>%{item.vat}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>{formatTRYRight(item.qty * item.price * (1 + item.vat / 100))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ width: '300px', marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Ara Toplam (KDV Hariç)</span>
                  <span>{formatTRYRight(calculateOfferTotals(viewingOffer.items || []).subTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>KDV Toplamı</span>
                  <span>{formatTRYRight(calculateOfferTotals(viewingOffer.items || []).vatTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800, borderTop: '1px solid #EEF1F6', paddingTop: '8px' }}>
                  <span>Genel Toplam</span>
                  <span>{formatTRYRight(viewingOffer.total_amount)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                <button type="button" onClick={() => go('offerList')} style={{ height: '40px', padding: '0 20px', border: '1.5px solid #E4E9F1', borderRadius: '10px', background: '#fff', color: '#54617A', fontWeight: 700, cursor: 'pointer' }}>Geri Dön</button>
              </div>
            </div>
          )}

          {/* Servis Listesi */}
          {screen === 'servList' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A0B4' }}>Müdahale Bekleyen Servis</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#EE6C5A', marginTop: '6px' }}>{serviceTickets.filter(s => s.status === 'unresolved').length}</div>
                </div>
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A0B4' }}>Çözülen Kayıtlar</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#1F8A5F', marginTop: '6px' }}>{serviceTickets.filter(s => s.status === 'resolved').length}</div>
                </div>
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A0B4' }}>Toplam Talep Hacmi</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#2C5AA8', marginTop: '6px' }}>{serviceTickets.length}</div>
                </div>
              </div>
              <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => go('servNew')} style={{ height: '38px', padding: '0 16px', border: 'none', borderRadius: '11px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
                    + Yeni Kayıt Aç
                  </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#FAFBFD', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Kayıt No</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Müşteri</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Arıza Detayı</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Atanan Teknisyen</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Durum</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4', textAlign: 'right' }}>Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterBySearch(serviceTickets, ['issue_description']).map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color, #F3F5F9)' }}>
                        <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>#{s.id.substring(0, 5).toUpperCase()}</td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#54617A' }}>{s.customers?.company_name || s.customer_name || 'Bilinmeyen'}</td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#54617A' }}>{s.issue_description}</td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#54617A' }}>{s.profiles?.full_name || 'Atanmadı'}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <select 
                            value={s.status} 
                            onChange={(e) => handleServiceStatusChange(s.id, e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--border-color, #E4E9F1)', background: 'var(--input-bg, #fff)', outline: 'none' }}
                          >
                            <option value="unresolved">Açık / Bekliyor</option>
                            <option value="resolved">Çözüldü</option>
                          </select>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button onClick={() => handleEditInit('service', s)} style={{ background: '#FEF0EC', border: 'none', color: '#D8503D', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', marginRight: '6px' }}>Düzenle</button>
                          <button onClick={() => handleDeleteItem('service_tickets', s.id)} style={{ background: '#EFF2F7', border: 'none', color: '#6B778C', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Sil</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Personel Listesi */}
          {screen === 'staff' && (
            <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                <div style={{ flex: 1 }} />
                <button onClick={() => go('staffNew')} style={{ height: '38px', padding: '0 16px', border: 'none', borderRadius: '11px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
                  + Yeni Personel Ekle
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#FAFBFD', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                    <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Ad Soyad</th>
                    <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Rol</th>
                    <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>E-posta / Tel</th>
                    <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Durum</th>
                    <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4', textAlign: 'right' }}>Aksiyon</th>
                  </tr>
                </thead>
                <tbody>
                  {filterBySearch(profiles, ['full_name', 'role', 'email']).map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color, #F3F5F9)' }}>
                      <td style={{ padding: '14px 20px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-color, #101E33)' }}>{p.full_name}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#54617A' }}>{p.role === 'admin' ? 'Yönetici' : 'Personel'}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#54617A' }}>
                        <div>{p.email || 'tanımsız@isteyonetim.com'}</div>
                        <div style={{ fontSize: '11.5px', color: '#94A0B4' }}>{p.phone}</div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', ...badge(p.is_active ? 'Aktif' : 'Pasif', p.is_active ? 'ok' : 'mute') }}>
                          {p.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button onClick={() => handleEditInit('staff', p)} style={{ background: '#FEF0EC', border: 'none', color: '#D8503D', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', marginRight: '6px' }}>Düzenle</button>
                        <button onClick={() => handleDeleteItem('profiles', p.id)} style={{ background: '#EFF2F7', border: 'none', color: '#6B778C', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Sil</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Gelen Mesajlar (Mailbox Görünümü) */}
          {screen === 'msgInbox' && (
            <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                <div style={{ flex: 1, fontSize: '14px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>📥 Gelen Kutusu</div>
                <button onClick={() => go('msgNew')} style={{ height: '38px', padding: '0 16px', border: 'none', borderRadius: '11px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
                  + Yeni Mesaj Yaz
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filterBySearch(messages, ['subject', 'body', 'sender_name']).filter(m => m.receiver_id === currentUserProfile?.id || !m.receiver_id).map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => { setViewingMsg(m); go('msgDetail'); }}
                    style={{ display: 'flex', padding: '14px 20px', borderBottom: '1px solid var(--border-color, #F3F5F9)', cursor: 'pointer', gap: '14px', alignItems: 'center', background: m.is_read ? 'transparent' : 'rgba(238,108,90,0.03)' }}
                  >
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: m.is_read ? 'transparent' : '#EE6C5A', flex: 'none' }} />
                    <div style={{ width: '150px', flex: 'none', fontSize: '13.5px', fontWeight: m.is_read ? 600 : 800, color: 'var(--text-color, #101E33)' }}>{m.sender_name || 'Sistem Göndericisi'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '13.5px', fontWeight: m.is_read ? 700 : 800, color: 'var(--text-color, #101E33)' }}>{m.subject || 'Konu Yok'}</span>
                      <span style={{ fontSize: '12.5px', color: '#7A8699', marginLeft: '10px' }}>— {m.body?.substring(0, 70)}...</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A0B4', flex: 'none' }}>{new Date(m.created_at).toLocaleDateString('tr-TR')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Giden Mesajlar */}
          {screen === 'msgSent' && (
            <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                <div style={{ flex: 1, fontSize: '14px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>📤 Gönderilmiş Mesajlar</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {messages.filter(m => m.sender_id === currentUserProfile?.id || m.sender_id === 'admin').map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => { setViewingMsg(m); go('msgDetail'); }}
                    style={{ display: 'flex', padding: '14px 20px', borderBottom: '1px solid var(--border-color, #F3F5F9)', cursor: 'pointer', gap: '14px', alignItems: 'center' }}
                  >
                    <div style={{ width: '150px', flex: 'none', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-color, #101E33)' }}>Alıcı: {m.receiver_name || 'Herkes'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-color, #101E33)' }}>{m.subject || 'Konu Yok'}</span>
                      <span style={{ fontSize: '12.5px', color: '#7A8699', marginLeft: '10px' }}>— {m.body?.substring(0, 70)}...</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A0B4', flex: 'none' }}>{new Date(m.created_at).toLocaleDateString('tr-TR')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mesaj Okuma & Cevaplama Ekranı (Mail Mantığı) */}
          {screen === 'msgDetail' && viewingMsg && (
            <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '24px', animation: 'fadeUp .25s ease' }}>
              <div style={{ borderBottom: '1px solid #EEF1F6', paddingBottom: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>{viewingMsg.subject || 'Konu Yok'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12.5px', color: '#7A8699' }}>
                  <div>Gönderen: <strong>{viewingMsg.sender_name}</strong></div>
                  <div>Tarih: {new Date(viewingMsg.created_at).toLocaleString('tr-TR')}</div>
                </div>
              </div>
              
              <div style={{ fontSize: '14.5px', color: 'var(--text-color, #101E33)', lineHeight: '1.7', background: 'rgba(0,0,0,0.01)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color, #EEF1F6)', minHeight: '120px' }}>
                {viewingMsg.body}
              </div>

              {/* Cevap Yaz Modülü */}
              <div style={{ marginTop: '30px', borderTop: '1px solid #EEF1F6', paddingTop: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-color, #101E33)', marginBottom: '14px' }}>Cevap Yaz</div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setMsgReceiverId(viewingMsg.sender_id);
                  setMsgSubject('Re: ' + (viewingMsg.subject || ''));
                  handleFormSubmit(e);
                }}>
                  <textarea 
                    value={msgBody} 
                    onChange={e => setMsgBody(e.target.value)} 
                    required 
                    placeholder="Mesajınızı buraya yazın..." 
                    style={{ width: '100%', height: '100px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '12px', fontSize: '13.5px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '14px' }}>
                    <button type="button" onClick={() => go('msgInbox')} style={{ height: '38px', padding: '0 16px', border: '1.5px solid #E4E9F1', borderRadius: '10px', background: '#fff', color: '#54617A', fontWeight: 700, cursor: 'pointer' }}>Geri Dön</button>
                    <button type="submit" style={{ height: '38px', padding: '0 20px', border: 'none', borderRadius: '10px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Gönder</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Görev Ekleme Formu */}
          {screen === 'taskNew' && (
            <form onSubmit={handleFormSubmit} className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Görev Başlığı</label>
                  <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required placeholder="Görev konusu..." style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Açıklama</label>
                  <textarea value={taskDesc} onChange={e => setTaskDesc(e.target.value)} placeholder="Görev detayları..." style={{ height: '100px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '12px 14px', fontSize: '13.5px', outline: 'none', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>İlişkili Proje</label>
                  <select value={taskProjId} onChange={e => setTaskProjId(e.target.value)} style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }}>
                    <option value="">Bağımsız Görev</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Sorumlu Personel</label>
                  <select value={taskAssignedTo} onChange={e => setTaskAssignedTo(e.target.value)} style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }}>
                    <option value="">Atanmadı</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Öncelik</label>
                  <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }}>
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Bitiş Tarihi</label>
                  <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => go(prevScreen)} style={{ height: '44px', padding: '0 20px', border: '1.5px solid #E4E9F1', borderRadius: '12px', background: '#fff', color: '#54617A', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>Vazgeç</button>
                <button type="submit" style={{ height: '44px', padding: '0 24px', border: 'none', borderRadius: '12px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', fontSize: '13.5px', fontWeight: 800, cursor: 'pointer' }}>Kaydet</button>
              </div>
            </form>
          )}

          {/* Proje Ekleme Formu */}
          {screen === 'projNew' && (
            <form onSubmit={handleFormSubmit} className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Proje Adı</label>
                  <input value={projName} onChange={e => setProjName(e.target.value)} required placeholder="Proje adı..." style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Açıklama</label>
                  <textarea value={projDesc} onChange={e => setProjDesc(e.target.value)} placeholder="Proje kapsamı ve detayları..." style={{ height: '100px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '12px 14px', fontSize: '13.5px', outline: 'none', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Başlangıç Tarihi</label>
                  <input type="date" value={projStartDate} onChange={e => setProjStartDate(e.target.value)} style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Hedef Bitiş Tarihi</label>
                  <input type="date" value={projEndDate} onChange={e => setProjEndDate(e.target.value)} style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Proje Durumu</label>
                  <select value={projStatus} onChange={e => setProjStatus(e.target.value)} style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }}>
                    <option value="pending">Beklemede / Yeni</option>
                    <option value="active">Aktif / Devam Ediyor</option>
                    <option value="completed">Tamamlandı</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => go(prevScreen)} style={{ height: '44px', padding: '0 20px', border: '1.5px solid #E4E9F1', borderRadius: '12px', background: '#fff', color: '#54617A', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>Vazgeç</button>
                <button type="submit" style={{ height: '44px', padding: '0 24px', border: 'none', borderRadius: '12px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', fontSize: '13.5px', fontWeight: 800, cursor: 'pointer' }}>Kaydet</button>
              </div>
            </form>
          )}

          {/* Müşteri Ekleme Formu */}
          {screen === 'custNew' && (
            <form onSubmit={handleFormSubmit} className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Müşteri Firma Adı</label>
                  <input value={custCompany} onChange={e => setCustCompany(e.target.value)} required placeholder="Firma ticari ünvanı..." style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Yetkili Temsilci</label>
                  <input value={custContact} onChange={e => setCustContact(e.target.value)} required placeholder="Ad Soyad..." style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>İletişim Telefonu</label>
                  <input value={custPhone} onChange={e => setCustPhone(e.target.value)} required placeholder="0532..." style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>E-posta Adresi</label>
                  <input type="email" value={custEmail} onChange={e => setCustEmail(e.target.value)} required placeholder="firma@iletisim.com" style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Adres Bilgisi</label>
                  <textarea value={custAddress} onChange={e => setCustAddress(e.target.value)} placeholder="Fatura / Sevk adresi..." style={{ height: '80px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '12px 14px', fontSize: '13.5px', outline: 'none', resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => go(prevScreen)} style={{ height: '44px', padding: '0 20px', border: '1.5px solid #E4E9F1', borderRadius: '12px', background: '#fff', color: '#54617A', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>Vazgeç</button>
                <button type="submit" style={{ height: '44px', padding: '0 24px', border: 'none', borderRadius: '12px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', fontSize: '13.5px', fontWeight: 800, cursor: 'pointer' }}>Kaydet</button>
              </div>
            </form>
          )}

          {/* Teklif Ekleme Formu (Fatura Görünümlü Gelişmiş Editör) */}
          {screen === 'offerNew' && (
            <form onSubmit={handleFormSubmit} className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Teklif / Fatura Başlığı</label>
                  <input value={offerTitle} onChange={e => setOfferTitle(e.target.value)} required placeholder="Örn: Sunucu Tedariği ve Yazılım Kurulum Hizmeti" style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Alıcı Müşteri</label>
                  <select value={offerCustId} onChange={e => setOfferCustId(e.target.value)} required style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }}>
                    <option value="">Müşteri Seçin...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Teklif Durumu</label>
                  <select value={offerStatus} onChange={e => setOfferStatus(e.target.value)} style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }}>
                    <option value="draft">Taslak</option>
                    <option value="sent">Gönderildi (Bekliyor)</option>
                    <option value="accepted">Kabul Edildi</option>
                    <option value="rejected">Reddedildi</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Düzenleme Tarihi</label>
                  <input type="date" value={offerDate} onChange={e => setOfferDate(e.target.value)} style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Geçerlilik Tarihi</label>
                  <input type="date" value={offerValidDate} onChange={e => setOfferValidDate(e.target.value)} style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                </div>
              </div>

              {/* Kalemler Tablosu */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-color, #101E33)', marginBottom: '10px' }}>Fatura / Teklif Kalemleri</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#FAFBFD', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                      <th style={{ padding: '10px', fontSize: '11px', color: '#94A0B4' }}>Ürün / Hizmet</th>
                      <th style={{ padding: '10px', fontSize: '11px', color: '#94A0B4' }}>Açıklama</th>
                      <th style={{ padding: '10px', fontSize: '11px', color: '#94A0B4', width: '80px', textAlign: 'center' }}>Miktar</th>
                      <th style={{ padding: '10px', fontSize: '11px', color: '#94A0B4', width: '120px', textAlign: 'right' }}>Birim Fiyat</th>
                      <th style={{ padding: '10px', fontSize: '11px', color: '#94A0B4', width: '90px', textAlign: 'center' }}>KDV %</th>
                      <th style={{ padding: '10px', fontSize: '11px', color: '#94A0B4', width: '60px', textAlign: 'center' }}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offerItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F3F5F9' }}>
                        <td style={{ padding: '8px' }}>
                          <input required value={item.product} onChange={e => {
                            const copy = [...offerItems];
                            copy[idx].product = e.target.value;
                            setOfferItems(copy);
                          }} placeholder="Ürün adı..." style={{ height: '36px', border: '1px solid #E4E9F1', borderRadius: '8px', padding: '0 8px', width: '100%', boxSizing: 'border-box' }} />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input value={item.description} onChange={e => {
                            const copy = [...offerItems];
                            copy[idx].description = e.target.value;
                            setOfferItems(copy);
                          }} placeholder="Açıklama..." style={{ height: '36px', border: '1px solid #E4E9F1', borderRadius: '8px', padding: '0 8px', width: '100%', boxSizing: 'border-box' }} />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input type="number" required value={item.qty} onChange={e => {
                            const copy = [...offerItems];
                            copy[idx].qty = Math.max(1, parseInt(e.target.value) || 1);
                            setOfferItems(copy);
                          }} style={{ height: '36px', border: '1px solid #E4E9F1', borderRadius: '8px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }} />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input type="number" required value={item.price} onChange={e => {
                            const copy = [...offerItems];
                            copy[idx].price = Math.max(0, parseFloat(e.target.value) || 0);
                            setOfferItems(copy);
                          }} style={{ height: '36px', border: '1px solid #E4E9F1', borderRadius: '8px', textAlign: 'right', width: '100%', boxSizing: 'border-box' }} />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <select value={item.vat} onChange={e => {
                            const copy = [...offerItems];
                            copy[idx].vat = parseInt(e.target.value);
                            setOfferItems(copy);
                          }} style={{ height: '36px', border: '1px solid #E4E9F1', borderRadius: '8px', padding: '0 6px', width: '100%', boxSizing: 'border-box' }}>
                            <option value="0">%0</option>
                            <option value="1">%1</option>
                            <option value="10">%10</option>
                            <option value="20">%20</option>
                          </select>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button type="button" onClick={() => {
                            if (offerItems.length > 1) {
                              setOfferItems(offerItems.filter((_, i) => i !== idx));
                            }
                          }} style={{ background: '#FDECEA', border: 'none', color: '#C7422F', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 800 }}>X</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" onClick={() => setOfferItems([...offerItems, { product: '', description: '', qty: 1, price: 0, vat: 20 }])} style={{ marginTop: '12px', padding: '8px 16px', background: '#EFF2F7', color: '#101E33', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  + Yeni Satır Ekle
                </button>
              </div>

              {/* Toplam Kartları */}
              <div style={{ borderTop: '2px solid #EEF1F6', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                    <span>KDV Hariç Toplam:</span>
                    <strong>{formatTRYRight(calculateOfferTotals(offerItems).subTotal)}</strong>
                  </div>
                  {Object.entries(calculateOfferTotals(offerItems).vatRates).map(([rate, amt]) => (
                    <div key={rate} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: '#7A8699' }}>
                      <span>KDV (%{rate}):</span>
                      <span>{formatTRYRight(amt)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, borderTop: '2px solid #101E33', paddingTop: '8px', marginTop: '4px' }}>
                    <span>Genel Toplam:</span>
                    <span style={{ color: '#EE6C5A' }}>{formatTRYRight(calculateOfferTotals(offerItems).grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => go('offerList')} style={{ height: '44px', padding: '0 20px', border: '1.5px solid #E4E9F1', borderRadius: '12px', background: '#fff', color: '#54617A', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>Vazgeç</button>
                <button type="submit" style={{ height: '44px', padding: '0 24px', border: 'none', borderRadius: '12px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', fontSize: '13.5px', fontWeight: 800, cursor: 'pointer' }}>Teklifi Kaydet</button>
              </div>
            </form>
          )}

          {/* Finans Hareketi Ekleme & Gelişmiş Çift Sütun Muhasebe Raporu */}
          {screen === 'finNew' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeUp .25s ease' }}>
              
              {/* Gelir / Gider Muhasebe Paneli (Çift Sütun) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Gelirler Sütunu */}
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '20px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#1F8A5F', marginBottom: '14px', borderBottom: '1px solid #E7EBF2', paddingBottom: '8px' }}>🟢 Toplam Gelir Girişleri</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {finance.filter(f => f.type === 'income').slice(0, 5).map(f => (
                      <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px dashed #EEF1F6', paddingBottom: '6px' }}>
                        <div>
                          <strong>{f.description}</strong>
                          <div style={{ fontSize: '11px', color: '#7A8699' }}>{f.category} · {f.transaction_date}</div>
                        </div>
                        <span style={{ color: '#1F8A5F', fontWeight: 800 }}>+{formatTRYRight(f.amount)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '2px solid #E7EBF2', paddingTop: '10px', marginTop: '10px' }}>
                      <span>Toplam:</span>
                      <span style={{ color: '#1F8A5F' }}>{formatTRYRight(finance.filter(f => f.type === 'income').reduce((a, b) => a + b.amount, 0))}</span>
                    </div>
                  </div>
                </div>

                {/* Giderler Sütunu */}
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '20px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#C7422F', marginBottom: '14px', borderBottom: '1px solid #E7EBF2', paddingBottom: '8px' }}>🔴 Toplam Gider Çıkışları</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {finance.filter(f => f.type === 'expense').slice(0, 5).map(f => (
                      <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px dashed #EEF1F6', paddingBottom: '6px' }}>
                        <div>
                          <strong>{f.description}</strong>
                          <div style={{ fontSize: '11px', color: '#7A8699' }}>{f.category} · {f.transaction_date}</div>
                        </div>
                        <span style={{ color: '#C7422F', fontWeight: 800 }}>-{formatTRYRight(f.amount)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '2px solid #E7EBF2', paddingTop: '10px', marginTop: '10px' }}>
                      <span>Toplam:</span>
                      <span style={{ color: '#C7422F' }}>{formatTRYRight(finance.filter(f => f.type === 'expense').reduce((a, b) => a + b.amount, 0))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hareket Ekle Formu */}
              <form onSubmit={handleFormSubmit} className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '24px' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-color, #101E33)', marginBottom: '14px' }}>{editingId ? 'Hareketi Düzenle' : 'Yeni Cari Hareket / Harcama Ekle'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>İşlem Türü</label>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 700, color: '#101E33', cursor: 'pointer' }}>
                        <input type="radio" checked={finType === 'income'} onChange={() => setFinType('income')} /> Gelir Girişi (+)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 700, color: '#101E33', cursor: 'pointer' }}>
                        <input type="radio" checked={finType === 'expense'} onChange={() => setFinType('expense')} /> Gider Çıkışı (-)
                      </label>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Açıklama</label>
                    <input value={finDesc} onChange={e => setFinDesc(e.target.value)} required placeholder="Sunucu tahsilatı, vergi ödemesi vb." style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Kategori</label>
                    <select value={finCategory} onChange={e => setFinCategory(e.target.value)} style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }}>
                      <option value="bank">Banka Transferi</option>
                      <option value="cash">Nakit</option>
                      <option value="check">Çek / Senet</option>
                      <option value="invoice">Fatura Hakedişi</option>
                      <option value="other">Diğer Cari</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Tutar (₺)</label>
                    <input type="number" step="0.01" value={finAmount} onChange={e => setFinAmount(e.target.value)} required placeholder="0.00" style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>İşlem Tarihi</label>
                    <input type="date" value={finDate} onChange={e => setFinDate(e.target.value)} style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  {editingId && <button type="button" onClick={() => { setEditingId(null); clearFormFields(); }} style={{ height: '44px', padding: '0 20px', border: '1.5px solid #E4E9F1', borderRadius: '12px', background: '#fff', color: '#54617A', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>Vazgeç</button>}
                  <button type="submit" style={{ height: '44px', padding: '0 24px', border: 'none', borderRadius: '12px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', fontSize: '13.5px', fontWeight: 800, cursor: 'pointer' }}>{editingId ? 'Değişiklikleri Kaydet' : 'Hareketi İşle'}</button>
                </div>
              </form>

              {/* Cari Hareketler Tablosu (Form Altında Listelenir) */}
              <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid #EEF1F6', fontSize: '14px', fontWeight: 800 }}>Tüm Cari Kayıtlar</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#FAFBFD', borderBottom: '1px solid var(--border-color, #EEF1F6)' }}>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Tarih</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Açıklama</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Kategori</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Tür</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4' }}>Tutar</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#94A0B4', textAlign: 'right' }}>Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterBySearch(finance, ['description', 'category']).map(f => {
                      const isInc = f.type === 'income';
                      return (
                        <tr key={f.id} style={{ borderBottom: '1px solid var(--border-color, #F3F5F9)' }}>
                          <td style={{ padding: '14px 20px', fontSize: '13px', color: '#54617A' }}>{new Date(f.transaction_date).toLocaleDateString('tr-TR')}</td>
                          <td style={{ padding: '14px 20px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-color, #101E33)' }}>{f.description}</td>
                          <td style={{ padding: '14px 20px', fontSize: '13px', color: '#54617A' }}>
                            <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', background: '#F0F2F6', color: '#54617A' }}>{f.category}</span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', ...badge(isInc ? 'Gelir' : 'Gider', isInc ? 'ok' : 'hot') }}>
                              {isInc ? 'Gelir' : 'Gider'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 800, color: isInc ? '#1F8A5F' : '#C7422F' }}>
                            {(isInc ? '+' : '-') + formatTRYRight(f.amount || 0)}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <button onClick={() => handleEditInit('finance', f)} style={{ background: '#FEF0EC', border: 'none', color: '#D8503D', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', marginRight: '6px' }}>Düzenle</button>
                            <button onClick={() => handleDeleteItem('finance_transactions', f.id)} style={{ background: '#EFF2F7', border: 'none', color: '#6B778C', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Sil</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Servis Kaydı Açma Formu */}
          {screen === 'servNew' && (
            <form onSubmit={handleFormSubmit} className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Müşteri Firma</label>
                  <select value={servCustId} onChange={e => setServCustId(e.target.value)} required style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }}>
                    <option value="">Seçiniz...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Atanan Teknisyen</label>
                  <select value={servStaffId} onChange={e => setServStaffId(e.target.value)} style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }}>
                    <option value="">Seçiniz...</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Arıza & Talep Detayı</label>
                  <textarea value={servDesc} onChange={e => setServDesc(e.target.value)} required placeholder="Kullanıcının ilettiği hata / sorun detaylı tanımı..." style={{ height: '100px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '12px 14px', fontSize: '13.5px', outline: 'none', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Servis Durumu</label>
                  <select value={servStatus} onChange={e => setServStatus(e.target.value)} style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }}>
                    <option value="unresolved">Açık / Beklemede</option>
                    <option value="resolved">Çözüldü / Tamamlandı</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => go(prevScreen)} style={{ height: '44px', padding: '0 20px', border: '1.5px solid #E4E9F1', borderRadius: '12px', background: '#fff', color: '#54617A', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>Vazgeç</button>
                <button type="submit" style={{ height: '44px', padding: '0 24px', border: 'none', borderRadius: '12px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', fontSize: '13.5px', fontWeight: 800, cursor: 'pointer' }}>Kaydet</button>
              </div>
            </form>
          )}

          {/* Mesaj Yazma Formu */}
          {screen === 'msgNew' && (
            <form onSubmit={handleFormSubmit} className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Alıcı Seçin</label>
                  <select value={msgReceiverId} onChange={e => setMsgReceiverId(e.target.value)} required style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }}>
                    <option value="">Seçiniz...</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Konu</label>
                  <input value={msgSubject} onChange={e => setMsgSubject(e.target.value)} required placeholder="Mesaj konusu..." style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Mesaj İçeriği</label>
                  <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} required placeholder="Mesajınızı yazın..." style={{ height: '120px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '12px 14px', fontSize: '13.5px', outline: 'none', resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => go(prevScreen)} style={{ height: '44px', padding: '0 20px', border: '1.5px solid #E4E9F1', borderRadius: '12px', background: '#fff', color: '#54617A', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>Vazgeç</button>
                <button type="submit" style={{ height: '44px', padding: '0 24px', border: 'none', borderRadius: '12px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', fontSize: '13.5px', fontWeight: 800, cursor: 'pointer' }}>Gönder</button>
              </div>
            </form>
          )}

          {/* Personel Ekleme Formu */}
          {screen === 'staffNew' && (
            <form onSubmit={handleFormSubmit} className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Personel Adı Soyadı</label>
                  <input value={staffName} onChange={e => setStaffName(e.target.value)} required placeholder="Örn: Mert Tunç" style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>E-posta Adresi</label>
                  <input type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} required placeholder="mert@isteyonetim.com" style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Telefon Numarası</label>
                  <input value={staffPhone} onChange={e => setStaffPhone(e.target.value)} placeholder="0533..." style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Rol Yetkisi</label>
                  <select value={staffRole} onChange={e => setStaffRole(e.target.value)} style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }}>
                    <option value="staff">Personel (Sınırlı)</option>
                    <option value="manager">Müdür (Orta Yetki)</option>
                    <option value="admin">Yönetici (Tam Yetki)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#54617A' }}>Hesap Durumu</label>
                  <select value={staffActive} onChange={e => setStaffActive(e.target.value)} style={{ height: '46px', border: '1.5px solid #E4E9F1', borderRadius: '12px', padding: '0 14px', fontSize: '13.5px', outline: 'none' }}>
                    <option value="true">Aktif</option>
                    <option value="false">Pasif</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => go(prevScreen)} style={{ height: '44px', padding: '0 20px', border: '1.5px solid #E4E9F1', borderRadius: '12px', background: '#fff', color: '#54617A', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>Vazgeç</button>
                <button type="submit" style={{ height: '44px', padding: '0 24px', border: 'none', borderRadius: '12px', background: 'linear-gradient(100deg,#EE6C5A,#F5A05A)', color: '#fff', fontSize: '13.5px', fontWeight: 800, cursor: 'pointer' }}>Personeli Kaydet</button>
              </div>
            </form>
          )}

          {/* Form / Dynamic Views */}
          {isForm && screen !== 'taskNew' && screen !== 'projNew' && screen !== 'custNew' && screen !== 'offerNew' && screen !== 'finNew' && screen !== 'servNew' && screen !== 'msgNew' && screen !== 'staffNew' && (
            <div className="sc-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px' }}>
              <span>Yükleniyor...</span>
            </div>
          )}

          {/* Integrated Settings / Account Screen */}
          {screen === 'account' && (
            <div style={{ animation: 'fadeUp .25s ease', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Profile Card header */}
              <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '22px', display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg,#EE6C5A,#F5A05A)', color: '#fff', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '21px', fontWeight: 800 }}>
                  {currentUserProfile?.full_name?.substring(0, 2).toUpperCase() || 'KA'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>{currentUserProfile?.full_name || 'Fatih Akyıldız'}</div>
                  <div style={{ fontSize: '13px', color: '#7A8699', fontWeight: 600, marginTop: '3px' }}>
                    {currentUserProfile?.role === 'admin' ? 'Yönetici' : 'Personel'} · {currentUserProfile?.email || 'fatih@isteyonetim.com'} · {currentUserProfile?.company_name || 'Aydın Teknoloji A.Ş.'}
                  </div>
                </div>
                <button 
                  onClick={() => setSubSettingView('profile')} 
                  style={{ height: '42px', padding: '0 18px', border: '1.5px solid #E4E9F1', borderRadius: '12px', background: '#fff', color: 'var(--text-color, #101E33)', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Profili Düzenle
                </button>
              </div>

              {/* Sub-Setting Edit View Slot */}
              {subSettingView === 'profile' && (
                <form onSubmit={handleUpdateProfile} style={{ background: '#fff', border: '1.5px solid #FAE0D6', borderRadius: '20px', padding: '20px', animation: 'fadeUp 0.2s ease' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-color, #101E33)', marginBottom: '14px' }}>Profil & Şirket Bilgilerini Güncelle</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#54617A', fontWeight: 800 }}>Ad Soyad</label>
                      <input value={profileNameInput} onChange={e => setProfileNameInput(e.target.value)} required style={{ height: '40px', border: '1.5px solid #E4E9F1', borderRadius: '10px', padding: '0 12px', fontSize: '13.5px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#54617A', fontWeight: 800 }}>Telefon</label>
                      <input value={profilePhoneInput} onChange={e => setProfilePhoneInput(e.target.value)} style={{ height: '40px', border: '1.5px solid #E4E9F1', borderRadius: '10px', padding: '0 12px', fontSize: '13.5px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '12px', color: '#54617A', fontWeight: 800 }}>Şirket Adı</label>
                      <input value={profileCompanyInput} onChange={e => setProfileCompanyInput(e.target.value)} required style={{ height: '40px', border: '1.5px solid #E4E9F1', borderRadius: '10px', padding: '0 12px', fontSize: '13.5px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setSubSettingView(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E4E9F1', background: '#fff', cursor: 'pointer' }}>İptal</button>
                    <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: Colors.coral, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Kaydet</button>
                  </div>
                </form>
              )}

              {subSettingView === 'password' && (
                <form onSubmit={handleUpdatePassword} style={{ background: '#fff', border: '1.5px solid #FAE0D6', borderRadius: '20px', padding: '20px', animation: 'fadeUp 0.2s ease' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-color, #101E33)', marginBottom: '14px' }}>Yeni Şifre Belirle</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: '#54617A', fontWeight: 800 }}>Şifre</label>
                    <input type="password" value={profilePasswordInput} onChange={e => setProfilePasswordInput(e.target.value)} required placeholder="En az 6 karakter" style={{ height: '40px', border: '1.5px solid #E4E9F1', borderRadius: '10px', padding: '0 12px', fontSize: '13.5px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setSubSettingView(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E4E9F1', background: '#fff', cursor: 'pointer' }}>İptal</button>
                    <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: Colors.coral, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Şifreyi Güncelle</button>
                  </div>
                </form>
              )}

              {subSettingView === 'plan' && (
                <div style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '24px', animation: 'fadeUp 0.2s ease' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-color, #101E33)', marginBottom: '14px' }}>İŞteYönetim Fiyatlandırma Planları</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {[
                      { name: 'Başlangıç', price: '499 TL', desc: '5 Kullanıcı, Temel Görev Takibi', features: ['Görev listeleri', 'Müşteri paneli', '500 MB Dosya Depolama'] },
                      { name: 'Profesyonel', price: '999 TL', desc: '15 Kullanıcı, Tam Muhasebe & Servis', features: ['Akordeon modüller', 'Fatura ve PDF Teklifler', 'Cari Hesaplar & KDV Raporu', '5 GB Dosya Depolama'] },
                      { name: 'Kurumsal', price: '1999 TL', desc: 'Sınırsız Kullanıcı, Özel API', features: ['Öncelikli destek', 'Çoklu veri tabanı entegrasyonu', 'Sınırsız dosya depolama'] }
                    ].map(p => (
                      <div key={p.name} style={{ border: '1.5px solid #E4E9F1', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>{p.name}</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#EE6C5A' }}>{p.price}<span style={{ fontSize: '12px', color: '#7A8699' }}> /ay</span></div>
                        <p style={{ fontSize: '12px', color: '#7A8699', margin: 0 }}>{p.desc}</p>
                        <div style={{ height: '1px', background: '#EEF1F6', margin: '6px 0' }} />
                        <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {p.features.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                        <button type="button" onClick={handleTriggerPayment} style={{ marginTop: 'auto', height: '36px', background: '#101E33', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>Satın Al</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {subSettingView === 'billing' && (
                <div style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', padding: '20px', animation: 'fadeUp 0.2s ease' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-color, #101E33)', marginBottom: '12px' }}>Abonelik Fatura Detayları & Geçmişi</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#FAFBFD', borderBottom: '1px solid #EEF1F6' }}>
                        <th style={{ padding: '10px', fontSize: '11px', color: '#94A0B4' }}>İşlem Adı</th>
                        <th style={{ padding: '10px', fontSize: '11px', color: '#94A0B4' }}>Tarih / Aralık</th>
                        <th style={{ padding: '10px', fontSize: '11px', color: '#94A0B4' }}>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #F3F5F9' }}>
                        <td style={{ padding: '12px' }}><strong>14 Günlük Ücretsiz Deneme (Demo)</strong></td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>26.07.2026 - 09.08.2026</td>
                        <td style={{ padding: '12px' }}><span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', ...badge('Aktif / Kullanımda', 'info') }}>Aktif</span></td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #F3F5F9' }}>
                        <td style={{ padding: '12px' }}><strong>İlk Üyelik Kayıt Girişi</strong></td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>26.07.2026</td>
                        <td style={{ padding: '12px' }}><span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', ...badge('Tamamlandı', 'ok') }}>Başarılı</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Main settings grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', overflow: 'hidden' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A0B4', letterSpacing: '.7px', textTransform: 'uppercase', padding: '16px 20px 12px' }}>Abonelik & Yönetim</div>
                  
                  <div onClick={() => setSubSettingView('password')} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '14px 20px', borderTop: '1px solid #F3F5F9', cursor: 'pointer' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 800, background: '#F3EEFB', color: '#6941A8' }}>PW</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>Şifre Değiştir</div>
                      <div style={{ fontSize: '12px', color: '#94A0B4', fontWeight: 600, marginTop: '2px' }}>Güvenliğinizi güncel tutun</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="m6 3 5 5-5 5" stroke="#C3CBD9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>

                  <div onClick={() => setSubSettingView('plan')} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '14px 20px', borderTop: '1px solid #F3F5F9', cursor: 'pointer' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 800, background: '#E7F6EF', color: '#1F8A5F' }}>PR</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>Plan ve Faturalama</div>
                      <div style={{ fontSize: '12px', color: '#94A0B4', fontWeight: 600, marginTop: '2px' }}>Paketleri incele ve iyzico ile ödeme yap</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="m6 3 5 5-5 5" stroke="#C3CBD9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>

                  <div onClick={() => setSubSettingView('billing')} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '14px 20px', borderTop: '1px solid #F3F5F9', cursor: 'pointer' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 800, background: '#FEF3E2', color: '#B87514' }}>FT</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>Fatura & Abonelik Geçmişi</div>
                      <div style={{ fontSize: '12px', color: '#94A0B4', fontWeight: 600, marginTop: '2px' }}>Deneme süresi ve fatura detayları</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="m6 3 5 5-5 5" stroke="#C3CBD9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>

                <div className="sc-card" style={{ background: '#fff', border: '1px solid #E7EBF2', borderRadius: '20px', overflow: 'hidden' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A0B4', letterSpacing: '.7px', textTransform: 'uppercase', padding: '16px 20px 12px' }}>Uygulama Tercihleri</div>
                  
                  <div onClick={() => setToggleNotify(!toggleNotify)} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '14px 20px', borderTop: '1px solid #F3F5F9', cursor: 'pointer' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 800, background: '#FEF0EC', color: '#D8503D' }}>BL</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>Anlık Bildirimler</div>
                      <div style={{ fontSize: '12px', color: '#94A0B4', fontWeight: 600, marginTop: '2px' }}>Görev ve mesaj bildirimleri</div>
                    </div>
                    <div style={{ width: '44px', height: '26px', borderRadius: '14px', padding: '3px', boxSizing: 'border-box', background: toggleNotify ? '#EE6C5A' : '#DDE3EC', display: 'flex', justifyContent: toggleNotify ? 'flex-end' : 'flex-start' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(16,30,51,.3)' }}></div>
                    </div>
                  </div>

                  <div onClick={() => setToggleEmailSummary(!toggleEmailSummary)} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '14px 20px', borderTop: '1px solid #F3F5F9', cursor: 'pointer' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 800, background: '#E9F0FD', color: '#2C5AA8' }}>EP</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>E-Posta Özeti</div>
                      <div style={{ fontSize: '12px', color: '#94A0B4', fontWeight: 600, marginTop: '2px' }}>Her sabah 08:00 durum raporu</div>
                    </div>
                    <div style={{ width: '44px', height: '26px', borderRadius: '14px', padding: '3px', boxSizing: 'border-box', background: toggleEmailSummary ? '#EE6C5A' : '#DDE3EC', display: 'flex', justifyContent: toggleEmailSummary ? 'flex-end' : 'flex-start' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(16,30,51,.3)' }}></div>
                    </div>
                  </div>

                  <div onClick={() => setToggleDarkTheme(!toggleDarkTheme)} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '14px 20px', borderTop: '1px solid #F3F5F9', cursor: 'pointer' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 800, background: '#EFF2F7', color: '#54617A' }}>DL</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-color, #101E33)' }}>Koyu Tema</div>
                      <div style={{ fontSize: '12px', color: '#94A0B4', fontWeight: 600, marginTop: '2px' }}>Göz yormayan karanlık arayüz</div>
                    </div>
                    <div style={{ width: '44px', height: '26px', borderRadius: '14px', padding: '3px', boxSizing: 'border-box', background: toggleDarkTheme ? '#EE6C5A' : '#DDE3EC', display: 'flex', justifyContent: toggleDarkTheme ? 'flex-end' : 'flex-start' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(16,30,51,.3)' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auth Screen Layout */}
      {!isLoggedIn && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', boxSizing: 'border-box', background: 'radial-gradient(1200px 600px at 50% 0%, #EEF2F7 0%, #DDE3EC 60%)' }}>
          <div style={{ width: '400px', background: '#FFFFFF', borderRadius: '24px', boxShadow: '0 40px 80px -20px rgba(16,30,51,.25)', padding: '40px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: '#101E33', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="uploads/isteyonetim_logo.png" alt="İŞte Yönetim" style={{ position: 'absolute', width: '160px', left: '-50px', top: '-6px' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#101E33', margin: 0 }}>{isRegister ? 'Yeni Hesap Oluştur' : 'Tekrar Hoş Geldiniz'}</h2>
                <p style={{ fontSize: '14px', color: '#7A8699', marginTop: '6px', margin: 0 }}>İşletmenizi tek panelden yönetin</p>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isRegister && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#54617A' }}>Ad Soyad</label>
                    <input type="text" required value={registerName} onChange={e => setRegisterName(e.target.value)} placeholder="Adınız Soyadınız" style={{ height: '48px', border: '1.5px solid #E2E7EF', borderRadius: '12px', padding: '0 15px', fontSize: '14.5px', color: '#101E33', boxSizing: 'border-box', width: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#54617A' }}>Şirket Adı</label>
                    <input type="text" required value={registerCompany} onChange={e => setRegisterCompany(e.target.value)} placeholder="Şirketinizin Ünvanı" style={{ height: '48px', border: '1.5px solid #E2E7EF', borderRadius: '12px', padding: '0 15px', fontSize: '14.5px', color: '#101E33', boxSizing: 'border-box', width: '100%' }} />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#54617A' }}>E-posta</label>
                <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="ornek@isteyonetim.com" style={{ height: '48px', border: '1.5px solid #E2E7EF', borderRadius: '12px', padding: '0 15px', fontSize: '14.5px', color: '#101E33', boxSizing: 'border-box', width: '100%' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#54617A' }}>Şifre</label>
                <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="••••••" style={{ height: '48px', border: '1.5px solid #E2E7EF', borderRadius: '12px', padding: '0 15px', fontSize: '14.5px', color: '#101E33', boxSizing: 'border-box', width: '100%' }} />
              </div>

              <button type="submit" style={{ height: '52px', border: 'none', borderRadius: '14px', background: 'linear-gradient(100deg,#EE6C5A 0%,#F5A05A 100%)', color: '#fff', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 22px -8px rgba(238,108,90,.5)' }}>
                {isRegister ? 'Kayıt Ol ve Başla' : 'Giriş Yap'}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '13px', color: '#7A8699', marginTop: '16px' }}>
              {isRegister ? (
                <span>Zaten hesabınız var mı? <span onClick={() => setIsRegister(false)} style={{ color: '#EE6C5A', fontWeight: 800, cursor: 'pointer' }}>Giriş Yapın</span></span>
              ) : (
                <span>Hesabınız yok mu? <span onClick={() => setIsRegister(true)} style={{ color: '#EE6C5A', fontWeight: 800, cursor: 'pointer' }}>Kayıt Olun</span></span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Colors = {
  coral: '#EE6C5A',
  orange: '#F5A05A',
  navy: '#101E33',
  ink: '#54617A',
  bg: '#F4F6FA',
  lightGray: '#EAEEF5',
  white: '#FFFFFF'
};
export { Colors };
