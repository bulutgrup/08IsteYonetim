import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode, mockData } from '../lib/supabase';
import { Link } from 'react-router-dom';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    if (isMockMode()) {
      const saved = localStorage.getItem('sb-mock-projects');
      if (saved) {
        setProjects(JSON.parse(saved));
      } else {
        setProjects(mockData.projects || []);
        localStorage.setItem('sb-mock-projects', JSON.stringify(mockData.projects || []));
      }
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (e) {
      console.error("Projeler yüklenirken hata oluştu:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
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

  const getProjectRoles = (project: any) => {
    let pm = 'Atanmadı';
    let tech = 'Atanmadı';
    let finance = 'Atanmadı';
    let displayDesc = project.description || '';

    if (project.description && project.description.startsWith('__METADATA__:')) {
      try {
        const parts = project.description.split('__\n');
        const metaStr = parts[0].replace('__METADATA__:', '');
        const meta = JSON.parse(metaStr);
        displayDesc = parts.slice(1).join('__\n');

        if (meta.assigned_pm) {
          pm = staff.find(s => s.id === meta.assigned_pm)?.full_name || 'Atanmadı';
        }
        if (meta.assigned_tech) {
          tech = staff.find(s => s.id === meta.assigned_tech)?.full_name || 'Atanmadı';
        }
        if (meta.assigned_finance) {
          finance = staff.find(s => s.id === meta.assigned_finance)?.full_name || 'Atanmadı';
        }
      } catch (e) {
        // ignore
      }
    }

    return { pm, tech, finance, displayDesc };
  };

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    if (isMockMode()) {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
      return;
    }
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (error) throw error;
      fetchProjects();
    } catch (e) {
      console.error("Proje güncellenirken hata oluştu:", e);
    }
  };

  const getStatusLabelClass = (status: string) => {
    switch (status) {
      case 'active': return 'label label-success';
      case 'pending': return 'label label-warning';
      case 'completed': return 'label label-primary';
      case 'archived': return 'label label-secondary';
      default: return 'label label-secondary';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'pending': return 'Beklemede';
      case 'completed': return 'Tamamlandı';
      case 'archived': return 'Arşivlendi';
      default: return status;
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm("Bu projeyi silmek istediğinizden emin misiniz?")) return;
    
    if (isMockMode()) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      return;
    }
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      fetchProjects();
    } catch (e) {
      console.error("Proje silinirken hata oluştu:", e);
    }
  };

  return (
    <Layout title="Proje Listesi">
      <div className="row">
        <div className="col-12">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Tüm Projeler</h4>
              <div className="box-controls pull-right">
                <Link to="/projects/new" className="btn btn-sm btn-rounded btn-success">
                  <i className="fa fa-plus mr-5"></i> Yeni Proje Oluştur
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
              ) : projects.length === 0 ? (
                <div className="text-center py-40">
                  <p className="text-muted">Herhangi bir proje bulunamadı.</p>
                </div>
              ) : (
                <>
                  {/* Desktop View */}
                  <div className="table-responsive d-none d-md-block">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Proje Adı</th>
                          <th>Görevliler</th>
                          <th>Başlangıç Tarihi</th>
                          <th>Bitiş Tarihi</th>
                          <th>Durum</th>
                          <th style={{ width: '250px' }}>Aksiyon</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map((project) => {
                          const { pm, tech, finance, displayDesc } = getProjectRoles(project);
                          return (
                            <tr key={project.id}>
                              <td>
                                <strong>{project.name}</strong>
                                <small className="block text-muted" style={{ display: 'block', fontSize: '11px' }}>{displayDesc}</small>
                              </td>
                              <td>
                                <div className="font-size-12">
                                  <div><strong className="text-danger">PM (Yönetici):</strong> {pm}</div>
                                  {tech !== 'Atanmadı' && <div><strong className="text-warning">Teknik Sorumlu:</strong> {tech}</div>}
                                  {finance !== 'Atanmadı' && <div><strong className="text-success">Finans Sorumlu:</strong> {finance}</div>}
                                </div>
                              </td>
                              <td>{project.start_date ? new Date(project.start_date).toLocaleDateString('tr-TR') : 'Belirtilmedi'}</td>
                              <td>{project.end_date ? new Date(project.end_date).toLocaleDateString('tr-TR') : 'Belirtilmedi'}</td>
                              <td>
                                <span className={getStatusLabelClass(project.status)}>
                                  {translateStatus(project.status)}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group">
                                  <button type="button" className="btn btn-sm btn-info-outline dropdown-toggle mr-10" data-toggle="dropdown">
                                    Durum Değiştir
                                  </button>
                                  <div className="dropdown-menu">
                                    <button className="dropdown-item" onClick={() => handleStatusChange(project.id, 'active')}>Aktif</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(project.id, 'pending')}>Beklemede</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(project.id, 'completed')}>Tamamlandı</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(project.id, 'archived')}>Arşivlendi</button>
                                  </div>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-danger-outline"
                                    onClick={() => handleDelete(project.id)}
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
                    {projects.map((project) => {
                      const { pm, tech, finance, displayDesc } = getProjectRoles(project);
                      const isExpanded = expandedRowId === project.id;
                      return (
                        <div 
                          key={`mob-${project.id}`} 
                          className="box box-solid mb-10" 
                          style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}
                        >
                          <div 
                            className="box-header bg-white py-15 px-20 d-flex justify-content-between align-items-center"
                            style={{ cursor: 'pointer', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}
                            onClick={() => setExpandedRowId(isExpanded ? null : project.id)}
                          >
                            <div style={{ flex: 1, paddingRight: '10px' }}>
                              <h5 className="mb-0 font-weight-600 text-dark" style={{ fontSize: '15px', lineHeight: '1.4' }}>
                                {project.name}
                              </h5>
                              <span className="font-size-11 text-muted mt-5 d-block">
                                Bitiş: {project.end_date ? new Date(project.end_date).toLocaleDateString('tr-TR') : 'Belirtilmedi'}
                              </span>
                            </div>
                            <div className="d-flex align-items-center" style={{ gap: '8px', flexShrink: 0 }}>
                              <span className={getStatusLabelClass(project.status)}>
                                {translateStatus(project.status)}
                              </span>
                              <i className={`fa ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-muted ml-5`}></i>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="box-body bg-light-skin py-15 px-20" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                              <div className="mb-10">
                                <strong>Proje Açıklaması:</strong> {displayDesc}
                              </div>
                              <div className="mb-10">
                                <strong>Görevliler:</strong>
                                <div className="pl-10 mt-5">
                                  <div><strong className="text-danger">PM (Yönetici):</strong> {pm}</div>
                                  {tech !== 'Atanmadı' && <div><strong className="text-warning">Teknik Sorumlu:</strong> {tech}</div>}
                                  {finance !== 'Atanmadı' && <div><strong className="text-success">Finans Sorumlu:</strong> {finance}</div>}
                                </div>
                              </div>
                              <div className="mb-10">
                                <strong>Başlangıç:</strong> {project.start_date ? new Date(project.start_date).toLocaleDateString('tr-TR') : 'Belirtilmedi'}
                              </div>
                              <div className="mb-10">
                                <strong>Bitiş:</strong> {project.end_date ? new Date(project.end_date).toLocaleDateString('tr-TR') : 'Belirtilmedi'}
                              </div>
                              <div className="d-flex mt-15" style={{ gap: '10px' }}>
                                <div className="btn-group flex-grow-1">
                                  <button type="button" className="btn btn-sm btn-info-outline btn-block dropdown-toggle py-5" data-toggle="dropdown">
                                    Durum Değiştir
                                  </button>
                                  <div className="dropdown-menu dropdown-menu-right">
                                    <button className="dropdown-item" onClick={() => handleStatusChange(project.id, 'active')}>Aktif</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(project.id, 'pending')}>Beklemede</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(project.id, 'completed')}>Tamamlandı</button>
                                    <button className="dropdown-item" onClick={() => handleStatusChange(project.id, 'archived')}>Arşivlendi</button>
                                  </div>
                                </div>
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-danger-outline btn-rounded flex-grow-1 py-5"
                                  onClick={() => handleDelete(project.id)}
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
    </Layout>
  );
};
