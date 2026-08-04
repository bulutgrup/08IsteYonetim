import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, isMockMode } from '../lib/supabase';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  
  // Slug kullanılabilirlik durumu
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSlugChange = (val: string) => {
    const cleaned = val.toLowerCase()
      .replace(/[^a-z0-9-]/g, '') // Sadece küçük harfler, rakamlar ve tire (-)
      .replace(/-+/g, '-'); // Peşpeşe tireleri tekleştir
    setSlug(cleaned);
  };

  // Kullanıcı slug yazmayı bitirdikten 500ms sonra veritabanında kontrol et (Debounce)
  useEffect(() => {
    if (!slug) {
      setSlugStatus('idle');
      return;
    }

    if (isMockMode()) {
      setSlugStatus('available');
      return;
    }

    setSlugStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('id')
          .eq('slug', slug);

        if (error) throw error;

        if (data && data.length > 0) {
          setSlugStatus('taken');
        } else {
          setSlugStatus('available');
        }
      } catch (e) {
        console.error("Link kontrol hatası:", e);
        // Hata durumunda kayıt olmaya engel olmamak için available sayıyoruz
        setSlugStatus('available');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Eğer şirket linki zaten alınmışsa kaydı durdur
    if (slugStatus === 'taken') {
      setError('Bu şirket linki (alt alan adı) zaten kullanımda! Lütfen başka bir alan adı yazın.');
      setLoading(false);
      return;
    }

    if (isMockMode()) {
      // Simülasyon modu
      const mockProfile = {
        full_name: fullName,
        email: email,
        phone: phone,
        role: 'admin',
        tenant_name: companyName,
        slug: slug
      };
      localStorage.setItem('sb-mock-profile', JSON.stringify(mockProfile));
      localStorage.setItem('sb-mock-logged-in', 'true');
      
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        navigate('/');
      }, 1500);
      return;
    }

    try {
      // Supabase Auth SignUp ile kullanıcıyı kaydet
      // trigger_signup_notification tetikleyicimiz hata-korumalı yapıldığı için sunucu hatası asla alınmaz!
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            company_name: companyName,
            slug: slug
          }
        }
      });

      if (signUpError) throw signUpError;

      setSuccess(true);
      setLoading(false);
      
      setTimeout(() => {
        navigate('/login');
      }, 4000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Kayıt işlemi sırasında veritabanı veya sunucu kaynaklı bir hata oluştu.');
      setLoading(false);
    }
  };

  return (
    <div 
      className="hold-transition" 
      style={{ 
        background: 'radial-gradient(circle at top right, #1a2e3b 0%, #0d131a 100%)', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '30px 20px',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Premium Cam Efektli (Glassmorphic) Konteyner */}
      <div 
        style={{ 
          width: '100%', 
          maxWidth: '520px', 
          background: 'rgba(255, 255, 255, 0.03)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '45px', 
          borderRadius: '28px', 
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)', 
          border: '1px solid rgba(255, 255, 255, 0.08)' 
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          {/* Neon Logo Tasarımı */}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: '900', 
              margin: '0 0 8px', 
              background: 'linear-gradient(135deg, #00ffaa 0%, #00bfff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}>
              İŞte Yönetim
            </h1>
          </Link>
          <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '15px', margin: '0' }}>
            İşletmenizi dijital dünyaya taşıyın, ekibinizi yönetin.
          </p>
        </div>

        {error && (
          <div 
            style={{ 
              background: 'rgba(255, 77, 77, 0.12)', 
              border: '1px solid rgba(255, 77, 77, 0.25)', 
              color: '#ff8080', 
              padding: '14px 18px', 
              borderRadius: '12px', 
              fontSize: '14.5px',
              lineHeight: '1.5',
              marginBottom: '20px'
            }}
          >
            <strong>Hata:</strong> {error}
          </div>
        )}

        {success ? (
          <div 
            style={{ 
              background: 'rgba(43, 224, 128, 0.12)', 
              border: '1px solid rgba(43, 224, 128, 0.25)', 
              color: '#2be080', 
              padding: '24px', 
              borderRadius: '16px', 
              fontSize: '15.5px',
              lineHeight: '1.6',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>✓</div>
            <h3 style={{ margin: '0 0 10px', color: '#fff', fontWeight: '700' }}>Kayıt Başarılı!</h3>
            <p style={{ margin: '0 0 15px', color: 'rgba(255,255,255,0.7)' }}>
              Harika! İşletmeniz ve yönetici profiliniz oluşturuldu. E-postanıza gelen doğrulama bağlantısına tıklayarak giriş yapabilirsiniz.
            </p>
            <small style={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>Yönlendiriliyorsunuz...</small>
          </div>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Ad Soyad */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', fontWeight: '600' }}>Yönetici Ad Soyad *</label>
              <input
                type="text"
                placeholder="Örn: Ahmet Yılmaz"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  color: '#fff', 
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  fontSize: '15px',
                  outline: 'none',
                  transition: '0.2s',
                  boxSizing: 'border-box',
                  width: '100%'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid #00ffaa';
                  e.target.style.boxShadow = '0 0 8px rgba(0, 255, 170, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
                }}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {/* İletişim Bilgileri (E-posta & Telefon) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', fontWeight: '600' }}>E-posta Adresi *</label>
                <input
                  type="email"
                  placeholder="mail@isletme.com"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    color: '#fff', 
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    fontSize: '15px',
                    outline: 'none',
                    transition: '0.2s',
                    boxSizing: 'border-box',
                    width: '100%'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid #00ffaa';
                    e.target.style.boxShadow = '0 0 8px rgba(0, 255, 170, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', fontWeight: '600' }}>Telefon Numarası *</label>
                <input
                  type="text"
                  placeholder="0532 123 45 67"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    color: '#fff', 
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    fontSize: '15px',
                    outline: 'none',
                    transition: '0.2s',
                    boxSizing: 'border-box',
                    width: '100%'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid #00ffaa';
                    e.target.style.boxShadow = '0 0 8px rgba(0, 255, 170, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* İşletme Adı */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', fontWeight: '600' }}>İşletme / Şirket Adı *</label>
              <input
                type="text"
                placeholder="Örn: Bulut Yapı Ltd. Şti."
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  color: '#fff', 
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  fontSize: '15px',
                  outline: 'none',
                  transition: '0.2s',
                  boxSizing: 'border-box',
                  width: '100%'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid #00ffaa';
                  e.target.style.boxShadow = '0 0 8px rgba(0, 255, 170, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
                }}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            {/* Alt Alan Adı (Slug) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', fontWeight: '600' }}>Şirket Linki (Alt Alan Adı) *</label>
              <div style={{ display: 'flex', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="sirket-adi"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    color: '#fff', 
                    padding: '12px 16px', 
                    borderTopLeftRadius: '12px',
                    borderBottomLeftRadius: '12px',
                    fontSize: '15px',
                    outline: 'none',
                    transition: '0.2s',
                    flex: '1',
                    minWidth: '0'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid #00ffaa';
                    e.target.style.borderRight = 'none';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                    e.target.style.borderRight = 'none';
                  }}
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  required
                />
                <span 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    color: 'rgba(255, 255, 255, 0.5)', 
                    padding: '12px 14px', 
                    borderTopRightRadius: '12px',
                    borderBottomRightRadius: '12px',
                    fontSize: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderLeft: 'none',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  .isteyonetim.com
                </span>
              </div>
              
              {/* Slug Durum Bilgisi */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                  Sadece küçük harf, sayı ve tire (-)
                </small>
                {slugStatus === 'checking' && (
                  <small style={{ color: '#00bfff', fontSize: '11.5px', fontWeight: '600' }}>● Kontrol ediliyor...</small>
                )}
                {slugStatus === 'available' && (
                  <small style={{ color: '#00ffaa', fontSize: '11.5px', fontWeight: '600' }}>✓ Bu link kullanılabilir</small>
                )}
                {slugStatus === 'taken' && (
                  <small style={{ color: '#ff4d4d', fontSize: '11.5px', fontWeight: '600' }}>✗ Bu şirket linki zaten alınmış!</small>
                )}
              </div>
            </div>

            {/* Şifre */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', fontWeight: '600' }}>Şifre *</label>
              <input
                type="password"
                placeholder="En az 6 karakterli güçlü şifre"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  color: '#fff', 
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  fontSize: '15px',
                  outline: 'none',
                  transition: '0.2s',
                  boxSizing: 'border-box',
                  width: '100%'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid #00ffaa';
                  e.target.style.boxShadow = '0 0 8px rgba(0, 255, 170, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
                }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Kayıt Ol Butonu */}
            <button
              type="submit"
              style={{ 
                background: 'linear-gradient(135deg, #00ffaa 0%, #00bfff 100%)', 
                border: 'none', 
                color: '#0d131a', 
                padding: '14px', 
                borderRadius: '14px', 
                fontSize: '16px', 
                fontWeight: '700', 
                cursor: 'pointer',
                transition: '0.25s',
                marginTop: '10px',
                boxShadow: '0 8px 20px rgba(0, 255, 170, 0.2)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 255, 170, 0.35)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 255, 170, 0.2)';
              }}
              disabled={loading}
            >
              {loading ? 'İşletme Kaydediliyor...' : 'Ücretsiz Başla / Kayıt Ol'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '25px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '14px', margin: '0' }}>
            Zaten üye misiniz?{' '}
            <Link to="/login" style={{ color: '#00bfff', fontWeight: '600', textDecoration: 'none' }}>
              Giriş Yapın
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
