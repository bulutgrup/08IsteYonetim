/* ============================================================
   İşteYönetim — shared app logic + i18n
   ============================================================ */
const I18N = {
  tr:{
    "nav.features":"Özellikler","nav.how":"Nasıl Çalışır","nav.pricing":"Paketler",
    "nav.download":"İndir","nav.faq":"SSS","nav.contact":"İletişim",
    "nav.login":"Giriş Yap","nav.cta":"Ücretsiz Başla",

    "hero.pill":"İş takibi artık tek ekranda","hero.badge":"YENİ",
    "hero.title":"İşinizin her adımı <span class=\"hl\">kontrol altında</span>",
    "hero.sub":"İş akışlarını, personel görevlerini ve işleyişin her aşamasını tek yerden yönetin. İşin en son hangi adımda olduğunu anında görün, eksik kalan yeri net seçin.",
    "hero.cta1":"Ücretsiz Dene","hero.cta2":"Uygulamayı İndir",
    "hero.trust":"<b>2.400+</b> ekip İşteYönetim ile çalışıyor",

    "logos.label":"Sektörden ekipler güveniyor",

    "feat.eyebrow":"Neler Sunuyor","feat.title":"Tek uygulama, tüm işleyiş",
    "feat.sub":"Kafeden atölyeye, sahadan ofise — ekibinizin işini başlangıçtan teslimata kadar tek panelde toplayın.",
    "f1.t":"İş Akışı Yönetimi","f1.d":"Her işi adımlara bölün, sıraya koyun ve sürükle-bırak ile aşamalar arasında taşıyın.",
    "f2.t":"Personel İş Takibi","f2.d":"Kim hangi görevde, ne kadar ilerledi? Tüm ekibin yükünü tek bakışta görün.",
    "f3.t":"Adım Adım İşleyiş","f3.d":"İşin en son hangi aşamada olduğunu, eksik kalan adımı renkli durumlarla net görün.",
    "f4.t":"Her Yerden Erişim","f4.d":"Mobil uygulama sayesinde tüm personel sahada, yolda veya ofiste işine ulaşır.",
    "f5.t":"Bildirim & Hatırlatma","f5.d":"Görev atandığında, adım tamamlandığında veya bir iş geciktiğinde anında haber alın.",
    "f6.t":"Raporlama","f6.d":"Tamamlanan iş, gecikme ve ekip performansını otomatik raporlarla ölçün.",

    "how.eyebrow":"Nasıl Çalışır","how.title":"Dört adımda işleyişi kurun",
    "how.sub":"Kurulum dakikalar sürer. Karmaşık ayar yok — işinizi tanımlayın, ekibi davet edin, takibe başlayın.",
    "h1.t":"İş akışını tanımlayın","h1.d":"İşinizin adımlarını oluşturun: teklif, üretim, kontrol, teslimat… Şablonları kullanın ya da kendinizinkini kurun.",
    "h2.t":"Ekibi davet edin","h2.d":"Personeli rolleriyle ekleyin. Herkes kendi görevlerini telefonundan görür ve günceller.",
    "h3.t":"Görevleri atayın","h3.d":"Her adımı bir kişiye atayın, son tarih verin. Sistem ilerlemeyi otomatik takip eder.",
    "h4.t":"İlerlemeyi izleyin","h4.d":"Canlı panelde işin hangi aşamada olduğunu görün, gecikmeleri yakalayın, raporları indirin.",

    "shots.eyebrow":"Uygulama","shots.title":"Cebinizdeki kontrol merkezi",
    "shots.sub":"Sade, hızlı ve Türkçe arayüz. Tek dokunuşla iş ekleyin, adım güncelleyin, ekibi yönetin.",

    "price.eyebrow":"Paketler","price.title":"İşletmenize uygun paket",
    "price.sub":"14 gün ücretsiz deneyin, kredi kartı gerekmez. İstediğiniz zaman yükseltin veya iptal edin.",
    "price.monthly":"Aylık","price.yearly":"Yıllık","price.save":"2 ay bedava",
    "price.per":"/ ay","price.note_m":"aylık faturalandırılır","price.note_y":"yıllık faturalandırılır",
    "p1.name":"KOBİ","p1.desc":"Küçük ekipler ve yeni başlayanlar için.",
    "p1.cta":"Ücretsiz Başla",
    "p2.name":"Profesyonel","p2.desc":"Büyüyen ekipler ve çoklu iş akışları için.",
    "p2.cta":"Hemen Dene","p2.tag":"En Popüler",
    "p3.name":"Kurumsal","p3.desc":"Çok şubeli ve büyük operasyonlar için.",
    "p3.cta":"Bizimle İletişime Geç","p3.price":"Özel",
    "p1.f1":"5 kullanıcıya kadar","p1.f2":"3 iş akışı şablonu","p1.f3":"Mobil uygulama","p1.f4":"Temel raporlar","p1.f5":"E-posta desteği","p1.f6":"Gelişmiş yetkilendirme","p1.f7":"API erişimi",
    "p2.f1":"25 kullanıcıya kadar","p2.f2":"Sınırsız iş akışı","p2.f3":"Mobil + web uygulaması","p2.f4":"Gelişmiş raporlar","p2.f5":"Bildirim & hatırlatma","p2.f6":"Gelişmiş yetkilendirme","p2.f7":"Öncelikli destek",
    "p3.f1":"Sınırsız kullanıcı","p3.f2":"Sınırsız iş akışı","p3.f3":"Çoklu şube yönetimi","p3.f4":"Özel raporlar & API","p3.f5":"SSO & güvenlik","p3.f6":"Özel eğitim","p3.f7":"7/24 öncelikli destek",

    "dl.eyebrow":"İndir","dl.title":"Her cihazda yanınızda",
    "dl.sub":"iOS, Android ve web. Hesabınız tüm cihazlarda anlık eşitlenir.",
    "dl.ios.t":"iPhone & iPad","dl.ios.d":"iOS 14 ve üzeri","dl.and.t":"Android","dl.and.d":"Android 8.0 ve üzeri","dl.web.t":"Web Uygulaması","dl.web.d":"Tüm modern tarayıcılar",
    "dl.web.btn":"Tarayıcıda Aç","dl.qr":"Telefonla tarayın, hemen indirin",

    "faq.eyebrow":"SSS","faq.title":"Sıkça sorulan sorular","faq.sub":"Aradığınızı bulamadınız mı? Bize yazın, yardımcı olalım.",
    "q1.q":"Kurulum ne kadar sürer?","q1.a":"Çoğu ekip 15 dakikadan kısa sürede kuruluyor. Hazır iş akışı şablonlarını seçip ekibinizi davet etmeniz yeterli — kod veya teknik bilgi gerekmez.",
    "q2.q":"Ücretsiz deneme nasıl çalışıyor?","q2.a":"14 gün boyunca Profesyonel paketin tüm özelliklerini kredi kartı olmadan kullanırsınız. Süre sonunda dilediğiniz pakete geçebilir ya da devam etmeyebilirsiniz.",
    "q3.q":"Verilerim güvende mi?","q3.a":"Tüm veriler şifreli olarak Türkiye'deki sunucularda saklanır. Günlük yedekleme yapılır ve KVKK uyumludur.",
    "q4.q":"Personelin uygulamayı kullanması zor mu?","q4.a":"Hayır. Arayüz sade ve tamamen Türkçedir. Personel yalnızca kendine atanan görevleri görür ve tek dokunuşla durumu günceller.",
    "q5.q":"İnternet olmadan çalışır mı?","q5.a":"Mobil uygulama çevrimdışı görev güncellemeyi destekler; bağlantı geldiğinde değişiklikler otomatik eşitlenir.",
    "q6.q":"Paketimi sonradan değiştirebilir miyim?","q6.a":"Evet, istediğiniz zaman yükseltebilir veya düşürebilirsiniz. Değişiklik anında geçerli olur, fark ücreti orantılı hesaplanır.",

    "contact.eyebrow":"İletişim","contact.title":"Demo talep edin","contact.sub":"Ekibinize özel 20 dakikalık canlı demo ayarlayalım. Formu doldurun, en geç 1 iş günü içinde dönelim.",
    "contact.name":"Ad Soyad","contact.email":"E-posta","contact.company":"Şirket","contact.size":"Ekip büyüklüğü","contact.msg":"Mesajınız","contact.msg_ph":"Hangi işleri takip etmek istiyorsunuz?","contact.send":"Demo Talep Et","contact.sent":"Teşekkürler! En kısa sürede döneceğiz.",
    "contact.i1.t":"E-posta","contact.i2.t":"Telefon","contact.i3.t":"Adres","contact.i3.d":"Mustafa Kemal Mah. Maidan İş Merkezi 4C Blok No:140 Çankaya ANKARA",
    "contact.s1":"1-5 kişi","contact.s2":"6-25 kişi","contact.s3":"26-100 kişi","contact.s4":"100+ kişi",

    "cta.title":"İşinizi bugün düzene sokun","cta.sub":"Dağınık notları, grupları ve tabloları bırakın. İşteYönetim ile her şey tek yerde.","cta.btn1":"14 Gün Ücretsiz Dene","cta.btn2":"Paketleri Gör",

    "foot.desc":"İş akışlarını, personel takibini ve işleyişin her adımını tek yerden yöneten Türkiye'nin iş yönetim uygulaması.",
    "foot.product":"Ürün","foot.company":"Şirket","foot.support":"Destek",
    "foot.copy":"© 2026 İşteYönetim. Tüm hakları saklıdır.",
    "foot.privacy":"Gizlilik","foot.terms":"Kullanım Şartları","foot.kvkk":"KVKK",

    /* pricing page */
    "pp.title":"Şeffaf, basit fiyatlandırma","pp.sub":"Gizli ücret yok. Ekibiniz büyüdükçe ödeyin, küçüldükçe düşürün.",
    "pp.compare":"Paket karşılaştırması","pp.compare_sub":"Hangi paketin size uyduğunu detaylı görün.",
    "cmp.feature":"Özellik","cmp.users":"Kullanıcı sayısı","cmp.flows":"İş akışı","cmp.mobile":"Mobil uygulama","cmp.web":"Web uygulaması","cmp.reports":"Raporlama","cmp.notif":"Bildirimler","cmp.roles":"Gelişmiş yetkilendirme","cmp.branches":"Çoklu şube","cmp.api":"API erişimi","cmp.sso":"SSO & güvenlik","cmp.support":"Destek",
    "cmp.basic":"Temel","cmp.adv":"Gelişmiş","cmp.custom":"Özel","cmp.email":"E-posta","cmp.priority":"Öncelikli","cmp.support247":"7/24",

    /* download page */
    "dp.title":"İşteYönetim'i indirin","dp.sub":"Telefonunuzda, tabletinizde ve bilgisayarınızda. Bir hesap, her yerde.",
    "dp.req":"Sistem gereksinimleri","dp.feat":"Her platformda aynı güç",
    "dp.f1.t":"Anlık eşitleme","dp.f1.d":"Bir cihazda yaptığınız değişiklik saniyeler içinde her yerde.",
    "dp.f2.t":"Çevrimdışı mod","dp.f2.d":"Bağlantı yokken bile görevleri güncelleyin; sonra otomatik eşitlenir.",
    "dp.f3.t":"Anlık bildirim","dp.f3.d":"Görev ve gecikmelerden cihazınızda anında haberdar olun.",
  },
  en:{
    "nav.features":"Features","nav.how":"How It Works","nav.pricing":"Pricing",
    "nav.download":"Download","nav.faq":"FAQ","nav.contact":"Contact",
    "nav.login":"Log In","nav.cta":"Start Free",

    "hero.pill":"Job tracking, now on one screen","hero.badge":"NEW",
    "hero.title":"Every step of your work, <span class=\"hl\">under control</span>",
    "hero.sub":"Manage workflows, staff tasks and every stage of your operation in one place. See exactly which step a job is on and spot what's missing at a glance.",
    "hero.cta1":"Try Free","hero.cta2":"Get the App",
    "hero.trust":"<b>2,400+</b> teams run on İşteYönetim",

    "logos.label":"Trusted by teams across industries",

    "feat.eyebrow":"What You Get","feat.title":"One app, your whole operation",
    "feat.sub":"From café to workshop, field to office — bring your team's work together in a single panel, start to delivery.",
    "f1.t":"Workflow Management","f1.d":"Break each job into steps, queue them and drag to move work between stages.",
    "f2.t":"Staff Task Tracking","f2.d":"Who's on what, and how far along? See the whole team's load at a glance.",
    "f3.t":"Step-by-Step Flow","f3.d":"See exactly which stage a job is on and what step is missing with colour-coded statuses.",
    "f4.t":"Access Anywhere","f4.d":"With the mobile app every team member reaches their work in the field, on the road or at the office.",
    "f5.t":"Alerts & Reminders","f5.d":"Get notified the moment a task is assigned, a step is done or a job runs late.",
    "f6.t":"Reporting","f6.d":"Measure completed work, delays and team performance with automatic reports.",

    "how.eyebrow":"How It Works","how.title":"Set up your operation in four steps",
    "how.sub":"Setup takes minutes. No complex config — define your work, invite the team, start tracking.",
    "h1.t":"Define the workflow","h1.d":"Create your job's steps: quote, production, review, delivery… Use templates or build your own.",
    "h2.t":"Invite your team","h2.d":"Add staff with their roles. Everyone sees and updates their own tasks from their phone.",
    "h3.t":"Assign tasks","h3.d":"Assign each step to a person with a due date. The system tracks progress automatically.",
    "h4.t":"Track progress","h4.d":"See which stage a job is on in a live panel, catch delays and download reports.",

    "shots.eyebrow":"The App","shots.title":"A control centre in your pocket",
    "shots.sub":"A clean, fast interface. Add a job, update a step, manage the team in one tap.",

    "price.eyebrow":"Pricing","price.title":"A plan that fits your business",
    "price.sub":"Try free for 14 days, no card required. Upgrade or cancel anytime.",
    "price.monthly":"Monthly","price.yearly":"Yearly","price.save":"2 months free",
    "price.per":"/ mo","price.note_m":"billed monthly","price.note_y":"billed yearly",
    "p1.name":"SMB","p1.desc":"For small teams and getting started.",
    "p1.cta":"Start Free",
    "p2.name":"Professional","p2.desc":"For growing teams and multiple workflows.",
    "p2.cta":"Try Now","p2.tag":"Most Popular",
    "p3.name":"Enterprise","p3.desc":"For multi-branch and large operations.",
    "p3.cta":"Contact Us","p3.price":"Custom",
    "p1.f1":"Up to 5 users","p1.f2":"3 workflow templates","p1.f3":"Mobile app","p1.f4":"Basic reports","p1.f5":"Email support","p1.f6":"Advanced permissions","p1.f7":"API access",
    "p2.f1":"Up to 25 users","p2.f2":"Unlimited workflows","p2.f3":"Mobile + web app","p2.f4":"Advanced reports","p2.f5":"Alerts & reminders","p2.f6":"Advanced permissions","p2.f7":"Priority support",
    "p3.f1":"Unlimited users","p3.f2":"Unlimited workflows","p3.f3":"Multi-branch management","p3.f4":"Custom reports & API","p3.f5":"SSO & security","p3.f6":"Dedicated onboarding","p3.f7":"24/7 priority support",

    "dl.eyebrow":"Download","dl.title":"With you on every device",
    "dl.sub":"iOS, Android and web. Your account syncs instantly across all devices.",
    "dl.ios.t":"iPhone & iPad","dl.ios.d":"iOS 14 and above","dl.and.t":"Android","dl.and.d":"Android 8.0 and above","dl.web.t":"Web App","dl.web.d":"All modern browsers",
    "dl.web.btn":"Open in Browser","dl.qr":"Scan with your phone to download",

    "faq.eyebrow":"FAQ","faq.title":"Frequently asked questions","faq.sub":"Didn't find it? Write to us and we'll help.",
    "q1.q":"How long does setup take?","q1.a":"Most teams are up in under 15 minutes. Just pick a ready workflow template and invite your team — no code or technical skill needed.",
    "q2.q":"How does the free trial work?","q2.a":"You get all Professional features for 14 days without a card. At the end, switch to any plan or stop.",
    "q3.q":"Is my data safe?","q3.a":"All data is stored encrypted on servers in Türkiye, backed up daily and KVKK compliant.",
    "q4.q":"Is the app hard for staff to use?","q4.a":"No. The interface is simple and fully in Turkish. Staff only see their assigned tasks and update status in one tap.",
    "q5.q":"Does it work offline?","q5.a":"The mobile app supports offline task updates; changes sync automatically when you're back online.",
    "q6.q":"Can I change my plan later?","q6.a":"Yes, upgrade or downgrade anytime. Changes apply instantly and the difference is prorated.",

    "contact.eyebrow":"Contact","contact.title":"Request a demo","contact.sub":"Let's set up a 20-minute live demo for your team. Fill the form and we'll reply within 1 business day.",
    "contact.name":"Full Name","contact.email":"Email","contact.company":"Company","contact.size":"Team size","contact.msg":"Your message","contact.msg_ph":"What jobs do you want to track?","contact.send":"Request Demo","contact.sent":"Thanks! We'll get back to you soon.",
    "contact.i1.t":"Email","contact.i2.t":"Phone","contact.i3.t":"Address","contact.i3.d":"Mustafa Kemal Mah. Maidan İş Merkezi 4C Blok No:140 Çankaya ANKARA",
    "contact.s1":"1-5 people","contact.s2":"6-25 people","contact.s3":"26-100 people","contact.s4":"100+ people",

    "cta.title":"Get your work in order today","cta.sub":"Drop the scattered notes, chat groups and spreadsheets. With İşteYönetim everything is in one place.","cta.btn1":"Try 14 Days Free","cta.btn2":"See Plans",

    "foot.desc":"Türkiye's work management app that runs workflows, staff tracking and every step of your operation from one place.",
    "foot.product":"Product","foot.company":"Company","foot.support":"Support",
    "foot.copy":"© 2026 İşteYönetim. All rights reserved.",
    "foot.privacy":"Privacy","foot.terms":"Terms","foot.kvkk":"KVKK",

    "pp.title":"Transparent, simple pricing","pp.sub":"No hidden fees. Pay as your team grows, scale down as it shrinks.",
    "pp.compare":"Plan comparison","pp.compare_sub":"See in detail which plan fits you.",
    "cmp.feature":"Feature","cmp.users":"Users","cmp.flows":"Workflows","cmp.mobile":"Mobile app","cmp.web":"Web app","cmp.reports":"Reporting","cmp.notif":"Notifications","cmp.roles":"Advanced permissions","cmp.branches":"Multi-branch","cmp.api":"API access","cmp.sso":"SSO & security","cmp.support":"Support",
    "cmp.basic":"Basic","cmp.adv":"Advanced","cmp.custom":"Custom","cmp.email":"Email","cmp.priority":"Priority","cmp.support247":"24/7",

    "dp.title":"Download İşteYönetim","dp.sub":"On your phone, tablet and computer. One account, everywhere.",
    "dp.req":"System requirements","dp.feat":"Same power on every platform",
    "dp.f1.t":"Instant sync","dp.f1.d":"A change on one device is everywhere within seconds.",
    "dp.f2.t":"Offline mode","dp.f2.d":"Update tasks even without a connection; they sync automatically later.",
    "dp.f3.t":"Push notifications","dp.f3.d":"Be notified of tasks and delays on your device instantly.",
  }
};

/* prices per plan/billing */
const PRICES = {
  p1:{m:"₺299",y:"₺249"},
  p2:{m:"₺499",y:"₺416"},
};

function getLang(){return localStorage.getItem('iy-lang')||'tr';}
function applyLang(lang){
  const dict=I18N[lang]||I18N.tr;
  document.documentElement.setAttribute('lang',lang);
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k=el.getAttribute('data-i18n');
    if(dict[k]!=null) el.innerHTML=dict[k];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{
    const k=el.getAttribute('data-i18n-ph');
    if(dict[k]!=null) el.setAttribute('placeholder',dict[k]);
  });
  document.querySelectorAll('[data-lang-btn]').forEach(b=>{
    b.classList.toggle('active',b.getAttribute('data-lang-btn')===lang);
  });
  localStorage.setItem('iy-lang',lang);
  updateBilling(); // re-render price notes in current lang
}

/* ----- tweak theme persistence across pages ----- */
function applyTheme(t){
  const root=document.documentElement;
  if(t.direction) root.setAttribute('data-direction',t.direction);
  if(t.accent){root.style.setProperty('--accent',t.accent[0]);root.style.setProperty('--accent-2',t.accent[1]||t.accent[0]);
    root.style.setProperty('--grad',`linear-gradient(135deg,${t.accent[0]},${t.accent[1]||t.accent[0]} 60%,${t.accent[2]||t.accent[1]||t.accent[0]})`);}
  if(t.fontHead) root.style.setProperty('--font-head',t.fontHead);
  if(t.radius!=null){root.style.setProperty('--radius',t.radius+'px');root.style.setProperty('--radius-sm',Math.max(8,t.radius-8)+'px');root.style.setProperty('--radius-lg',(t.radius+10)+'px');}
}
function loadTheme(){
  try{const t=JSON.parse(localStorage.getItem('iy-theme')||'{}');applyTheme(t);}catch(e){}
}

/* ----- billing toggle (pricing) ----- */
let BILLING='m';
function updateBilling(){
  const lang=getLang();const dict=I18N[lang];
  document.querySelectorAll('[data-price]').forEach(el=>{
    const p=el.getAttribute('data-price');
    if(PRICES[p]) el.textContent=PRICES[p][BILLING];
  });
  document.querySelectorAll('[data-price-note]').forEach(el=>{
    el.textContent = BILLING==='y'?dict['price.note_y']:dict['price.note_m'];
  });
  document.querySelectorAll('[data-bill-btn]').forEach(b=>{
    b.classList.toggle('active',b.getAttribute('data-bill-btn')===BILLING);
  });
}

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded',()=>{
  loadTheme();
  applyLang(getLang());

  /* language buttons */
  document.querySelectorAll('[data-lang-btn]').forEach(b=>{
    b.addEventListener('click',()=>applyLang(b.getAttribute('data-lang-btn')));
  });

  /* nav scroll */
  const nav=document.querySelector('header.nav');
  if(nav){
    const onScroll=()=>nav.classList.toggle('scrolled',window.scrollY>10);
    onScroll();window.addEventListener('scroll',onScroll,{passive:true});
  }

  /* mobile drawer */
  const drawer=document.getElementById('drawer');
  const menuBtn=document.getElementById('menuBtn');
  if(menuBtn&&drawer){
    const close=()=>drawer.classList.remove('open');
    menuBtn.addEventListener('click',()=>drawer.classList.add('open'));
    drawer.querySelector('.drawer-bg').addEventListener('click',close);
    drawer.querySelector('.drawer-close').addEventListener('click',close);
    drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  }

  /* FAQ accordion */
  document.querySelectorAll('.faq').forEach(faq=>{
    const q=faq.querySelector('.faq-q');
    const a=faq.querySelector('.faq-a');
    q.addEventListener('click',()=>{
      const open=faq.classList.contains('open');
      document.querySelectorAll('.faq').forEach(f=>{f.classList.remove('open');f.querySelector('.faq-a').style.maxHeight=null;});
      if(!open){faq.classList.add('open');a.style.maxHeight=a.scrollHeight+'px';}
    });
  });

  /* how-it-works tabs */
  const steps=document.querySelectorAll('.howstep');
  const panels=document.querySelectorAll('[data-howpanel]');
  steps.forEach(s=>{
    s.addEventListener('click',()=>{
      steps.forEach(x=>x.classList.remove('active'));
      s.classList.add('active');
      const idx=s.getAttribute('data-howstep');
      panels.forEach(p=>p.style.display=p.getAttribute('data-howpanel')===idx?'':'none');
    });
  });

  /* billing toggle */
  document.querySelectorAll('[data-bill-btn]').forEach(b=>{
    b.addEventListener('click',()=>{BILLING=b.getAttribute('data-bill-btn');updateBilling();});
  });
  updateBilling();

  /* contact form */
  const form=document.getElementById('contactForm');
  if(form){
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const btn=form.querySelector('button[type=submit]');
      
      // AJAX ile contact.php'ye POST et
      const formData = new FormData(form);
      fetch('contact.php', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        console.log('Sunucu yanıtı:', data);
      })
      .catch(err => {
        console.error('Gönderim hatası:', err);
      });

      btn.textContent=I18N[getLang()]['contact.sent'];
      btn.style.background='#1E8A5B';
      form.reset();
      setTimeout(()=>{applyLang(getLang());btn.style.background='';},3500);
    });
  }

  /* reveal on scroll */
  const io=new IntersectionObserver((ents)=>{
    ents.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}});
  },{threshold:.12,rootMargin:'0px 0px -5% 0px'});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  /* failsafe: never leave content hidden */
  setTimeout(()=>document.querySelectorAll('.reveal:not(.in)').forEach(el=>{
    const r=el.getBoundingClientRect();
    if(r.top<window.innerHeight) el.classList.add('in');
  }),2500);
});
