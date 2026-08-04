import React from 'react';
import { Layout } from '../components/Layout';

export const FAQ: React.FC = () => {
  return (
    <Layout title="Sıkça Sorulan Sorular (S.S.S.)">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Sıkça Sorulan Sorular</h4>
              <p className="text-muted mb-0">İşteYönetim platformu hakkında en çok merak edilen konular ve yanıtları.</p>
            </div>
            <div className="box-body">
              <div className="accordion" id="faqAccordion">
                
                {/* Soru 1 */}
                <div className="card mb-15 style-none" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                  <div className="card-header bg-white py-15 px-20" id="headingOne" style={{ borderBottom: 'none', cursor: 'pointer' }} data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                    <h5 className="mb-0 font-weight-600 text-dark flexbox">
                      <span><i className="fa fa-question-circle text-success mr-10 font-size-18"></i> İşteYönetim Nedir ve Ne İşe Yarar?</span>
                      <i className="fa fa-chevron-down font-size-12 text-muted"></i>
                    </h5>
                  </div>
                  <div id="collapseOne" className="collapse show" aria-labelledby="headingOne" data-parent="#faqAccordion">
                    <div className="card-body bg-light-skin py-15 px-20 text-muted border-top" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      İşteYönetim, işletmelerin projelerini, görevlerini, cari hesaplarını (müşterilerini), tekliflerini, teknik servis kayıtlarını ve tüm gelir-gider finansal süreçlerini tek bir panelden yönetebilmesini sağlayan multi-tenant bulut tabanlı (SaaS) bir iş yönetim platformudur.
                    </div>
                  </div>
                </div>

                {/* Soru 2 */}
                <div className="card mb-15 style-none" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                  <div className="card-header bg-white py-15 px-20 collapsed" id="headingTwo" style={{ borderBottom: 'none', cursor: 'pointer' }} data-toggle="collapse" data-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                    <h5 className="mb-0 font-weight-600 text-dark flexbox">
                      <span><i className="fa fa-question-circle text-success mr-10 font-size-18"></i> Personel Atamaları ve Görev Yönetimi Nasıl Yapılır?</span>
                      <i className="fa fa-chevron-down font-size-12 text-muted"></i>
                    </h5>
                  </div>
                  <div id="collapseTwo" className="collapse" aria-labelledby="headingTwo" data-parent="#faqAccordion">
                    <div className="card-body bg-light-skin py-15 px-20 text-muted border-top" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      Sistem Ayarları &gt; Personel Yönetimi menüsünden ekibinizi tanımlayabilirsiniz. Personel eklendikten sonra Görev Paneli'nden görev oluştururken "Birincil Sorumlu", "Yardımcı Personel" veya "Kontrol Eden" olarak bu personelleri kolayca seçebilir ve atamalarını gerçekleştirebilirsiniz.
                    </div>
                  </div>
                </div>

                {/* Soru 3 */}
                <div className="card mb-15 style-none" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                  <div className="card-header bg-white py-15 px-20 collapsed" id="headingThree" style={{ borderBottom: 'none', cursor: 'pointer' }} data-toggle="collapse" data-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                    <h5 className="mb-0 font-weight-600 text-dark flexbox">
                      <span><i className="fa fa-question-circle text-success mr-10 font-size-18"></i> Finansal Gelir & Gider Takibi Nasıl Çalışır?</span>
                      <i className="fa fa-chevron-down font-size-12 text-muted"></i>
                    </h5>
                  </div>
                  <div id="collapseThree" className="collapse" aria-labelledby="headingThree" data-parent="#faqAccordion">
                    <div className="card-body bg-light-skin py-15 px-20 text-muted border-top" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      Finans Paneli altından yeni banka, nakit, çek veya fatura işlemlerini ekleyebilirsiniz. Gelirler yeşil, giderler kırmızı renk kodlarıyla listelenir. Bu hareketler Giriş Paneli'ndeki (Dashboard) kasa net bakiye durumunu, aylık mali raporları ve gelir dağılım grafiklerini otomatik olarak canlı besler.
                    </div>
                  </div>
                </div>

                {/* Soru 4 */}
                <div className="card mb-15 style-none" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                  <div className="card-header bg-white py-15 px-20 collapsed" id="headingFour" style={{ borderBottom: 'none', cursor: 'pointer' }} data-toggle="collapse" data-target="#collapseFour" aria-expanded="false" aria-controls="collapseFour">
                    <h5 className="mb-0 font-weight-600 text-dark flexbox">
                      <span><i className="fa fa-question-circle text-success mr-10 font-size-18"></i> Teknik Servis / Arıza Kaydı Takibi Nasıl Yapılır?</span>
                      <i className="fa fa-chevron-down font-size-12 text-muted"></i>
                    </h5>
                  </div>
                  <div id="collapseFour" className="collapse" aria-labelledby="headingFour" data-parent="#faqAccordion">
                    <div className="card-body bg-light-skin py-15 px-20 text-muted border-top" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      Teknik Servis Paneli'nden müşterilerinizden gelen arıza bildirimlerini kaydedip teknisyen personellerinize atayabilirsiniz. Arıza çözüldüğünde kaydı "Çözüldü" durumuna alırken çözüm notlarınızı girerek geçmiş arıza çözümlerini arşivleyebilirsiniz.
                    </div>
                  </div>
                </div>

                {/* Soru 5 */}
                <div className="card mb-15 style-none" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                  <div className="card-header bg-white py-15 px-20 collapsed" id="headingFive" style={{ borderBottom: 'none', cursor: 'pointer' }} data-toggle="collapse" data-target="#collapseFive" aria-expanded="false" aria-controls="collapseFive">
                    <h5 className="mb-0 font-weight-600 text-dark flexbox">
                      <span><i className="fa fa-question-circle text-success mr-10 font-size-18"></i> Paketimizi Nasıl Yükseltebiliriz?</span>
                      <i className="fa fa-chevron-down font-size-12 text-muted"></i>
                    </h5>
                  </div>
                  <div id="collapseFive" className="collapse" aria-labelledby="headingFive" data-parent="#faqAccordion">
                    <div className="card-body bg-light-skin py-15 px-20 text-muted border-top" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      Sidebar menüsündeki linkleri kullanarak veya sağ üst köşedeki ayarlar/çark menüsü üzerinden yükseltme sayfasına erişebilirsiniz. KOBİ veya Profesyonel planlar arasından aylık veya yıllık abonelik seçimi yaparak kredi kartı simülasyonu ile hesabınızı hemen yükseltebilirsiniz.
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
