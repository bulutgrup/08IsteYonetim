import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode, mockData } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const FinanceForm: React.FC = () => {
  const navigate = useNavigate();
  const [type, setType] = useState('income'); // income or expense
  const [category, setCategory] = useState('bank'); // bank, cash, check, invoice
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isMockMode()) {
      if (!mockData.finance) mockData.finance = [];
      mockData.finance.push({
        id: String(mockData.finance.length + 1),
        type,
        category,
        amount: parseFloat(amount),
        description,
        transaction_date: transactionDate
      });
      setTimeout(() => {
        setLoading(false);
        navigate('/finance');
      }, 1000);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum açmış kullanıcı bulunamadı!");

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error("Kullanıcı profili yüklenemedi!");

      const { error } = await supabase
        .from('finance_transactions')
        .insert({
          tenant_id: profile.tenant_id,
          type,
          category,
          amount: parseFloat(amount),
          description,
          transaction_date: transactionDate
        });

      if (error) throw error;
      navigate('/finance');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Finansal işlem kaydedilirken hata oluştu.');
      setLoading(false);
    }
  };

  return (
    <Layout title="Yeni Finansal İşlem Ekle">
      <div className="row">
        <div className="col-12 col-lg-8">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Finansal İşlem Bilgileri</h4>
            </div>
            
            <div className="box-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="form-element">
                {/* Gelir / Gider Tipi Seçimi */}
                <div className="form-group">
                  <label style={{ display: 'block' }}>İşlem Türü *</label>
                  <div className="d-flex" style={{ gap: '20px' }}>
                    <label className="d-flex align-items-center" style={{ cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="transaction_type"
                        className="mr-5"
                        checked={type === 'income'}
                        onChange={() => setType('income')}
                      />
                      <span className="text-success font-weight-600">Gelir (Tahsilat / Giriş)</span>
                    </label>
                    <label className="d-flex align-items-center" style={{ cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="transaction_type"
                        className="mr-5"
                        checked={type === 'expense'}
                        onChange={() => setType('expense')}
                      />
                      <span className="text-danger font-weight-600">Gider (Ödeme / Çıkış)</span>
                    </label>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="category">Ödeme Kanalı *</label>
                      <select
                        id="category"
                        className="form-control"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                      >
                        <option value="bank">Banka Havalesi</option>
                        <option value="cash">Nakit / Kasa</option>
                        <option value="check">Çek</option>
                        <option value="invoice">Fatura Tahsilatı</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="amount">İşlem Tutarı (₺) *</label>
                      <input
                        type="number"
                        id="amount"
                        className="form-control"
                        placeholder="Örn: 2450.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="transactionDate">İşlem Tarihi *</label>
                      <input
                        type="date"
                        id="transactionDate"
                        className="form-control"
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">İşlem Açıklaması *</label>
                  <input
                    type="text"
                    id="description"
                    className="form-control"
                    placeholder="Örn: Haziran ayı kira ödemesi veya Otantik Kumpir tahsilatı"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="box-footer" style={{ paddingLeft: 0, paddingRight: 0, background: 'transparent' }}>
                  <button
                    type="submit"
                    className={`btn btn-rounded font-weight-600 px-30 ${type === 'income' ? 'btn-success' : 'btn-danger'}`}
                    disabled={loading}
                  >
                    {loading ? 'Kaydediliyor...' : 'İşlemi Kaydet'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-rounded btn-outline-secondary ml-10 px-30"
                    onClick={() => navigate('/finance')}
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
