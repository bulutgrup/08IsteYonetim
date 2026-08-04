import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { useNavigate, Link } from 'react-router-dom';
import { addNotification } from '../lib/supabase';

interface Message {
  id: string;
  sender_name: string;
  sender_email: string;
  avatar: string;
  subject: string;
  content: string;
  date: string;
  starred: boolean;
  read: boolean;
  folder: 'inbox' | 'sent' | 'draft' | 'trash';
  label?: 'important' | 'promo' | 'social';
}

export const MessageWrite: React.FC = () => {
  const navigate = useNavigate();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Alıcı Önerileri (Müşteri & Personeller)
  const recipients = [
    { name: 'Ahmet Karaca (Otantik Kumpir)', email: 'ahmet@otantikkumpir.com' },
    { name: 'Murat Can (Şampiyon Kokoreç)', email: 'murat@sampiyon.com' },
    { name: 'Bulut Yapı Destek', email: 'destek@bulut.digital' },
    { name: 'Ali BOLAT (Ekip Lideri)', email: 'ali@isteyonetim.com' },
    { name: 'Elif ÜNVER (Müşteri İlişkileri)', email: 'elif@isteyonetim.com' }
  ];

  const handleSendMessage = (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    if (!to || !subject || !content) return;
    
    setLoading(true);

    setTimeout(() => {
      // Mevcut mesajları oku
      const saved = localStorage.getItem('sb-mock-messages');
      const messages: Message[] = saved ? JSON.parse(saved) : [];

      const newMsg: Message = {
        id: String(Date.now()),
        sender_name: 'Fatih AKYILDIZ',
        sender_email: 'admin@isteyonetim.com',
        avatar: '/images/avatar/7.jpg',
        subject: subject,
        content: content,
        date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        starred: false,
        read: true,
        folder: isDraft ? 'draft' : 'sent'
      };

      messages.unshift(newMsg);
      localStorage.setItem('sb-mock-messages', JSON.stringify(messages));
      
      if (!isDraft) {
        addNotification(
          'Yeni Mesaj Gönderildi',
          `"${subject}" konulu mesaj gönderildi.`,
          'fa fa-envelope text-success',
          '/messages',
          { openMessageId: newMsg.id }
        );
      }

      setLoading(false);
      setToastMessage(isDraft ? 'Mesaj taslak olarak kaydedildi.' : 'Mesajınız başarıyla gönderildi!');

      setTimeout(() => {
        navigate('/messages');
      }, 1500);

    }, 800);
  };

  return (
    <Layout title="Yeni Mesaj Yaz">
      
      {/* BAŞARI BİLDİRİMİ */}
      {toastMessage && (
        <div 
          className="alert alert-success font-weight-600 shadow-sm" 
          role="alert" 
          style={{ position: 'fixed', top: '80px', right: '30px', zIndex: 9999, borderRadius: '8px' }}
        >
          <i className="fa fa-check mr-5"></i> {toastMessage}
        </div>
      )}

      <div className="row">
        
        {/* SOL BLOK: FOLDERS */}
        <div className="col-lg-3 col-12">
          <div className="p-10">
            <Link to="/messages" className="btn btn-rounded btn-info btn-block mb-20 py-10 font-weight-600">
              <i className="fa fa-arrow-left mr-5"></i> Gelen Kutusu
            </Link>
          </div>
          
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Klasörler</h4>
            </div>
            <div className="box-body no-padding">
              <ul className="nav nav-pills flex-column">
                <li className="nav-item">
                  <Link to="/messages" className="nav-link text-left py-10" style={{ color: '#555' }}>
                    <i className="ion ion-ios-email-outline mr-10 font-size-16"></i> Gelen Kutusu
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/messages" className="nav-link text-left py-10" style={{ color: '#555' }}>
                    <i className="ion ion-paper-airplane mr-10 font-size-16"></i> Gönderilenler
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/messages" className="nav-link text-left py-10" style={{ color: '#555' }}>
                    <i className="ion ion-email-unread mr-10 font-size-16"></i> Taslaklar
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/messages" className="nav-link text-left py-10" style={{ color: '#555' }}>
                    <i className="ion ion-trash-a mr-10 font-size-16"></i> Çöp Kutusu
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* SAĞ BLOK: EDITÖR */}
        <div className="col-lg-9 col-12">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Yeni Mesaj Oluştur</h4>
            </div>
            
            <form onSubmit={(e) => handleSendMessage(e, false)}>
              <div className="box-body">
                
                {/* Alıcı Kime */}
                <div className="form-group">
                  <label className="font-weight-600 text-dark mb-5">Alıcı E-posta *</label>
                  <select 
                    className="form-control" 
                    value={to} 
                    onChange={(e) => setTo(e.target.value)}
                    required
                    style={{ borderRadius: '8px' }}
                  >
                    <option value="">Bir alıcı seçin...</option>
                    {recipients.map((r, i) => (
                      <option key={i} value={r.email}>{r.name} - ({r.email})</option>
                    ))}
                  </select>
                </div>

                {/* Konu */}
                <div className="form-group">
                  <label className="font-weight-600 text-dark mb-5">Konu / Başlık *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Konu başlığını girin..." 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    style={{ borderRadius: '8px' }}
                  />
                </div>

                {/* Mesaj İçeriği */}
                <div className="form-group">
                  <label className="font-weight-600 text-dark mb-5">Mesaj İçeriği *</label>
                  <textarea 
                    className="form-control" 
                    rows={12} 
                    placeholder="Mesajınızı buraya girin..." 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    style={{ borderRadius: '10px', padding: '15px' }}
                  ></textarea>
                </div>

                {/* Ek Dosya Simülasyonu */}
                <div className="form-group mb-0">
                  <div className="btn btn-sm btn-rounded btn-info btn-file" style={{ position: 'relative', overflow: 'hidden' }}>
                    <i className="fa fa-paperclip mr-5"></i> Dosya Ekle
                    <input type="file" style={{ position: 'absolute', top: 0, right: 0, minWidth: '100%', minHeight: '100%', fontSize: '100px', textAlign: 'right', opacity: 0, outline: 'none', background: 'white', cursor: 'inherit', display: 'block' }} />
                  </div>
                  <small className="help-block ml-10 text-muted">Maksimum Ek Dosya Boyutu: 32MB</small>
                </div>

              </div>

              {/* Form Footer */}
              <div className="box-footer text-right">
                <button 
                  type="reset" 
                  className="btn btn-rounded btn-danger mr-10 font-weight-600 px-20"
                  onClick={() => navigate('/messages')}
                >
                  <i className="fa fa-times mr-5"></i> İptal
                </button>
                <button 
                  type="button" 
                  className="btn btn-rounded btn-default mr-10 font-weight-600 px-20"
                  onClick={(e) => handleSendMessage(e, true)}
                  disabled={loading}
                >
                  <i className="fa fa-pencil mr-5"></i> Taslak
                </button>
                <button 
                  type="submit" 
                  className="btn btn-rounded btn-success font-weight-600 px-20"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm mr-5" role="status" aria-hidden="true"></span>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-envelope-o mr-5"></i> Gönder
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </Layout>
  );
};
