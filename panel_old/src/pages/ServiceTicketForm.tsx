import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode, mockData, addNotification } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const ServiceTicketForm: React.FC = () => {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [purchasingResponsible, setPurchasingResponsible] = useState('');
  const [billingResponsible, setBillingResponsible] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [status, setStatus] = useState('open');
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
        setStaff(localList.filter((p: any) => p.is_active));
        setCustomers(mockData.customers || []);
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
      purchasing_responsible: purchasingResponsible || null,
      billing_responsible: billingResponsible || null
    };
    const finalDescription = `__METADATA__:${JSON.stringify(meta)}__\n${issueDescription}`;

    if (isMockMode()) {
      const saved = localStorage.getItem('sb-mock-service-tickets');
      let ticketsList = saved ? JSON.parse(saved) : [...mockData.serviceTickets];

      const newTicketId = String(ticketsList.length + 5014);
      const newT = {
        id: newTicketId,
        customer_name: customers.find(c => c.id === customerId)?.company_name || 'Bilinmeyen Müşteri',
        customer_id: customerId,
        status,
        issue_description: finalDescription,
        assigned_to: assignedTo,
        purchasing_responsible: purchasingResponsible,
        billing_responsible: billingResponsible,
        created_at: new Date().toISOString()
      };

      ticketsList.unshift(newT);
      localStorage.setItem('sb-mock-service-tickets', JSON.stringify(ticketsList));

      const ticketTitle = `Destek #${newTicketId.slice(0, 4)}`;
      if (assignedTo) {
        addNotification('Teknik Servis Ataması', `${ticketTitle} kaydında Teknisyen olarak görevlendirildiniz.`, 'fa fa-plug text-danger', '/service-tickets');
      }
      if (purchasingResponsible) {
        addNotification('Malzeme Alım Talebi', `${ticketTitle} kaydında Satın Alma sorumlusu olarak atandınız.`, 'fa fa-shopping-cart text-warning', '/service-tickets');
      }
      if (billingResponsible) {
        addNotification('Fatura / Ödeme Takibi', `${ticketTitle} kaydında Muhasebe/Tahsilat sorumlusu olarak atandınız.`, 'fa fa-try text-success', '/service-tickets');
      }

      setTimeout(() => {
        setLoading(false);
        navigate('/service-tickets');
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

      // Note: in Supabase table it's assigned_staff_id, let's pass that to prevent errors
      const { data: insertedTicket, error } = await supabase
        .from('service_tickets')
        .insert({
          tenant_id: profile.tenant_id,
          customer_id: customerId,
          assigned_staff_id: assignedTo || null,
          issue_description: finalDescription,
          status: status === 'open' ? 'unresolved' : 'resolved' // Map open/closed to schema unresolved/resolved status
        })
        .select('id')
        .single();

      if (error) throw error;

      if (insertedTicket?.id) {
        const ticketTitle = `Destek #${insertedTicket.id.slice(0, 4)}`;
        if (assignedTo) {
          addNotification('Teknik Servis Ataması', `${ticketTitle} kaydında Teknisyen olarak görevlendirildiniz.`, 'fa fa-plug text-danger', '/service-tickets');
        }
        if (purchasingResponsible) {
          addNotification('Malzeme Alım Talebi', `${ticketTitle} kaydında Satın Alma sorumlusu olarak atandınız.`, 'fa fa-shopping-cart text-warning', '/service-tickets');
        }
        if (billingResponsible) {
          addNotification('Fatura / Ödeme Takibi', `${ticketTitle} kaydında Muhasebe/Tahsilat sorumlusu olarak atandınız.`, 'fa fa-try text-success', '/service-tickets');
        }
      }

      navigate('/service-tickets');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Servis kaydı oluşturulurken hata oluştu.');
      setLoading(false);
    }
  };

  return (
    <Layout title="Yeni Arıza / Servis Talebi Bildir">
      <div className="row">
        <div className="col-12 col-lg-8">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Servis Destek Bilgileri</h4>
            </div>
            
            <div className="box-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="form-element">
                <div className="row">
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="customerSelect">Müşteri / Firma *</label>
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
                      <label htmlFor="staffSelect">Atanacak Personel</label>
                      <select
                        id="staffSelect"
                        className="form-control"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                      >
                        <option value="">Seçiniz (Daha Sonra Atanabilir)</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="purchasingSelect">Satın Alma Sorumlusu</label>
                      <select
                        id="purchasingSelect"
                        className="form-control"
                        value={purchasingResponsible}
                        onChange={(e) => setPurchasingResponsible(e.target.value)}
                      >
                        <option value="">Seçiniz (Varsa)</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="billingSelect">Muhasebe Sorumlusu</label>
                      <select
                        id="billingSelect"
                        className="form-control"
                        value={billingResponsible}
                        onChange={(e) => setBillingResponsible(e.target.value)}
                      >
                        <option value="">Seçiniz (Varsa)</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="ticketStatus">Durum</label>
                      <select
                        id="ticketStatus"
                        className="form-control"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="open">Açık / Yeni</option>
                        <option value="in_progress">Devam Ediyor</option>
                        <option value="resolved">Çözüldü</option>
                        <option value="closed">Kapatıldı</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="issueDesc">Arıza / Sorun Tanımı *</label>
                  <textarea
                    id="issueDesc"
                    rows={5}
                    className="form-control text-white"
                    placeholder="Müşterinin yaşadığı sorunu detaylı şekilde açıklayın (örn: tablet POS bağlantısı koptu, sipariş basılamıyor)"
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="box-footer" style={{ paddingLeft: 0, paddingRight: 0, background: 'transparent' }}>
                  <button
                    type="submit"
                    className="btn btn-rounded btn-success font-weight-600 px-30"
                    disabled={loading}
                  >
                    {loading ? 'Kaydediliyor...' : 'Arıza Bildirimini Kaydet'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-rounded btn-outline-secondary ml-10 px-30"
                    onClick={() => navigate('/service-tickets')}
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
