import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode, mockData } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const CustomerForm: React.FC = () => {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isMockMode()) {
      if (!mockData.customers) mockData.customers = [];
      mockData.customers.push({
        id: String(mockData.customers.length + 1),
        company_name: companyName,
        contact_name: contactName,
        email,
        phone,
        address
      });
      setTimeout(() => {
        setLoading(false);
        navigate('/customers');
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
        .from('customers')
        .insert({
          tenant_id: profile.tenant_id,
          company_name: companyName,
          contact_name: contactName || null,
          email: email || null,
          phone: phone || null,
          address: address || null
        });

      if (error) throw error;
      navigate('/customers');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Müşteri oluşturulurken bir hata oluştu.');
      setLoading(false);
    }
  };

  return (
    <Layout title="Müşteri Ekle">
      <div className="row">
        <div className="col-12 col-lg-8">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Yeni Müşteri Bilgileri</h4>
            </div>
            
            <div className="box-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="form-element">
                <div className="form-group">
                  <label htmlFor="companyName">Firma / Cari Unvanı *</label>
                  <input
                    type="text"
                    id="companyName"
                    className="form-control"
                    placeholder="Örn: Otantik Kumpir Ltd. Şti."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactName">Yetkili Kişi Ad Soyad</label>
                  <input
                    type="text"
                    id="contactName"
                    className="form-control"
                    placeholder="Örn: Ahmet Karaca"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="email">E-posta Adresi</label>
                      <input
                        type="email"
                        id="email"
                        className="form-control"
                        placeholder="ahmet@sirket.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="phone">Telefon Numarası</label>
                      <input
                        type="text"
                        id="phone"
                        className="form-control"
                        placeholder="Örn: +90 532 123 45 67"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="address">Adres Bilgileri</label>
                  <textarea
                    id="address"
                    rows={4}
                    className="form-control"
                    placeholder="Fatura veya sevk adresi..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  ></textarea>
                </div>

                <div className="box-footer" style={{ paddingLeft: 0, paddingRight: 0, background: 'transparent' }}>
                  <button
                    type="submit"
                    className="btn btn-rounded btn-success font-weight-600 px-30"
                    disabled={loading}
                  >
                    {loading ? 'Müşteri Kaydediliyor...' : 'Müşteri Ekle'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-rounded btn-outline-secondary ml-10 px-30"
                    onClick={() => navigate('/customers')}
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
