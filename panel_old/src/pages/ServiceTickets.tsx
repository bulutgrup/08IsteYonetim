import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode, mockData } from '../lib/supabase';
import { Link } from 'react-router-dom';

export const ServiceTickets: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    if (isMockMode()) {
      const saved = localStorage.getItem('sb-mock-service-tickets');
      if (saved) {
        setTickets(JSON.parse(saved));
      } else {
        const initial = mockData.serviceTickets || [];
        setTickets(initial);
        localStorage.setItem('sb-mock-service-tickets', JSON.stringify(initial));
      }
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .select('*, customers(company_name), profiles(full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (e) {
      console.error("Teknik servis kayıtları yüklenemedi:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const loadStaff = async () => {
      const savedStaff = localStorage.getItem('sb-mock-personnel');
      const localList = savedStaff ? JSON.parse(savedStaff) : [
        { id: '1', full_name: 'Ahmet Karaca', is_active: true },
        { id: '2', full_name: 'Mehmet Yılmaz', is_active: true },
        { id: '3', full_name: 'Ali BOLAT', is_active: true },
        { id: '4', full_name: 'Emre KINACI', is_active: false }
      ];

      if (isMockMode()) {
        setStaff(localList);
        return;
      }
      try {
        const { data } = await supabase.from('profiles').select('id, full_name, is_active');
        const dbList = data || [];
        const mergedList = [...dbList];

        localList.forEach((localItem: any) => {
          const exists = dbList.some((dbItem: any) => 
            dbItem.full_name && localItem.full_name && dbItem.full_name.toLowerCase() === localItem.full_name.toLowerCase()
          );
          if (!exists) {
            mergedList.push(localItem);
          }
        });
        setStaff(mergedList);
      } catch (e) {
        console.error("Personel yüklenemedi:", e);
        setStaff(localList);
      }
    };
    loadStaff();
  }, []);

  const getTicketRoles = (ticket: any) => {
    let tech = 'Atanmadı';
    let purchasing = 'Atanmadı';
    let billing = 'Atanmadı';
    let displayDesc = ticket.issue_description || '';

    const assignedId = ticket.assigned_to || ticket.assigned_staff_id;
    if (assignedId) {
      tech = staff.find(s => s.id === assignedId)?.full_name || 'Atanmadı';
    } else if (ticket.profiles?.full_name) {
      tech = ticket.profiles.full_name;
    }

    if (ticket.issue_description && ticket.issue_description.startsWith('__METADATA__:')) {
      try {
        const metaEndIndex = ticket.issue_description.indexOf('__', 13);
        if (metaEndIndex !== -1) {
          const metaStr = ticket.issue_description.substring(13, metaEndIndex);
          const meta = JSON.parse(metaStr);
          displayDesc = ticket.issue_description.substring(metaEndIndex + 2).trim();

          if (meta.purchasing_responsible) {
            purchasing = staff.find(s => s.id === meta.purchasing_responsible)?.full_name || 'Atanmadı';
          }
          if (meta.billing_responsible) {
            billing = staff.find(s => s.id === meta.billing_responsible)?.full_name || 'Atanmadı';
          }
        }
      } catch (e) {
        // ignore
      }
    }

    return { tech, purchasing, billing, displayDesc };
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    if (newStatus === 'resolved') {
      const t = tickets.find(x => x.id === ticketId);
      setSelectedTicket(t);
      setResolutionNotes(t?.resolution_notes || '');
      setShowModal(true);
      return;
    }

    if (isMockMode()) {
      const updated = tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t);
      setTickets(updated);
      localStorage.setItem('sb-mock-service-tickets', JSON.stringify(updated));
      return;
    }
    try {
      const { error } = await supabase
        .from('service_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;
      fetchTickets();
    } catch (e) {
      console.error("Arıza durumu güncellenirken hata:", e);
    }
  };

  const handleSaveResolution = async () => {
    if (!selectedTicket) return;

    if (isMockMode()) {
      const updated = tickets.map(t => t.id === selectedTicket.id ? { ...t, status: 'resolved', resolution_notes: resolutionNotes } : t);
      setTickets(updated);
      localStorage.setItem('sb-mock-service-tickets', JSON.stringify(updated));
      setShowModal(false);
      setSelectedTicket(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('service_tickets')
        .update({ 
          status: 'resolved', 
          resolution_notes: resolutionNotes,
          resolved_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;
      setShowModal(false);
      setSelectedTicket(null);
      fetchTickets();
    } catch (e) {
      console.error("Çözüm notu kaydedilemedi:", e);
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!window.confirm("Bu teknik servis kaydını silmek istediğinizden emin misiniz?")) return;
    
    if (isMockMode()) {
      const updated = tickets.filter(t => t.id !== ticketId);
      setTickets(updated);
      localStorage.setItem('sb-mock-service-tickets', JSON.stringify(updated));
      return;
    }
    try {
      const { error } = await supabase
        .from('service_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;
      fetchTickets();
    } catch (e) {
      console.error("Kayıt silinirken hata oluştu:", e);
    }
  };

  const getStatusLabelClass = (status: string) => {
    switch (status) {
      case 'open': return 'label label-danger';
      case 'in_progress': return 'label label-warning';
      case 'resolved': return 'label label-success';
      case 'closed': return 'label label-secondary';
      default: return 'label label-secondary';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'open': return 'Açık / Yeni';
      case 'in_progress': return 'İşlemde';
      case 'resolved': return 'Çözüldü';
      case 'closed': return 'Kapatıldı';
      default: return status;
    }
  };

  // İstatistikler
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

  return (
    <Layout title="Teknik Servis Yönetimi">
      {/* İstatistikler */}
      <div className="row">
        <div className="col-xl-3 col-md-6 col-12">
          <div className="box">
            <div className="box-body py-20">
              <h5 className="text-mute mb-5 font-size-14">Toplam Arıza Kaydı</h5>
              <div className="d-flex justify-content-between align-items-end">
                <h2 className="mb-0 font-weight-700 text-dark">{totalCount}</h2>
                <span className="badge badge-pill badge-primary">Tümü</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 col-12">
          <div className="box">
            <div className="box-body py-20">
              <h5 className="text-mute mb-5 font-size-14">Yeni Arızalar</h5>
              <div className="d-flex justify-content-between align-items-end">
                <h2 className="mb-0 font-weight-700 text-danger">{openCount}</h2>
                <span className="badge badge-pill badge-danger">Acil</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 col-12">
          <div className="box">
            <div className="box-body py-20">
              <h5 className="text-mute mb-5 font-size-14">Devam Edenler</h5>
              <div className="d-flex justify-content-between align-items-end">
                <h2 className="mb-0 font-weight-700 text-warning">{inProgressCount}</h2>
                <span className="badge badge-pill badge-warning">İşlemde</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 col-12">
          <div className="box">
            <div className="box-body py-20">
              <h5 className="text-mute mb-5 font-size-14">Çözülen Kayıtlar</h5>
              <div className="d-flex justify-content-between align-items-end">
                <h2 className="mb-0 font-weight-700 text-success">{resolvedCount}</h2>
                <span className="badge badge-pill badge-success">Başarılı</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Teknik Destek & Servis Talepleri</h4>
              <div className="box-controls pull-right">
                <Link to="/service-tickets/new" className="btn btn-sm btn-rounded btn-success">
                  <i className="fa fa-plus mr-5"></i> Yeni Arıza Bildirimi Oluştur
                </Link>
              </div>
            </div>
            
            <div className="box-body">
              {loading ? (
                <div className="text-center py-40">
                  <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Yükleniyor...</span>
                  </div>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-40">
                  <p className="text-muted">Herhangi bir servis talebi bulunmamaktadır.</p>
                </div>
              ) : (
                <>
                  {/* Desktop View */}
                  <div className="table-responsive d-none d-md-block">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Destek No</th>
                          <th>Müşteri / Firma</th>
                          <th>Arıza Tanımı</th>
                          <th>Görevliler</th>
                          <th>Kayıt Tarihi</th>
                          <th>Durum</th>
                          <th style={{ width: '250px' }}>Aksiyon</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((t) => {
                          const { tech, purchasing, billing, displayDesc } = getTicketRoles(t);
                          return (
                            <tr key={t.id}>
                              <td><strong>#{t.id.slice(0, 4)}</strong></td>
                              <td><strong>{t.customers?.company_name || 'Müşteri Belirtilmedi'}</strong></td>
                              <td>
                                <strong>{displayDesc}</strong>
                                {t.resolution_notes && (
                                  <small className="block text-success" style={{ display: 'block', fontSize: '11px' }}>
                                    <strong>Çözüm Notu:</strong> {t.resolution_notes}
                                  </small>
                                )}
                              </td>
                              <td>
                                <div className="font-size-12">
                                  <div><strong className="text-danger">Teknisyen:</strong> {tech}</div>
                                  {purchasing !== 'Atanmadı' && <div><strong className="text-warning">Satın Alma:</strong> {purchasing}</div>}
                                  {billing !== 'Atanmadı' && <div><strong className="text-success">Muhasebe:</strong> {billing}</div>}
                                </div>
                              </td>
                              <td>{new Date(t.created_at).toLocaleDateString('tr-TR')}</td>
                              <td>
                                <span className={getStatusLabelClass(t.status)}>
                                  {translateStatus(t.status)}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group">
                                  <button type="button" className="btn btn-sm btn-info-outline dropdown-toggle mr-10" data-toggle="dropdown">
                                    Durum Değiştir
                                  </button>
                                  <div className="dropdown-menu">
                                    <button className="dropdown-item" onClick={() => handleStatusChange(t.id, 'open')}>Açık / Yeni</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(t.id, 'in_progress')}>İşlemde</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(t.id, 'resolved')}>Çözüldü</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(t.id, 'closed')}>Kapatıldı</button>
                                  </div>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-danger-outline"
                                    onClick={() => handleDelete(t.id)}
                                  >
                                    <i className="fa fa-trash"></i> Sil
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View */}
                  <div className="d-block d-md-none">
                    {tickets.map((t) => {
                      const { tech, purchasing, billing, displayDesc } = getTicketRoles(t);
                      const isExpanded = expandedRowId === t.id;
                      return (
                        <div 
                          key={`mob-${t.id}`} 
                          className="box box-solid mb-10" 
                          style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}
                        >
                          <div 
                            className="box-header bg-white py-15 px-20 d-flex justify-content-between align-items-center"
                            style={{ cursor: 'pointer', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}
                            onClick={() => setExpandedRowId(isExpanded ? null : t.id)}
                          >
                            <div style={{ flex: 1, paddingRight: '10px' }}>
                              <h5 className="mb-0 font-weight-600 text-dark" style={{ fontSize: '15px', lineHeight: '1.4' }}>
                                #{t.id.slice(0, 4)} - {t.customers?.company_name || 'Müşteri Belirtilmedi'}
                              </h5>
                              <span className="font-size-11 text-muted mt-5 d-block">
                                Tarih: {new Date(t.created_at).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            <div className="d-flex align-items-center" style={{ gap: '8px', flexShrink: 0 }}>
                              <span className={getStatusLabelClass(t.status)}>
                                {translateStatus(t.status)}
                              </span>
                              <i className={`fa ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-muted ml-5`}></i>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="box-body bg-light-skin py-15 px-20" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                              <div className="mb-10">
                                <strong>Arıza Tanımı:</strong> {displayDesc}
                              </div>
                              {t.resolution_notes && (
                                <div className="mb-10 text-success">
                                  <strong>Çözüm Notu:</strong> {t.resolution_notes}
                                </div>
                              )}
                              <div className="mb-10">
                                <strong>Görevliler:</strong>
                                <div className="pl-10 mt-5">
                                  <div><strong className="text-danger">Teknisyen:</strong> {tech}</div>
                                  {purchasing !== 'Atanmadı' && <div><strong className="text-warning">Satın Alma:</strong> {purchasing}</div>}
                                  {billing !== 'Atanmadı' && <div><strong className="text-success">Muhasebe:</strong> {billing}</div>}
                                </div>
                              </div>
                              <div className="d-flex mt-15" style={{ gap: '10px' }}>
                                <div className="btn-group flex-grow-1">
                                  <button type="button" className="btn btn-sm btn-info-outline btn-block dropdown-toggle py-5" data-toggle="dropdown">
                                    Durum Değiştir
                                  </button>
                                  <div className="dropdown-menu dropdown-menu-right">
                                    <button className="dropdown-item" onClick={() => handleStatusChange(t.id, 'open')}>Açık / Yeni</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(t.id, 'in_progress')}>İşlemde</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(t.id, 'resolved')}>Çözüldü</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(t.id, 'closed')}>Kapatıldı</button>
                                  </div>
                                </div>
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-danger-outline btn-rounded flex-grow-1 py-5"
                                  onClick={() => handleDelete(t.id)}
                                >
                                  <i className="fa fa-trash"></i> Sil
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Çözüm Notu Giriş Modalı */}
      {showModal && selectedTicket && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Arıza Çözüm Detayı Girin</h5>
                <button type="button" className="close" onClick={() => setShowModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="modalNotes">Nasıl çözüldü? (Çözüm Notu) *</label>
                  <textarea
                    id="modalNotes"
                    rows={4}
                    className="form-control text-white"
                    placeholder="Yapılan teknik işlemler, değişen parçalar vb..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-rounded" onClick={() => setShowModal(false)}>İptal</button>
                <button type="button" className="btn btn-success btn-rounded" onClick={handleSaveResolution}>Çözüldü Olarak İşaretle</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
