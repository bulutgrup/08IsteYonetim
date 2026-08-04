import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Image, 
  ActivityIndicator, 
  Alert,
  Platform,
  StatusBar,
  Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase config
const supabaseUrl = 'https://tcigxuhsaizzfukfbtxi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaWd4dWhzYWl6emZ1a2ZidHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDMyODUsImV4cCI6MjA5NTkxOTI4NX0.e5lPqRAwPaIOqFoDtKQIFCj-Q6DXDNWBbZcdmqAd0g0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Colors = {
  coral: '#EE6C5A',
  orange: '#F5A05A',
  navy: '#101E33',
  ink: '#54617A',
  bg: '#F4F6FA',
  lightGray: '#EAEEF5',
  white: '#FFFFFF'
};

const LightColors = {
  coral: '#EE6C5A',
  orange: '#F5A05A',
  navy: '#101E33',
  ink: '#54617A',
  bg: '#F4F6FA',
  lightGray: '#EAEEF5',
  white: '#FFFFFF',
  text: '#101E33',
  cardBg: '#FFFFFF',
  border: '#EAEEF5'
};

const DarkColors = {
  coral: '#EE6C5A',
  orange: '#F5A05A',
  navy: '#94A0B4',
  ink: '#A9B8D0',
  bg: '#0B132B',
  lightGray: '#1C2541',
  white: '#1C2541',
  text: '#FFFFFF',
  cardBg: '#1C2541',
  border: '#2A3656'
};

const SCREENS: Record<string, { kind: string; title: string; eyebrow: string; fab?: string }> = {
  home:      { kind: 'home',  title: 'Giriş Paneli', eyebrow: 'Genel bakış' },
  msgInbox:  { kind: 'list',  title: 'Gelen Mesajlar', eyebrow: 'Mesajlar', fab: 'msgNew' },
  msgNew:    { kind: 'form',  title: 'Mesaj Yaz', eyebrow: 'Mesajlar' },
  taskNew:   { kind: 'form',  title: 'Görev Oluştur', eyebrow: 'Görev Paneli' },
  taskList:  { kind: 'list',  title: 'Görev Listesi', eyebrow: 'Görev Paneli', fab: 'taskNew' },
  projNew:   { kind: 'form',  title: 'Proje Oluştur', eyebrow: 'Proje Paneli' },
  projList:  { kind: 'list',  title: 'Proje Listesi', eyebrow: 'Proje Paneli', fab: 'projNew' },
  offerNew:  { kind: 'form',  title: 'Teklif Oluştur', eyebrow: 'Teklif Paneli' },
  offerList: { kind: 'list',  title: 'Verilen Teklifler', eyebrow: 'Teklif Paneli', fab: 'offerNew' },
  custNew:   { kind: 'form',  title: 'Müşteri Oluştur', eyebrow: 'Müşteri Paneli' },
  custList:  { kind: 'list',  title: 'Müşteri Listesi', eyebrow: 'Müşteri Paneli', fab: 'custNew' },
  finNew:    { kind: 'form',  title: 'Hareket Ekle', eyebrow: 'Finans Paneli' },
  finList:   { kind: 'list',  title: 'Gider Listesi', eyebrow: 'Finans Paneli', fab: 'finNew' },
  servNew:   { kind: 'form',  title: 'Servis Ekle', eyebrow: 'Teknik Servis' },
  servList:  { kind: 'list',  title: 'Servis Listesi', eyebrow: 'Teknik Servis', fab: 'servNew' },
  staff:     { kind: 'list',  title: 'Personel Yönetimi', eyebrow: 'Sistem Ayarları' },
  account:   { kind: 'rows',  title: 'Hesap Ayarları', eyebrow: 'Sistem Ayarları' },
  settings:  { kind: 'rows',  title: 'Ayarlar', eyebrow: 'Sistem Ayarları' }
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [screen, setScreen] = useState<string>('home');
  const [prevScreen, setPrevScreen] = useState<string>('home');
  const [email, setEmail] = useState<string>('demo@isteyonetim.com');
  const [password, setPassword] = useState<string>('123456');
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [registerCompany, setRegisterCompany] = useState<string>('');
  const [registerName, setRegisterName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Loaded database arrays
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [finance, setFinance] = useState<any[]>([]);
  const [serviceTickets, setServiceTickets] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>({
    full_name: 'Kemal Bey',
    role: 'admin',
    company_name: 'Aydın Teknoloji A.Ş.',
    phone: '+90 532 999 88 77',
    plan_type: 'starter'
  });

  // Selected item for detail view
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Search input
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formStatus, setFormStatus] = useState<string>('');
  const [formPriority, setFormPriority] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');
  const [formCustomerId, setFormCustomerId] = useState<string>('');
  const [formAssignedTo, setFormAssignedTo] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [formType, setFormType] = useState<string>('expense');

  // Reply message text
  const [replyText, setReplyText] = useState<string>('');

  // Active filter tab
  const [activeChip, setActiveChip] = useState<string>('Tümü');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const theme = darkMode ? DarkColors : LightColors;

  useEffect(() => {
    AsyncStorage.getItem('session_logged_in').then(val => {
      if (val === 'true') {
        setIsLoggedIn(true);
        fetchData();
      }
    });
    AsyncStorage.getItem('dark_mode').then(val => {
      setDarkMode(val === 'true');
    });
  }, [isLoggedIn]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const isDemoUser = !user || user.email === 'demo@isteyonetim.com';

      if (user && user.email !== 'demo@isteyonetim.com') {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          setCurrentUserProfile(profile);
        }
      }

      // 1. Fetch tasks
      const { data: dbTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      setTasks(dbTasks && dbTasks.length > 0 ? dbTasks : (isDemoUser ? mockData.tasks : []));

      // 2. Fetch projects
      const { data: dbProjects } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      setProjects(dbProjects && dbProjects.length > 0 ? dbProjects : (isDemoUser ? mockData.projects : []));

      // 3. Fetch customers
      const { data: dbCustomers } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      setCustomers(dbCustomers && dbCustomers.length > 0 ? dbCustomers : (isDemoUser ? mockData.customers : []));

      // 4. Fetch offers
      const { data: dbOffers } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
      setOffers(dbOffers && dbOffers.length > 0 ? dbOffers : (isDemoUser ? mockData.offers : []));

      // 5. Fetch finance transactions
      const { data: dbFinance } = await supabase.from('finance_transactions').select('*').order('transaction_date', { ascending: false });
      setFinance(dbFinance && dbFinance.length > 0 ? dbFinance : (isDemoUser ? mockData.finance : []));

      // 6. Fetch service tickets
      const { data: dbService } = await supabase.from('service_tickets').select('*').order('created_at', { ascending: false });
      setServiceTickets(dbService && dbService.length > 0 ? dbService : (isDemoUser ? mockData.serviceTickets : []));

      // 7. Fetch messages
      const { data: dbMessages } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
      setMessages(dbMessages && dbMessages.length > 0 ? dbMessages : (isDemoUser ? mockData.messages : []));

      // 8. Fetch system profiles
      const { data: dbProfiles } = await supabase.from('profiles').select('*');
      setProfiles(dbProfiles || []);

    } catch (e) {
      console.log('Error pulling data from supabase:', e);
      setTasks(mockData.tasks);
      setProjects(mockData.projects);
      setCustomers(mockData.customers);
      setOffers(mockData.offers);
      setFinance(mockData.finance);
      setServiceTickets(mockData.serviceTickets);
      setMessages(mockData.messages);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    if (email === 'demo@isteyonetim.com' && password === '123456') {
      await AsyncStorage.setItem('session_logged_in', 'true');
      setIsLoggedIn(true);
      setScreen('home');
    } else {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          Alert.alert('Giriş Hatası', error.message);
        } else if (data.session) {
          await AsyncStorage.setItem('session_logged_in', 'true');
          setIsLoggedIn(true);
          await fetchData();
          setScreen('home');
        }
      } catch (err: any) {
        Alert.alert('Hata', err.message);
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch(e) {}
    await AsyncStorage.removeItem('session_logged_in');
    setIsLoggedIn(false);
    setCurrentUserProfile({
      full_name: 'Kemal Bey',
      role: 'admin',
      company_name: 'Aydın Teknoloji A.Ş.',
      phone: '+90 532 999 88 77',
      plan_type: 'starter'
    });
    setScreen('home');
  };

  const handleRegister = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: registerName,
          company_name: registerCompany,
          role: 'admin'
        }
      }
    });
    if (error) {
      Alert.alert('Kayıt Hatası', error.message);
    } else {
      Alert.alert('Başarılı', 'Kayıt oluşturuldu, giriş yapabilirsiniz.');
      setIsRegister(false);
    }
    setLoading(false);
  };

  const toggleDarkMode = async (val: boolean) => {
    setDarkMode(val);
    await AsyncStorage.setItem('dark_mode', String(val));
  };

  const handleSaveForm = async () => {
    setLoading(true);
    try {
      if (screen === 'taskNew') {
        const payload = {
          title: formTitle || 'Yeni Görev',
          description: formDesc || '',
          status: formStatus || 'todo',
          priority: formPriority || 'medium',
          due_date: formDate || null,
          assigned_to: formAssignedTo || null
        };
        await supabase.from('tasks').insert([payload]);
        Alert.alert('Başarılı', 'Görev başarıyla oluşturuldu.');
      } else if (screen === 'projNew') {
        const payload = {
          name: formTitle || 'Yeni Proje',
          description: formDesc || '',
          status: formStatus || 'active',
          start_date: formDate || null
        };
        await supabase.from('projects').insert([payload]);
        Alert.alert('Başarılı', 'Proje başarıyla oluşturuldu.');
      } else if (screen === 'msgNew') {
        const payload = {
          title: formTitle || 'Yeni Mesaj',
          content: formDesc || '',
          sender_name: currentUserProfile.full_name,
          receiver_name: formAssignedTo || 'Destek Ekibi'
        };
        await supabase.from('messages').insert([payload]);
        Alert.alert('Başarılı', 'Mesajınız gönderildi.');
      } else if (screen === 'offerNew') {
        const payload = {
          title: formTitle || 'Yeni Teklif',
          amount: parseFloat(formAmount) || 0,
          status: formStatus || 'sent',
          valid_until: formDate || null,
          customer_name: formCustomerId || 'Genel Müşteri'
        };
        await supabase.from('offers').insert([payload]);
        Alert.alert('Başarılı', 'Teklif oluşturuldu.');
      } else if (screen === 'custNew') {
        const payload = {
          company_name: formTitle || 'Yeni Müşteri',
          contact_name: formDesc || '',
          phone: formAmount || ''
        };
        await supabase.from('customers').insert([payload]);
        Alert.alert('Başarılı', 'Müşteri kaydedildi.');
      } else if (screen === 'finNew') {
        const payload = {
          description: formTitle || 'Yeni Finans Hareketi',
          amount: parseFloat(formAmount) || 0,
          type: formType,
          category: formCategory || 'cash',
          transaction_date: formDate || new Date().toISOString().split('T')[0]
        };
        await supabase.from('finance_transactions').insert([payload]);
        Alert.alert('Başarılı', 'Finans hareketi eklendi.');
      } else if (screen === 'servNew') {
        const payload = {
          customer_name: formCustomerId || 'Genel Müşteri',
          issue_description: formDesc || '',
          status: 'unresolved'
        };
        await supabase.from('service_tickets').insert([payload]);
        Alert.alert('Başarılı', 'Teknik servis kaydı oluşturuldu.');
      }

      // Reset
      setFormTitle('');
      setFormDesc('');
      setFormAmount('');
      setFormStatus('');
      setFormPriority('');
      setFormDate('');
      setFormCustomerId('');
      setFormAssignedTo('');
      setFormCategory('');
      fetchData();
      go(prevScreen);
    } catch (err: any) {
      Alert.alert('Hata', err.message);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (table: string, id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from(table).update({ status: newStatus }).eq('id', id);
      if (error) {
        Alert.alert('Hata', error.message);
      } else {
        Alert.alert('Başarılı', 'Durum güncellendi.');
        fetchData();
        go(prevScreen);
      }
    } catch (err: any) {
      Alert.alert('Hata', err.message);
    }
  };

  const handleDeleteItem = async (table: string, id: string) => {
    Alert.alert('Emin misiniz?', 'Bu kaydı silmek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { 
        text: 'Sil', 
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from(table).delete().eq('id', id);
            Alert.alert('Silindi', 'Kayıt başarıyla silindi.');
            fetchData();
            go(prevScreen);
          } catch (e: any) {
            Alert.alert('Hata', e.message);
          }
        }
      }
    ]);
  };

  const handleReplyMessage = async () => {
    if (replyText.trim() === '') return;
    setLoading(true);
    try {
      const payload = {
        title: `Re: ${selectedItem.title}`,
        content: replyText,
        sender_name: currentUserProfile.full_name,
        receiver_name: selectedItem.sender_name
      };
      await supabase.from('messages').insert([payload]);
      Alert.alert('Başarılı', 'Yanıtınız gönderildi.');
      setReplyText('');
      fetchData();
      go('msgInbox');
    } catch (err: any) {
      Alert.alert('Hata', err.message);
    }
    setLoading(false);
  };

  const handleSaveProfile = () => {
    Alert.alert('Profil Güncellendi', 'Kişisel bilgileriniz başarıyla kaydedildi.');
    go('settings');
  };

  const handleSaveCompany = () => {
    Alert.alert('Firma Güncellendi', 'Şirket bilgileriniz başarıyla kaydedildi.');
    go('settings');
  };

  const handlePlanUpgrade = (plan: string) => {
    Alert.alert('Plan Güncellendi', `Aboneliğiniz ${plan.toUpperCase()} planına yükseltildi!`);
    setCurrentUserProfile((prev: any) => ({ ...prev, plan_type: plan }));
    go('settings');
  };

  const go = (target: string) => {
    setPrevScreen(screen);
    setScreen(target);
    setMenuOpen(false);
  };

  const openDetail = (item: any, detailScreen: string) => {
    setSelectedItem(item);
    go(detailScreen);
  };

  // Helper to filter items based on search queries and chips
  const getFilteredItems = () => {
    let list: any[] = [];
    if (screen === 'taskList') list = tasks;
    else if (screen === 'projList') list = projects;
    else if (screen === 'custList') list = customers;
    else if (screen === 'offerList') list = offers;
    else if (screen === 'finList') list = finance;
    else if (screen === 'servList') list = serviceTickets;
    else if (screen === 'msgInbox') list = messages;

    // Filter by Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => {
        const titleMatch = (item.title || item.name || item.company_name || item.description || '').toLowerCase().includes(q);
        const subMatch = (item.description || item.contact_name || item.issue_description || item.content || '').toLowerCase().includes(q);
        return titleMatch || subMatch;
      });
    }

    // Filter by Chip (Status)
    if (activeChip !== 'Tümü') {
      list = list.filter(item => {
        const status = (item.status || '').toLowerCase();
        if (activeChip === 'Aktif') return status === 'active' || status === 'todo' || status === 'unresolved' || status === 'in_progress' || status === 'sent';
        if (activeChip === 'Tamamlanan') return status === 'completed' || status === 'done' || status === 'resolved' || status === 'accepted';
        return true;
      });
    }

    return list;
  };

  const filteredItemsList = getFilteredItems();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={theme.cardBg} translucent />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image 
            source={require('../assets/uploads/isteyonetim_logo.png')} 
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerEyebrow}>{SCREENS[screen]?.eyebrow || 'SİSTEM'}</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>{SCREENS[screen]?.title || 'İŞte Yönetim'}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => setMenuOpen(true)} style={[styles.menuButton, { backgroundColor: theme.white, borderColor: theme.border }]}>
            <Text style={{ fontSize: 18, color: Colors.coral }}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView style={{ flex: 1, padding: 15 }} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* HOME SCREEN */}
        {screen === 'home' && (
          <View style={{ gap: 15 }}>
            <View style={[styles.welcomeBanner, { backgroundColor: Colors.navy }]}>
              <Text style={{ color: '#A9B8D0', fontSize: 13, fontWeight: '600' }}>Merhaba, {currentUserProfile.full_name} 👋</Text>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 3 }}>Bugün {tasks.filter(t => t.status !== 'done').length} açık işiniz var</Text>
            </View>

            {/* Quick Actions Shortcuts */}
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.coral, letterSpacing: 0.5 }}>HIZLI İŞLEMLER</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <TouchableOpacity onPress={() => { setFormType('expense'); go('finNew'); }} style={[styles.shortcutBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>💵 Gider Ekle</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => go('taskNew')} style={[styles.shortcutBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>📋 Görev Ekle</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => go('offerNew')} style={[styles.shortcutBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>💼 Teklif Hazırla</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => go('servNew')} style={[styles.shortcutBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>🛠️ Servis Aç</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Summary Metrics */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <TouchableOpacity onPress={() => go('taskList')} style={[styles.quickCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text }}>{tasks.filter(t => t.status !== 'done').length}</Text>
                <Text style={styles.quickLabel}>Açık Görev</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => go('projList')} style={[styles.quickCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text }}>{projects.filter(p => p.status === 'active').length}</Text>
                <Text style={styles.quickLabel}>Aktif Proje</Text>
              </TouchableOpacity>
            </View>

            {/* Today's Tasks */}
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Bugünün Görevleri</Text>
              {tasks.length === 0 ? (
                <Text style={{ fontSize: 12, color: theme.ink }}>Herhangi bir görev bulunmamaktadır.</Text>
              ) : (
                tasks.slice(0, 3).map((t, idx) => (
                  <TouchableOpacity key={idx} onPress={() => openDetail(t, 'taskDetail')} style={styles.taskRow}>
                    <View style={[styles.taskIndicator, { backgroundColor: t.priority === 'high' ? Colors.coral : '#2C5AA8' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.taskTitle, { color: theme.text }]}>{t.title}</Text>
                      <Text style={styles.taskSub} numberOfLines={1}>{t.description || 'Açıklama belirtilmemiş'}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}

        {/* DYNAMIC LIST VIEWS */}
        {SCREENS[screen]?.kind === 'list' && (
          <View style={{ gap: 15 }}>
            <TextInput 
              placeholder="Ara..."
              placeholderTextColor={theme.ink}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchBar, { backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }]}
            />

            {/* Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 5 }}>
              {['Tümü', 'Aktif', 'Tamamlanan'].map((chip, idx) => (
                <TouchableOpacity 
                  key={idx}
                  onPress={() => setActiveChip(chip)}
                  style={[styles.chip, { backgroundColor: theme.cardBg, borderColor: theme.border }, activeChip === chip && styles.activeChip]}
                >
                  <Text style={[styles.chipText, { color: theme.ink }, activeChip === chip && styles.activeChipText]}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* List Renderer */}
            <View style={{ gap: 10 }}>
              {filteredItemsList.length === 0 ? (
                <Text style={{ fontSize: 13, color: theme.ink, textAlign: 'center', marginTop: 20 }}>Listelenecek kayıt bulunamadı.</Text>
              ) : (
                filteredItemsList.map((item, idx) => {
                  let mainTitle = item.title || item.name || item.company_name || 'İsimsiz Öğe';
                  let subText = item.description || item.contact_name || item.issue_description || item.content || 'Detay bulunmuyor';
                  let avatarChar = mainTitle.substring(0, 2).toUpperCase();
                  let detailScreen = 'taskDetail';

                  if (screen === 'taskList') detailScreen = 'taskDetail';
                  else if (screen === 'projList') detailScreen = 'projDetail';
                  else if (screen === 'offerList') detailScreen = 'offerDetail';
                  else if (screen === 'custList') detailScreen = 'custDetail';
                  else if (screen === 'finList') detailScreen = 'finDetail';
                  else if (screen === 'servList') detailScreen = 'servDetail';
                  else if (screen === 'msgInbox') detailScreen = 'msgDetail';

                  if (screen === 'finList') {
                    mainTitle = `${item.description} (${item.type === 'income' ? 'Gelir' : 'Gider'})`;
                    subText = `${item.amount.toLocaleString('tr-TR')} ₺ · ${item.transaction_date}`;
                    avatarChar = item.type === 'income' ? 'G+' : 'G-';
                  }

                  return (
                    <TouchableOpacity 
                      key={idx} 
                      onPress={() => openDetail(item, detailScreen)}
                      style={[styles.listItemCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                    >
                      <View style={[styles.listAvatar, { backgroundColor: item.type === 'income' ? '#EBFBEE' : '#FEF0EC' }]}>
                        <Text style={{ color: item.type === 'income' ? '#2B8A3E' : Colors.coral, fontWeight: '800' }}>{avatarChar}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemTitle, { color: theme.text }]}>{mainTitle}</Text>
                        <Text style={[styles.itemSubtitle, { color: theme.ink }]} numberOfLines={2}>{subText}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>
        )}

        {/* DETAILS SCREEN: TASK DETAIL */}
        {screen === 'taskDetail' && selectedItem && (
          <View style={{ gap: 15 }}>
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.coral }}>GÖREV DETAYI</Text>
              <Text style={[styles.detailTitle, { color: theme.text }]}>{selectedItem.title}</Text>
              <Text style={[styles.detailDesc, { color: theme.ink }]}>{selectedItem.description || 'Açıklama belirtilmemiş.'}</Text>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.text }]}>Durum:</Text>
                <Text style={{ fontWeight: '700', color: selectedItem.status === 'done' ? '#2B8A3E' : Colors.coral }}>
                  {selectedItem.status === 'done' ? 'Tamamlandı' : selectedItem.status === 'in_progress' ? 'Devam Ediyor' : 'Yapılacak'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.text }]}>Öncelik:</Text>
                <Text style={{ fontWeight: '700', color: selectedItem.priority === 'high' ? Colors.coral : '#2C5AA8' }}>
                  {selectedItem.priority === 'high' ? 'Yüksek' : 'Normal'}
                </Text>
              </View>
              {selectedItem.due_date && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.text }]}>Bitiş Tarihi:</Text>
                  <Text style={{ color: theme.ink }}>{selectedItem.due_date}</Text>
                </View>
              )}
            </View>

            <View style={{ gap: 10 }}>
              {selectedItem.status !== 'done' && (
                <TouchableOpacity 
                  onPress={() => handleUpdateStatus('tasks', selectedItem.id, 'done')}
                  style={[styles.primaryButton, { backgroundColor: '#2B8A3E' }]}
                >
                  <Text style={styles.buttonText}>✓ Tamamlandı Olarak İşaretle</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={() => handleDeleteItem('tasks', selectedItem.id)}
                style={[styles.logoutButton, { marginTop: 0 }]}
              >
                <Text style={{ color: Colors.coral, fontWeight: '800' }}>🗑️ Görevi Sil</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => go(prevScreen)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Geri Dön</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* DETAILS SCREEN: PROJECT DETAIL */}
        {screen === 'projDetail' && selectedItem && (
          <View style={{ gap: 15 }}>
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.coral }}>PROJE DETAYI</Text>
              <Text style={[styles.detailTitle, { color: theme.text }]}>{selectedItem.name}</Text>
              <Text style={[styles.detailDesc, { color: theme.ink }]}>{selectedItem.description || 'Açıklama belirtilmemiş.'}</Text>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.text }]}>Durum:</Text>
                <Text style={{ fontWeight: '700', color: selectedItem.status === 'completed' ? '#2B8A3E' : Colors.coral }}>
                  {selectedItem.status === 'completed' ? 'Tamamlandı' : 'Aktif'}
                </Text>
              </View>
              {selectedItem.start_date && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.text }]}>Başlangıç Tarihi:</Text>
                  <Text style={{ color: theme.ink }}>{selectedItem.start_date}</Text>
                </View>
              )}
            </View>

            <View style={{ gap: 10 }}>
              {selectedItem.status !== 'completed' && (
                <TouchableOpacity 
                  onPress={() => handleUpdateStatus('projects', selectedItem.id, 'completed')}
                  style={[styles.primaryButton, { backgroundColor: '#2B8A3E' }]}
                >
                  <Text style={styles.buttonText}>✓ Projeyi Tamamla</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={() => handleDeleteItem('projects', selectedItem.id)}
                style={[styles.logoutButton, { marginTop: 0 }]}
              >
                <Text style={{ color: Colors.coral, fontWeight: '800' }}>🗑️ Projeyi Sil</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => go(prevScreen)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Geri Dön</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* DETAILS SCREEN: OFFER DETAIL */}
        {screen === 'offerDetail' && selectedItem && (
          <View style={{ gap: 15 }}>
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.coral }}>TEKLİF DETAYI</Text>
              <Text style={[styles.detailTitle, { color: theme.text }]}>{selectedItem.title}</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: theme.text, marginVertical: 10 }}>
                {selectedItem.amount.toLocaleString('tr-TR')} ₺
              </Text>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.text }]}>Müşteri:</Text>
                <Text style={{ color: theme.ink }}>{selectedItem.customer_name || 'Bilinmiyor'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.text }]}>Durum:</Text>
                <Text style={{ fontWeight: '700', color: selectedItem.status === 'accepted' ? '#2B8A3E' : Colors.coral }}>
                  {selectedItem.status === 'accepted' ? 'Kabul Edildi' : selectedItem.status === 'sent' ? 'Gönderildi' : 'Taslak'}
                </Text>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              {selectedItem.status !== 'accepted' && (
                <TouchableOpacity 
                  onPress={() => handleUpdateStatus('offers', selectedItem.id, 'accepted')}
                  style={[styles.primaryButton, { backgroundColor: '#2B8A3E' }]}
                >
                  <Text style={styles.buttonText}>✓ Teklifi Kabul Et</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={() => handleDeleteItem('offers', selectedItem.id)}
                style={[styles.logoutButton, { marginTop: 0 }]}
              >
                <Text style={{ color: Colors.coral, fontWeight: '800' }}>🗑️ Teklifi Sil</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => go(prevScreen)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Geri Dön</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* DETAILS SCREEN: SERVICE TICKET DETAIL */}
        {screen === 'servDetail' && selectedItem && (
          <View style={{ gap: 15 }}>
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.coral }}>SERVİS KAYDI DETAYI</Text>
              <Text style={[styles.detailTitle, { color: theme.text }]}>{selectedItem.customer_name}</Text>
              <Text style={[styles.detailDesc, { color: theme.ink }]}>{selectedItem.issue_description || 'Detay belirtilmemiş.'}</Text>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.text }]}>Durum:</Text>
                <Text style={{ fontWeight: '700', color: selectedItem.status === 'resolved' ? '#2B8A3E' : Colors.coral }}>
                  {selectedItem.status === 'resolved' ? 'Çözüldü' : 'Açık'}
                </Text>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              {selectedItem.status !== 'resolved' && (
                <TouchableOpacity 
                  onPress={() => handleUpdateStatus('service_tickets', selectedItem.id, 'resolved')}
                  style={[styles.primaryButton, { backgroundColor: '#2B8A3E' }]}
                >
                  <Text style={styles.buttonText}>✓ Sorunu Çözüldü İşaretle</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={() => handleDeleteItem('service_tickets', selectedItem.id)}
                style={[styles.logoutButton, { marginTop: 0 }]}
              >
                <Text style={{ color: Colors.coral, fontWeight: '800' }}>🗑️ Servis Kaydını Sil</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => go(prevScreen)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Geri Dön</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* DETAILS SCREEN: READ MAIL (MESSAGE DETAIL) */}
        {screen === 'msgDetail' && selectedItem && (
          <View style={{ gap: 15 }}>
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.coral }}>MESAJ DETAYI</Text>
              <Text style={[styles.detailTitle, { color: theme.text }]}>{selectedItem.title}</Text>
              <Text style={{ fontSize: 12, color: theme.ink, marginBottom: 10 }}>
                Gönderen: {selectedItem.sender_name} → Alıcı: {selectedItem.receiver_name}
              </Text>
              <Text style={[styles.detailDesc, { color: theme.text, marginTop: 10 }]}>{selectedItem.content}</Text>
            </View>

            {/* Reply block */}
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: theme.text, marginBottom: 8 }}>Yanıt Yaz</Text>
              <TextInput 
                placeholder="Yanıtınızı buraya yazın..."
                placeholderTextColor={theme.ink}
                value={replyText}
                onChangeText={setReplyText}
                multiline
                numberOfLines={3}
                style={[styles.input, { height: 80, textAlignVertical: 'top', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
              />
              <TouchableOpacity 
                onPress={handleReplyMessage}
                style={[styles.primaryButton, { height: 40, marginTop: 5 }]}
              >
                <Text style={styles.buttonText}>Yanıtla</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => go('msgInbox')} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* DYNAMIC FORM SCREENS */}
        {SCREENS[screen]?.kind === 'form' && (
          <View style={{ gap: 15 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>Lütfen formu eksiksiz doldurun:</Text>
            
            {/* Conditional Input Rendering based on screen type */}
            {screen === 'servNew' ? (
              <TextInput 
                placeholder="Müşteri Adı"
                placeholderTextColor={theme.ink}
                value={formCustomerId}
                onChangeText={setFormCustomerId}
                style={[styles.input, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
              />
            ) : screen === 'custNew' ? (
              <TextInput 
                placeholder="Şirket / Müşteri Adı"
                placeholderTextColor={theme.ink}
                value={formTitle}
                onChangeText={setFormTitle}
                style={[styles.input, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
              />
            ) : (
              <TextInput 
                placeholder={screen === 'msgNew' ? 'Mesaj Konusu' : 'Başlık / Tanım'}
                placeholderTextColor={theme.ink}
                value={formTitle}
                onChangeText={setFormTitle}
                style={[styles.input, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
              />
            )}

            {screen === 'msgNew' && (
              <TextInput 
                placeholder="Alıcı (Ad Soyad)"
                placeholderTextColor={theme.ink}
                value={formAssignedTo}
                onChangeText={setFormAssignedTo}
                style={[styles.input, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
              />
            )}

            {(screen === 'finNew' || screen === 'offerNew') && (
              <TextInput 
                placeholder="Tutar (₺)"
                placeholderTextColor={theme.ink}
                value={formAmount}
                onChangeText={setFormAmount}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
              />
            )}

            {screen === 'offerNew' && (
              <TextInput 
                placeholder="Müşteri Adı"
                placeholderTextColor={theme.ink}
                value={formCustomerId}
                onChangeText={setFormCustomerId}
                style={[styles.input, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
              />
            )}

            {screen === 'finNew' && (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>Tür seçin:</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity 
                    onPress={() => setFormType('expense')}
                    style={[styles.chip, { flex: 1, alignItems: 'center' }, formType === 'expense' && { backgroundColor: Colors.coral }]}
                  >
                    <Text style={{ fontWeight: '700', color: formType === 'expense' ? '#fff' : theme.text }}>Gider</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setFormType('income')}
                    style={[styles.chip, { flex: 1, alignItems: 'center' }, formType === 'income' && { backgroundColor: '#2B8A3E' }]}
                  >
                    <Text style={{ fontWeight: '700', color: formType === 'income' ? '#fff' : theme.text }}>Gelir</Text>
                  </TouchableOpacity>
                </View>
                <TextInput 
                  placeholder="Kategori (Nakit, Banka, Çek vb.)"
                  placeholderTextColor={theme.ink}
                  value={formCategory}
                  onChangeText={setFormCategory}
                  style={[styles.input, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
                />
              </View>
            )}

            {/* Date field if required */}
            {(screen === 'taskNew' || screen === 'projNew' || screen === 'offerNew' || screen === 'finNew') && (
              <TextInput 
                placeholder="Tarih (YYYY-AA-GG)"
                placeholderTextColor={theme.ink}
                value={formDate}
                onChangeText={setFormDate}
                style={[styles.input, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
              />
            )}

            {screen !== 'finNew' && (
              <TextInput 
                placeholder={screen === 'msgNew' ? 'Mesaj içeriği...' : screen === 'servNew' ? 'Arıza detayı ve açıklaması...' : 'Detaylar / Açıklama'}
                placeholderTextColor={theme.ink}
                value={formDesc}
                onChangeText={setFormDesc}
                multiline
                numberOfLines={4}
                style={[styles.input, { height: 100, textAlignVertical: 'top', backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
              />
            )}

            {loading ? (
              <ActivityIndicator color={Colors.coral} />
            ) : (
              <TouchableOpacity 
                onPress={handleSaveForm}
                style={styles.primaryButton}
              >
                <Text style={styles.buttonText}>Kaydet</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => go(prevScreen)} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SETTINGS VIEW */}
        {screen === 'settings' && (
          <View style={{ gap: 15 }}>
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Uygulama Ayarları</Text>
              
              <View style={[styles.rowItem, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: theme.border }]}>
                <View>
                  <Text style={{ fontWeight: '700', color: theme.text }}>Koyu Tema</Text>
                  <Text style={{ fontSize: 11, color: theme.ink, marginTop: 2 }}>Karanlık arayüze geçiş yap</Text>
                </View>
                <Switch value={darkMode} onValueChange={toggleDarkMode} />
              </View>

              <TouchableOpacity onPress={() => go('settingsProfile')} style={[styles.rowItem, { borderColor: theme.border }]}>
                <Text style={{ fontWeight: '700', color: theme.text }}>👤 Kişisel Bilgiler</Text>
                <Text style={{ fontSize: 11, color: theme.ink, marginTop: 2 }}>Ad soyad, telefon ve unvan düzenle</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => go('settingsCompany')} style={[styles.rowItem, { borderColor: theme.border }]}>
                <Text style={{ fontWeight: '700', color: theme.text }}>🏢 Şirket Bilgileri</Text>
                <Text style={{ fontSize: 11, color: theme.ink, marginTop: 2 }}>Firma adı, vergi numarası ve vergi dairesi</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => go('settingsPlan')} style={[styles.rowItem, { borderColor: theme.border }]}>
                <Text style={{ fontWeight: '700', color: theme.text }}>💳 Abonelik & Plan</Text>
                <Text style={{ fontSize: 11, color: theme.ink, marginTop: 2 }}>Paket yükseltme ve ödeme simülasyonu</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={{ color: Colors.coral, fontWeight: '800' }}>Oturumu Kapat</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SETTINGS VIEW: EDIT PROFILE */}
        {screen === 'settingsProfile' && (
          <View style={{ gap: 15 }}>
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Kişisel Bilgileri Düzenle</Text>
              <TextInput 
                placeholder="Ad Soyad"
                placeholderTextColor={theme.ink}
                value={currentUserProfile.full_name}
                onChangeText={(val) => setCurrentUserProfile((p: any) => ({ ...p, full_name: val }))}
                style={[styles.input, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
              />
              <TextInput 
                placeholder="Telefon"
                placeholderTextColor={theme.ink}
                value={currentUserProfile.phone}
                onChangeText={(val) => setCurrentUserProfile((p: any) => ({ ...p, phone: val }))}
                style={[styles.input, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
              />
            </View>
            <TouchableOpacity onPress={handleSaveProfile} style={styles.primaryButton}>
              <Text style={styles.buttonText}>Profil Bilgilerini Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => go('settings')} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SETTINGS VIEW: EDIT COMPANY */}
        {screen === 'settingsCompany' && (
          <View style={{ gap: 15 }}>
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Şirket Bilgilerini Düzenle</Text>
              <TextInput 
                placeholder="Firma Adı"
                placeholderTextColor={theme.ink}
                value={currentUserProfile.company_name}
                onChangeText={(val) => setCurrentUserProfile((p: any) => ({ ...p, company_name: val }))}
                style={[styles.input, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
              />
            </View>
            <TouchableOpacity onPress={handleSaveCompany} style={styles.primaryButton}>
              <Text style={styles.buttonText}>Firma Bilgilerini Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => go('settings')} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SETTINGS VIEW: UPGRADE PLAN */}
        {screen === 'settingsPlan' && (
          <View style={{ gap: 15 }}>
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Abonelik Paketleri</Text>
              <Text style={{ fontSize: 13, color: theme.ink, marginBottom: 15 }}>
                Mevcut Paketiniz: {currentUserProfile.plan_type.toUpperCase()}
              </Text>
              
              <TouchableOpacity onPress={() => handlePlanUpgrade('starter')} style={[styles.quickCard, { backgroundColor: theme.cardBg, borderColor: theme.border, marginBottom: 10 }]}>
                <Text style={{ fontWeight: '800', color: theme.text }}>Starter Paket</Text>
                <Text style={{ fontSize: 11, color: theme.ink }}>Maksimum 5 Kullanıcı · 299 ₺/ay</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handlePlanUpgrade('professional')} style={[styles.quickCard, { backgroundColor: theme.cardBg, borderColor: theme.border, marginBottom: 10 }]}>
                <Text style={{ fontWeight: '800', color: theme.text }}>Professional Paket</Text>
                <Text style={{ fontSize: 11, color: theme.ink }}>Maksimum 15 Kullanıcı · 599 ₺/ay</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handlePlanUpgrade('enterprise')} style={[styles.quickCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={{ fontWeight: '800', color: theme.text }}>Enterprise Paket</Text>
                <Text style={{ fontSize: 11, color: theme.ink }}>Sınırsız Kullanıcı · 1299 ₺/ay</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => go('settings')} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Floating Action Button (FAB) for List views */}
      {SCREENS[screen]?.kind === 'list' && SCREENS[screen]?.fab && (
        <TouchableOpacity 
          style={styles.fabButton}
          onPress={() => go(SCREENS[screen].fab!)}
        >
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>+</Text>
        </TouchableOpacity>
      )}

      {/* Bottom Tabs */}
      <View style={[styles.bottomTabs, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        {[
          { label: 'Ana Sayfa', mark: 'GP', target: 'home' },
          { label: 'Mesajlar', mark: 'MS', target: 'msgInbox' },
          { label: 'Görevler', mark: 'GÖ', target: 'taskList' },
          { label: 'Ayarlar', mark: 'SA', target: 'settings' }
        ].map((tab, idx) => {
          const isActive = screen === tab.target || (tab.target === 'taskList' && (screen === 'taskList' || screen === 'taskNew' || screen === 'taskDetail'));
          return (
            <TouchableOpacity 
              key={idx} 
              onPress={() => go(tab.target)}
              style={styles.tabItem}
            >
              <View style={[styles.tabBadge, isActive && styles.activeTabBadge]}>
                <Text style={[styles.tabMarkText, isActive && styles.activeTabMarkText]}>{tab.mark}</Text>
              </View>
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Side Menu Drawer overlay */}
      {menuOpen && (
        <View style={styles.drawerOverlay}>
          <View style={[styles.drawerPanel, { backgroundColor: Colors.navy }]}>
            <Text style={styles.drawerHeader}>İŞte Yönetim</Text>
            <View style={{ flex: 1, padding: 15, gap: 10 }}>
              <TouchableOpacity onPress={() => go('home')} style={styles.drawerItem}><Text style={styles.drawerItemText}>🏠 Ana Sayfa</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => go('taskList')} style={styles.drawerItem}><Text style={styles.drawerItemText}>📋 Görevler</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => go('projList')} style={styles.drawerItem}><Text style={styles.drawerItemText}>📂 Projeler</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => go('offerList')} style={styles.drawerItem}><Text style={styles.drawerItemText}>💼 Teklifler</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => go('custList')} style={styles.drawerItem}><Text style={styles.drawerItemText}>👥 Müşteriler</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => go('finList')} style={styles.drawerItem}><Text style={styles.drawerItemText}>💰 Finans</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => go('servList')} style={styles.drawerItem}><Text style={styles.drawerItemText}>🛠️ Teknik Servis</Text></TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setMenuOpen(false)} style={styles.drawerCloseButton}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Kapat</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setMenuOpen(false)} style={{ flex: 1 }} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 0
  },
  authContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center'
  },
  authCard: {
    width: '90%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center'
  },
  authLogo: {
    width: 140,
    height: 50,
    marginBottom: 20
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.navy
  },
  authSubtitle: {
    fontSize: 14,
    color: Colors.ink,
    marginTop: 5,
    marginBottom: 20
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 14.5,
    marginBottom: 12
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.coral,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.coral,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 10
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E4E9F1',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5
  },
  secondaryButtonText: {
    color: Colors.ink,
    fontSize: 14,
    fontWeight: '700'
  },
  buttonText: {
    color: '#fff',
    fontSize: 15.5,
    fontWeight: '800'
  },
  switchText: {
    color: Colors.coral,
    fontSize: 13,
    fontWeight: '700'
  },
  header: {
    height: 64,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15
  },
  headerEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A0B4',
    letterSpacing: 0.5
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800'
  },
  menuButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  welcomeBanner: {
    borderRadius: 20,
    padding: 16
  },
  quickCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14
  },
  quickLabel: {
    fontSize: 11,
    color: Colors.ink,
    fontWeight: '600',
    marginTop: 2
  },
  sectionCard: {
    borderRadius: 20,
    padding: 15,
    borderWidth: 1
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F4F9'
  },
  taskIndicator: {
    width: 6,
    height: 30,
    borderRadius: 4
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  taskSub: {
    fontSize: 11,
    color: Colors.ink,
    marginTop: 1
  },
  searchBar: {
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13.5
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6
  },
  activeChip: {
    backgroundColor: Colors.coral,
    borderColor: Colors.coral
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '700'
  },
  activeChipText: {
    color: '#fff'
  },
  listItemCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  listAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '700'
  },
  itemSubtitle: {
    fontSize: 11.5,
    marginTop: 2
  },
  rowItem: {
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  logoutButton: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#F6D8D2',
    backgroundColor: '#FEF4F2',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  bottomTabs: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 74,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3
  },
  tabBadge: {
    width: 30,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(16,30,51,0.05)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  activeTabBadge: {
    backgroundColor: Colors.coral
  },
  tabMarkText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.ink
  },
  activeTabMarkText: {
    color: '#fff'
  },
  tabLabel: {
    fontSize: 9.5,
    color: Colors.ink,
    fontWeight: '600'
  },
  activeTabLabel: {
    color: Colors.coral,
    fontWeight: '800'
  },
  drawerOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(16,30,51,0.5)',
    flexDirection: 'row',
    zIndex: 99
  },
  drawerPanel: {
    width: 270,
    height: '100%',
    paddingTop: 50
  },
  drawerHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    paddingHorizontal: 15,
    marginBottom: 20
  },
  drawerItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8
  },
  drawerItemText: {
    color: '#A9B8D0',
    fontSize: 14,
    fontWeight: '700'
  },
  drawerCloseButton: {
    height: 48,
    backgroundColor: Colors.coral,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 15,
    borderRadius: 12
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.coral,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  shortcutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 5
  },
  detailDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 10
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  detailLabel: {
    fontWeight: '700'
  }
});
