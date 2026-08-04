import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode, mockData } from '../lib/supabase';

export const Upgrade: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: number } | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [profile, setProfile] = useState<any>(null);

  // Billing & Buyer Info for iyzico checkout
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingName, setBillingName] = useState('');
  const [billingSurname, setBillingSurname] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [checkoutPlan, setCheckoutPlan] = useState<{ name: string; price: number } | null>(null);

  // Load current user profile details
  useEffect(() => {
    const loadProfile = async () => {
      if (isMockMode()) {
        const saved = localStorage.getItem('sb-mock-profile');
        const p = saved ? JSON.parse(saved) : mockData.profile;
        setProfile(p);
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (prof) {
            setProfile(prof);
          }
        }
      } catch (err) {
        console.error("Profil bilgileri yüklenemedi:", err);
      }
    };
    loadProfile();
  }, []);

  // Listen to URL callback params from iyzico
  useEffect(() => {
    const checkPaymentStatus = async () => {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      const token = params.get('token');

      if (status === 'success' && token) {
        setIsVerifying(true);
        setVerifyMessage('Ödemeniz iyzico tarafından güvenli olarak sorgulanıyor ve doğrulanıyor...');
        
        try {
          const response = await fetch(`https://isteyonetim.com/verify-payment.php?token=${encodeURIComponent(token)}`);
          const resData = await response.json();
          
          if (resData.status === 'success') {
            const planType = resData.plan_type;
            const cycle = resData.billing_cycle;
            const planName = planType === 'deneme' ? 'Deneme Paketi' : (planType === 'kobi' ? 'KOBİ Paketi' : 'Profesyonel Paket');
            
            setVerifyMessage(`Ödeme doğrulandı! Paketiniz "${planName}" olarak güncelleniyor...`);
            
            if (isMockMode()) {
              const saved = localStorage.getItem('sb-mock-profile');
              if (saved) {
                const parsed = JSON.parse(saved);
                parsed.plan = planName;
                localStorage.setItem('sb-mock-profile', JSON.stringify(parsed));
              }
              // Redirect to clean success URL
              window.location.href = window.location.pathname + '?upgrade_success=true&plan=' + encodeURIComponent(planName);
            } else {
              // Real mode: update Supabase database
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { data: prof } = await supabase
                  .from('profiles')
                  .select('tenant_id')
                  .eq('id', user.id)
                  .single();
                
                if (prof) {
                  // Calculate subscription ends at
                  const days = cycle === 'yearly' ? 365 : (planType === 'deneme' ? 3 : 30);
                  const endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
                  
                  const { error } = await supabase
                    .from('tenants')
                    .update({
                      plan_type: planType === 'deneme' ? 'profesyonel' : planType,
                      status: 'active',
                      billing_cycle: cycle,
                      subscription_ends_at: endsAt
                    })
                    .eq('id', prof.tenant_id);
                  
                  if (error) throw error;
                }
              }
              window.location.href = window.location.pathname + '?upgrade_success=true&plan=' + encodeURIComponent(planName);
            }
          } else {
            alert("Ödeme doğrulanamadı: " + (resData.message || 'Bilinmeyen hata'));
            setIsVerifying(false);
          }
        } catch (err: any) {
          console.error("Ödeme doğrulama hatası:", err);
          alert("Doğrulama hatası: " + err.message);
          setIsVerifying(false);
        }
      } else if (status === 'error') {
        alert("Ödeme işlemi iptal edildi veya bir hata oluştu.");
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get('upgrade_success') === 'true') {
        const planName = params.get('plan') || 'Paket';
        setSelectedPlan({ name: planName, price: 0 });
        setPaymentSuccess(true);
        setShowCheckoutModal(true);
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
          setShowCheckoutModal(false);
          setPaymentSuccess(false);
          window.location.reload();
        }, 3500);
      }
    };
    checkPaymentStatus();
  }, []);

  // Initiate iyzico popup payment
  // Set initial billing info and show modal
  const handleOpenCheckout = (planName: string, planPrice: number) => {
    let initialName = 'Fatih';
    let initialSurname = 'Akyildiz';
    let initialEmail = 'test@isteyonetim.com';
    let initialPhone = '';

    if (profile) {
      initialEmail = profile.email || initialEmail;
      initialPhone = profile.phone || '';
      if (profile.full_name) {
        const names = profile.full_name.trim().split(' ');
        initialSurname = names.pop() || '';
        initialName = names.join(' ') || 'User';
      }
    }

    setBillingName(initialName);
    setBillingSurname(initialSurname);
    setBillingEmail(initialEmail);
    setBillingPhone(initialPhone);
    setCheckoutPlan({ name: planName, price: planPrice });
    setShowBillingModal(true);
  };

  // Trigger iyzico payment form initialization
  const startIyzicoCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPlan) return;

    if (!billingName.trim() || !billingSurname.trim() || !billingEmail.trim() || !billingPhone.trim()) {
      alert('Lütfen tüm fatura ve iletişim bilgilerini doldurun.');
      return;
    }

    setShowBillingModal(false);
    setIsProcessing(true);
    setVerifyMessage('iyzico Güvenli Ödeme Sayfası Hazırlanıyor...');

    let planKey = 'deneme';
    if (checkoutPlan.name === 'KOBİ Paketi') planKey = 'kobi';
    else if (checkoutPlan.name === 'Profesyonel Paket') planKey = 'profesyonel';

    let tenantId = 'mock-tenant-id';
    if (!isMockMode() && profile) {
      tenantId = profile.tenant_id;
    }

    try {
      const response = await fetch('https://isteyonetim.com/pay.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan_type: planKey,
          billing_cycle: planKey === 'deneme' ? 'monthly' : billingPeriod,
          tenant_id: tenantId,
          buyer_email: billingEmail,
          buyer_name: billingName,
          buyer_surname: billingSurname,
          buyer_phone: billingPhone,
          host: window.location.host // Pass active host for redirection
        })
      });

      const resData = await response.json();
      
      if (resData.status === 'success' && resData.checkoutFormContent) {
        // Log debug info from server
        console.log('=== iyzico DEBUG ===');
        console.log('Buyer Email sent to iyzico:', resData._debug_buyer_email);
        console.log('Buyer Phone sent to iyzico:', resData._debug_buyer_phone);
        console.log('iyzico Base URL:', resData._debug_baseUrl);
        console.log('Full response:', resData);

        // Find or create iyzico pop-up container
        let container = document.getElementById('iyzipay-checkout-form');
        if (!container) {
          container = document.createElement('div');
          container.id = 'iyzipay-checkout-form';
          container.className = 'popup';
          document.body.appendChild(container);
        } else {
          container.className = 'popup';
          container.innerHTML = '';
        }

        // Add email hint banner above the form
        const emailHint = document.createElement('div');
        emailHint.style.cssText = 'background:#e8f5e9;border:1px solid #4caf50;border-radius:8px;padding:12px 16px;margin-bottom:12px;text-align:center;font-size:14px;color:#2e7d32;';
        emailHint.innerHTML = '<strong>📧 iyzico e-posta doğrulaması için bu adresi girin:</strong><br><span style="font-size:16px;font-weight:700;color:#1b5e20;">' + resData._debug_buyer_email + '</span>';
        container.appendChild(emailHint);

        // Inject and execute script
        const scriptEl = document.createElement('script');
        scriptEl.type = 'text/javascript';
        const cleanScript = resData.checkoutFormContent.replace(/<script[^>]*>|<\/script>/g, '');
        scriptEl.innerHTML = cleanScript;
        container.appendChild(scriptEl);
        
        setIsProcessing(false);
      } else {
        // Show detailed error for debugging
        console.error('iyzico error response:', resData);
        alert("iyzico ödeme formu başlatılamadı: " + (resData.errorMessage || JSON.stringify(resData)));
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error("Ödeme başlatma hatası:", err);
      alert("Ödeme başlatma hatası: " + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <Layout title="Hesap Yükseltme & Paketler">
      
      {/* BAŞLIK VE AÇIKLAMA */}
      <div className="text-center py-20 mb-30" style={{ fontFamily: "'Inter', sans-serif" }}>
        <h2 className="font-weight-800 text-dark mb-10" style={{ fontSize: '32px' }}>İşletmeniz İçin En Uygun Planı Seçin</h2>
        <p className="text-muted font-size-16" style={{ maxWidth: '650px', margin: '0 auto' }}>
          Tüm yönetim süreçlerinizi tek bir çatı altında toplayın. Limitleri kaldırın, ekibinizle tam senkronize çalışarak verimliliğinizi artırın.
        </p>

        {/* DÖNEM TERCİH BUTONLARI (AYLIK / YILLIK TOGGLE) */}
        <div className="d-inline-flex align-items-center justify-content-center mt-30 p-5 bg-white shadow-sm" style={{ borderRadius: '30px', border: '1px solid #e1e5eb' }}>
          <button 
            onClick={() => setBillingPeriod('monthly')}
            className="btn btn-rounded font-weight-700 px-25 py-10"
            style={{ 
              background: billingPeriod === 'monthly' ? '#689f38' : 'transparent', 
              color: billingPeriod === 'monthly' ? '#fff' : '#555',
              border: 'none',
              boxShadow: billingPeriod === 'monthly' ? '0 4px 10px rgba(104,159,56,0.2)' : 'none'
            }}
          >
            Aylık Ödeme
          </button>
          <button 
            onClick={() => setBillingPeriod('yearly')}
            className="btn btn-rounded font-weight-700 px-25 py-10 d-flex align-items-center"
            style={{ 
              background: billingPeriod === 'yearly' ? '#689f38' : 'transparent', 
              color: billingPeriod === 'yearly' ? '#fff' : '#555',
              border: 'none',
              boxShadow: billingPeriod === 'yearly' ? '0 4px 10px rgba(104,159,56,0.2)' : 'none'
            }}
          >
            Yıllık Ödeme
            <span className="badge badge-danger ml-5 font-size-10 px-5 py-5" style={{ textTransform: 'uppercase', borderRadius: '10px' }}>2 Ay Bedava!</span>
          </button>
        </div>
      </div>

      {/* FİYATLANDIRMA KARTLARI */}
      <div className="row justify-content-center align-items-stretch">
        
        {/* KOBİ PAKETİ */}
        <div className="col-lg-4 col-md-6 col-12 mb-30">
          <div className="box h-p100 d-flex flex-column" style={{ borderRadius: '20px', overflow: 'hidden', transition: '0.3s', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
            <div className="p-30 text-center bg-lighter border-bottom">
              <h3 className="font-weight-700 text-dark mb-5">KOBİ Paketi</h3>
              <p className="text-muted font-size-13 mb-20">Küçük ölçekli işletmeler için ideal çözümler</p>
              
              <div className="price-display mb-10">
                <span className="font-weight-800 text-dark" style={{ fontSize: '42px' }}>
                  {billingPeriod === 'yearly' ? '2.990 ₺' : '299 ₺'}
                </span>
                <span className="text-muted font-size-14">
                  {billingPeriod === 'yearly' ? ' / yıllık' : ' / aylık'}
                </span>
              </div>
              <small className="text-success font-weight-600 block">
                {billingPeriod === 'yearly' ? 'Yıllık ödeme ile yılda 598 ₺ tasarruf!' : 'İstediğiniz zaman iptal edebilirsiniz.'}
              </small>
            </div>
            
            <div className="p-30 flex-grow-1">
              <ul className="list-unstyled mb-0" style={{ fontSize: '14.5px', lineHeight: '2.2', color: '#444' }}>
                <li><i className="fa fa-check text-success mr-10"></i> <strong>5 Ekip Üyesi</strong> Limiti</li>
                <li><i className="fa fa-check text-success mr-10"></i> Görev Takip Modülü</li>
                <li><i className="fa fa-check text-success mr-10"></i> Proje Yönetimi</li>
                <li><i className="fa fa-check text-success mr-10"></i> Müşteri Portföy Modülü</li>
                <li><i className="fa fa-check text-success mr-10"></i> <strong>5 GB Bulut Depolama</strong></li>
                <li className="text-muted"><i className="fa fa-times text-danger mr-10"></i> Gelişmiş Teklif Modülü</li>
                <li className="text-muted"><i className="fa fa-times text-danger mr-10"></i> Gelir/Gider & Çek Finans Paneli</li>
                <li className="text-muted"><i className="fa fa-times text-danger mr-10"></i> Teknik Servis / Arıza Yönetimi</li>
              </ul>
            </div>
            
            <div className="p-30 pt-0">
              <button 
                onClick={() => handleOpenCheckout('KOBİ Paketi', billingPeriod === 'yearly' ? 2990 : 299)}
                className="btn btn-rounded btn-success btn-block py-12 font-weight-700 font-size-15"
                style={{ boxShadow: '0 4px 12px rgba(104,159,56,0.15)' }}
              >
                Hemen Yükselt
              </button>
            </div>
          </div>
        </div>

        {/* PROFESYONEL PAKET (ÖNERİLEN & GLASSMORPHIC ÖNE ÇIKARILMIŞ) */}
        <div className="col-lg-4 col-md-6 col-12 mb-30">
          <div 
            className="box h-p100 d-flex flex-column" 
            style={{ 
              borderRadius: '20px', 
              overflow: 'hidden', 
              transition: '0.3s', 
              boxShadow: '0 15px 35px rgba(104,159,56,0.15)',
              border: '2.5px solid #689f38',
              position: 'relative'
            }}
          >
            <div 
              style={{ 
                position: 'absolute', 
                top: '15px', 
                right: '15px', 
                background: '#ff8f00', 
                color: '#fff', 
                fontSize: '11px', 
                fontWeight: '700', 
                padding: '4px 12px', 
                borderRadius: '12px',
                textTransform: 'uppercase',
                boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                zIndex: 10
              }}
            >
              EN POPÜLER
            </div>

            <div className="p-30 text-center bg-white border-bottom" style={{ background: 'linear-gradient(180deg, rgba(104,159,56,0.05) 0%, transparent 100%)' }}>
              <h3 className="font-weight-800 text-dark mb-5" style={{ color: '#689f38 !important' }}>Profesyonel Paket</h3>
              <p className="text-muted font-size-13 mb-20">Kapsamlı yönetim ve tüm entegre araçlar</p>
              
              <div className="price-display mb-10">
                <span className="font-weight-900" style={{ fontSize: '46px', color: '#689f38' }}>
                  {billingPeriod === 'yearly' ? '4.990 ₺' : '499 ₺'}
                </span>
                <span className="text-muted font-size-14">
                  {billingPeriod === 'yearly' ? ' / yıllık' : ' / aylık'}
                </span>
              </div>
              <small className="text-warning font-weight-700 block" style={{ color: '#e67e00' }}>
                {billingPeriod === 'yearly' ? 'Yıllık ödeme ile yılda 998 ₺ tasarruf!' : 'Tam erişim yetkisi.'}
              </small>
            </div>
            
            <div className="p-30 flex-grow-1 bg-white">
              <ul className="list-unstyled mb-0" style={{ fontSize: '14.5px', lineHeight: '2.2', color: '#333' }}>
                <li><i className="fa fa-check text-success mr-10"></i> <strong>Sınırsız Ekip Üyesi</strong></li>
                <li><i className="fa fa-check text-success mr-10"></i> Görev Takip Modülü</li>
                <li><i className="fa fa-check text-success mr-10"></i> Proje Yönetimi</li>
                <li><i className="fa fa-check text-success mr-10"></i> Müşteri Portföy Modülü</li>
                <li><i className="fa fa-check text-success mr-10"></i> <strong>Gelişmiş Teklif Modülü</strong></li>
                <li><i className="fa fa-check text-success mr-10"></i> <strong>Gelir/Gider & Çek Finans Paneli</strong></li>
                <li><i className="fa fa-check text-success mr-10"></i> <strong>Teknik Servis / Arıza Yönetimi</strong></li>
                <li><i className="fa fa-check text-success mr-10"></i> <strong>50 GB Bulut Depolama</strong></li>
                <li><i className="fa fa-check text-success mr-10"></i> E-posta ve SMS Bildirimleri</li>
              </ul>
            </div>
            
            <div className="p-30 pt-0 bg-white">
              <button 
                onClick={() => handleOpenCheckout('Profesyonel Paket', billingPeriod === 'yearly' ? 4990 : 499)}
                className="btn btn-rounded btn-primary btn-block py-14 font-weight-800 font-size-16"
                style={{ 
                  background: 'linear-gradient(135deg, #689f38 0%, #ff8f00 100%)', 
                  border: 'none',
                  boxShadow: '0 6px 18px rgba(104,159,56,0.3)'
                }}
              >
                Hemen Yükselt
              </button>
            </div>
          </div>
        </div>

        {/* KURUMSAL PAKET */}
        <div className="col-lg-4 col-md-6 col-12 mb-30">
          <div className="box h-p100 d-flex flex-column" style={{ borderRadius: '20px', overflow: 'hidden', transition: '0.3s', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
            <div className="p-30 text-center bg-lighter border-bottom">
              <h3 className="font-weight-700 text-dark mb-5">Kurumsal Paket</h3>
              <p className="text-muted font-size-13 mb-20">Holdingler ve büyük şirket grupları için</p>
              
              <div className="price-display mb-10 py-10">
                <span className="font-weight-800 text-dark" style={{ fontSize: '32px' }}>
                  Teklif Alın
                </span>
              </div>
              <small className="text-muted font-weight-600 block">
                İşletmenizin hacmine göre özel fiyatlandırma.
              </small>
            </div>
            
            <div className="p-30 flex-grow-1">
              <ul className="list-unstyled mb-0" style={{ fontSize: '14.5px', lineHeight: '2.2', color: '#444' }}>
                <li><i className="fa fa-check text-success mr-10"></i> <strong>Sınırsız Kullanıcı & Rol</strong></li>
                <li><i className="fa fa-check text-success mr-10"></i> Tüm Profesyonel Paket Özellikleri</li>
                <li><i className="fa fa-check text-success mr-10"></i> <strong>Özel ERP & CRM Entegrasyonları</strong></li>
                <li><i className="fa fa-check text-success mr-10"></i> <strong>Sınırsız Bulut Depolama</strong></li>
                <li><i className="fa fa-check text-success mr-10"></i> Size Özel Bulut Sunucu Kurulumu</li>
                <li><i className="fa fa-check text-success mr-10"></i> <strong>7/24 Telefon & SLA Desteği</strong></li>
                <li><i className="fa fa-check text-success mr-10"></i> KVKK & Güvenlik Sertifikasyonları</li>
              </ul>
            </div>
            
            <div className="p-30 pt-0">
              <a 
                href="mailto:admin@isteyonetim.com?subject=Kurumsal%20Paket%20Teklif%20Talebi&body=Merhaba,%20İşletmemiz%20için%20İşteYönetim%20Kurumsal%20Paket%20hizmetinizle%20ilgileniyoruz.%20Teklif%20süreciyle%20ilgili%20tarafımızla%20iletişime%20geçebilir%20misiniz?"
                className="btn btn-rounded btn-dark btn-block py-12 font-weight-700 font-size-15"
                style={{ boxShadow: '0 4px 12px rgba(47,54,60,0.15)' }}
              >
                Bize Ulaşın / Teklif İste
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* YÜKLENİYOR VE DOĞRULANIYOR MODEL OVERLAY PENCERESİ */}
      {(isProcessing || isVerifying) && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(13, 19, 26, 0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '400px' }}>
            <div className="modal-content text-center p-30" style={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', background: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
              <div className="py-20">
                <div className="spinner-border text-success mb-20" role="status" style={{ width: '3.5rem', height: '3.5rem' }}>
                  <span className="sr-only">Yükleniyor...</span>
                </div>
                <h4 className="font-weight-700 text-dark mb-10">Lütfen Bekleyiniz</h4>
                <p className="text-muted mb-0 font-size-14" style={{ lineHeight: '1.6' }}>{verifyMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ÖDEME BAŞARILI DIALOG MODALI */}
      {showCheckoutModal && paymentSuccess && selectedPlan && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(13, 19, 26, 0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '450px' }}>
            <div className="modal-content" style={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', background: '#fff', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
              <div className="modal-body p-40 text-center">
                <div 
                  className="d-flex align-items-center justify-content-center bg-success text-white mb-20 mx-auto" 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', fontSize: '42px', boxShadow: '0 8px 25px rgba(40,167,69,0.3)' }}
                >
                  ✓
                </div>
                <h3 className="font-weight-800 text-dark mb-10">Ödeme Başarılı!</h3>
                <p className="text-muted font-size-15 mb-0" style={{ lineHeight: '1.6' }}>
                  Hesabınız <strong>{selectedPlan.name}</strong> seviyesine başarıyla yükseltildi. Tüm limitleriniz güncellendi. İyi çalışmalar dileriz!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FATURA BİLGİLERİ ONAY MODALI */}
      {showBillingModal && checkoutPlan && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(13, 19, 26, 0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '480px' }}>
            <div className="modal-content" style={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', background: '#fff', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
              
              <div className="modal-header p-25 align-items-center border-bottom-0 pb-0">
                <h4 className="modal-title font-weight-800 text-dark" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Fatura Bilgilerini Doğrulayın
                </h4>
                <button type="button" className="close" onClick={() => setShowBillingModal(false)} aria-label="Kapat" style={{ outline: 'none', border: 'none', background: 'transparent' }}>
                  <span aria-hidden="true" style={{ fontSize: '24px' }}>&times;</span>
                </button>
              </div>

              <form onSubmit={startIyzicoCheckout}>
                <div className="modal-body p-25 pt-15">
                  <p className="text-muted font-size-13 mb-20" style={{ lineHeight: '1.5' }}>
                    iyzico güvenli ödeme sisteminin doğrulama kodlarını sorunsuz alabilmeniz için <strong>kendi iyzico hesabınıza veya ödeme yapacağınız karta ait bilgileri</strong> giriniz.
                  </p>

                  <div className="row">
                    <div className="col-md-6 col-12 mb-15">
                      <label className="font-weight-700 text-dark font-size-13 mb-5">Adınız</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        value={billingName} 
                        onChange={(e) => setBillingName(e.target.value)} 
                        placeholder="Örn. Ahmet"
                        style={{ borderRadius: '10px' }}
                      />
                    </div>
                    <div className="col-md-6 col-12 mb-15">
                      <label className="font-weight-700 text-dark font-size-13 mb-5">Soyadınız</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        value={billingSurname} 
                        onChange={(e) => setBillingSurname(e.target.value)} 
                        placeholder="Örn. Yılmaz"
                        style={{ borderRadius: '10px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group mb-15">
                    <label className="font-weight-700 text-dark font-size-13 mb-5">E-posta Adresi</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      required 
                      value={billingEmail} 
                      onChange={(e) => setBillingEmail(e.target.value)} 
                      placeholder="Örn. name@example.com"
                      style={{ borderRadius: '10px' }}
                    />
                    <small className="form-text text-muted font-size-11 mt-5">
                      iyzico e-posta doğrulama ekranında bu adresi girmelisiniz.
                    </small>
                  </div>

                  <div className="form-group mb-0">
                    <label className="font-weight-700 text-dark font-size-13 mb-5">Cep Telefonu</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={billingPhone} 
                      onChange={(e) => setBillingPhone(e.target.value)} 
                      placeholder="Örn. 0532 123 45 67"
                      style={{ borderRadius: '10px' }}
                    />
                    <small className="form-text text-muted font-size-11 mt-5">
                      Lütfen iyzico hesabınıza kayıtlı gerçek cep telefonunuzu girin.
                    </small>
                  </div>

                  {/* Ödeme Detayı Özeti */}
                  <div className="mt-25 p-15 bg-light rounded d-flex justify-content-between align-items-center">
                    <div>
                      <span className="font-weight-700 text-dark block font-size-14">{checkoutPlan.name}</span>
                      <span className="text-muted font-size-11">
                        {checkoutPlan.name === 'Deneme Paketi' ? 'Tek Seferlik' : (billingPeriod === 'yearly' ? 'Yıllık Faturalandırma' : 'Aylık Faturalandırma')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-weight-800 text-dark font-size-18" style={{ color: '#689f38' }}>
                        {checkoutPlan.name === 'Deneme Paketi' ? '1,00 ₺' : (billingPeriod === 'yearly' ? (checkoutPlan.name === 'KOBİ Paketi' ? '2.990,00 ₺' : '4.990,00 ₺') : (checkoutPlan.name === 'KOBİ Paketi' ? '299,00 ₺' : '499,00 ₺'))}
                      </span>
                    </div>
                  </div>

                </div>

                <div className="modal-footer p-25 border-top-0 pt-0">
                  <button type="button" className="btn btn-ghost px-20 py-10" onClick={() => setShowBillingModal(false)}>İptal</button>
                  <button 
                    type="submit" 
                    className="btn btn-success px-25 py-10 font-weight-700" 
                    style={{ background: '#689f38', border: 'none', borderRadius: '10px', color: '#fff' }}
                  >
                    Ödemeye Devam Et
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};
