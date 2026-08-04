import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode, mockData } from '../lib/supabase';

export const Support: React.FC = () => {
  const [profile, setProfile] = useState<any>({
    full_name: '',
    email: '',
    phone: '',
    tenant_name: ''
  });
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (isMockMode()) {
        const saved = localStorage.getItem('sb-mock-profile');
        if (saved) {
          setProfile(JSON.parse(saved));
        } else {
          setProfile(mockData.profile);
        }
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('*, tenants(name)')
            .eq('id', user.id)
            .single();
          if (data) {
            setProfile({
              full_name: data.full_name,
              email: user.email || '',
              phone: data.phone || '',
              tenant_name: data.tenants?.name || 'İşletme'
            });
          }
        }
      } catch (e) {
        console.error("Profil bilgileri alınamadı:", e);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const messageBody = `Gönderen Firma: ${profile.tenant_name}\nYönetici: ${profile.full_name}\nTelefon: ${profile.phone}\nE-posta: ${profile.email}\n\nMesaj:\n${message}`;

    if (isMockMode()) {
      // 1. Save to sb-support-messages for CP panel to read
      const savedSupport = localStorage.getItem('sb-support-messages');
      const supportList = savedSupport ? JSON.parse(savedSupport) : [];
      const newSupportMsg = {
        id: String(Date.now()),
        tenant_name: profile.tenant_name,
        sender_name: profile.full_name,
        sender_email: profile.email,
        subject: subject,
        body: message,
        created_at: new Date().toISOString()
      };
      supportList.unshift(newSupportMsg);
      localStorage.setItem('sb-support-messages', JSON.stringify(supportList));

      // 2. Also save to sb-mock-messages as sent folder item
      const savedMessages = localStorage.getItem('sb-mock-messages');
      const msgList = savedMessages ? JSON.parse(savedMessages) : [];
      msgList.unshift({
        id: 'support-' + Date.now(),
        sender_name: profile.full_name,
        subject: `Destek Talebi: ${subject}`,
        date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        avatar: '/images/avatar/7.jpg',
        folder: 'sent',
        read: true,
        body: message
      });
      localStorage.setItem('sb-mock-messages', JSON.stringify(msgList));

      setTimeout(() => {
        setLoading(false);
        setSuccessMsg("Destek talebiniz başarıyla CP (Kontrol Paneli) üzerine iletildi.");
        setSubject('');
        setMessage('');
      }, 1000);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı!");

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) throw new Error("Şirket bilgisi bulunamadı!");

      // messages tablosuna alıcı ID null (destek/genel) olarak ekle
      const { error } = await supabase
        .from('messages')
        .insert({
          tenant_id: userProfile.tenant_id,
          sender_id: user.id,
          receiver_id: null, // NULL = Destek Ekibi / CP Genel
          subject: `Destek Talebi: ${subject}`,
          body: messageBody,
          is_read: false,
          is_online_chat: false
        });

      if (error) throw error;

      setSuccessMsg("Destek talebiniz başarıyla CP (Kontrol Paneli) üzerine iletildi.");
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Destek talebi iletilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Destek Talebi Oluştur">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Destek & Yardım Talebi</h4>
              <p className="text-muted mb-0">Bir sorununuz mu var? Buradan yazarak sistem yöneticisine doğrudan destek talebi iletebilirsiniz.</p>
            </div>
            
            <div className="box-body">
              {successMsg && (
                <div className="alert alert-success" role="alert">
                  <i className="fa fa-check mr-5"></i> {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="alert alert-danger" role="alert">
                  <i className="fa fa-warning mr-5"></i> {errorMsg}
                </div>
              )}

              <div className="border-bottom pb-15 mb-20">
                <div className="row">
                  <div className="col-6">
                    <span className="text-muted d-block">Talep Eden Yetkili</span>
                    <strong>{profile.full_name} ({profile.email})</strong>
                  </div>
                  <div className="col-6">
                    <span className="text-muted d-block">Şirket / İşletme</span>
                    <strong>{profile.tenant_name}</strong>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="form-element">
                <div className="form-group">
                  <label htmlFor="supportSubject">Talep Konusu *</label>
                  <input 
                    type="text" 
                    id="supportSubject" 
                    className="form-control" 
                    placeholder="Örn: Finans raporu çıktısı alma sorunu"
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    disabled={loading}
                    style={{ borderRadius: '8px' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="supportMessage">Detaylı Açıklamanız *</label>
                  <textarea 
                    id="supportMessage" 
                    className="form-control" 
                    rows={6}
                    placeholder="Lütfen yaşadığınız sorunu veya sorunuzu detaylıca yazınız..."
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    disabled={loading}
                    style={{ borderRadius: '8px' }}
                  ></textarea>
                </div>

                <div className="box-footer style-none px-0 pb-0" style={{ background: 'transparent' }}>
                  <button 
                    type="submit" 
                    className="btn btn-rounded btn-success font-weight-600 px-30" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-5" role="status"></span>
                        Gönderiliyor...
                      </>
                    ) : (
                      'Talebi Gönder'
                    )}
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
