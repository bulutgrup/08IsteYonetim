import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode, mockData, formatTRY } from '../lib/supabase';
import { Link } from 'react-router-dom';

export const Finance: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    if (isMockMode()) {
      setTransactions(mockData.finance || []);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('finance_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (e) {
      console.error("Finansal hareketler yüklenirken hata:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu finansal hareketi silmek istediğinizden emin misiniz?")) return;
    
    if (isMockMode()) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      return;
    }
    try {
      const { error } = await supabase
        .from('finance_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTransactions();
    } catch (e) {
      console.error("İşlem silinirken hata oluştu:", e);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'bank': return 'badge bg-primary';
      case 'cash': return 'badge bg-success';
      case 'check': return 'badge bg-warning';
      case 'invoice': return 'badge bg-info';
      default: return 'badge bg-secondary';
    }
  };

  const translateCategory = (category: string) => {
    switch (category) {
      case 'bank': return 'Banka Havalesi';
      case 'cash': return 'Nakit Ödeme';
      case 'check': return 'Müşteri Çeki';
      case 'invoice': return 'Fatura Tahsilatı';
      default: return category;
    }
  };

  const getAmountColor = (type: string) => {
    return type === 'income' ? 'text-success font-weight-600' : 'text-danger font-weight-600';
  };

  // İstatistikler
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(t => {
    const typeMatch = filterType === 'all' || t.type === filterType;
    const catMatch = filterCategory === 'all' || t.category === filterCategory;
    return typeMatch && catMatch;
  });

  return (
    <Layout title="Finans Yönetimi">
      {/* Finansal Özet Kartları */}
      <div className="row">
        <div className="col-xl-4 col-md-6 col-12">
          <div className="box pull-up">
            <div className="box-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h5 className="text-mute mb-0">Toplam Gelir</h5>
                  <h2 className="mb-0 font-weight-700 text-success">
                    {formatTRY(totalIncome)}
                  </h2>
                </div>
                <div className="bg-success-light rounded-circle h-60 w-60 d-flex align-items-center justify-content-center">
                  <i className="fa fa-arrow-up text-success font-size-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-md-6 col-12">
          <div className="box pull-up">
            <div className="box-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h5 className="text-mute mb-0">Toplam Gider</h5>
                  <h2 className="mb-0 font-weight-700 text-danger">
                    {formatTRY(totalExpense)}
                  </h2>
                </div>
                <div className="bg-danger-light rounded-circle h-60 w-60 d-flex align-items-center justify-content-center">
                  <i className="fa fa-arrow-down text-danger font-size-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-md-6 col-12">
          <div className="box pull-up">
            <div className="box-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h5 className="text-mute mb-0">Net Kasa Bakiye</h5>
                  <h2 className={`mb-0 font-weight-700 ${netBalance >= 0 ? 'text-primary' : 'text-danger'}`}>
                    {formatTRY(netBalance)}
                  </h2>
                </div>
                <div className="bg-primary-light rounded-circle h-60 w-60 d-flex align-items-center justify-content-center">
                  <i className="fa fa-university text-primary font-size-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Kasa & Banka Hareketleri</h4>
              <div className="box-controls pull-right">
                <Link to="/finance/new" className="btn btn-sm btn-rounded btn-success">
                  <i className="fa fa-plus mr-5"></i> Yeni Finansal İşlem Ekle
                </Link>
              </div>
            </div>
            
            <div className="box-body">
              {/* Filtreleme Çubuğu */}
              <div className="row mb-20">
                <div className="col-md-3 col-6">
                  <label htmlFor="filterType">İşlem Türü</label>
                  <select
                    id="filterType"
                    className="form-control"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">Tümü (Gelir/Gider)</option>
                    <option value="income">Sadece Gelirler</option>
                    <option value="expense">Sadece Giderler</option>
                  </select>
                </div>
                <div className="col-md-3 col-6">
                  <label htmlFor="filterCat">Ödeme Kanalı</label>
                  <select
                    id="filterCat"
                    className="form-control"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="all">Tüm Kanallar</option>
                    <option value="bank">Banka Havalesi</option>
                    <option value="cash">Nakit Kasa</option>
                    <option value="check">Çek Portföyü</option>
                    <option value="invoice">Fatura Tahsilatı</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-40">
                  <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Yükleniyor...</span>
                  </div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-40">
                  <p className="text-muted">Kriterlere uygun finansal hareket bulunamadı.</p>
                </div>
              ) : (
                <>
                  {/* Desktop View */}
                  <div className="table-responsive d-none d-md-block">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Tarih</th>
                          <th>Açıklama</th>
                          <th>Kategori</th>
                          <th>Tür</th>
                          <th>Tutar</th>
                          <th style={{ width: '100px' }}>Aksiyon</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((t) => (
                          <tr key={t.id}>
                            <td>{new Date(t.transaction_date).toLocaleDateString('tr-TR')}</td>
                            <td><strong>{t.description}</strong></td>
                            <td>
                              <span className={getCategoryBadgeClass(t.category)}>
                                {translateCategory(t.category)}
                              </span>
                            </td>
                            <td>
                              <span className={t.type === 'income' ? 'label label-success' : 'label label-danger'}>
                                {t.type === 'income' ? 'Gelir' : 'Gider'}
                              </span>
                            </td>
                            <td>
                              <span className={getAmountColor(t.type)}>
                                {t.type === 'expense' ? '- ' : '+ '}
                                {formatTRY(t.amount)}
                              </span>
                            </td>
                            <td>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-danger-outline btn-rounded"
                                onClick={() => handleDelete(t.id)}
                              >
                                <i className="fa fa-trash"></i> Sil
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View */}
                  <div className="d-block d-md-none">
                    {filteredTransactions.map((t) => {
                      const isExpanded = expandedRowId === t.id;
                      return (
                        <div 
                          key={`mob-${t.id}`} 
                          className="box box-solid mb-10" 
                          style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}
                        >
                          <div 
                            className="box-header bg-white py-15 px-20 d-flex justify-content-between align-items-center"
                            style={{ cursor: 'pointer', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}
                            onClick={() => setExpandedRowId(isExpanded ? null : t.id)}
                          >
                            <div style={{ flex: 1, paddingRight: '10px' }}>
                              <h5 className="mb-0 font-weight-600 text-dark" style={{ fontSize: '15px', lineHeight: '1.4' }}>
                                {t.description}
                              </h5>
                              <span className="font-size-11 text-muted mt-5 d-block">
                                Tarih: {new Date(t.transaction_date).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            <div className="d-flex align-items-center" style={{ gap: '8px', flexShrink: 0 }}>
                              <span className={getAmountColor(t.type)} style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                {t.type === 'expense' ? '- ' : '+ '}
                                {formatTRY(t.amount)}
                              </span>
                              <i className={`fa ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-muted ml-5`}></i>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="box-body bg-light-skin py-15 px-20" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                              <div className="mb-10">
                                <strong>Kategori:</strong>{' '}
                                <span className={getCategoryBadgeClass(t.category)}>
                                  {translateCategory(t.category)}
                                </span>
                              </div>
                              <div className="mb-10">
                                <strong>İşlem Türü:</strong>{' '}
                                <span className={t.type === 'income' ? 'label label-success' : 'label label-danger'}>
                                  {t.type === 'income' ? 'Gelir' : 'Gider'}
                                </span>
                              </div>
                              <div className="d-flex mt-15" style={{ gap: '10px' }}>
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-danger-outline btn-rounded btn-block py-5"
                                  onClick={() => handleDelete(t.id)}
                                >
                                  <i className="fa fa-trash"></i> İşlemi Sil
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
