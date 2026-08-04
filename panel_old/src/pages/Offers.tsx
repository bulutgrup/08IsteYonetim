import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode, formatTRY } from '../lib/supabase';
import { Link } from 'react-router-dom';


export const Offers: React.FC = () => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Default offers
  const defaultOffers = [
    { id: '1', title: 'Web Arayüz Tasarımı Teklifi', customers: { company_name: 'Otantik Kumpir' }, amount: 15000, status: 'sent', valid_until: '2026-06-30' },
    { id: '2', title: 'Tablet POS Donanım Kurulumu', customers: { company_name: 'Şampiyon Kokoreç' }, amount: 8500, status: 'accepted', valid_until: '2026-07-15' },
    { id: '3', title: 'Yıllık Sunucu Bakım Sözleşmesi', customers: { company_name: 'Bulut Yapı Sanayi' }, amount: 3200, status: 'draft', valid_until: '2026-06-20' }
  ];

  const fetchOffers = async () => {
    setLoading(true);
    if (isMockMode()) {
      const saved = localStorage.getItem('sb-mock-offers');
      if (saved) {
        setOffers(JSON.parse(saved));
      } else {
        setOffers(defaultOffers);
        localStorage.setItem('sb-mock-offers', JSON.stringify(defaultOffers));
      }
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*, customers(company_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (e) {
      console.error("Teklifler yüklenirken hata oluştu:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    const loadStaff = async () => {
      const savedStaff = localStorage.getItem('sb-mock-personnel');
      const localList = savedStaff ? JSON.parse(savedStaff) : [
        { id: '1', full_name: 'Ahmet Karaca', is_active: true },
        { id: '2', full_name: 'Mehmet Yılmaz', is_active: true },
        { id: '3', full_name: 'Ali BOLAT', is_active: true },
        { id: '4', full_name: 'Emre KINACI', is_active: false }
      ];

      if (isMockMode()) {
        setStaff(localList);
        return;
      }
      try {
        const { data } = await supabase.from('profiles').select('id, full_name, is_active');
        const dbList = data || [];
        const mergedList = [...dbList];

        localList.forEach((localItem: any) => {
          const exists = dbList.some((dbItem: any) => 
            dbItem.full_name && localItem.full_name && dbItem.full_name.toLowerCase() === localItem.full_name.toLowerCase()
          );
          if (!exists) {
            mergedList.push(localItem);
          }
        });
        setStaff(mergedList);
      } catch (e) {
        console.error("Personel yüklenemedi:", e);
        setStaff(localList);
      }
    };
    loadStaff();
  }, []);

  const getOfferRoles = (offer: any) => {
    let author = 'Atanmadı';
    let approver = 'Atanmadı';
    let purchasing = 'Atanmadı';
    let displayNotes = offer.notes || '';

    if (offer.notes && offer.notes.startsWith('__METADATA__:')) {
      try {
        const parts = offer.notes.split('__\n');
        const metaStr = parts[0].replace('__METADATA__:', '');
        const meta = JSON.parse(metaStr);
        displayNotes = parts.slice(1).join('__\n');

        if (meta.assigned_author) {
          author = staff.find(s => s.id === meta.assigned_author)?.full_name || 'Atanmadı';
        }
        if (meta.assigned_approver) {
          approver = staff.find(s => s.id === meta.assigned_approver)?.full_name || 'Atanmadı';
        }
        if (meta.assigned_purchasing) {
          purchasing = staff.find(s => s.id === meta.assigned_purchasing)?.full_name || 'Atanmadı';
        }
      } catch (e) {
        // ignore
      }
    }

    return { author, approver, purchasing, displayNotes };
  };

  const handleStatusChange = async (offerId: string, newStatus: string) => {
    if (isMockMode()) {
      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: newStatus } : o));
      return;
    }
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: newStatus })
        .eq('id', offerId);

      if (error) throw error;
      fetchOffers();
    } catch (e) {
      console.error("Teklif güncellenirken hata oluştu:", e);
    }
  };

  const handleDelete = async (offerId: string) => {
    if (!window.confirm("Bu teklifi silmek istediğinizden emin misiniz?")) return;
    
    if (isMockMode()) {
      setOffers(prev => prev.filter(o => o.id !== offerId));
      return;
    }
    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId);

      if (error) throw error;
      fetchOffers();
    } catch (e) {
      console.error("Teklif silinirken hata oluştu:", e);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft': return 'badge bg-secondary';
      case 'sent': return 'badge bg-info';
      case 'accepted': return 'badge bg-success';
      case 'rejected': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'draft': return 'Taslak';
      case 'sent': return 'Gönderildi';
      case 'accepted': return 'Kabul Edildi';
      case 'rejected': return 'Reddedildi';
      default: return status;
    }
  };

  // İstatistik hesaplamaları
  const totalAmount = offers.reduce((sum, o) => sum + (o.status === 'accepted' ? o.amount : 0), 0);
  const pendingCount = offers.filter(o => o.status === 'sent').length;
  const acceptedCount = offers.filter(o => o.status === 'accepted').length;

  return (
    <Layout title="Teklif Yönetimi">
      {/* İstatistik Özet Kartları */}
      <div className="row">
        <div className="col-lg-4 col-12">
          <div className="box pull-up">
            <div className="box-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h5 className="text-mute mb-0">Toplam Kabul Edilen Teklif</h5>
                  <h2 className="mb-0 font-weight-700 text-success">
                    {formatTRY(totalAmount)}
                  </h2>
                </div>
                <div className="bg-success-light rounded-circle h-60 w-60 d-flex align-items-center justify-content-center">
                  <i className="fa fa-money text-success font-size-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4 col-12">
          <div className="box pull-up">
            <div className="box-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h5 className="text-mute mb-0">Bekleyen Teklifler</h5>
                  <h2 className="mb-0 font-weight-700 text-warning">{pendingCount} Adet</h2>
                </div>
                <div className="bg-warning-light rounded-circle h-60 w-60 d-flex align-items-center justify-content-center">
                  <i className="fa fa-paper-plane text-warning font-size-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4 col-12">
          <div className="box pull-up">
            <div className="box-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h5 className="text-mute mb-0">Kabul Edilen Projeler</h5>
                  <h2 className="mb-0 font-weight-700 text-info">{acceptedCount} Adet</h2>
                </div>
                <div className="bg-info-light rounded-circle h-60 w-60 d-flex align-items-center justify-content-center">
                  <i className="fa fa-check-circle text-info font-size-24"></i>
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
              <h4 className="box-title">Verilen Fiyat Teklifleri</h4>
              <div className="box-controls pull-right">
                <Link to="/offers/new" className="btn btn-sm btn-rounded btn-success">
                  <i className="fa fa-plus mr-5"></i> Yeni Teklif Hazırla
                </Link>
              </div>
            </div>
            
            <div className="box-body">
              {loading ? (
                <div className="text-center py-40">
                  <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Yükleniyor...</span>
                  </div>
                </div>
              ) : offers.length === 0 ? (
                <div className="text-center py-40">
                  <p className="text-muted">Herhangi bir teklif kaydı bulunamadı.</p>
                </div>
              ) : (
                <>
                  {/* Desktop View */}
                  <div className="table-responsive d-none d-md-block">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Teklif Konusu</th>
                          <th>Müşteri</th>
                          <th>Yetkililer</th>
                          <th>Tutar</th>
                          <th>Geçerlilik Tarihi</th>
                          <th>Durum</th>
                          <th style={{ width: '250px' }}>Aksiyon</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offers.map((offer) => {
                          const { author, approver, purchasing, displayNotes } = getOfferRoles(offer);
                          return (
                            <tr key={offer.id}>
                              <td>
                                <strong>{offer.title}</strong>
                                {displayNotes && <small className="block text-muted" style={{ display: 'block', fontSize: '11px' }}>{displayNotes}</small>}
                              </td>
                              <td>{offer.customers?.company_name || offer.customer_id || 'Müşteri Belirtilmedi'}</td>
                              <td>
                                <div className="font-size-12">
                                  <div><strong className="text-dark">Hazırlayan:</strong> {author}</div>
                                  {approver !== 'Atanmadı' && <div><strong className="text-success">Onaylayan:</strong> {approver}</div>}
                                  {purchasing !== 'Atanmadı' && <div><strong className="text-warning">Satın Alma:</strong> {purchasing}</div>}
                                </div>
                              </td>
                              <td><strong>{offer.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }).replace('TRY', '₺')}</strong></td>
                              <td>{new Date(offer.valid_until).toLocaleDateString('tr-TR')}</td>
                              <td>
                                <span className={getStatusBadgeClass(offer.status)}>
                                  {translateStatus(offer.status)}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group">
                                  <button type="button" className="btn btn-sm btn-info-outline dropdown-toggle mr-10" data-toggle="dropdown">
                                    Durum Değiştir
                                  </button>
                                  <div className="dropdown-menu">
                                    <button className="dropdown-item" onClick={() => handleStatusChange(offer.id, 'draft')}>Taslak</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(offer.id, 'sent')}>Gönderildi</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(offer.id, 'accepted')}>Kabul Edildi</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(offer.id, 'rejected')}>Reddedildi</button>
                                  </div>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-danger-outline"
                                    onClick={() => handleDelete(offer.id)}
                                  >
                                    <i className="fa fa-trash"></i> Sil
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View */}
                  <div className="d-block d-md-none">
                    {offers.map((offer) => {
                      const { author, approver, purchasing, displayNotes } = getOfferRoles(offer);
                      const isExpanded = expandedRowId === offer.id;
                      return (
                        <div 
                          key={`mob-${offer.id}`} 
                          className="box box-solid mb-10" 
                          style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}
                        >
                          <div 
                            className="box-header bg-white py-15 px-20 d-flex justify-content-between align-items-center"
                            style={{ cursor: 'pointer', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}
                            onClick={() => setExpandedRowId(isExpanded ? null : offer.id)}
                          >
                            <div style={{ flex: 1, paddingRight: '10px' }}>
                              <h5 className="mb-0 font-weight-600 text-dark" style={{ fontSize: '15px', lineHeight: '1.4' }}>
                                {offer.title}
                              </h5>
                              <span className="font-size-11 text-muted mt-5 d-block">
                                Müşteri: {offer.customers?.company_name || offer.customer_id || 'Müşteri Belirtilmedi'}
                              </span>
                            </div>
                            <div className="d-flex align-items-center" style={{ gap: '8px', flexShrink: 0 }}>
                              <span className={getStatusBadgeClass(offer.status)}>
                                {translateStatus(offer.status)}
                              </span>
                              <i className={`fa ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-muted ml-5`}></i>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="box-body bg-light-skin py-15 px-20" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                              <div className="mb-10">
                                <strong>Açıklama/Notlar:</strong> {displayNotes}
                              </div>
                              <div className="mb-10">
                                <strong>Tutar:</strong> <strong>{offer.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }).replace('TRY', '₺')}</strong>
                              </div>
                              <div className="mb-10">
                                <strong>Geçerlilik Tarihi:</strong> {new Date(offer.valid_until).toLocaleDateString('tr-TR')}
                              </div>
                              <div className="mb-10">
                                <strong>Görevliler:</strong>
                                <div className="pl-10 mt-5">
                                  <div><strong className="text-dark">Hazırlayan:</strong> {author}</div>
                                  {approver !== 'Atanmadı' && <div><strong className="text-success">Onaylayan:</strong> {approver}</div>}
                                  {purchasing !== 'Atanmadı' && <div><strong className="text-warning">Satın Alma:</strong> {purchasing}</div>}
                                </div>
                              </div>
                              <div className="d-flex mt-15" style={{ gap: '10px' }}>
                                <div className="btn-group flex-grow-1">
                                  <button type="button" className="btn btn-sm btn-info-outline btn-block dropdown-toggle py-5" data-toggle="dropdown">
                                    Durum Değiştir
                                  </button>
                                  <div className="dropdown-menu dropdown-menu-right">
                                    <button className="dropdown-item" onClick={() => handleStatusChange(offer.id, 'draft')}>Taslak</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(offer.id, 'sent')}>Gönderildi</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(offer.id, 'accepted')}>Kabul Edildi</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(offer.id, 'rejected')}>Reddedildi</button>
                                  </div>
                                </div>
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-danger-outline btn-rounded flex-grow-1 py-5"
                                  onClick={() => handleDelete(offer.id)}
                                >
                                  <i className="fa fa-trash"></i> Sil
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
