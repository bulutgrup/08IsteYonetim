import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode, mockData, addNotification } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const ProjectForm: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignedPm, setAssignedPm] = useState('');
  const [assignedTech, setAssignedTech] = useState('');
  const [assignedFinance, setAssignedFinance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    const loadStaff = async () => {
      const savedStaff = localStorage.getItem('sb-mock-personnel');
      const localList = savedStaff ? JSON.parse(savedStaff) : [
        { id: '1', full_name: 'Ahmet Karaca', is_active: true },
        { id: '2', full_name: 'Mehmet Yılmaz', is_active: true },
        { id: '3', full_name: 'Ali BOLAT', is_active: true },
        { id: '4', full_name: 'Emre KINACI', is_active: false }
      ];

      if (isMockMode()) {
        setStaff(localList.filter((p: any) => p.is_active));
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

        setStaff(mergedList.filter((p: any) => p.is_active !== false));
      } catch (e) {
        console.error("Personel yüklenemedi:", e);
        setStaff(localList.filter((p: any) => p.is_active));
      }
    };
    loadStaff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const meta = {
      assigned_pm: assignedPm || null,
      assigned_tech: assignedTech || null,
      assigned_finance: assignedFinance || null
    };
    const finalDescription = `__METADATA__:${JSON.stringify(meta)}__\n${description}`;

    if (isMockMode()) {
      if (!mockData.projects) mockData.projects = [];
      const newProjectId = String(mockData.projects.length + 1);
      mockData.projects.push({
        id: newProjectId,
        name,
        description: finalDescription,
        status,
        start_date: startDate,
        end_date: endDate
      });

      // Local storage updates
      localStorage.setItem('sb-mock-projects', JSON.stringify(mockData.projects));

      // Notifications
      const projectTitleText = `Proje: "${name}"`;
      if (assignedPm) {
        addNotification('Proje Yöneticisi Atandı', `${projectTitleText} projesinde Proje Yöneticisi olarak atandınız.`, 'fa fa-shield text-info', '/projects');
      }
      if (assignedTech) {
        addNotification('Teknik Sorumlu Atandı', `${projectTitleText} projesinde Teknik Sorumlu olarak atandınız.`, 'fa fa-code text-warning', '/projects');
      }
      if (assignedFinance) {
        addNotification('Finans Sorumlusu Atandı', `${projectTitleText} projesinde Finans Sorumlusu olarak atandınız.`, 'fa fa-try text-success', '/projects');
      }

      setTimeout(() => {
        setLoading(false);
        navigate('/projects');
      }, 1000);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum açmış kullanıcı bulunamadı!");

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error("Kullanıcı profili yüklenemedi!");

      const { error } = await supabase
        .from('projects')
        .insert({
          tenant_id: profile.tenant_id,
          name,
          description: finalDescription,
          status,
          start_date: startDate || null,
          end_date: endDate || null
        });

      if (error) throw error;

      // Notifications
      const projectTitleText = `Proje: "${name}"`;
      if (assignedPm) {
        addNotification('Proje Yöneticisi Atandı', `${projectTitleText} projesinde Proje Yöneticisi olarak atandınız.`, 'fa fa-shield text-info', '/projects');
      }
      if (assignedTech) {
        addNotification('Teknik Sorumlu Atandı', `${projectTitleText} projesinde Teknik Sorumlu olarak atandınız.`, 'fa fa-code text-warning', '/projects');
      }
      if (assignedFinance) {
        addNotification('Finans Sorumlusu Atandı', `${projectTitleText} projesinde Finans Sorumlusu olarak atandınız.`, 'fa fa-try text-success', '/projects');
      }

      navigate('/projects');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Proje oluşturulurken bir hata oluştu.');
      setLoading(false);
    }
  };

  return (
    <Layout title="Proje Oluştur">
      <div className="row">
        <div className="col-12 col-lg-8">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Yeni Proje Bilgileri</h4>
            </div>
            
            <div className="box-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="form-element">
                <div className="form-group">
                  <label htmlFor="projectName">Proje Adı *</label>
                  <input
                    type="text"
                    id="projectName"
                    className="form-control"
                    placeholder="Örn: E-Ticaret Entegrasyonu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="projectDesc">Açıklama</label>
                  <textarea
                    id="projectDesc"
                    rows={4}
                    className="form-control"
                    placeholder="Proje kapsamını detaylıca yazın..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>

                <div className="row">
                  <div className="col-md-4 col-12">
                    <div className="form-group">
                      <label htmlFor="pmSelect">Proje Yöneticisi (PM)</label>
                      <select
                        id="pmSelect"
                        className="form-control"
                        value={assignedPm}
                        onChange={(e) => setAssignedPm(e.target.value)}
                      >
                        <option value="">Seçiniz...</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-4 col-12">
                    <div className="form-group">
                      <label htmlFor="techSelect">Teknik Sorumlu</label>
                      <select
                        id="techSelect"
                        className="form-control"
                        value={assignedTech}
                        onChange={(e) => setAssignedTech(e.target.value)}
                      >
                        <option value="">Seçiniz...</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-4 col-12">
                    <div className="form-group">
                      <label htmlFor="financeSelect">Finans Sorumlusu</label>
                      <select
                        id="financeSelect"
                        className="form-control"
                        value={assignedFinance}
                        onChange={(e) => setAssignedFinance(e.target.value)}
                      >
                        <option value="">Seçiniz...</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4 col-12">
                    <div className="form-group">
                      <label htmlFor="projectStatus">Durum</label>
                      <select
                        id="projectStatus"
                        className="form-control"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="active">Aktif</option>
                        <option value="pending">Beklemede</option>
                        <option value="completed">Tamamlandı</option>
                        <option value="archived">Arşivlendi</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-4 col-12">
                    <div className="form-group">
                      <label htmlFor="startDate">Başlangıç Tarihi</label>
                      <input
                        type="date"
                        id="startDate"
                        className="form-control"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-4 col-12">
                    <div className="form-group">
                      <label htmlFor="endDate">Bitiş Tarihi</label>
                      <input
                        type="date"
                        id="endDate"
                        className="form-control"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="box-footer" style={{ paddingLeft: 0, paddingRight: 0, background: 'transparent' }}>
                  <button
                    type="submit"
                    className="btn btn-rounded btn-success font-weight-600 px-30"
                    disabled={loading}
                  >
                    {loading ? 'Proje Oluşturuluyor...' : 'Proje Oluştur'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-rounded btn-outline-secondary ml-10 px-30"
                    onClick={() => navigate('/projects')}
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
