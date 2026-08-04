import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Link, useLocation } from 'react-router-dom';

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

const initialMessages: Message[] = [
  {
    id: '1',
    sender_name: 'Ali GÜVEN',
    sender_email: 'ali@otantikkumpir.com',
    avatar: '/images/avatar/2.png',
    subject: 'Web Sitesi Taslak İncelemesi',
    content: 'Fatih Bey merhaba, gönderdiğiniz yeni web arayüz taslaklarını inceledim. Mobil görünüm harika olmuş. Otantik Kumpir logosunun boyutunu bir tık büyütebilirsek tasarımı onaylayıp ödemeyi geçmek isterim. Teşekkürler.',
    date: '14:32',
    starred: true,
    read: false,
    folder: 'inbox',
    label: 'important'
  },
  {
    id: '2',
    sender_name: 'Can BOLAT',
    sender_email: 'can@bolatgrup.com',
    avatar: '/images/avatar/3.png',
    subject: 'Haziran Ayı Sipariş Listesi Hk.',
    content: 'Merhaba, toptancı siparişleri listesini sisteme ekledim. Siparişlerin onay durumu değiştiğinde anlık mail bildiriminin admin@isteyonetim.com adresine düştüğünü test ettim, sorunsuz çalışıyor. Emeğinize sağlık.',
    date: '11:15',
    starred: false,
    read: false,
    folder: 'inbox',
    label: 'social'
  },
  {
    id: '3',
    sender_name: 'Emre KINACI',
    sender_email: 'emre@kinaciinsaat.com',
    avatar: '/images/avatar/4.png',
    subject: 'Teknik Servis Arızası Hk.',
    content: 'Mustafa Kemal Mah. Maidan İş Merkezindeki ofisimizde yer alan yazıcı bağlantı hatası veriyor, fatura kesemiyoruz. Lütfen bugün bir teknik servis personeli atayabilir misiniz? Durum acildir.',
    date: 'Dün',
    starred: true,
    read: true,
    folder: 'inbox',
    label: 'important'
  },
  {
    id: '4',
    sender_name: 'Mustafa ÜNVER',
    sender_email: 'mustafa@unverholding.com',
    avatar: '/images/avatar/5.png',
    subject: 'Yeni Teklif İsteği',
    content: 'Fiyatlandırma sayfasında KOBİ paketi yıllık 2999₺ ve Profesyonel paketi yıllık 4999₺ olarak gördük. Biz holding olarak Kurumsal paket için teklif almak istiyoruz. Formu doldurduk, teklifinizi bekliyoruz.',
    date: '28 Mayıs',
    starred: false,
    read: true,
    folder: 'inbox',
    label: 'promo'
  },
  {
    id: '5',
    sender_name: 'Mert BUZ',
    sender_email: 'mert@buzgida.com',
    avatar: '/images/avatar/6.png',
    subject: 'KDV Ödeme Dekontu',
    content: 'Merhaba Fatih Bey, mayıs ayı KDV ödeme dekontunu ekte gönderiyorum. Finans paneli üzerinden gider hareketi olarak banka kategorisinde sisteme işledim. Kontrol edebilirsiniz.',
    date: '25 Mayıs',
    starred: false,
    read: true,
    folder: 'inbox'
  },
  {
    id: '6',
    sender_name: 'Serhat ARSLAN',
    sender_email: 'serhat@arslanlojistik.com',
    avatar: '/images/avatar/8.png',
    subject: 'Sözleşme Taslağı',
    content: 'İşteYönetim platformunu 1 yıl boyunca kullanmak için anlaştığımız sözleşme taslağını ekte iletiyorum. İnceleyip dönüş yaparsanız sevinirim.',
    date: '20 Mayıs',
    starred: true,
    read: true,
    folder: 'inbox'
  },
  {
    id: '7',
    sender_name: 'Fatih AKYILDIZ',
    sender_email: 'admin@isteyonetim.com',
    avatar: '/images/avatar/7.jpg',
    subject: 'KOBİ Paket Satın Alım Bildirimi',
    content: 'Sayın Otantik Kumpir Yetkilisi, işletmeniz için KOBİ paketi aboneliğiniz başarıyla başlatılmıştır. Fatura detayları finans panelinize yüklenmiştir. Keyifli kullanımlar dileriz.',
    date: '15 Mayıs',
    starred: false,
    read: true,
    folder: 'sent'
  }
];

export const Messages: React.FC = () => {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'draft' | 'trash' | 'starred'>('inbox');
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySuccess, setReplySuccess] = useState(false);

  // Yerel hafızadan mesajları çek veya varsayılanları yükle
  useEffect(() => {
    const saved = localStorage.getItem('sb-mock-messages');
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages(initialMessages);
      localStorage.setItem('sb-mock-messages', JSON.stringify(initialMessages));
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0 && location.state && (location.state as any).openMessageId) {
      const openId = (location.state as any).openMessageId;
      const msg = messages.find(m => m.id === String(openId));
      if (msg) {
        handleMessageClick(msg);
      }
      // Rota durumunu temizleyelim ki sayfa yenilendiğinde sürekli açılmasın
      window.history.replaceState({}, document.title);
    }
  }, [messages, location.state]);

  const saveMessages = (newMessages: Message[]) => {
    setMessages(newMessages);
    localStorage.setItem('sb-mock-messages', JSON.stringify(newMessages));
  };

  // Filtrelenmiş Mesajlar
  const filteredMessages = messages.filter((msg) => {
    // Arama Sorgusu Filtresi
    const matchesSearch = 
      msg.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Etiket Filtresi Aktifse
    if (activeLabel) {
      return msg.label === activeLabel && msg.folder !== 'trash';
    }

    // Yıldızlı Menü Seçildiyse
    if (activeFolder === 'starred') {
      return msg.starred && msg.folder !== 'trash';
    }

    // Klasör Filtresi
    return msg.folder === activeFolder;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredMessages.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Satır tıklama olayını engelle
    const updated = messages.map((m) =>
      m.id === id ? { ...m, starred: !m.starred } : m
    );
    saveMessages(updated);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    let updated;
    if (activeFolder === 'trash') {
      // Çöp kutusunda ise kalıcı olarak sil
      updated = messages.filter((m) => !selectedIds.includes(m.id));
    } else {
      // Normal klasörde ise çöp kutusuna taşı
      updated = messages.map((m) =>
        selectedIds.includes(m.id) ? { ...m, folder: 'trash' as const } : m
      );
    }
    
    saveMessages(updated);
    setSelectedIds([]);
  };

  const handleMarkAsReadSelected = () => {
    if (selectedIds.length === 0) return;
    const updated = messages.map((m) =>
      selectedIds.includes(m.id) ? { ...m, read: true } : m
    );
    saveMessages(updated);
    setSelectedIds([]);
  };

  const handleMessageClick = (msg: Message) => {
    setSelectedMessage(msg);
    setReplyText('');
    setReplySuccess(false);
    
    // Mesajı okundu olarak işaretle
    const updated = messages.map((m) =>
      m.id === msg.id ? { ...m, read: true } : m
    );
    saveMessages(updated);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessage) return;

    // Gönderilen mesajlara ekle
    const newSentMsg: Message = {
      id: String(Date.now()),
      sender_name: 'Fatih AKYILDIZ',
      sender_email: 'admin@isteyonetim.com',
      avatar: '/images/avatar/7.jpg',
      subject: `Re: ${selectedMessage.subject}`,
      content: replyText,
      date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      starred: false,
      read: true,
      folder: 'sent'
    };

    saveMessages([...messages, newSentMsg]);
    setReplySuccess(true);
    setReplyText('');
    
    setTimeout(() => {
      setSelectedMessage(null);
    }, 1500);
  };

  // Toplam gelen okunmamış mesaj sayısı
  const unreadCount = messages.filter((m) => m.folder === 'inbox' && !m.read).length;

  return (
    <Layout title="Mesaj Kutusu">
      <div className="row">
        
        {/* SOL BLOK: KLASÖRLER VE ETİKETLER */}
        <div className="col-lg-3 col-12">
          <div className="p-10">
            <Link to="/messages/write" className="btn btn-rounded btn-success btn-block mb-20 py-10 font-weight-600">
              <i className="fa fa-pencil mr-5"></i> Yeni Mesaj Yaz
            </Link>
          </div>
          
          {/* KLASÖRLER KUTUSU */}
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Klasörler</h4>
            </div>
            <div className="box-body no-padding">
              <ul className="nav nav-pills flex-column">
                <li className="nav-item">
                  <button 
                    onClick={() => { setActiveFolder('inbox'); setActiveLabel(null); }}
                    className={`nav-link btn btn-block text-left py-10 ${activeFolder === 'inbox' && !activeLabel ? 'active' : ''}`}
                    style={{ background: activeFolder === 'inbox' && !activeLabel ? '#689f38' : 'transparent', color: activeFolder === 'inbox' && !activeLabel ? '#fff' : '#555', border: 'none', borderRadius: '4px' }}
                  >
                    <i className="ion ion-ios-email-outline mr-10 font-size-16"></i> Gelen Kutusu
                    {unreadCount > 0 && <span className="label label-success pull-right">{unreadCount}</span>}
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    onClick={() => { setActiveFolder('sent'); setActiveLabel(null); }}
                    className={`nav-link btn btn-block text-left py-10 ${activeFolder === 'sent' ? 'active' : ''}`}
                    style={{ background: activeFolder === 'sent' ? '#689f38' : 'transparent', color: activeFolder === 'sent' ? '#fff' : '#555', border: 'none', borderRadius: '4px' }}
                  >
                    <i className="ion ion-paper-airplane mr-10 font-size-16"></i> Gönderilenler
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    onClick={() => { setActiveFolder('draft'); setActiveLabel(null); }}
                    className={`nav-link btn btn-block text-left py-10 ${activeFolder === 'draft' ? 'active' : ''}`}
                    style={{ background: activeFolder === 'draft' ? '#689f38' : 'transparent', color: activeFolder === 'draft' ? '#fff' : '#555', border: 'none', borderRadius: '4px' }}
                  >
                    <i className="ion ion-email-unread mr-10 font-size-16"></i> Taslaklar
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    onClick={() => { setActiveFolder('starred'); setActiveLabel(null); }}
                    className={`nav-link btn btn-block text-left py-10 ${activeFolder === 'starred' && !activeLabel ? 'active' : ''}`}
                    style={{ background: activeFolder === 'starred' && !activeLabel ? '#689f38' : 'transparent', color: activeFolder === 'starred' && !activeLabel ? '#fff' : '#555', border: 'none', borderRadius: '4px' }}
                  >
                    <i className="ion ion-star mr-10 font-size-16"></i> Yıldızlılar
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    onClick={() => { setActiveFolder('trash'); setActiveLabel(null); }}
                    className={`nav-link btn btn-block text-left py-10 ${activeFolder === 'trash' ? 'active' : ''}`}
                    style={{ background: activeFolder === 'trash' ? '#689f38' : 'transparent', color: activeFolder === 'trash' ? '#fff' : '#555', border: 'none', borderRadius: '4px' }}
                  >
                    <i className="ion ion-trash-a mr-10 font-size-16"></i> Çöp Kutusu
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* ETİKETLER KUTUSU */}
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Etiketler</h4>
            </div>
            <div className="box-body no-padding">
              <ul className="nav nav-pills flex-column">
                <li className="nav-item">
                  <button 
                    onClick={() => setActiveLabel('important')}
                    className={`nav-link btn btn-block text-left py-10 ${activeLabel === 'important' ? 'active' : ''}`}
                    style={{ background: activeLabel === 'important' ? 'rgba(238, 16, 68, 0.1)' : 'transparent', color: activeLabel === 'important' ? '#ee1044' : '#555', border: 'none', borderRadius: '4px' }}
                  >
                    <i className="fa fa-circle-o text-danger mr-10"></i> Önemliler
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    onClick={() => setActiveLabel('promo')}
                    className={`nav-link btn btn-block text-left py-10 ${activeLabel === 'promo' ? 'active' : ''}`}
                    style={{ background: activeLabel === 'promo' ? 'rgba(255, 143, 0, 0.1)' : 'transparent', color: activeLabel === 'promo' ? '#ff8f00' : '#555', border: 'none', borderRadius: '4px' }}
                  >
                    <i className="fa fa-circle-o text-warning mr-10"></i> Kampanyalar
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    onClick={() => setActiveLabel('social')}
                    className={`nav-link btn btn-block text-left py-10 ${activeLabel === 'social' ? 'active' : ''}`}
                    style={{ background: activeLabel === 'social' ? 'rgba(56, 100, 159, 0.1)' : 'transparent', color: activeLabel === 'social' ? '#38649f' : '#555', border: 'none', borderRadius: '4px' }}
                  >
                    <i className="fa fa-circle-o text-info mr-10"></i> Sosyal Medya
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* SAĞ BLOK: MESAJ TABLOSU */}
        <div className="col-lg-9 col-12">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">
                {activeLabel ? 'Etiketli Mesajlar' : activeFolder === 'inbox' ? 'Gelen Kutusu' : activeFolder === 'sent' ? 'Gönderilen Mesajlar' : activeFolder === 'starred' ? 'Yıldızlı Mesajlar' : activeFolder === 'draft' ? 'Taslaklar' : 'Çöp Kutusu'}
              </h4>
              
              <div className="box-controls pull-right">
                <div className="lookup lookup-circle lookup-right">
                  <input 
                    type="text" 
                    placeholder="Mesajlarda ara..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="box-body">
              
              {/* MESAJ YÖNETİM BUTONLARI */}
              <div className="mailbox-controls pb-20 d-flex justify-content-between align-items-center flex-wrap">
                <div className="d-flex align-items-center">
                  {/* Tümünü Seç */}
                  <div className="checkbox mr-15">
                    <input 
                      type="checkbox" 
                      id="select_all" 
                      onChange={handleSelectAll}
                      checked={filteredMessages.length > 0 && selectedIds.length === filteredMessages.length}
                    />
                    <label htmlFor="select_all" className="mb-0 pr-10"></label>
                  </div>
                  
                  {/* Toplu Aksiyon Butonları */}
                  <div className="btn-group">
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm btn-rounded" 
                      title="Sil" 
                      onClick={handleDeleteSelected}
                      disabled={selectedIds.length === 0}
                    >
                      <i className="ion ion-trash-a font-size-16 text-danger"></i> Seçilenleri Sil
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm btn-rounded ml-10" 
                      title="Okundu İşaretle" 
                      onClick={handleMarkAsReadSelected}
                      disabled={selectedIds.length === 0}
                    >
                      <i className="ion ion-checkmark-circled font-size-16 text-success"></i> Okundu Yap
                    </button>
                  </div>
                </div>
                
                <div className="text-muted font-size-12 mt-5 mt-md-0">
                  {filteredMessages.length} mesajdan {selectedIds.length} adedi seçildi
                </div>
              </div>

              {/* MESAJ LİSTESİ */}
              {filteredMessages.length === 0 ? (
                <div className="text-center py-40">
                  <p className="text-muted font-size-16">Herhangi bir mesaj bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mailbox-messages">
                    <tbody>
                      {filteredMessages.map((msg) => (
                        <tr 
                          key={msg.id} 
                          onClick={() => handleMessageClick(msg)}
                          style={{ cursor: 'pointer', background: msg.read ? 'transparent' : 'rgba(104,159,56,0.04)' }}
                        >
                          {/* Seçim Checkbox */}
                          <td style={{ width: '40px' }} onClick={(e) => e.stopPropagation()}>
                            <div className="checkbox mb-0">
                              <input 
                                type="checkbox" 
                                id={`check_${msg.id}`}
                                checked={selectedIds.includes(msg.id)}
                                onChange={() => handleSelectOne(msg.id)}
                              />
                              <label htmlFor={`check_${msg.id}`} className="mb-0"></label>
                            </div>
                          </td>

                          {/* Yıldız */}
                          <td style={{ width: '40px' }}>
                            <button 
                              className="btn btn-flat p-0" 
                              onClick={(e) => handleToggleStar(e, msg.id)}
                            >
                              <i className={msg.starred ? "fa fa-star text-warning" : "fa fa-star-o text-muted"}></i>
                            </button>
                          </td>

                          {/* Avatar */}
                          <td style={{ width: '60px' }} className="d-none d-sm-table-cell">
                            <img className="avatar rounded-circle" src={msg.avatar} alt={msg.sender_name} style={{ width: '38px', height: '38px' }} />
                          </td>

                          {/* Gönderen Kişi */}
                          <td style={{ width: '160px' }} className="mailbox-name font-weight-600">
                            {!msg.read && <span className="badge badge-success mr-5">Yeni</span>}
                            <span style={{ fontWeight: msg.read ? '400' : '700' }}>{msg.sender_name}</span>
                          </td>

                          {/* Konu ve İçerik */}
                          <td className="mailbox-subject">
                            <span style={{ fontWeight: msg.read ? '500' : '700' }}>{msg.subject}</span>
                            <span className="text-muted d-block text-truncate" style={{ maxWidth: '350px', fontSize: '12px' }}>
                              {msg.content}
                            </span>
                            
                            {/* Etiketler */}
                            {msg.label && (
                              <span className={`badge badge-sm mt-5 ${msg.label === 'important' ? 'badge-danger' : msg.label === 'promo' ? 'badge-warning' : 'badge-info'}`}>
                                {msg.label === 'important' ? 'Önemli' : msg.label === 'promo' ? 'Kampanya' : 'Sosyal'}
                              </span>
                            )}
                          </td>

                          {/* Tarih */}
                          <td style={{ width: '80px', textAlign: 'right' }} className="mailbox-date font-size-12 text-muted">
                            {msg.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* DETAYLI MESAJ OKUMA MODALI */}
      {selectedMessage && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content" style={{ borderRadius: '15px', border: 'none', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              
              {/* Modal Header */}
              <div className="modal-header bg-gradient-fruit text-white p-20 d-flex justify-content-between align-items-center">
                <h5 className="modal-title font-weight-700 m-0">{selectedMessage.subject}</h5>
                <button 
                  type="button" 
                  className="close text-white" 
                  onClick={() => setSelectedMessage(null)}
                  style={{ border: 'none', background: 'transparent', fontSize: '24px', opacity: 0.8 }}
                >
                  &times;
                </button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-30">
                {/* Gönderen Bilgisi */}
                <div className="d-flex align-items-center justify-content-between border-bottom pb-15 mb-20">
                  <div className="d-flex align-items-center">
                    <img src={selectedMessage.avatar} alt="" className="avatar rounded-circle mr-15" style={{ width: '45px', height: '45px' }} />
                    <div>
                      <h5 className="mb-0 font-weight-700">{selectedMessage.sender_name}</h5>
                      <small className="text-muted">{selectedMessage.sender_email}</small>
                    </div>
                  </div>
                  <div className="text-right text-muted font-size-12">
                    {selectedMessage.date}
                  </div>
                </div>

                {/* Mesaj İçeriği */}
                <div className="py-10" style={{ fontSize: '15px', lineHeight: '1.6', color: '#444', minHeight: '120px', whiteSpace: 'pre-wrap' }}>
                  {selectedMessage.content}
                </div>

                {/* Yanıt Gönderme Başarılı Bildirimi */}
                {replySuccess ? (
                  <div className="alert alert-success mt-20" role="alert">
                    Yanıtınız başarıyla gönderildi!
                  </div>
                ) : (
                  /* Yanıt Alanı */
                  <form onSubmit={handleSendReply} className="mt-30 border-top pt-20">
                    <div className="form-group">
                      <label className="font-weight-600 text-dark mb-10">
                        <i className="fa fa-reply mr-5 text-success"></i> Hızlı Yanıt Yaz
                      </label>
                      <textarea 
                        className="form-control" 
                        rows={4} 
                        placeholder="Mesajınızı buraya yazın..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        required
                        style={{ borderRadius: '10px', padding: '12px' }}
                      ></textarea>
                    </div>
                    
                    <div className="text-right">
                      <button 
                        type="button" 
                        className="btn btn-rounded btn-secondary-outline mr-10"
                        onClick={() => setSelectedMessage(null)}
                      >
                        Kapat
                      </button>
                      <button type="submit" className="btn btn-rounded btn-success font-weight-600 px-20">
                        <i className="fa fa-paper-plane mr-5"></i> Yanıtı Gönder
                      </button>
                    </div>
                  </form>
                )}

              </div>
              
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};
