import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode, mockData } from '../lib/supabase';

export const Profile: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>({
    full_name: '',
    email: '',
    phone: '',
    role: '',
    tenant_name: ''
  });
  const [avatar, setAvatar] = useState<string>("/images/avatar/7.jpg");
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
          localStorage.setItem('sb-mock-profile', JSON.stringify(mockData.profile));
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
              role: data.role,
              tenant_name: data.tenants?.name || 'İşletme'
            });
          }
        }
      } catch (e) {
        console.error("Profil yüklenirken hata oluştu:", e);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile.email) {
      const savedAvatar = localStorage.getItem('sb-avatar-' + profile.email);
      if (savedAvatar) {
        setAvatar(savedAvatar);
      } else {
        setAvatar("/images/avatar/7.jpg");
      }
    }
  }, [profile.email]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg("Resim boyutu 2MB'tan küçük olmalıdır.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        localStorage.setItem('sb-avatar-' + profile.email, base64String);
        window.dispatchEvent(new Event('avatar-changed'));
        setSuccessMsg("Profil resminiz başarıyla güncellendi.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    if (isMockMode()) {
      localStorage.setItem('sb-mock-profile', JSON.stringify(profile));
      // Update global mockData.profile as well
      mockData.profile = profile;
      setTimeout(() => {
        setLoading(false);
        setSuccessMsg("Profil bilgileriniz başarıyla güncellendi.");
      }, 1000);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı!");

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone
        })
        .eq('id', user.id);

      if (error) throw error;
      setSuccessMsg("Profil bilgileriniz başarıyla güncellendi.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Profil güncellenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const translateRole = (role: string) => {
    switch (role) {
      case 'admin': return 'Kurucu / Sistem Yöneticisi';
      case 'manager': return 'Müdür';
      case 'staff': return 'Personel';
      default: return role;
    }
  };

  return (
    <Layout title="Kullanıcı Profili">
      <div className="row">
        {/* Sol Sütun - Kart */}
        <div className="col-lg-4 col-12">
          <div className="box box-profile">
            <div className="box-body text-center py-40">
              <div className="position-relative d-inline-block">
                <img 
                  src={avatar} 
                  className="rounded-circle mb-20" 
                  alt="User" 
                  style={{ width: '120px', height: '120px', border: '3px solid #689f38', objectFit: 'cover', cursor: 'pointer' }}
                  onClick={() => document.getElementById('avatarUpload')?.click()}
                  title="Resmi Değiştirmek İçin Tıklayın"
                />
                <input 
                  type="file" 
                  id="avatarUpload" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleAvatarChange} 
                />
                <div style={{ marginTop: '-10px', marginBottom: '20px' }}>
                  <button 
                    type="button" 
                    className="btn btn-xs btn-outline btn-rounded btn-success font-size-12 px-15 py-5"
                    onClick={() => document.getElementById('avatarUpload')?.click()}
                  >
                    Resim Seç & Değiştir
                  </button>
                </div>
              </div>
              <h3 className="font-weight-700 text-dark mb-5">{profile.full_name}</h3>
              <p className="text-muted font-size-14 mb-15">{profile.email}</p>
              <span className="badge badge-success px-15 py-5 font-size-12 mb-20">
                {translateRole(profile.role)}
              </span>
              
              <div className="border-top pt-20 mt-20 text-left">
                <div className="row mb-10">
                  <div className="col-5 text-muted font-weight-600">Şirket / İşletme:</div>
                  <div className="col-7 text-dark font-weight-700">{profile.tenant_name}</div>
                </div>
                <div className="row">
                  <div className="col-5 text-muted font-weight-600">Telefon:</div>
                  <div className="col-7 text-dark">{profile.phone || 'Belirtilmedi'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Sütun - Düzenleme Formu */}
        <div className="col-lg-8 col-12">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Profil Bilgilerini Düzenle</h4>
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

              <form onSubmit={handleSubmit} className="form-element">
                <div className="form-group">
                  <label htmlFor="pfName">Adı Soyadı *</label>
                  <input 
                    type="text" 
                    id="pfName" 
                    className="form-control" 
                    value={profile.full_name} 
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    required
                    disabled={loading}
                    style={{ borderRadius: '8px' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pfEmail">E-posta Adresi (Değiştirilemez)</label>
                  <input 
                    type="email" 
                    id="pfEmail" 
                    className="form-control" 
                    value={profile.email} 
                    disabled
                    style={{ borderRadius: '8px', background: '#f5f7fa' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pfPhone">Telefon Numarası</label>
                  <input 
                    type="text" 
                    id="pfPhone" 
                    className="form-control" 
                    value={profile.phone} 
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={loading}
                    style={{ borderRadius: '8px' }}
                  />
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
                        Güncelleniyor...
                      </>
                    ) : (
                      'Değişiklikleri Kaydet'
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
