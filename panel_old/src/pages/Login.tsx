import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, isMockMode } from '../lib/supabase';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isMockMode()) {
      // Simülasyon modu
      localStorage.setItem('sb-mock-logged-in', 'true');
      setTimeout(() => {
        setLoading(false);
        navigate('/');
      }, 1000);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Giriş yapılırken bir hata oluştu.');
      setLoading(false);
    }
  };

  return (
    <div className="hold-transition theme-fruit bg-img" style={{ backgroundImage: 'url(/images/auth-bg/bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} data-overlay="3">
      <div className="auth-2-outer row align-items-center h-p100 m-0" style={{ width: '100%', maxWidth: '450px', position: 'relative', zIndex: 1 }}>
        <div className="auth-2 bg-gradient-fruit" style={{ width: '100%', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
          <div className="auth-logo font-size-30 text-center">
            <Link to="/" className="text-white"><b>İŞ</b>te Yönetim</Link>
          </div>
          <div className="auth-body">
            <p className="auth-msg text-white-50 text-center">Kullanıcı Girişi</p>

            {error && (
              <div className="alert alert-danger" role="alert" style={{ background: 'rgba(255,77,77,0.15)', borderColor: 'rgba(255,77,77,0.3)', color: '#ff8080', borderRadius: '8px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="form-element">
              <div className="form-group has-feedback">
                <input
                  type="email"
                  className="form-control text-white"
                  placeholder="E-posta"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '10px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <span className="ion ion-email form-control-feedback text-white"></span>
              </div>
              <div className="form-group has-feedback">
                <input
                  type="password"
                  className="form-control text-white"
                  placeholder="Şifre"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '10px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span className="ion ion-locked form-control-feedback text-white"></span>
              </div>
              <div className="row">
                <div className="col-6">
                  <div className="checkbox">
                    <input type="checkbox" id="remember_me" />
                    <label htmlFor="remember_me" className="text-white">Beni Hatırla</label>
                  </div>
                </div>
                <div className="col-6 text-right">
                  <a href="#" className="text-white-50 hover-white">Şifremi Unuttum?</a>
                </div>
                <div className="col-12 text-center">
                  <button
                    type="submit"
                    className="btn btn-rounded mt-10 btn-success btn-block font-weight-600"
                    style={{ padding: '10px 0' }}
                    disabled={loading}
                  >
                    {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                  </button>
                </div>
              </div>
            </form>

            <div className="margin-top-30 text-center text-white">
              <p>İşletme kaydınız yok mu? <Link to="/register" className="text-info m-l-5 font-weight-600">Kayıt Olun</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
