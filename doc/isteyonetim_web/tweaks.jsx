/* İşteYönetim — Tweaks panel (mounts into #tweaks-root) */
const IY_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "sicak",
  "accent": ["#E85C46", "#F4983E", "#F7B24A"],
  "fontHead": "'Bricolage Grotesque',system-ui,sans-serif",
  "radius": 22
}/*EDITMODE-END*/;

function IYTweaks(){
  const [t,setTweak]=useTweaks(IY_TWEAK_DEFAULTS);
  React.useEffect(()=>{
    if(window.applyTheme) window.applyTheme(t);
    try{localStorage.setItem('iy-theme',JSON.stringify(t));}catch(e){}
  },[t]);
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Stil yönü" />
      <TweakRadio label="Yön" value={t.direction}
        options={[{value:'sicak',label:'Sıcak'},{value:'kurumsal',label:'Kurumsal'},{value:'ferah',label:'Ferah'}]}
        onChange={v=>setTweak('direction',v)} />
      <TweakSection label="Vurgu rengi" />
      <TweakColor label="Palet" value={t.accent}
        options={[
          ['#E85C46','#F4983E','#F7B24A'],
          ['#E8533A','#EC6A2E','#F08A2C'],
          ['#1E4063','#E85C46','#F4983E'],
          ['#E0533E','#E8746B','#F2A38C']
        ]}
        onChange={v=>setTweak('accent',v)} />
      <TweakSection label="Tipografi" />
      <TweakSelect label="Başlık fontu" value={t.fontHead}
        options={[
          {value:"'Bricolage Grotesque',system-ui,sans-serif",label:'Bricolage (editoryel)'},
          {value:"'Plus Jakarta Sans',system-ui,sans-serif",label:'Plus Jakarta (modern)'},
          {value:"'Space Grotesk',system-ui,sans-serif",label:'Space Grotesk (teknik)'}
        ]}
        onChange={v=>setTweak('fontHead',v)} />
      <TweakSection label="Biçim" />
      <TweakSlider label="Köşe yuvarlaklığı" value={t.radius} min={6} max={28} unit="px"
        onChange={v=>setTweak('radius',v)} />
    </TweaksPanel>
  );
}

(function mount(){
  const el=document.getElementById('tweaks-root');
  if(el && window.ReactDOM) ReactDOM.createRoot(el).render(<IYTweaks/>);
})();
