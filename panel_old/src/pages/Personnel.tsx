import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode } from '../lib/supabase';
import { Link } from 'react-router-dom';

interface PersonnelMember {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'staff';
  is_active: boolean;
  created_at: string;
}

const defaultPersonnel: PersonnelMember[] = [
  {
    id: '1',
    full_name: 'Ahmet Karaca',
    email: 'ahmet@otantikkumpir.com',
    phone: '+90 532 111 22 33',
    role: 'manager',
    is_active: true,
    created_at: '2026-05-01'
  },
  {
    id: '2',
    full_name: 'Mehmet Yılmaz',
    email: 'mehmet@isletme.com',
    phone: '+90 533 444 55 66',
    role: 'staff',
    is_active: true,
    created_at: '2026-05-15'
  },
  {
    id: '3',
    full_name: 'Ali BOLAT',
    email: 'ali@isteyonetim.com',
    phone: '+90 850 888 7143',
    role: 'manager',
    is_active: true,
    created_at: '2026-06-01'
  },
  {
    id: '4',
    full_name: 'Emre KINACI',
    email: 'emre@isletme.com',
    phone: '+90 505 777 88 99',
    role: 'staff',
    is_active: false,
    created_at: '2026-06-02'
  }
];

export const Personnel: React.FC = () => {
  const [personnel, setPersonnel] = useState<PersonnelMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPersonnel = async () => {
    setLoading(true);
    if (isMockMode()) {
      const saved = localStorage.getItem('sb-mock-personnel');
      if (saved) {
        setPersonnel(JSON.parse(saved));
      } else {
        setPersonnel(defaultPersonnel);
        localStorage.setItem('sb-mock-personnel', JSON.stringify(defaultPersonnel));
      }
      setLoading(false);
      return;
    }
    try {
      // Supabase'den gerçek profilleri çek (tenant_id'ye göre RLS ile korunur)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const saved = localStorage.getItem('sb-mock-personnel');
      const localList: PersonnelMember[] = saved ? JSON.parse(saved) : defaultPersonnel;
      const dbList = data || [];
      
      // Çakışmayanları yerel listeden ekleyerek birleştir
      const mergedList = [...dbList];
      localList.forEach((localItem) => {
        const exists = dbList.some((dbItem: any) => 
          (dbItem.email && localItem.email && dbItem.email.toLowerCase() === localItem.email.toLowerCase()) ||
          (dbItem.full_name && localItem.full_name && dbItem.full_name.toLowerCase() === localItem.full_name.toLowerCase())
        );
        if (!exists) {
          mergedList.push(localItem);
        }
      });

      setPersonnel(mergedList);
    } catch (e) {
      console.error("Personeller yüklenirken hata oluştu:", e);
      // RLS veya bağlantı hatası durumunda lokal listeye geri dön
      const saved = localStorage.getItem('sb-mock-personnel') || JSON.stringify(defaultPersonnel);
      setPersonnel(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const handleStatusChange = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    
    // Her durumda yerelde güncelle
    const saved = localStorage.getItem('sb-mock-personnel');
    const list: PersonnelMember[] = saved ? JSON.parse(saved) : defaultPersonnel;
    const updatedLocal = list.map((p) => p.id === id ? { ...p, is_active: nextStatus } : p);
    localStorage.setItem('sb-mock-personnel', JSON.stringify(updatedLocal));
    
    if (isMockMode()) {
      setPersonnel(updatedLocal);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: nextStatus })
        .eq('id', id);

      if (error) throw error;
      fetchPersonnel();
    } catch (e) {
      console.error("Personel güncellenirken hata oluştu:", e);
      // Yerel güncelleme ile devam et
      setPersonnel(prev => prev.map(p => p.id === id ? { ...p, is_active: nextStatus } : p));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu personeli silmek istediğinizden emin misiniz?")) return;

    // Yerelde sil
    const saved = localStorage.getItem('sb-mock-personnel');
    const list: PersonnelMember[] = saved ? JSON.parse(saved) : defaultPersonnel;
    const updatedLocal = list.filter((p) => p.id !== id);
    localStorage.setItem('sb-mock-personnel', JSON.stringify(updatedLocal));

    if (isMockMode()) {
      setPersonnel(updatedLocal);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchPersonnel();
    } catch (e) {
      console.error("Personel silinirken hata oluştu:", e);
      setPersonnel(updatedLocal);
    }
  };

  const translateRole = (role: string) => {
    switch (role) {
      case 'admin': return 'Yönetici';
      case 'manager': return 'Müdür';
      case 'staff': return 'Personel / Çalışan';
      default: return role;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'badge bg-danger';
      case 'manager': return 'badge bg-warning';
      case 'staff': return 'badge bg-primary';
      default: return 'badge bg-secondary';
    }
  };

  const filteredPersonnel = personnel.filter((p) =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.includes(searchQuery)
  );

  return (
    <Layout title="Personel Yönetimi">
      <div className="row">
        <div className="col-12">
          <div className="box">
            
            {/* Box Header */}
            <div className="box-header with-border">
              <h4 className="box-title">İşletme Çalışanları & Personel Tanımlama</h4>
              <div className="box-controls pull-right d-flex align-items-center">
                <div className="lookup lookup-circle lookup-right mr-10">
                  <input 
                    type="text" 
                    placeholder="Personel ara..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Link to="/settings/personnel/new" className="btn btn-sm btn-rounded btn-success font-weight-600">
                  <i className="fa fa-plus mr-5"></i> Yeni Personel Ekle
                </Link>
              </div>
            </div>

            {/* Box Body */}
            <div className="box-body">
              {loading ? (
                <div className="text-center py-40">
                  <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Yükleniyor...</span>
                  </div>
                </div>
              ) : filteredPersonnel.length === 0 ? (
                <div className="text-center py-40">
                  <p className="text-muted font-size-16">Herhangi bir personel kaydı bulunamadı.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Ad Soyad</th>
                        <th>E-posta</th>
                        <th>Telefon</th>
                        <th>Rol</th>
                        <th>Durum</th>
                        <th style={{ width: '200px' }}>Aksiyon</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPersonnel.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <strong>{p.full_name}</strong>
                          </td>
                          <td>{p.email || 'Belirtilmedi'}</td>
                          <td>{p.phone || 'Belirtilmedi'}</td>
                          <td>
                            <span className={getRoleBadgeClass(p.role)}>
                              {translateRole(p.role)}
                            </span>
                          </td>
                          <td>
                            <span className={`label label-${p.is_active ? 'success' : 'danger'}`}>
                              {p.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group">
                              <button 
                                type="button" 
                                className={`btn btn-sm ${p.is_active ? 'btn-danger-outline' : 'btn-success-outline'} mr-10`}
                                onClick={() => handleStatusChange(p.id, p.is_active)}
                              >
                                {p.is_active ? 'Pasife Al' : 'Aktife Al'}
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-danger-outline"
                                onClick={() => handleDelete(p.id)}
                                disabled={p.role === 'admin'} // Ana yönetici silinemez
                              >
                                <i className="fa fa-trash"></i> Sil
                              </button>
                            </div>
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
    </Layout>
  );
};
