import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode, mockData } from '../lib/supabase';
import { Link } from 'react-router-dom';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [staff, setStaff] = useState<any[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    if (isMockMode()) {
      const saved = localStorage.getItem('sb-mock-tasks');
      if (saved) {
        setTasks(JSON.parse(saved));
      } else {
        setTasks(mockData.tasks);
        localStorage.setItem('sb-mock-tasks', JSON.stringify(mockData.tasks));
      }
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, profiles(full_name), projects(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (e) {
      console.error("Görevler yüklenirken hata oluştu:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
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

  const getTaskRoles = (task: any) => {
    let primary = 'Atanmadı';
    let secondary = 'Atanmadı';
    let controller = 'Atanmadı';
    let displayDesc = task.description || '';

    if (task.assigned_to) {
      primary = staff.find(s => s.id === task.assigned_to)?.full_name || task.profiles?.full_name || 'Atanmadı';
    }

    if (task.description && task.description.startsWith('__METADATA__:')) {
      try {
        const parts = task.description.split('__\n');
        const metaStr = parts[0].replace('__METADATA__:', '');
        const meta = JSON.parse(metaStr);
        displayDesc = parts.slice(1).join('__\n');

        if (meta.secondary_assignee) {
          secondary = staff.find(s => s.id === meta.secondary_assignee)?.full_name || 'Atanmadı';
        }
        if (meta.controller_assignee) {
          controller = staff.find(s => s.id === meta.controller_assignee)?.full_name || 'Atanmadı';
        }
      } catch (e) {
        // ignore
      }
    }

    return { primary, secondary, controller, displayDesc };
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (isMockMode()) {
      const saved = localStorage.getItem('sb-mock-tasks');
      const list = saved ? JSON.parse(saved) : [...mockData.tasks];
      const updated = list.map((t: any) => t.id === taskId ? { ...t, status: newStatus } : t);
      localStorage.setItem('sb-mock-tasks', JSON.stringify(updated));
      mockData.tasks = mockData.tasks.map((t: any) => t.id === taskId ? { ...t, status: newStatus } : t);
      setTasks(updated);
      return;
    }
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
    } catch (e) {
      console.error("Görev güncellenirken hata oluştu:", e);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'badge bg-danger';
      case 'medium': return 'badge bg-warning';
      case 'low': return 'badge bg-info';
      default: return 'badge bg-secondary';
    }
  };

  const getStatusLabelClass = (status: string) => {
    switch (status) {
      case 'todo': return 'label label-danger';
      case 'in_progress': return 'label label-warning';
      case 'done': return 'label label-success';
      case 'approved': return 'label label-primary';
      default: return 'label label-secondary';
    }
  };

  const translatePriority = (priority: string) => {
    switch (priority) {
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return priority;
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'todo': return 'Yapılacak';
      case 'in_progress': return 'Devam Ediyor';
      case 'done': return 'Tamamlandı';
      case 'approved': return 'Onaylandı';
      default: return status;
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'todo') return t.status === 'todo';
    if (activeTab === 'in_progress') return t.status === 'in_progress';
    if (activeTab === 'done') return t.status === 'done' || t.status === 'approved';
    return true;
  });

  return (
    <Layout title="Görev Listesi">
      <div className="row">
        <div className="col-12">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Aktif İşler & Görevler</h4>
              <div className="box-controls pull-right">
                <Link to="/tasks/new" className="btn btn-sm btn-rounded btn-success">
                  <i className="fa fa-plus mr-5"></i> Yeni Görev Oluştur
                </Link>
              </div>
            </div>
            
            <div className="box-body">
              {/* Durum Filtreleme Tabları */}
              <div className="d-flex align-items-center mb-20 p-5 bg-lighter" style={{ borderRadius: '8px', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'all' ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => setActiveTab('all')}
                  style={{ borderRadius: '6px' }}
                >
                  Tümü
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'todo' ? 'btn-danger' : 'btn-outline-secondary'}`}
                  onClick={() => setActiveTab('todo')}
                  style={{ borderRadius: '6px' }}
                >
                  Yapılacak
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'in_progress' ? 'btn-warning' : 'btn-outline-secondary'}`}
                  onClick={() => setActiveTab('in_progress')}
                  style={{ borderRadius: '6px' }}
                >
                  Devam Ediyor
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'done' ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => setActiveTab('done')}
                  style={{ borderRadius: '6px' }}
                >
                  Tamamlandı / Onaylandı
                </button>
              </div>

              {loading ? (
                <div className="text-center py-40">
                  <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Yükleniyor...</span>
                  </div>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-40">
                  <p className="text-muted">Kriterlere uygun görev bulunamadı.</p>
                </div>
              ) : (
                <>
                  {/* Desktop View */}
                  <div className="table-responsive d-none d-md-block">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Görev Adı</th>
                          <th>Proje</th>
                          <th>Sorumlu</th>
                          <th>Son Tarih</th>
                          <th>Öncelik</th>
                          <th>Durum</th>
                          <th>Aksiyon</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTasks.map((task) => {
                          const { primary, secondary, controller, displayDesc } = getTaskRoles(task);
                          return (
                            <tr key={task.id}>
                              <td>
                                <strong>{task.title}</strong>
                                <small className="block text-muted" style={{ display: 'block', fontSize: '11px' }}>{displayDesc}</small>
                              </td>
                              <td>{task.projects?.name || task.project_id || 'Bağımsız'}</td>
                              <td>
                                <div className="font-size-12">
                                  <div><strong className="text-dark">Sorumlu:</strong> {primary}</div>
                                  {secondary !== 'Atanmadı' && <div><strong className="text-muted">Yardımcı:</strong> {secondary}</div>}
                                  {controller !== 'Atanmadı' && <div><strong className="text-success">Kontrol:</strong> {controller}</div>}
                                </div>
                              </td>
                              <td>{task.due_date ? new Date(task.due_date).toLocaleDateString('tr-TR') : 'Belirtilmedi'}</td>
                              <td>
                                <span className={getPriorityBadgeClass(task.priority)}>
                                  {translatePriority(task.priority)}
                                </span>
                              </td>
                              <td>
                                <span className={getStatusLabelClass(task.status)}>
                                  {translateStatus(task.status)}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group">
                                  <Link to={`/tasks/edit/${task.id}`} className="btn btn-sm btn-warning-outline mr-10 btn-rounded">
                                    <i className="fa fa-pencil"></i> Düzenle
                                  </Link>
                                  <button type="button" className="btn btn-sm btn-info-outline dropdown-toggle btn-rounded" data-toggle="dropdown">
                                    Durum Güncelle
                                  </button>
                                  <div className="dropdown-menu">
                                    <button className="dropdown-item" onClick={() => handleStatusChange(task.id, 'todo')}>Yapılacak</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(task.id, 'in_progress')}>Devam Ediyor</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(task.id, 'done')}>Tamamlandı</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(task.id, 'approved')}>Onaylandı</button>
                                  </div>
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
                    {filteredTasks.map((task) => {
                      const { primary, secondary, controller, displayDesc } = getTaskRoles(task);
                      const isExpanded = expandedRowId === task.id;
                      return (
                        <div 
                          key={`mob-${task.id}`} 
                          className="box box-solid mb-10" 
                          style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}
                        >
                          <div 
                            className="box-header bg-white py-15 px-20 d-flex justify-content-between align-items-center"
                            style={{ cursor: 'pointer', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}
                            onClick={() => setExpandedRowId(isExpanded ? null : task.id)}
                          >
                            <div style={{ flex: 1, paddingRight: '10px' }}>
                              <h5 className="mb-0 font-weight-600 text-dark" style={{ fontSize: '15px', lineHeight: '1.4' }}>
                                {task.title}
                              </h5>
                              <span className="font-size-11 text-muted mt-5 d-block">
                                Proje: {task.projects?.name || task.project_id || 'Bağımsız'}
                              </span>
                            </div>
                            <div className="d-flex align-items-center" style={{ gap: '8px', flexShrink: 0 }}>
                              <span className={getPriorityBadgeClass(task.priority)}>
                                {translatePriority(task.priority)}
                              </span>
                              <span className={getStatusLabelClass(task.status)}>
                                {translateStatus(task.status)}
                              </span>
                              <i className={`fa ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-muted ml-5`}></i>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="box-body bg-light-skin py-15 px-20" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                              {displayDesc && (
                                <div className="mb-10 text-muted">
                                  <strong>Açıklama:</strong> {displayDesc}
                                </div>
                              )}
                              <div className="mb-10">
                                <strong>Atanan Ekip:</strong>
                                <div className="pl-10 mt-5">
                                  <div><strong className="text-dark">Sorumlu:</strong> {primary}</div>
                                  {secondary !== 'Atanmadı' && <div><strong className="text-muted">Yardımcı:</strong> {secondary}</div>}
                                  {controller !== 'Atanmadı' && <div><strong className="text-success">Kontrol:</strong> {controller}</div>}
                                </div>
                              </div>
                              <div className="mb-10">
                                <strong>Son Tarih:</strong> {task.due_date ? new Date(task.due_date).toLocaleDateString('tr-TR') : 'Belirtilmedi'}
                              </div>
                              <div className="d-flex mt-15" style={{ gap: '10px' }}>
                                <Link to={`/tasks/edit/${task.id}`} className="btn btn-sm btn-warning-outline btn-rounded flex-grow-1 text-center py-5">
                                  <i className="fa fa-pencil"></i> Düzenle
                                </Link>
                                <div className="btn-group flex-grow-1">
                                  <button type="button" className="btn btn-sm btn-info-outline btn-rounded btn-block dropdown-toggle py-5" data-toggle="dropdown">
                                    Durum Güncelle
                                  </button>
                                  <div className="dropdown-menu dropdown-menu-right">
                                    <button className="dropdown-item" onClick={() => handleStatusChange(task.id, 'todo')}>Yapılacak</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(task.id, 'in_progress')}>Devam Ediyor</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(task.id, 'done')}>Tamamlandı</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(task.id, 'approved')}>Onaylandı</button>
                                  </div>
                                </div>
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
    </Layout>
  );
};
