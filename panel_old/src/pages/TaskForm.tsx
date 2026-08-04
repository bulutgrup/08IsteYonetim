import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode, mockData, addNotification } from '../lib/supabase';
import { useNavigate, useParams } from 'react-router-dom';

export const TaskForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [secondaryAssignee, setSecondaryAssignee] = useState('');
  const [controllerAssignee, setControllerAssignee] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    const loadFormOptions = async () => {
      const savedStaff = localStorage.getItem('sb-mock-personnel');
      const localList = savedStaff ? JSON.parse(savedStaff) : [
        { id: '1', full_name: 'Ahmet Karaca', is_active: true },
        { id: '2', full_name: 'Mehmet Yılmaz', is_active: true },
        { id: '3', full_name: 'Ali BOLAT', is_active: true },
        { id: '4', full_name: 'Emre KINACI', is_active: false }
      ];

      if (isMockMode()) {
        setStaff(localList.filter((p: any) => p.is_active));
        setProjects(mockData.projects);
        return;
      }
      try {
        const [projRes, profileRes] = await Promise.all([
          supabase.from('projects').select('id, name'),
          supabase.from('profiles').select('id, full_name, is_active')
        ]);

        if (projRes.data) setProjects(projRes.data);

        const dbList = profileRes.data || [];
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
        console.error("Form opsiyonları yüklenirken hata oluştu:", e);
        setStaff(localList.filter((p: any) => p.is_active));
      }
    };
    loadFormOptions();
  }, []);

  useEffect(() => {
    const loadTaskDetails = async () => {
      if (!id) return;
      if (isMockMode()) {
        const saved = localStorage.getItem('sb-mock-tasks');
        const tasksList = saved ? JSON.parse(saved) : mockData.tasks;
        const task = tasksList.find((t: any) => t.id === id);
        if (task) {
          setTitle(task.title || '');
          let desc = task.description || '';
          if (desc.startsWith('__METADATA__:')) {
            try {
              const parts = desc.split('__\n');
              const metaStr = parts[0].replace('__METADATA__:', '');
              const meta = JSON.parse(metaStr);
              desc = parts.slice(1).join('__\n');
              setSecondaryAssignee(meta.secondary_assignee || '');
              setControllerAssignee(meta.controller_assignee || '');
            } catch (e) {
              console.error(e);
            }
          }
          setDescription(desc);
          setProjectId(task.project_id || '');
          setAssignedTo(task.assigned_to || '');
          setPriority(task.priority || 'medium');
          setDueDate(task.due_date || '');
        }
        return;
      }
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        if (data) {
          setTitle(data.title || '');
          let desc = data.description || '';
          if (desc.startsWith('__METADATA__:')) {
            try {
              const parts = desc.split('__\n');
              const metaStr = parts[0].replace('__METADATA__:', '');
              const meta = JSON.parse(metaStr);
              desc = parts.slice(1).join('__\n');
              setSecondaryAssignee(meta.secondary_assignee || '');
              setControllerAssignee(meta.controller_assignee || '');
            } catch (e) {
              console.error(e);
            }
          }
          setDescription(desc);
          setProjectId(data.project_id || '');
          setAssignedTo(data.assigned_to || '');
          setPriority(data.priority || 'medium');
          setDueDate(data.due_date || '');
        }
      } catch (e) {
        console.error("Görev detayları yüklenirken hata oluştu:", e);
      }
    };
    loadTaskDetails();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const meta = {
      secondary_assignee: secondaryAssignee || null,
      controller_assignee: controllerAssignee || null
    };
    const finalDescription = `__METADATA__:${JSON.stringify(meta)}__\n${description}`;

    if (isMockMode()) {
      const saved = localStorage.getItem('sb-mock-tasks');
      let tasksList = saved ? JSON.parse(saved) : [...mockData.tasks];
      const targetId = isEditMode ? id : String(tasksList.length + 1);

      if (isEditMode) {
        tasksList = tasksList.map((t: any) => 
          t.id === id ? { ...t, title, description: finalDescription, project_id: projectId, assigned_to: assignedTo, priority, due_date: dueDate } : t
        );
        mockData.tasks = mockData.tasks.map((t: any) =>
          t.id === id ? { ...t, title, description: finalDescription, project_id: projectId, assigned_to: assignedTo, priority, due_date: dueDate } : t
        );
      } else {
        const newT = {
          id: targetId,
          title,
          description: finalDescription,
          project_id: projectId,
          assigned_to: assignedTo,
          status: 'todo',
          priority,
          due_date: dueDate
        };
        tasksList.unshift(newT);
        mockData.tasks.unshift(newT);
      }

      localStorage.setItem('sb-mock-tasks', JSON.stringify(tasksList));

      const taskTitleText = `Görev: "${title}"`;
      if (assignedTo) {
        addNotification(
          isEditMode ? 'Görev Güncellendi' : 'Yeni Görev Atandı',
          `${taskTitleText} görevinde Sorumlu Personel olarak atandınız.`,
          'fa fa-tasks text-info',
          `/tasks/edit/${targetId}`
        );
      }
      if (secondaryAssignee) {
        addNotification(
          'Yardımcı Personel Görevi',
          `${taskTitleText} görevinde Yardımcı Personel olarak atandınız.`,
          'fa fa-user-plus text-warning',
          `/tasks/edit/${targetId}`
        );
      }
      if (controllerAssignee) {
        addNotification(
          'Görev Kontrol Yetkisi',
          `${taskTitleText} görevinin Kontrol yetkilisi olarak atandınız.`,
          'fa fa-check-square-o text-success',
          `/tasks/edit/${targetId}`
        );
      }

      setTimeout(() => {
        setLoading(false);
        navigate('/tasks');
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

      if (isEditMode) {
        const { error } = await supabase
          .from('tasks')
          .update({
            project_id: projectId || null,
            title,
            description: finalDescription,
            assigned_to: assignedTo || null,
            priority,
            due_date: dueDate || null
          })
          .eq('id', id);

        if (error) throw error;

        const taskTitleText = `Görev: "${title}"`;
        if (assignedTo) {
          addNotification('Görev Güncellendi', `${taskTitleText} görevinde Sorumlu Personel olarak atandınız.`, 'fa fa-tasks text-info', `/tasks/edit/${id}`);
        }
        if (secondaryAssignee) {
          addNotification('Görev Güncellendi', `Yardımcı olduğunuz ${taskTitleText} görevi güncellendi.`, 'fa fa-user-plus text-warning', `/tasks/edit/${id}`);
        }
        if (controllerAssignee) {
          addNotification('Görev Güncellendi', `Kontrol yetkilisi olduğunuz ${taskTitleText} görevi güncellendi.`, 'fa fa-check-square-o text-success', `/tasks/edit/${id}`);
        }
      } else {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            tenant_id: profile.tenant_id,
            project_id: projectId || null,
            title,
            description: finalDescription,
            assigned_to: assignedTo || null,
            status: 'todo',
            priority,
            due_date: dueDate || null
          })
          .select('id')
          .single();

        if (error) throw error;

        if (data?.id) {
          const taskTitleText = `Görev: "${title}"`;
          if (assignedTo) {
            addNotification('Yeni Görev Atandı', `${taskTitleText} görevinde Sorumlu Personel olarak atandınız.`, 'fa fa-tasks text-info', `/tasks/edit/${data.id}`);
          }
          if (secondaryAssignee) {
            addNotification('Yardımcı Personel Görevi', `${taskTitleText} görevinde Yardımcı Personel olarak atandınız.`, 'fa fa-user-plus text-warning', `/tasks/edit/${data.id}`);
          }
          if (controllerAssignee) {
            addNotification('Görev Kontrol Yetkisi', `${taskTitleText} görevinin Kontrol yetkilisi olarak atandınız.`, 'fa fa-check-square-o text-success', `/tasks/edit/${data.id}`);
          }
        }
      }

      navigate('/tasks');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Görev kaydedilirken bir hata oluştu.');
      setLoading(false);
    }
  };

  return (
    <Layout title={isEditMode ? "Görev Düzenle" : "Görev Oluştur"}>
      <div className="row">
        <div className="col-12 col-lg-8">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Yeni Görev Bilgileri</h4>
            </div>
            
            <div className="box-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="form-element">
                <div className="form-group">
                  <label htmlFor="taskTitle">Görev Başlığı / Sipariş Adı *</label>
                  <input
                    type="text"
                    id="taskTitle"
                    className="form-control"
                    placeholder="Örn: Otantik Kumpir Teklif Hazırlama"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="taskDesc">Görev Açıklaması</label>
                  <textarea
                    id="taskDesc"
                    rows={4}
                    className="form-control"
                    placeholder="Görev ile ilgili detaylı notları buraya girin..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>

                <div className="row">
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="projectSelect">İlişkili Proje</label>
                      <select
                        id="projectSelect"
                        className="form-control"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                      >
                        <option value="">Bağımsız (Proje Yok)</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="staffSelect">Sorumlu Personel</label>
                      <select
                        id="staffSelect"
                        className="form-control"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                      >
                        <option value="">Atanmadı</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="secondaryStaffSelect">Yardımcı Personel</label>
                      <select
                        id="secondaryStaffSelect"
                        className="form-control"
                        value={secondaryAssignee}
                        onChange={(e) => setSecondaryAssignee(e.target.value)}
                      >
                        <option value="">Seçiniz (Varsa)</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="controllerStaffSelect">Kontrol Eden Yetkili</label>
                      <select
                        id="controllerStaffSelect"
                        className="form-control"
                        value={controllerAssignee}
                        onChange={(e) => setControllerAssignee(e.target.value)}
                      >
                        <option value="">Seçiniz (Varsa)</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="prioritySelect">Öncelik Derecesi</label>
                      <select
                        id="prioritySelect"
                        className="form-control"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                      >
                        <option value="low">Düşük</option>
                        <option value="medium">Orta</option>
                        <option value="high">Yüksek</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label htmlFor="dueDate">Son Teslim Tarihi</label>
                      <input
                        type="date"
                        id="dueDate"
                        className="form-control"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
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
                    {loading ? (isEditMode ? 'Güncelleniyor...' : 'Görev Oluşturuluyor...') : (isEditMode ? 'Görevi Güncelle' : 'Görev Oluştur')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-rounded btn-outline-secondary ml-10 px-30"
                    onClick={() => navigate('/tasks')}
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
