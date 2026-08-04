import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode, mockData } from '../lib/supabase';
import { Link } from 'react-router-dom';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    if (isMockMode()) {
      setCustomers(mockData.customers || []);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('company_name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (e) {
      console.error("Müşteriler yüklenirken hata oluştu:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (customerId: string) => {
    if (!window.confirm("Bu müşteriyi silmek istediğinizden emin misiniz?")) return;
    
    if (isMockMode()) {
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      return;
    }
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;
      fetchCustomers();
    } catch (e) {
      console.error("Müşteri silinirken hata oluştu:", e);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <Layout title="Müşteri Listesi">
      <div className="row">
        <div className="col-12">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Müşteriler & Cari Hesaplar</h4>
              <div className="box-controls pull-right">
                <Link to="/customers/new" className="btn btn-sm btn-rounded btn-success">
                  <i className="fa fa-plus mr-5"></i> Yeni Müşteri Ekle
                </Link>
              </div>
            </div>
            
            <div className="box-body">
              <div className="form-group col-md-4 col-12 pl-0 mb-20">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Müşteri adı, yetkili veya telefona göre ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="text-center py-40">
                  <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Yükleniyor...</span>
                  </div>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-40">
                  <p className="text-muted">Arama kriterine uygun müşteri bulunamadı.</p>
                </div>
              ) : (
                <>
                  {/* Desktop View */}
                  <div className="table-responsive d-none d-md-block">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Firma / Müşteri Adı</th>
                          <th>Yetkili Kişi</th>
                          <th>E-posta</th>
                          <th>Telefon</th>
                          <th>Adres</th>
                          <th style={{ width: '120px' }}>Aksiyon</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.map((customer) => (
                          <tr key={customer.id}>
                            <td><strong>{customer.company_name}</strong></td>
                            <td>{customer.contact_name || '-'}</td>
                            <td>{customer.email || '-'}</td>
                            <td>{customer.phone || '-'}</td>
                            <td>
                              <small className="text-muted" style={{ display: 'block', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {customer.address || '-'}
                              </small>
                            </td>
                            <td>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-danger-outline btn-rounded"
                                onClick={() => handleDelete(customer.id)}
                              >
                                <i className="fa fa-trash"></i> Sil
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View */}
                  <div className="d-block d-md-none">
                    {filteredCustomers.map((customer) => {
                      const isExpanded = expandedRowId === customer.id;
                      return (
                        <div 
                          key={`mob-${customer.id}`} 
                          className="box box-solid mb-10" 
                          style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}
                        >
                          <div 
                            className="box-header bg-white py-15 px-20 d-flex justify-content-between align-items-center"
                            style={{ cursor: 'pointer', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}
                            onClick={() => setExpandedRowId(isExpanded ? null : customer.id)}
                          >
                            <div style={{ flex: 1, paddingRight: '10px' }}>
                              <h5 className="mb-0 font-weight-600 text-dark" style={{ fontSize: '15px', lineHeight: '1.4' }}>
                                {customer.company_name}
                              </h5>
                              {customer.contact_name && (
                                <span className="font-size-11 text-muted mt-5 d-block">
                                  Yetkili: {customer.contact_name}
                                </span>
                              )}
                            </div>
                            <div className="d-flex align-items-center" style={{ gap: '8px', flexShrink: 0 }}>
                              <i className={`fa ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-muted ml-5`}></i>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="box-body bg-light-skin py-15 px-20" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                              <div className="mb-10">
                                <strong>E-posta:</strong> {customer.email || '-'}
                              </div>
                              <div className="mb-10">
                                <strong>Telefon:</strong> {customer.phone || '-'}
                              </div>
                              <div className="mb-10">
                                <strong>Adres:</strong> {customer.address || '-'}
                              </div>
                              <div className="d-flex mt-15" style={{ gap: '10px' }}>
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-danger-outline btn-rounded btn-block py-5"
                                  onClick={() => handleDelete(customer.id)}
                                >
                                  <i className="fa fa-trash"></i> Müşteriyi Sil
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
