import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase, isMockMode, mobileMockData } from '../../lib/supabase';

export default function BillingScreen() {
  const [profile, setProfile] = useState<any>(mobileMockData.profile);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  const fetchBillingInfo = async () => {
    setLoading(true);
    if (isMockMode()) {
      setProfile(mobileMockData.profile);
      setLoading(false);
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Profil ve Tenant bilgisini çek
        const { data: profData } = await supabase
          .from('profiles')
          .select('*, tenants(*)')
          .eq('id', user.id)
          .single();

        if (profData) {
          // Bu tenant altındaki toplam aktif kullanıcı sayısını say
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', profData.tenant_id)
            .eq('is_active', true);

          // Plana göre kullanıcı limiti
          let limit = 3;
          if (profData.tenants?.plan_type === 'profesyonel') limit = 10;
          if (profData.tenants?.plan_type === 'kurumsal') limit = 20;

          setProfile({
            full_name: profData.full_name,
            tenant_name: profData.tenants?.name || 'İşletme',
            plan_type: profData.tenants?.plan_type || 'kobi',
            active_users: count || 0,
            user_limit: limit
          });
        }
      }
    } catch (e) {
      console.error('Abonelik bilgileri çekilirken hata:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  const handlePurchase = async (planType: 'kobi' | 'profesyonel' | 'kurumsal', price: string) => {
    Alert.alert(
      'Satın Alım Onayı',
      `${planType.toUpperCase()} paketi (${price}) uygulama içi satın alma (IAP) ile tahsil edilecektir. Devam etmek istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Satın Al', 
          onPress: async () => {
            setBuying(true);
            
            if (isMockMode()) {
              // Mock Mod Simülasyonu
              setTimeout(() => {
                let limit = 3;
                if (planType === 'profesyonel') limit = 10;
                if (planType === 'kurumsal') limit = 20;

                mobileMockData.profile.plan_type = planType;
                mobileMockData.profile.user_limit = limit;
                
                setProfile(prev => ({
                  ...prev,
                  plan_type: planType,
                  user_limit: limit
                }));

                setBuying(false);
                Alert.alert('Başarılı', 'Paketiniz başarıyla yükseltildi! limitleriniz güncellendi.');
              }, 1500);
              return;
            }

            try {
              // Supabase Tenant Güncelleme
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Oturum açmış kullanıcı bulunamadı!');

              const { data: profData } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .single();

              if (!profData) throw new Error('Profil yüklenemedi!');

              // 1 aylık abonelik süresi uzat
              const endsAt = new Date();
              endsAt.setMonth(endsAt.getMonth() + 1);

              const { error } = await supabase
                .from('tenants')
                .update({
                  plan_type: planType,
                  status: 'active',
                  subscription_ends_at: endsAt.toISOString()
                })
                .eq('id', profData.tenant_id);

              if (error) throw error;

              Alert.alert('Başarılı', 'Ödeme tamamlandı! Paketiniz veritabanında yükseltildi.');
              fetchBillingInfo();

            } catch (e: any) {
              console.error(e);
              Alert.alert('Hata', e.message || 'Ödeme doğrulanamadı.');
            } finally {
              setBuying(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e85c46" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Mevcut Durum Kartı */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>{profile.tenant_name}</Text>
        <Text style={styles.statusSub}>Aktif Paket: <Text style={styles.statusHighlight}>{profile.plan_type.toUpperCase()}</Text></Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Kullanıcı Limiti Denetimi</Text>
            <Text style={styles.progressVal}>{profile.active_users} / {profile.user_limit} Personel</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, (profile.active_users / profile.user_limit) * 100)}%` }]} />
          </View>
          {profile.active_users >= profile.user_limit && (
            <Text style={styles.limitWarning}>⚠️ Kullanıcı limitine ulaştınız veya aştınız! Yeni personel eklemek için paketinizi yükseltin.</Text>
          )}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Paketler & Fiyatlandırma</Text>

      {/* 1-3 KOBİ Paketi */}
      <View style={[styles.planCard, profile.plan_type === 'kobi' && styles.activePlanCard]}>
        <View style={styles.planHeader}>
          <Text style={styles.planName}>KOBİ (1-3 Kullanıcı)</Text>
          {profile.plan_type === 'kobi' && <Text style={styles.activeTag}>Mevcut</Text>}
        </View>
        <Text style={styles.planPrice}>99 ₺ <Text style={styles.planPeriod}>/ aylık</Text></Text>
        <Text style={styles.planPriceYear}>990 ₺ / yıllık (2 Ay Bedava!)</Text>
        <Text style={styles.planDesc}>• Maksimum 3 aktif kullanıcı</Text>
        <Text style={styles.planDesc}>• Mobil POS uygulaması takibi</Text>
        <Text style={styles.planDesc}>• Temel finans ve sipariş kayıtları</Text>
        <TouchableOpacity 
          style={[styles.buyBtn, profile.plan_type === 'kobi' && styles.disabledBuyBtn]} 
          onPress={() => handlePurchase('kobi', '99 ₺')}
          disabled={buying || profile.plan_type === 'kobi'}
        >
          <Text style={styles.buyBtnText}>{profile.plan_type === 'kobi' ? 'Aktif Paket' : 'KOBİ Paketine Geç'}</Text>
        </TouchableOpacity>
      </View>

      {/* 4-10 Profesyonel Paketi */}
      <View style={[styles.planCard, profile.plan_type === 'profesyonel' && styles.activePlanCard]}>
        <View style={styles.planHeader}>
          <Text style={styles.planName}>PROFESYONEL (4-10 Kullanıcı)</Text>
          {profile.plan_type === 'profesyonel' && <Text style={styles.activeTag}>Mevcut</Text>}
        </View>
        <Text style={styles.planPrice}>199 ₺ <Text style={styles.planPeriod}>/ aylık</Text></Text>
        <Text style={styles.planPriceYear}>1990 ₺ / yıllık (2 Ay Bedava!)</Text>
        <Text style={styles.planDesc}>• Maksimum 10 aktif kullanıcı</Text>
        <Text style={styles.planDesc}>• Gelişmiş raporlama & takvim</Text>
        <Text style={styles.planDesc}>• Öncelikli e-posta desteği</Text>
        <TouchableOpacity 
          style={[styles.buyBtn, styles.buyBtnProf, profile.plan_type === 'profesyonel' && styles.disabledBuyBtn]} 
          onPress={() => handlePurchase('profesyonel', '199 ₺')}
          disabled={buying || profile.plan_type === 'profesyonel'}
        >
          <Text style={styles.buyBtnText}>{profile.plan_type === 'profesyonel' ? 'Aktif Paket' : 'Hemen Yükselt'}</Text>
        </TouchableOpacity>
      </View>

      {/* 11-20 Kurumsal Paketi */}
      <View style={[styles.planCard, profile.plan_type === 'kurumsal' && styles.activePlanCard]}>
        <View style={styles.planHeader}>
          <Text style={styles.planName}>KURUMSAL (11-20 Kullanıcı)</Text>
          {profile.plan_type === 'kurumsal' && <Text style={styles.activeTag}>Mevcut</Text>}
        </View>
        <Text style={styles.planPrice}>299 ₺ <Text style={styles.planPeriod}>/ aylık</Text></Text>
        <Text style={styles.planPriceYear}>2999 ₺ / yıllık (2 Ay Bedava!)</Text>
        <Text style={styles.planDesc}>• Maksimum 20 aktif kullanıcı</Text>
        <Text style={styles.planDesc}>• Çoklu şube & teknik servis personeli</Text>
        <Text style={styles.planDesc}>• 7/24 Telefon ve öncelikli destek</Text>
        <TouchableOpacity 
          style={[styles.buyBtn, styles.buyBtnCorp, profile.plan_type === 'kurumsal' && styles.disabledBuyBtn]} 
          onPress={() => handlePurchase('kurumsal', '299 ₺')}
          disabled={buying || profile.plan_type === 'kurumsal'}
        >
          <Text style={styles.buyBtnText}>{profile.plan_type === 'kurumsal' ? 'Aktif Paket' : 'Hemen Yükselt'}</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F3EEE0',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3EEE0',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6a7686',
    fontWeight: 'bold',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: '#14304d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#14304d',
  },
  statusSub: {
    fontSize: 14,
    color: '#6a7686',
    marginTop: 5,
    marginBottom: 15,
  },
  statusHighlight: {
    color: '#e85c46',
    fontWeight: 'bold',
  },
  progressContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e7decb',
    paddingTop: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6a7686',
  },
  progressVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#14304d',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#ece4d2',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#e85c46',
    borderRadius: 5,
  },
  limitWarning: {
    color: '#d94a38',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#14304d',
    marginBottom: 15,
  },
  planCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#14304d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activePlanCard: {
    borderColor: '#e85c46',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14304d',
  },
  activeTag: {
    backgroundColor: 'rgba(232,92,70,0.12)',
    color: '#e85c46',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 'bold',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#e85c46',
  },
  planPeriod: {
    fontSize: 14,
    color: '#6a7686',
    fontWeight: 'normal',
  },
  planPriceYear: {
    fontSize: 12,
    color: '#2be080',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  planDesc: {
    fontSize: 13,
    color: '#6a7686',
    marginBottom: 6,
  },
  buyBtn: {
    backgroundColor: '#1e4063',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buyBtnProf: {
    backgroundColor: '#e85c46',
  },
  buyBtnCorp: {
    backgroundColor: '#f4983e',
  },
  disabledBuyBtn: {
    backgroundColor: '#ece4d2',
  },
  buyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
