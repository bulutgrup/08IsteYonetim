import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { supabase, isMockMode, mobileMockData } from '../../lib/supabase';

export default function DashboardScreen() {
  const [profile, setProfile] = useState<any>(mobileMockData.profile);
  const [sales, setSales] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(mobileMockData.stats);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    if (isMockMode()) {
      setProfile(mobileMockData.profile);
      setSales(mobileMockData.sales);
      setStats(mobileMockData.stats);
      setLoading(false);
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Profil ve Şirket
        const { data: profData } = await supabase
          .from('profiles')
          .select('*, tenants(*)')
          .eq('id', user.id)
          .single();

        if (profData) {
          setProfile({
            full_name: profData.full_name,
            tenant_name: profData.tenants?.name || 'İşletme',
            plan_type: profData.tenants?.plan_type || 'kobi',
          });

          // Günlük Satış Hareketlerini çek
          const today = new Date().toISOString().split('T')[0];
          const { data: transData } = await supabase
            .from('finance_transactions')
            .select('*')
            .eq('tenant_id', profData.tenant_id)
            .eq('type', 'income')
            .eq('transaction_date', today)
            .order('created_at', { ascending: false });

          if (transData) {
            setSales(transData.map(t => ({
              id: t.id,
              amount: Number(t.amount),
              description: t.description,
              date: new Date(t.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
              customer: t.category === 'bank' ? 'Nakit Ödeme' : 'Kart Ödemesi'
            })));

            const total = transData.reduce((acc, cur) => acc + Number(cur.amount), 0);
            setStats({
              dailyTotal: total,
              dailyCount: transData.length
            });
          }
        }
      }
    } catch (e) {
      console.error('Dashboard verileri çekilirken hata:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e85c46" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Üst Karşılama Alanı */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Merhaba, {profile.full_name.split(' ')[0]}</Text>
        <Text style={styles.subtitle}>{profile.tenant_name} İş Panosu</Text>
      </View>

      {/* Ciro Kartı */}
      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>BUGÜNKÜ TOPLAM CİRO</Text>
        <Text style={styles.statsTotal}>{stats.dailyTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsSubVal}>🔥 {stats.dailyCount} Tahsilat İşlemi</Text>
          <Text style={styles.statsSubPlan}>{profile.plan_type.toUpperCase()} PAKETİ</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Son Satış Hareketleri</Text>

      {/* Satış Listesi */}
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.saleItem}>
            <View>
              <Text style={styles.saleTitle}>{item.description}</Text>
              <Text style={styles.saleSub}>{item.customer} • {item.date}</Text>
            </View>
            <Text style={styles.saleAmount}>+ {item.amount.toLocaleString('tr-TR')} ₺</Text>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Bugün henüz bir satış işlemi yapılmadı.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF8F0',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBF8F0',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6a7686',
    fontWeight: 'bold',
  },
  header: {
    marginTop: 20,
    marginBottom: 25,
  },
  welcome: {
    fontSize: 22,
    fontWeight: '800',
    color: '#14304d',
  },
  subtitle: {
    fontSize: 14,
    color: '#6a7686',
    marginTop: 3,
  },
  statsCard: {
    background: 'linear-gradient(135deg, #E85C46, #F4983E)',
    backgroundColor: '#e85c46', // Fallback
    padding: 25,
    borderRadius: 22,
    marginBottom: 30,
    shadowColor: '#e85c46',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
  },
  statsLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statsTotal: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 12,
    marginTop: 5,
  },
  statsSubVal: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  statsSubPlan: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#14304d',
    marginBottom: 15,
  },
  listContainer: {
    paddingBottom: 20,
  },
  saleItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#14304d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  saleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14304d',
  },
  saleSub: {
    fontSize: 12,
    color: '#6a7686',
    marginTop: 4,
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2be080',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#6a7686',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
