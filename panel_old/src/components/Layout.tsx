import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase, isMockMode, mockData } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(mockData.profile);
  const [avatar, setAvatar] = useState<string>("/images/avatar/7.jpg");

  useEffect(() => {
    const loadAvatar = () => {
      if (profile && profile.email) {
        const savedAvatar = localStorage.getItem('sb-avatar-' + profile.email);
        if (savedAvatar) {
          setAvatar(savedAvatar);
        } else {
          setAvatar("/images/avatar/7.jpg");
        }
      }
    };
    loadAvatar();
    window.addEventListener('avatar-changed', loadAvatar);
    return () => window.removeEventListener('avatar-changed', loadAvatar);
  }, [profile]);

  useEffect(() => {
    // Mobil görünümde sayfa değiştiğinde menüyü otomatik kapat
    const body = document.body;
    if (body.classList.contains('sidebar-open')) {
      body.classList.remove('sidebar-open');
    }
  }, [location.pathname]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<any[]>([]);
  const [controlPersonnel, setControlPersonnel] = useState<any[]>([]);
  const [controlTasks, setControlTasks] = useState<any[]>([]);

  useEffect(() => {
    // Profil bilgilerini Supabase'den çek
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
            .select('*, tenants(name, slug)')
            .eq('id', user.id)
            .single();
          if (data) {
            setProfile({
              full_name: data.full_name,
              email: user.email,
              phone: data.phone,
              role: data.role,
              tenant_name: data.tenants?.name || 'İşletme',
              slug: data.tenants?.slug || 'slug'
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
    const loadSidebarAndDropdowns = async () => {
      // 1. Load Notifications
      const savedNotifications = localStorage.getItem('sb-notifications');
      let currentNotifications = [];
      if (savedNotifications) {
        currentNotifications = JSON.parse(savedNotifications);
      } else {
        const defaults = [
          { id: '1', title: 'Yeni Görev Atandı', description: 'Teklif Hazırlanacak görevi size atandı.', icon: 'fa fa-tasks text-info', link: '/tasks', read: false },
          { id: '2', title: 'Yeni Gelen Mesaj', description: 'Ali GÜVEN yeni bir mesaj gönderdi.', icon: 'fa fa-envelope text-success', link: '/messages', read: false }
        ];
        currentNotifications = defaults;
        localStorage.setItem('sb-notifications', JSON.stringify(defaults));
      }

      // 2. Load Unread Messages
      const savedMessages = localStorage.getItem('sb-mock-messages');
      let inboxUnread = [];
      if (savedMessages) {
        const msgs = JSON.parse(savedMessages);
        inboxUnread = msgs.filter((m: any) => m.folder === 'inbox' && !m.read);
      } else {
        const defaultMsgs = [
          { id: '1', sender_name: 'Ali GÜVEN', subject: 'Web Sitesi Taslak İncelemesi', date: '14:32', avatar: '/images/avatar/2.png', folder: 'inbox', read: false, body: 'Merhaba Fatih Bey, taslağı hazırladım.' },
          { id: '2', sender_name: 'Can BOLAT', subject: 'Haziran Ayı Sipariş Listesi Hk.', date: '11:15', avatar: '/images/avatar/3.png', folder: 'inbox', read: false, body: 'Haziran ayı listesi ekte yer almaktadır.' }
        ];
        localStorage.setItem('sb-mock-messages', JSON.stringify(defaultMsgs));
        inboxUnread = defaultMsgs;
      }
      setUnreadMessages(inboxUnread);

      // Automatically generate notifications for unread messages if not already notified
      let updatedNotifications = [...currentNotifications];
      let notificationAdded = false;
      inboxUnread.forEach((msg: any) => {
        const hasNotification = updatedNotifications.some(
          (n: any) => n.linkState && n.linkState.openMessageId === msg.id
        );
        if (!hasNotification) {
          updatedNotifications.unshift({
            id: 'msg-' + msg.id,
            title: 'Yeni Gelen Mesaj',
            description: `${msg.sender_name} yeni bir mesaj gönderdi: ${msg.subject}`,
            icon: 'fa fa-envelope text-success',
            link: '/messages',
            linkState: { openMessageId: msg.id },
            read: false,
            created_at: new Date().toISOString()
          });
          notificationAdded = true;
        }
      });

      if (notificationAdded) {
        localStorage.setItem('sb-notifications', JSON.stringify(updatedNotifications));
      }
      setNotifications(updatedNotifications);

      // 3. Load Personnel for right sidebar
      const savedPersonnel = localStorage.getItem('sb-mock-personnel');
      let personnelList = [];
      if (savedPersonnel) {
        personnelList = JSON.parse(savedPersonnel);
      } else {
        personnelList = [
          { id: '1', full_name: 'Ahmet Karaca', role: 'manager', is_active: true, avatar: '/images/avatar/1.png' },
          { id: '2', full_name: 'Mehmet Yılmaz', role: 'staff', is_active: true, avatar: '/images/avatar/2.png' },
          { id: '3', full_name: 'Ali BOLAT', role: 'manager', is_active: true, avatar: '/images/avatar/3.png' },
          { id: '4', full_name: 'Emre KINACI', role: 'staff', is_active: false, avatar: '/images/avatar/4.png' }
        ];
        localStorage.setItem('sb-mock-personnel', JSON.stringify(personnelList));
      }

      // Check if logged in user is in the personnel list. If not, add them.
      if (profile && profile.full_name) {
        const exists = personnelList.some(
          (p: any) => p.full_name.toLowerCase() === profile.full_name.toLowerCase()
        );
        if (!exists) {
          const loggedInUserObj = {
            id: 'profile-user',
            full_name: profile.full_name,
            role: profile.role || 'admin',
            is_active: true,
            avatar: (profile && profile.email ? (localStorage.getItem('sb-avatar-' + profile.email) || '/images/avatar/7.jpg') : '/images/avatar/7.jpg')
          };
          personnelList.push(loggedInUserObj);
          localStorage.setItem('sb-mock-personnel', JSON.stringify(personnelList));
        }
      }
      setControlPersonnel(personnelList.filter((p: any) => p.is_active));

      // Resolve logged-in member ID
      const loggedInMember = personnelList.find(
        (p: any) => profile && profile.full_name && p.full_name.toLowerCase() === profile.full_name.toLowerCase()
      );
      const loggedInMemberId = loggedInMember ? loggedInMember.id : 'profile-user';

      // 4. Load Tasks for right sidebar
      let tasksList = [];
      if (isMockMode()) {
        const savedTasks = localStorage.getItem('sb-mock-tasks');
        if (savedTasks) {
          tasksList = JSON.parse(savedTasks);
        } else {
          // Assign the first default task to the logged-in user
          const defaultTasks = mockData.tasks.map((t: any, idx: number) => 
            idx === 0 ? { ...t, assigned_to: loggedInMemberId } : t
          );
          tasksList = defaultTasks;
          localStorage.setItem('sb-mock-tasks', JSON.stringify(defaultTasks));
        }
      } else {
        try {
          const { data } = await supabase.from('tasks').select('*');
          tasksList = data || [];
        } catch (e) {
          console.error(e);
        }
      }

      // Filter tasks assigned to the logged-in user
      const myTasks = tasksList.filter((t: any) => {
        const isMyTask = t.assigned_to === loggedInMemberId;
        const isActive = t.status === 'todo' || t.status === 'in_progress';
        return isMyTask && isActive;
      });
      setControlTasks(myTasks);
    };

    loadSidebarAndDropdowns();
    const timer = setInterval(loadSidebarAndDropdowns, 3000);
    return () => clearInterval(timer);
  }, [profile]);

  useEffect(() => {
    // Sayfa yüklendiğinde ve değiştiğinde CrmX Admin tema bileşenlerini tetikle
    const initializeTheme = () => {
      // @ts-ignore
      const $ = window.jQuery;
      if ($) {
        // Sidebar push menu ve ağaç menülerini etkinleştir
        if ($.fn.pushMenu) {
          $('[data-toggle="push-menu"]').pushMenu();
        }
        // treeview widget'ını başlat
        // @ts-ignore
        if (typeof $.fn.tree === 'function') {
          // @ts-ignore
          $('.sidebar-menu').tree();
        }
      }
    };
    // DOM'un yüklenmesi için küçük bir gecikme verelim
    const timer = setTimeout(initializeTheme, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleLogout = async () => {
    if (isMockMode()) {
      localStorage.setItem('sb-mock-logged-in', 'false');
    } else {
      await supabase.auth.signOut();
    }
    navigate('/login');
  };

  const handleNotificationClick = (notif: any) => {
    const savedNotifications = localStorage.getItem('sb-notifications');
    if (savedNotifications) {
      const list = JSON.parse(savedNotifications);
      const updated = list.map((n: any) => n.id === notif.id ? { ...n, read: true } : n);
      localStorage.setItem('sb-notifications', JSON.stringify(updated));
      setNotifications(updated);
    }
    navigate(notif.link, { state: notif.linkState });
  };

  const handleClearAllNotifications = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.setItem('sb-notifications', JSON.stringify([]));
    setNotifications([]);
  };

  const handleContentClick = () => {
    const body = document.body;
    if (body.classList.contains('sidebar-open')) {
      body.classList.remove('sidebar-open');
    }
  };

  return (
    <div className="wrapper" style={{ height: 'auto', minHeight: '100%' }}>
      {/* Sanatsal Arka Plan */}
      <div className="art-bg">
        <img src="/images/art1.svg" alt="" className="art-img light-img" />
        <img src="/images/art2.svg" alt="" className="art-img dark-img" />
      </div>

      {/* ÜST NAVBAR */}
      <header className="main-header">
        <Link to="/" className="logo">
          <div className="logo-mini">
            <span className="light-logo"><img src="/images/logo-light.png" alt="logo" /></span>
            <span className="dark-logo"><img src="/images/logo-dark.png" alt="logo" /></span>
          </div>
          <div className="logo-lg">
            <span className="light-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <img src="/images/logo-light.png" alt="logo" style={{ height: '30px' }} />
              <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '18px', letterSpacing: '0.5px' }}>İŞte Yönetim</span>
            </span>
            <span className="dark-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <img src="/images/logo-dark.png" alt="logo" style={{ height: '30px' }} />
              <span style={{ color: '#1e4063', fontWeight: 'bold', fontSize: '18px', letterSpacing: '0.5px' }}>İŞte Yönetim</span>
            </span>
          </div>
        </Link>
        <nav className="navbar navbar-static-top">
          <div>
            <a href="#" className="sidebar-toggle" data-toggle="push-menu" role="button">
              <i className="ti-align-left"></i>
            </a>
            <a href="#" data-provide="fullscreen" className="sidebar-toggle" title="Tam Ekran">
              <i className="mdi mdi-crop-free"></i>
            </a>
          </div>

          <div className="navbar-custom-menu r-side">
            <ul className="nav navbar-nav">
              <li className="search-bar">
                <div className="lookup lookup-circle lookup-right">
                  <input type="text" name="s" placeholder="Ara..." />
                </div>
              </li>
              {/* Mesajlar */}
              <li className="dropdown messages-menu">
                <a href="#" className="dropdown-toggle" data-toggle="dropdown" title="Mesajlar">
                  <i className="mdi mdi-email"></i>
                  {unreadMessages.length > 0 && (
                    <span className="label label-success">{unreadMessages.length}</span>
                  )}
                </a>
                <ul className="dropdown-menu animated bounceIn">
                  <li className="header">
                    <div className="p-20">
                      <div className="flexbox">
                        <div><h4 className="mb-0 mt-0">Mesajlar</h4></div>
                        <div><Link to="/messages" className="text-muted">Tümünü Gör</Link></div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <ul className="menu sm-scrol" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {unreadMessages.map((msg, idx) => (
                        <li key={`msg-${msg.id}-${idx}`}>
                          <Link to="/messages" state={{ openMessageId: msg.id }}>
                            <div className="pull-left"><img src={msg.avatar || "/images/avatar/2.png"} className="rounded-circle" alt="User" /></div>
                            <div className="mail-contnet">
                              <h4>{msg.sender_name}<small><i className="fa fa-clock-o"></i> {msg.date}</small></h4>
                              <span>{msg.subject}</span>
                            </div>
                          </Link>
                        </li>
                      ))}
                      {unreadMessages.length === 0 && (
                        <li className="py-20 text-center text-muted">Yeni mesajınız yok.</li>
                      )}
                    </ul>
                  </li>
                  <li className="footer"><Link to="/messages">Tüm Mesajlar</Link></li>
                </ul>
              </li>
              {/* Bildirimler */}
              <li className="dropdown notifications-menu">
                <a href="#" className="dropdown-toggle" data-toggle="dropdown" title="Bildirimler">
                  <i className="mdi mdi-bell"></i>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="label label-warning">{notifications.filter(n => !n.read).length}</span>
                  )}
                </a>
                <ul className="dropdown-menu animated bounceIn">
                  <li className="header">
                    <div className="p-20">
                      <div className="flexbox">
                        <div><h4 className="mb-0 mt-0">Bildirimler</h4></div>
                        <div><a href="#" className="text-danger" onClick={handleClearAllNotifications}>Tümünü Sil</a></div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <ul className="menu sm-scrol" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {notifications.map((notif, idx) => (
                        <li key={`notif-${notif.id}-${idx}`} style={{ opacity: notif.read ? 0.6 : 1 }}>
                          <a href="#" onClick={(e) => { e.preventDefault(); handleNotificationClick(notif); }}>
                            <i className={notif.icon || "fa fa-bell text-info"}></i> {notif.description}
                          </a>
                        </li>
                      ))}
                      {notifications.length === 0 && (
                        <li className="py-20 text-center text-muted">Bildirim bulunmamaktadır.</li>
                      )}
                    </ul>
                  </li>
                  <li className="footer"><Link to="/tasks">Tümünü Gör</Link></li>
                </ul>
              </li>
              {/* Kullanıcı Menüsü */}
              <li className="dropdown user user-menu">
                <a href="#" className="dropdown-toggle" data-toggle="dropdown" title="Kullanıcı">
                  <img src={avatar} className="user-image rounded-circle" alt="User" />
                </a>
                <ul className="dropdown-menu animated flipInX">
                  <li className="user-header bg-img" style={{ backgroundImage: 'url(/images/user-info.jpg)' }} data-overlay="3">
                    <div className="flexbox align-self-center">
                      <img src={avatar} className="float-left rounded-circle" alt="User" />
                      <h4 className="user-name align-self-center">
                        <span>{profile.full_name}</span>
                        <small>{profile.email}</small>
                      </h4>
                    </div>
                  </li>
                  <li className="user-body">
                    <Link className="dropdown-item" to="/profile"><i className="ion ion-person"></i> Profil</Link>
                    <Link className="dropdown-item" to="/messages"><i className="ion ion-email-unread"></i> Mesajlar</Link>
                    <Link className="dropdown-item" to="/settings/personnel"><i className="ion ion-settings"></i> Ayarlar</Link>
                    <div className="dropdown-divider"></div>
                    <a className="dropdown-item text-danger" href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} style={{ cursor: 'pointer' }}><i className="ion-log-out"></i> Çıkış Yap</a>
                  </li>
                </ul>
              </li>
              {/* Sağ Menü Açıcı */}
              <li>
                <a href="#" data-toggle="control-sidebar" title="Yapılacaklar"><i className="fa fa-cog fa-spin"></i></a>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* SOL MENÜ (SIDEBAR) */}
      <aside className="main-sidebar">
        <section className="sidebar">
          <div className="user-profile">
            <div className="ulogo">
              <Link to="/">
                <h3><b>İŞ</b>te Yönetim</h3>
              </Link>
            </div>
            <div className="profile-pic">
              <img src={avatar} alt="user" style={{ objectFit: 'cover' }} />
              <div className="profile-info">
                <h4>{profile.full_name}</h4>
                <small className="text-muted block" style={{ fontSize: '11px', display: 'block', marginTop: '2px' }}>{profile.tenant_name}</small>
              </div>
            </div>
          </div>

          <ul className="sidebar-menu" data-widget="tree">
            <li className={location.pathname === '/' ? 'active' : ''}>
              <Link to="/"><i className="ti-dashboard"></i><span>Giriş Paneli</span></Link>
            </li>
            <li className={`treeview ${location.pathname.startsWith('/messages') ? 'active menu-open' : ''}`}>
              <a href="#">
                <i className="ti-email"></i><span>Mesajlar</span>
                <span className="pull-right-container"><i className="fa fa-angle-right pull-right"></i></span>
              </a>
              <ul className="treeview-menu">
                <li><Link to="/messages"><i className="ti-more"></i>Gelen Mesajlar</Link></li>
                <li><Link to="/messages/write"><i className="ti-more"></i>Mesaj Yaz</Link></li>
              </ul>
            </li>
            <li className={`treeview ${location.pathname.startsWith('/tasks') ? 'active menu-open' : ''}`}>
              <a href="#">
                <i className="ti-direction-alt"></i><span>Görev Paneli</span>
                <span className="pull-right-container"><i className="fa fa-angle-right pull-right"></i></span>
              </a>
              <ul className="treeview-menu">
                <li><Link to="/tasks/new"><i className="ti-more"></i>Görev Oluştur</Link></li>
                <li><Link to="/tasks"><i className="ti-more"></i>Görev Listesi</Link></li>
              </ul>
            </li>
            <li className={`treeview ${location.pathname.startsWith('/projects') ? 'active menu-open' : ''}`}>
              <a href="#">
                <i className="ti-shield"></i><span>Proje Paneli</span>
                <span className="pull-right-container"><i className="fa fa-angle-right pull-right"></i></span>
              </a>
              <ul className="treeview-menu">
                <li><Link to="/projects/new"><i className="ti-more"></i>Proje Oluştur</Link></li>
                <li><Link to="/projects"><i className="ti-more"></i>Proje Listesi</Link></li>
              </ul>
            </li>
            <li className={`treeview ${location.pathname.startsWith('/offers') ? 'active menu-open' : ''}`}>
              <a href="#">
                <i className="ti-file"></i><span>Teklif Paneli</span>
                <span className="pull-right-container"><i className="fa fa-angle-right pull-right"></i></span>
              </a>
              <ul className="treeview-menu">
                <li><Link to="/offers/new"><i className="ti-more"></i>Teklif Oluştur</Link></li>
                <li><Link to="/offers"><i className="ti-more"></i>Verilen Teklifler</Link></li>
              </ul>
            </li>
            <li className={`treeview ${location.pathname.startsWith('/customers') ? 'active menu-open' : ''}`}>
              <a href="#">
                <i className="ti-user"></i><span>Müşteri Paneli</span>
                <span className="pull-right-container"><i className="fa fa-angle-right pull-right"></i></span>
              </a>
              <ul className="treeview-menu">
                <li><Link to="/customers/new"><i className="ti-more"></i>Müşteri Oluştur</Link></li>
                <li><Link to="/customers"><i className="ti-more"></i>Müşteri Listesi</Link></li>
              </ul>
            </li>
            <li className={`treeview ${location.pathname.startsWith('/finance') ? 'active menu-open' : ''}`}>
              <a href="#">
                <i className="ti-view-list"></i><span>Finans Paneli</span>
                <span className="pull-right-container"><i className="fa fa-angle-right pull-right"></i></span>
              </a>
              <ul className="treeview-menu">
                <li><Link to="/finance/new"><i className="ti-more"></i>Hareket Ekle</Link></li>
                <li><Link to="/finance"><i className="ti-more"></i>Gelir/Gider Listesi</Link></li>
              </ul>
            </li>
            <li className={`treeview ${location.pathname.startsWith('/service-tickets') ? 'active menu-open' : ''}`}>
              <a href="#">
                <i className="ti-plug"></i><span>Teknik Servis Paneli</span>
                <span className="pull-right-container"><i className="fa fa-angle-right pull-right"></i></span>
              </a>
              <ul className="treeview-menu">
                <li><Link to="/service-tickets/new"><i className="ti-more"></i>Servis Ekle</Link></li>
                <li><Link to="/service-tickets"><i className="ti-more"></i>Servis Listesi</Link></li>
              </ul>
            </li>
            
            <li className="header nav-small-cap">Yönetim & Ayarlar</li>
            <li className={`treeview ${location.pathname.startsWith('/settings') ? 'active menu-open' : ''}`}>
              <a href="#">
                <i className="ti-settings"></i><span>Sistem Ayarları</span>
                <span className="pull-right-container"><i className="fa fa-angle-right pull-right"></i></span>
              </a>
              <ul className="treeview-menu">
                <li className={location.pathname === '/settings/personnel' ? 'active' : ''}>
                  <Link to="/settings/personnel"><i className="ti-more"></i>Personel Yönetimi</Link>
                </li>
              </ul>
            </li>

            <li className="header nav-small-cap">Hesap</li>
            <li className={location.pathname === '/upgrade' ? 'active' : ''}>
              <Link to="/upgrade"><i className="ti-panel"></i><span>Hesap Yükseltme</span></Link>
            </li>
            
            <li style={{ marginTop: '20px' }}>
              <button className="btn btn-block btn-danger-outline btn-sm text-left py-10" onClick={handleLogout} style={{ border: 'none', background: 'transparent', width: '100%' }}>
                <i className="ti-power-off" style={{ marginRight: '10px' }}></i><span>Güvenli Çıkış</span>
              </button>
            </li>
          </ul>
        </section>
      </aside>

      {/* İÇERİK ALANI */}
      <div className="content-wrapper" onClick={handleContentClick} style={{ cursor: 'pointer' }}>
        <div className="container-full" onClick={(e) => e.stopPropagation()}>
          <div className="content-header">
            <div className="d-flex align-items-center">
              <div className="mr-auto w-p50">
                <h3 className="page-title br-0">{title}</h3>
              </div>
            </div>
          </div>
          <section className="content">
            {children}
          </section>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="main-footer">
        <div className="pull-right d-none d-sm-inline-block">
          <ul className="nav nav-primary nav-dotted nav-dot-separated justify-content-center justify-content-md-end">
            <li className="nav-item"><Link className="nav-link" to="/faq">S.S.S.</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/support">Destek</Link></li>
          </ul>
        </div>
        &copy; 2026 <a href="https://www.bulutgrup.tr/" target="_blank" rel="noreferrer">Bulut Grup</a> / Tüm Hakları Saklıdır.
      </footer>

      {/* SAĞ YAN PANEL (Yapılacaklar listesi vb.) */}
      <aside className="control-sidebar control-sidebar-light">
        <div className="rpanel-title">
          <span className="pull-right btn btn-circle btn-danger" data-toggle="control-sidebar">
            <i className="ion ion-close text-white"></i>
          </span>
        </div>
        <ul className="nav nav-tabs control-sidebar-tabs">
          <li className="nav-item"><a href="#control-sidebar-home-tab" className="active" data-toggle="tab">Personel</a></li>
          <li className="nav-item"><a href="#control-sidebar-settings-tab" data-toggle="tab">Yapılacaklar</a></li>
        </ul>
        <div className="tab-content">
          <div className="tab-pane active" id="control-sidebar-home-tab">
            <div className="flexbox"><p>Aktif Ekipler</p></div>
            <div className="media-list media-list-hover mt-20">
              {controlPersonnel.map((p, idx) => (
                <div className="media py-10 px-0" key={`personnel-${p.id || idx}-${idx}`}>
                  <a className="avatar avatar-lg status-success" href="#">
                    <img src={p.avatar || `/images/avatar/${(idx % 4) + 1}.png`} alt="..." />
                  </a>
                  <div className="media-body">
                    <p className="font-size-16">
                      <a className="hover-primary" href="#"><strong>{p.full_name}</strong></a>
                    </p>
                    <p>{p.role === 'manager' ? 'Müdür / Yönetici' : 'Personel'}</p>
                    <span>Aktif</span>
                  </div>
                </div>
              ))}
              {controlPersonnel.length === 0 && (
                <div className="text-center py-20 text-muted">Aktif personel bulunmamaktadır.</div>
              )}
            </div>
          </div>
          <div className="tab-pane" id="control-sidebar-settings-tab">
            <div className="flexbox"><p>Kişisel Görevler</p></div>
            <ul className="todo-list mt-20">
              {controlTasks.map((t, idx) => (
                <li className="py-15 px-5 by-1" key={`task-${t.id || idx}-${idx}`}>
                  <input type="checkbox" id={`basic_checkbox_${t.id}`} className="filled-in" checked={t.status === 'done'} readOnly />
                  <label htmlFor={`basic_checkbox_${t.id}`} className="mb-0 h-15"></label>
                  <span className="text-line">{t.title}</span>
                  <small className={`badge ${t.priority === 'high' ? 'bg-danger' : t.priority === 'medium' ? 'bg-warning' : 'bg-info'}`}>
                    {t.priority === 'high' ? 'Yüksek' : t.priority === 'medium' ? 'Orta' : 'Düşük'}
                  </small>
                </li>
              ))}
              {controlTasks.length === 0 && (
                <li className="py-20 text-center text-muted">Devam eden göreviniz bulunmamaktadır.</li>
              )}
            </ul>
          </div>
        </div>
      </aside>
      <div className="control-sidebar-bg"></div>
    </div>
  );
};
