import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode, mockData, addNotification } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const OfferForm: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('draft');
  const [assignedAuthor, setAssignedAuthor] = useState('');
  const [assignedApprover, setAssignedApprover] = useState('');
  const [assignedPurchasing, setAssignedPurchasing] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    const loadFormOptions = async () => {
      const savedStaff = localStorage.getItem('sb-mock-personnel');
      const localList = savedStaff ? JSON.parse(savedStaff) : [
        { id: '1', full_name: 'Ahmet Karaca', is_active: true },
        { id: '2', full_name: 'Mehmet Yılmaz', is_active: true },
        { id: '3', full_name: 'Ali BOLAT', is_active: true },
        { id: '4', full_name: 'Emre KINACI', is_active: false }
      ];

      if (isMockMode()) {
        setCustomers(mockData.customers || []);
        setStaff(localList.filter((p: any) => p.is_active));
        return;
      }
      try {
        const [custRes, profileRes] = await Promise.all([
          supabase.from('customers').select('id, company_name').order('company_name', { ascending: true }),
          supabase.from('profiles').select('id, full_name, is_active')
        ]);

        if (custRes.data) setCustomers(custRes.data);
        
        const dbList = profileRes.data || [];
        const mergedList = [...dbList];

        localList.forEach((localItem: any) => {
          const exists = dbList.some((dbItem: any) => 
            dbItem.full_name && localItem.full_name && dbItem.full_name.toLowerCase() === localItem.full_name.toLowerCase()
          );
          if (!exists) {
            mergedList.push(localItem);
          }
        });

        setStaff(mergedList.filter((p: any) => p.is_active !== false));
      } catch (e) {
        console.error("Form verileri yüklenirken hata:", e);
        setCustomers(mockData.customers || []);
        setStaff(localList.filter((p: any) => p.is_active));
      }
    };
    loadFormOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const meta = {
      assigned_author: assignedAuthor || null,
      assigned_approver: assignedApprover || null,
      assigned_purchasing: assignedPurchasing || null
    };
    const finalNotes = `__METADATA__:${JSON.stringify(meta)}__\n${notes}`;

    if (isMockMode()) {
      const saved = localStorage.getItem('sb-mock-offers');
      let offersList = saved ? JSON.parse(saved) : [
        { id: '1', title: 'Web Arayüz Tasarımı Teklifi', customer_name: 'Otantik Kumpir', amount: 15000, status: 'sent', valid_until: '2026-06-30' },
        { id: '2', title: 'Tablet POS Donanım Kurulumu', customer_name: 'Şampiyon Kokoreç', amount: 8500, status: 'accepted', valid_until: '2026-07-15' },
        { id: '3', title: 'Yıllık Sunucu Bakım Sözleşmesi', customer_name: 'Bulut Yapı Sanayi', amount: 3200, status: 'draft', valid_until: '2026-06-20' }
      ];

      const newOfferId = String(offersList.length + 1);
      const newO = {
        id: newOfferId,
        title,
        customer_name: customers.find(c => c.id === customerId)?.company_name || 'Bilinmeyen Müşteri',
        customer_id: customerId,
        amount: parseFloat(amount),
        status,
        valid_until: validUntil,
        notes: finalNotes
      };

      offersList.unshift(newO);
      localStorage.setItem('sb-mock-offers', JSON.stringify(offersList));

      // Trigger notifications for selected members
      const offerTitleText = `Teklif: "${title}"`;
      if (assignedAuthor) {
        addNotification('Teklif Hazırlandı', `${offerTitleText} teklifinde Hazırlayan Yetkili olarak atandınız.`, 'fa fa-file-text-o text-info', '/offers');
      }
      if (assignedApprover) {
        addNotification('Teklif Onay Bekliyor', `${offerTitleText} teklifinde Onay Makamı olarak atandınız.`, 'fa fa-gavel text-warning', '/offers');
      }
      if (assignedPurchasing) {
        addNotification('Satın Alma Süreci Başladı', `${offerTitleText} teklifinde Satın Alma Sorumlusu olarak atandınız.`, 'fa fa-shopping-cart text-success', '/offers');
      }

      setTimeout(() => {
        setLoading(false);
        navigate('/offers');
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
        .from('offers')
        .insert({
          tenant_id: profile.tenant_id,
          customer_id: customerId,
          title,
          total_amount: parseFloat(amount),
          status,
          valid_until: validUntil || null,
          notes: finalNotes || null
        });

      if (error) throw error;

      // Notifications
      const offerTitleText = `Teklif: "${title}"`;
      if (assignedAuthor) {
        addNotification('Teklif Hazırlandı', `${offerTitleText} teklifinde Hazırlayan Yetkili olarak atandınız.`, 'fa fa-file-text-o text-info', '/offers');
      }
      if (assignedApprover) {
        addNotification('Teklif Onay Bekliyor', `${offerTitleText} teklifinde Onay Makamı olarak atandınız.`, 'fa fa-gavel text-warning', '/offers');
      }
      if (assignedPurchasing) {
        addNotification('Satın Alma Süreci Başladı', `${offerTitleText} teklifinde Satın Alma Sorumlusu olarak atandınız.`, 'fa fa-shopping-cart text-success', '/offers');
      }

      navigate('/offers');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Teklif oluşturulurken bir hata oluştu.');
      setLoading(false);
    }
  };

  return (
    <Layout title="Yeni Teklif Oluştur">
      <div className="row">
        <div className="col-12 col-lg-8">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Teklif Detayları</h4>
            </div>
            
            <div className="box-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="form-element">
                <div className="form-group">
                  <label htmlFor="offerTitle">Teklif Konusu / Başlığı *</label>
                  <input
                    type="text"
                    id="offerTitle"
                    className="form-control"
                    placeholder="Örn: Restoran Otomasyon Kurulum Hizmeti"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="customerSelect">Müşteri Seçin *</label>
                      <select
                        id="customerSelect"
                        className="form-control"
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        required
                      >
                        <option value="">Seçiniz...</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.company_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="amount">Teklif Tutarı (₺) *</label>
                      <input
                        type="number"
                        id="amount"
                        className="form-control"
                        placeholder="Örn: 15450"
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
                      <label htmlFor="validUntil">Geçerlilik Son Tarihi</label>
                      <input
                        type="date"
                        id="validUntil"
                        className="form-control"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="offerStatus">Durum</label>
                      <select
                        id="offerStatus"
                        className="form-control"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="draft">Taslak</option>
                        <option value="sent">Gönderildi</option>
                        <option value="accepted">Kabul Edildi</option>
                        <option value="rejected">Reddedildi</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4 col-12">
                    <div className="form-group">
                      <label htmlFor="authorSelect">Hazırlayan Yetkili</label>
                      <select
                        id="authorSelect"
                        className="form-control"
                        value={assignedAuthor}
                        onChange={(e) => setAssignedAuthor(e.target.value)}
                      >
                        <option value="">Seçiniz...</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-4 col-12">
                    <div className="form-group">
                      <label htmlFor="approverSelect">Onaylayan Yönetici</label>
                      <select
                        id="approverSelect"
                        className="form-control"
                        value={assignedApprover}
                        onChange={(e) => setAssignedApprover(e.target.value)}
                      >
                        <option value="">Seçiniz...</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-4 col-12">
                    <div className="form-group">
                      <label htmlFor="purchasingSelect">Satın Alma Sorumlusu</label>
                      <select
                        id="purchasingSelect"
                        className="form-control"
                        value={assignedPurchasing}
                        onChange={(e) => setAssignedPurchasing(e.target.value)}
                      >
                        <option value="">Seçiniz...</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Özel Koşullar / Notlar</label>
                  <textarea
                    id="notes"
                    rows={4}
                    className="form-control"
                    placeholder="Teklif şartları, ödeme koşulları ve diğer notlar..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>

                <div className="box-footer" style={{ paddingLeft: 0, paddingRight: 0, background: 'transparent' }}>
                  <button
                    type="submit"
                    className="btn btn-rounded btn-success font-weight-600 px-30"
                    disabled={loading}
                  >
                    {loading ? 'Teklif Hazırlanıyor...' : 'Teklifi Kaydet'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-rounded btn-outline-secondary ml-10 px-30"
                    onClick={() => navigate('/offers')}
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
