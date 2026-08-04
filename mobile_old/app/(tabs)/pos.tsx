import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { supabase, isMockMode, mobileMockData } from '../../lib/supabase';

export default function POSScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransaction = async (paymentMethod: 'cash' | 'card') => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir tutar girin!');
      return;
    }

    setLoading(true);

    if (isMockMode()) {
      // Mock Mod Simülasyonu
      const newSale = {
        id: String(mobileMockData.sales.length + 1),
        amount: numericAmount,
        description: description || 'Mobil Hızlı POS Satışı',
        date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        customer: paymentMethod === 'cash' ? 'Nakit Ödeme' : 'Kart Ödemesi'
      };
      mobileMockData.sales.unshift(newSale);
      mobileMockData.stats.dailyTotal += numericAmount;
      mobileMockData.stats.dailyCount += 1;

      setTimeout(() => {
        setLoading(false);
        Alert.alert('Başarılı', `${paymentMethod === 'cash' ? 'Nakit' : 'Kart'} tahsilatı başarıyla yapıldı!`);
        setAmount('');
        setDescription('');
      }, 800);
      return;
    }

    try {
      // Supabase'e finans hareketi ekle
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Oturum açmış kullanıcı bulunamadı!');

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Kullanıcı profili yüklenemedi!');

      const { error } = await supabase
        .from('finance_transactions')
        .insert({
          tenant_id: profile.tenant_id,
          type: 'income',
          category: paymentMethod === 'cash' ? 'bank' : 'other', // bank nakit, other kart olarak simüle edildi
          amount: numericAmount,
          description: description || 'Mobil POS Tahsilatı',
          transaction_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      Alert.alert('Başarılı', 'Tahsilat başarıyla veritabanına kaydedildi!');
      setAmount('');
      setDescription('');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Hata', e.message || 'İşlem gerçekleştirilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Hızlı POS Satışı</Text>
        
        <Text style={styles.label}>Tutar (TL) *</Text>
        <TextInput
          style={styles.inputAmount}
          placeholder="0.00"
          placeholderTextColor="#8d99ae"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Açıklama / Sipariş Notu</Text>
        <TextInput
          style={styles.inputDesc}
          placeholder="Örn: 2 Adet Kumpir"
          placeholderTextColor="#8d99ae"
          value={description}
          onChangeText={setDescription}
        />

        <View style={styles.btnRow}>
          <TouchableOpacity 
            style={[styles.btn, styles.btnCash]} 
            onPress={() => handleTransaction('cash')}
            disabled={loading}
          >
            <Text style={styles.btnText}>💵 NAKİT</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btn, styles.btnCard]} 
            onPress={() => handleTransaction('card')}
            disabled={loading}
          >
            <Text style={styles.btnText}>💳 KART</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FBF8F0',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 20,
    shadowColor: '#14304d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#14304d',
    marginBottom: 25,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6a7686',
    marginBottom: 8,
  },
  inputAmount: {
    borderWidth: 1,
    borderColor: '#e7decb',
    borderRadius: 10,
    padding: 15,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#14304d',
    marginBottom: 20,
    textAlign: 'right',
  },
  inputDesc: {
    borderWidth: 1,
    borderColor: '#e7decb',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#14304d',
    marginBottom: 30,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  btn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCash: {
    backgroundColor: '#2be080',
  },
  btnCard: {
    backgroundColor: '#e85c46',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
