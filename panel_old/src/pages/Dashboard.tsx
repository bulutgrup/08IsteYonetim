import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isMockMode, mockData, formatTRY } from '../lib/supabase';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    orders: 0,
    tax: 0,
    weeklyIncome: 0,
    yearlySales: 0,
    totalIncome: 0,
    augustIncome: 0
  });
  const [tickets, setTickets] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{
    barCategories: string[];
    barIncome: number[];
    barExpense: number[];
    donutSeries: number[];
    sparkSeries: number[];
  }>({
    barCategories: [],
    barIncome: [],
    barExpense: [],
    donutSeries: [],
    sparkSeries: []
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      let tasksList: any[] = [];
      let financeList: any[] = [];
      let ticketsList: any[] = [];

      if (isMockMode()) {
        tasksList = mockData.tasks || [];
        financeList = mockData.finance || [];
        ticketsList = mockData.serviceTickets || [];
      } else {
        try {
          // Supabase'den gerçek zamanlı verileri çek
          const { data: tData } = await supabase.from('tasks').select('id');
          const { data: fData } = await supabase.from('finance_transactions').select('type, amount, category, transaction_date');
          const { data: sData } = await supabase.from('service_tickets').select('id, status, issue_description, created_at, customers(company_name)').limit(5);

          tasksList = tData || [];
          financeList = fData || [];
          ticketsList = sData || [];
        } catch (e) {
          console.error("Supabase'den canlı veriler çekilirken hata oluştu:", e);
          tasksList = mockData.tasks || [];
          financeList = mockData.finance || [];
          ticketsList = mockData.serviceTickets || [];
        }
      }

      // Gelir ve gider hareketlerinin toplamını dinamik hesapla
      const incomeSum = financeList
        .filter((x: any) => x.type === 'income')
        .reduce((acc: number, cur: any) => acc + (Number(cur.amount) || 0), 0);

      const expenseSum = financeList
        .filter((x: any) => x.type === 'expense')
        .reduce((acc: number, cur: any) => acc + (Number(cur.amount) || 0), 0);

      const netCashBalance = incomeSum - expenseSum;
      const tasksCount = tasksList.length;

      setStats({
        orders: tasksCount, // Aktif İşler & Görevler Adedi
        tax: expenseSum, // Toplam Gider ₺
        weeklyIncome: incomeSum, // Toplam Gelir ₺
        yearlySales: netCashBalance, // Net Kasa Bakiye ₺
        totalIncome: incomeSum, // Toplam Gelir Widget
        augustIncome: netCashBalance // Gelecek Tahmini / Net Kasa
      });

      // Grafik verilerini hesapla (Son 6 Ay)
      const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      const barCategories: string[] = [];
      const barIncome: number[] = [];
      const barExpense: number[] = [];
      
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const mIndex = d.getMonth();
        const y = d.getFullYear();
        const label = `${monthNames[mIndex]} ${String(y).substring(2)}`;
        barCategories.push(label);
        
        const monthlyTrans = financeList.filter((x: any) => {
          if (!x.transaction_date) return false;
          const tDate = new Date(x.transaction_date);
          return tDate.getFullYear() === y && tDate.getMonth() === mIndex;
        });
        
        const monthlyIncome = monthlyTrans.filter((x: any) => x.type === 'income').reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
        const monthlyExpense = monthlyTrans.filter((x: any) => x.type === 'expense').reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
        
        barIncome.push(monthlyIncome);
        barExpense.push(monthlyExpense);
      }

      // Donut grafik kategorilerini hesapla (Gelir dağılımı)
      const incomeTransactions = financeList.filter((x: any) => x.type === 'income');
      const bankSum = incomeTransactions.filter((x: any) => x.category === 'bank').reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
      const cashSum = incomeTransactions.filter((x: any) => x.category === 'cash').reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
      const checkSum = incomeTransactions.filter((x: any) => x.category === 'check').reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
      const invoiceSum = incomeTransactions.filter((x: any) => x.category === 'invoice').reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
      
      const hasAnyValue = bankSum > 0 || cashSum > 0 || checkSum > 0 || invoiceSum > 0;
      const donutSeries = hasAnyValue
        ? [bankSum, cashSum, checkSum, invoiceSum]
        : [1000, 500, 200, 300]; // Veri yoksa görsel olarak göze hoş gelen varsayılan değerler

      // Alan grafiği trendi (Son 12 günün günlük gelirleri)
      const sparkSeries: number[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const y = d.getFullYear();
        const m = d.getMonth();
        const dateStr = d.getDate();
        
        const dailyIncome = financeList
          .filter((x: any) => {
            if (x.type !== 'income' || !x.transaction_date) return false;
            const tDate = new Date(x.transaction_date);
            return tDate.getFullYear() === y && tDate.getMonth() === m && tDate.getDate() === dateStr;
          })
          .reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
        
        sparkSeries.push(dailyIncome);
      }

      setChartData({
        barCategories,
        barIncome,
        barExpense,
        donutSeries,
        sparkSeries
      });

      // Teknik servis kayıtlarını formatla ve METADATA etiketini temizle
      const mapped = ticketsList.map((t: any, idx: number) => {
        const cName = t.customers?.company_name || t.customer_name || 'Bilinmeyen Müşteri';
        let displayDesc = t.issue_description || '';
        
        if (displayDesc.startsWith('__METADATA__:')) {
          try {
            const metaEndIndex = displayDesc.indexOf('__', 13);
            if (metaEndIndex !== -1) {
              displayDesc = displayDesc.substring(metaEndIndex + 2).trim();
            }
          } catch (e) {
            // ignore
          }
        }
        
        return {
          id: t.id ? String(t.id).substring(0, 4) : String(idx + 5010),
          customer_name: cName,
          status: t.status,
          issue_description: displayDesc,
          created_at: t.created_at ? new Date(t.created_at).toLocaleDateString('tr-TR') : 'Belirtilmedi'
        };
      });

      setTickets(mapped);
      setLoading(false);
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (loading || chartData.barCategories.length === 0) return;

    // ApexCharts ve ZingChart grafiklerini tetikle
    const renderCharts = () => {
      // @ts-ignore
      const ApexCharts = window.ApexCharts;
      if (ApexCharts) {
        // 1. Satış Raporları (Bar Grafik)
        const barOptions = {
          chart: {
            height: 350,
            type: 'bar',
            toolbar: { show: false }
          },
          colors: ['#E85C46', '#F4983E'],
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: '55%',
              borderRadius: 5
            },
          },
          dataLabels: { enabled: false },
          stroke: { show: true, width: 2, colors: ['transparent'] },
          series: [{
            name: 'Gelir',
            data: chartData.barIncome
          }, {
            name: 'Gider',
            data: chartData.barExpense
          }],
          xaxis: {
            categories: chartData.barCategories,
          },
          fill: { opacity: 1 },
          tooltip: {
            y: { formatter: (val: number) => `${val.toLocaleString('tr-TR')} ₺` }
          }
        };
        const barChart = new ApexCharts(document.querySelector("#bar-chart-dom"), barOptions);
        barChart.render();

        // 2. Gelir Raporları (Donut Grafik)
        const donutOptions = {
          chart: { height: 350, type: 'donut' },
          colors: ['#E85C46', '#F4983E', '#F7B24A', '#1E4063'],
          series: chartData.donutSeries,
          labels: ['Banka', 'Nakit', 'Çek', 'Fatura'],
          responsive: [{
            breakpoint: 480,
            options: {
              chart: { width: 200 },
              legend: { position: 'bottom' }
            }
          }]
        };
        const donutChart = new ApexCharts(document.querySelector("#donut-chart-dom"), donutOptions);
        donutChart.render();

        // 3. Toplam Gelir Sparkline (Alan Grafik)
        const sparkOptions = {
          chart: {
            type: 'area',
            height: 120,
            sparkline: { enabled: true }
          },
          stroke: { curve: 'smooth', width: 2 },
          colors: ['#E85C46'],
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.5,
              opacityTo: 0.1,
              stops: [0, 90, 100]
            }
          },
          series: [{
            name: 'Günlük Gelir',
            data: chartData.sparkSeries
          }],
          yaxis: { min: 0 },
        };
        const sparkChart = new ApexCharts(document.querySelector("#spark-chart-dom"), sparkOptions);
        sparkChart.render();

        return () => {
          barChart.destroy();
          donutChart.destroy();
          sparkChart.destroy();
        };
      }
    };

    // DOM'un yüklenmesi ve ApexCharts nesnesinin hazır olması için süre tanıyalım
    const timer = setTimeout(renderCharts, 300);
    return () => clearTimeout(timer);
  }, [loading, chartData]);

  return (
    <Layout title="Giriş Paneli">
      {/* İstatistik Kartları */}
      <div className="row">
        <div className="col-xl-3 col-md-6 col-12">
          <div className="box box-body bg-info">
            <h5 className="mb-0">
              <span className="text-uppercase">Görevler & İşler</span>
              <span className="float-right"><span className="badge badge-white badge-outline" style={{ fontSize: '10px', padding: '2px 8px' }}>Genel</span></span>
            </h5>
            <br />
            <small>Aktif Kayıtlar</small>
            <p className="font-size-26">{stats.orders.toLocaleString('tr-TR')} Adet</p>
            <div className="font-size-12"><i className="ion-checkmark-circled text-white mr-1"></i> Sistem genelinde aktif görevler</div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 col-12">
          <div className="box box-body bg-danger">
            <h5 className="mb-0">
              <span className="text-uppercase">Toplam Giderler</span>
              <span className="float-right"><span className="badge badge-white badge-outline" style={{ fontSize: '10px', padding: '2px 8px' }}>Finans</span></span>
            </h5>
            <br />
            <small>Bu Ayki Toplam</small>
            <p className="font-size-26">{stats.tax.toLocaleString('tr-TR')} ₺</p>
            <div className="font-size-12"><i className="ion-arrow-graph-up-right text-white mr-1"></i> Gider hareketleri toplamı</div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 col-12">
          <div className="box box-body bg-success">
            <h5 className="mb-0">
              <span className="text-uppercase">Toplam Gelirler</span>
              <span className="float-right"><span className="badge badge-white badge-outline" style={{ fontSize: '10px', padding: '2px 8px' }}>Finans</span></span>
            </h5>
            <br />
            <small>Bu Ayki Toplam</small>
            <p className="font-size-26">{stats.weeklyIncome.toLocaleString('tr-TR')} ₺</p>
            <div className="font-size-12"><i className="ion-arrow-graph-up-right text-white mr-1"></i> Gelir tahsilatları toplamı</div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 col-12">
          <div className="box box-body bg-warning">
            <h5 className="mb-0">
              <span className="text-uppercase">Kasa Net Bakiye</span>
              <span className="float-right"><span className="badge badge-white badge-outline" style={{ fontSize: '10px', padding: '2px 8px' }}>Net Kasa</span></span>
            </h5>
            <br />
            <small>Net Nakit Akışı</small>
            <p className="font-size-26">{stats.yearlySales.toLocaleString('tr-TR')} ₺</p>
            <div className="font-size-12">
              <i className={stats.yearlySales >= 0 ? "ion-arrow-graph-up-right text-white mr-1" : "ion-arrow-graph-down-right text-white mr-1"}></i> 
              Net bakiye durumu (Gelir - Gider)
            </div>
          </div>
        </div>
      </div>

      {/* Grafikler */}
      <div className="row">
        <div className="col-12 col-lg-8">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Satış & Mali Raporlar</h4>
            </div>
            <div className="box-body">
              <div id="bar-chart-dom" style={{ minHeight: '350px' }}></div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Gelir Kaynakları</h4>
            </div>
            <div className="box-body">
              <div id="donut-chart-dom" style={{ minHeight: '350px' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Alt Tablolar ve Yan Bilgi Paneli */}
      <div className="row">
        {/* Sol Taraftaki Teknik Servis Tablosu */}
        <div className="col-12 col-xl-8">
          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Teknik Servis Listesi</h4>
            </div>
            <div className="box-body">
              <div className="table-responsive">
                <table className="table table-hover no-wrap">
                  <thead>
                    <tr>
                      <th># Sıra</th>
                      <th>Müşteri</th>
                      <th>Arıza Açıklaması</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t, idx) => (
                      <tr key={idx}>
                        <td># {t.id}</td>
                        <td>{t.customer_name}</td>
                        <td>{t.issue_description}</td>
                        <td>
                          <span className={`label label-${t.status === 'resolved' ? 'success' : 'danger'}`}>
                            {t.status === 'resolved' ? 'Çözüldü' : 'Çözülmedi'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Taraftaki Finans Durumu */}
        <div className="col-12 col-xl-4">
          <div className="box">
            <div className="box-header no-border">
              <h4>Toplam Gelir</h4>
            </div>
            <div className="box-body pb-40">
              <h1 className="text-center font-size-50">
                {formatTRY(stats.totalIncome)}
              </h1>
            </div>
            <div className="box-body p-0 overflow-h">
              <div id="spark-chart-dom"></div>
            </div>
          </div>

          <div className="box">
            <div className="box-header with-border">
              <h4 className="box-title">Mali Analiz (Ağustos)</h4>
            </div>
            <div className="box-body bb-1 bbr-0">
              <span className="font-size-40 text-primary">{formatTRY(stats.augustIncome)}</span>
              <span className="text-fade ml-10">Tahmini</span>
            </div>
            <div className="box-body">
              <div className="row justify-content-between pb-25">
                <div className="col-4">
                  <h2 className="mb-0">60%</h2>
                  <div className="progress progress-xs mb-10">
                    <div className="progress-bar bg-warning" role="progressbar" style={{ width: '60%' }}></div>
                  </div>
                  <span className="font-size-12 text-fade">Satış</span>
                </div>
                <div className="col-4">
                  <h2 className="mb-0">40%</h2>
                  <div className="progress progress-xs mb-10">
                    <div className="progress-bar bg-danger" role="progressbar" style={{ width: '40%' }}></div>
                  </div>
                  <span className="font-size-12 text-fade">Ürün Satış</span>
                </div>
                <div className="col-4">
                  <h2 className="mb-0">50%</h2>
                  <div className="progress progress-xs mb-10">
                    <div className="progress-bar bg-info" role="progressbar" style={{ width: '50%' }}></div>
                  </div>
                  <span className="font-size-12 text-fade">Yazılım</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
