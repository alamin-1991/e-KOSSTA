/* EKOSSTA_UNIT_LAYOUT_BUILD: UNIT_TABLE_V7_20261022 */
/* EKOSSTA_ANALYSIS_MODULE_BUILD: ANALYSIS_LIVE_DATA_V1_20261023 */
/* EKOSSTA_PAJSK_CLASS_REPORT: V2_20261023_ALL_CLASSES_PRINT_FILTER */
window.__EKOSSTA_UNIT_LAYOUT_BUILD__ = "UNIT_TABLE_V7_20261022";
const $=id=>document.getElementById(id);
const state={apiUrl:localStorage.getItem('ekossta_model_b_api_url')||'',dark:localStorage.getItem('ekossta_model_b_dark')==='1',token:sessionStorage.getItem('ekossta_v2_token')||'',user:JSON.parse(sessionStorage.getItem('ekossta_v2_user')||'null')};
let CURRENT_PAGE='dashboard';
let PENCAPAIAN_RECORD_MODE_=false;
let PENCAPAIAN_READ_ONLY_=false;
let ANALYSIS_CACHE_={loaded:false,students:[],units:[],activities:[],achievementActivities:[],reports:[],attendanceByYear:{},errors:[]};
let ANALYSIS_LAST_VIEW_={year:'',units:[],attendance:[],activityRows:[]};
let ANALYSIS_UNIT_SLIDER_INDEX_=0;
const ANALYSIS_UNIT_SLIDER_CATEGORIES_=['UNIT BERUNIFORM','KELAB / PERSATUAN','SUKAN / PERMAINAN','RUMAH SUKAN'];
let PAJSK_CACHE_={loaded:false,year:'',kelas:'',classes:[],years:[],data:[],scoreNote:''};
const PAJSK_CATEGORIES_=['KELAB / PERSATUAN','UNIT BERUNIFORM','SUKAN / PERMAINAN'];
const PAJSK_CATEGORY_LABELS_={'KELAB / PERSATUAN':'Kelab / Persatuan','UNIT BERUNIFORM':'Badan Beruniform','SUKAN / PERMAINAN':'Sukan / Permainan','RUMAH SUKAN':'Rumah Sukan','ACARA / PENYERTAAN':'Acara / Penyertaan'};
let DASHBOARD_SUMMARY_CACHE_={murid:null,units:null};
let DASHBOARD_ANALYTICS_CACHE_={loaded:false,year:'',topStudents:[],activities:[],attendanceByUnit:[],membersByUnit:[],summary:{}};
let DASHBOARD_ATTENDANCE_SLIDE_=0;
let DASHBOARD_MEMBERS_SLIDE_=0;
const DASHBOARD_UNIT_CATEGORIES_=[
  {key:'UNIT BERUNIFORM',label:'Unit Beruniform'},
  {key:'KELAB / PERSATUAN',label:'Kelab / Persatuan'},
  {key:'SUKAN / PERMAINAN',label:'Sukan / Permainan'},
  {key:'RUMAH SUKAN',label:'Rumah Sukan'}
];
let APP_SETTINGS_={appName:'e-KOSSTA',schoolLogoDataUrl:'',schoolLogoMime:'',hasSchoolLogo:false};
let APP_SETTINGS_LOADING_=null;
let APP_SETTINGS_LAST_LOADED_AT_=0;
let APP_SETTINGS_DRAFT_LOGO_=null; // null=keep, empty string=remove, data URL=replace
const APP_BRAND_ALIASES_=new Set(['e-KOSSTA']);

function isDesktopSidebar_(){
  return window.matchMedia('(min-width: 769px)').matches;
}

function isDesktopDropdown_(){
  return window.matchMedia('(min-width: 1025px)').matches;
}

function closeSidebarPopups_(except=null){
  document.querySelectorAll('.nav-group.desktop-popup-open').forEach(group=>{
    if(group!==except){
      group.classList.remove('desktop-popup-open');
      group.classList.remove('open');
      const toggle=group.querySelector(':scope > .nav-group-toggle');
      if(toggle)toggle.setAttribute('aria-expanded','false');
    }
  });
}

function positionSidebarPopup_(group){
  if(!group || !isDesktopSidebar_())return;
  const toggle=group.querySelector(':scope > .nav-group-toggle');
  const menu=group.querySelector(':scope > .nav-submenu');
  if(!toggle || !menu)return;
  const r=toggle.getBoundingClientRect();
  const gap=8;
  const width=Math.min(260, Math.max(220, window.innerWidth-r.right-gap-14));
  const maxHeight=Math.max(220, window.innerHeight-24);
  menu.style.left=Math.round(r.right+gap)+'px';
  menu.style.top=Math.round(Math.max(12, Math.min(r.top, window.innerHeight-maxHeight-12)))+'px';
  menu.style.width=Math.round(width)+'px';
  menu.style.maxHeight=Math.round(maxHeight)+'px';
}

function setupNavigation(){
  const buttons=[...document.querySelectorAll('#sidebar .nav-item[data-page]')];
  buttons.forEach(btn=>btn.addEventListener('click',()=>{
    showPage(btn.dataset.page);
    if(isDesktopSidebar_())closeSidebarPopups_();
  }));

  document.querySelectorAll('[data-page-jump]').forEach(btn=>{
    btn.addEventListener('click',()=>showPage(btn.dataset.pageJump));
  });

  document.querySelectorAll('[data-main-group]').forEach(btn=>{
    btn.addEventListener('click',()=>showPage(defaultPageForGroup_(btn.dataset.mainGroup)));
  });

  document.querySelectorAll('.nav-group-toggle').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const group=btn.closest('.nav-group');
      if(!group)return;
      if(isDesktopSidebar_() && !isDesktopDropdown_()){
        const opening=!group.classList.contains('desktop-popup-open');
        closeSidebarPopups_(opening?group:null);
        group.classList.toggle('desktop-popup-open',opening);
        group.classList.toggle('open',opening);
        btn.setAttribute('aria-expanded',opening?'true':'false');
        if(opening)requestAnimationFrame(()=>positionSidebarPopup_(group));
      }else{
        const open=group.classList.toggle('open');
        btn.setAttribute('aria-expanded',open?'true':'false');
      }
    });
  });

  setupMobileMenu_();

  document.addEventListener('click',e=>{
    if(isDesktopSidebar_() && !e.target.closest('#sidebar'))closeSidebarPopups_();
  });

  window.addEventListener('resize',()=>{
    if(isDesktopSidebar_()){
      document.querySelectorAll('.nav-group.desktop-popup-open').forEach(positionSidebarPopup_);
    }else{
      document.querySelectorAll('.nav-submenu').forEach(m=>{m.style.left='';m.style.top='';m.style.width='';m.style.maxHeight=''});
      document.querySelectorAll('.nav-group').forEach(g=>g.classList.remove('desktop-popup-open'));
    }
  });

  if(isDesktopSidebar_()){
    document.querySelectorAll('.nav-group').forEach(g=>{
      g.classList.remove('open','desktop-popup-open');
      const t=g.querySelector(':scope > .nav-group-toggle');
      if(t)t.setAttribute('aria-expanded','false');
    });
  }

  const themeTargets=['themeBtn','desktopThemeBtn','sidebarThemeBtn'];
  themeTargets.forEach(id=>{
    const e=$(id);
    if(e)e.onclick=toggleTheme;
  });

  const lo=$('sidebarLogoutBtn');
  if(lo)lo.onclick=logout;
}

function setupMobileMenu_(){
  const mobileNav=$('mobileNav');
  const drawer=$('mobileMenu');
  const content=$('mobileMenuContent');
  if(!mobileNav||!drawer||!content)return;

  const openMenu=(preferredGroup='')=>{
    buildMobileMenu_(preferredGroup);
    drawer.hidden=false;
    drawer.setAttribute('aria-hidden','false');
    document.body.classList.add('mobile-menu-open');
    requestAnimationFrame(()=>drawer.classList.add('show'));
  };
  const closeMenu=()=>{
    drawer.classList.remove('show');
    drawer.setAttribute('aria-hidden','true');
    document.body.classList.remove('mobile-menu-open');
    setTimeout(()=>{drawer.hidden=true;},180);
  };

  mobileNav.querySelectorAll('[data-mobile-open-group]').forEach(btn=>btn.addEventListener('click',()=>{
    const key=btn.dataset.mobileOpenGroup;
    if(key==='tetapan')openMenu('tetapan');
    else showPage(defaultPageForGroup_(key));
  }));
  mobileNav.querySelectorAll('[data-page]').forEach(btn=>btn.addEventListener('click',()=>showPage(btn.dataset.page)));
  drawer.querySelectorAll('[data-mobile-close]').forEach(el=>el.addEventListener('click',closeMenu));
  drawer.addEventListener('click',e=>{
    const groupBtn=e.target.closest('.mobile-group-toggle');
    if(groupBtn){
      const group=groupBtn.closest('.mobile-menu-group');
      if(!group)return;
      group.classList.toggle('open');
      groupBtn.setAttribute('aria-expanded',group.classList.contains('open')?'true':'false');
      return;
    }
    const logoutBtn=e.target.closest('[data-mobile-logout]');
    if(logoutBtn){
      closeMenu();
      logout();
      return;
    }
    const item=e.target.closest('[data-mobile-page]');
    if(item){
      showPage(item.dataset.mobilePage);
      closeMenu();
    }
  });
  drawer.addEventListener('click',e=>{
    if(e.target===drawer)closeMenu();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!drawer.hidden)closeMenu();});
}

function buildMobileMenu_(preferredGroup=''){
  const content=$('mobileMenuContent');
  if(!content)return;
  const role=state.user?.role||'';
  const activePage=CURRENT_PAGE||'dashboard';
  const canAdmin=role==='ADMIN';

  const groups=[
    {key:'kokurikulum',label:'Kokurikulum',items:[
      ['unit','Unit Kokurikulum',''],
      ['attendance','Kehadiran','V2.4'],
      ['aktiviti','Aktiviti & Acara',''],
      ['pencapaian','Pencapaian','']
    ]},
    {key:'laporan',label:'Laporan',items:[
      ['reports','Jana Laporan',''],
    ]},
    {key:'tetapan',label:'Tetapan',items:[
      ['system-settings','Tetapan Sistem',''],
      ['guru','Guru',''],
      ['murid','Murid',''],
      ['users','Pengurusan Pengguna',''],
      ['report-templates','Edit Templat','ADMIN']
    ]}
  ];

  if(!canAdmin)groups.pop();
  const allowed=page=>{
    if(['murid','guru','users','system-settings','report-templates','penempatan'].includes(page))return canAdmin;
    return ['unit','reports','reports-edit','attendance','activity','pencapaian'].includes(page);
  };
  const isDisabled=page=>!allowed(page)||['peserta','galeri'].includes(page);

  const groupIsOpen=g=>{
    if(preferredGroup && g.key===preferredGroup)return true;
    return g.items.some(x=>x[0]===activePage);
  };

  const renderItems=(items,indent=0)=>items.map(([page,label,badge])=>{
    if(page==='report-templates'&&!canAdmin)return '';
    const disabled=isDisabled(page);
    return `<button class="mobile-menu-item ${activePage===page?'active':''} ${disabled?'disabled':''} ${indent?'nested':''}" data-mobile-page="${page}" type="button" ${disabled?'disabled':''}><span>${label}</span>${badge?`<em>${badge}</em>`:''}</button>`;
  }).join('');

  content.innerHTML=`
    <button class="mobile-main-link ${activePage==='dashboard'?'active':''}" data-mobile-page="dashboard" type="button">
      <b>Dashboard</b>
    </button>
    ${groups.map(g=>{
      const open=groupIsOpen(g);
      if(g.key!=='tetapan'){
        return `<div class="mobile-menu-group ${open?'open':''}">
          <button class="mobile-group-toggle" type="button" aria-expanded="${open?'true':'false'}"><span>${g.label}</span><b>›</b></button>
          <div class="mobile-group-items">${renderItems(g.items)}</div>
        </div>`;
      }
      const settingsOpen=open;
      return `<div class="mobile-menu-group ${settingsOpen?'open':''}">
        <button class="mobile-group-toggle" type="button" aria-expanded="${settingsOpen?'true':'false'}"><span>${g.label}</span><b>›</b></button>
        <div class="mobile-group-items">
          ${renderItems([['system-settings','Tetapan Sistem','']])}
          <div class="mobile-menu-group mobile-nested-group">
            <button class="mobile-group-toggle mobile-nested-toggle" type="button" aria-expanded="${activePage==='guru'||activePage==='murid'||activePage==='report-templates'?'true':'false'}"><span>Pengurusan Data</span><b>›</b></button>
            <div class="mobile-group-items">${renderItems([['guru','Guru',''],['murid','Murid',''],['report-templates','Edit Templat','ADMIN']])}</div>
          </div>
          ${renderItems([['users','Pengurusan Pengguna','']])}
        </div>
      </div>`
    }).join('')}
    <button class="mobile-logout-btn" data-mobile-logout type="button">Log Keluar</button>`;
}

/* Palette reference: Blue, Light, White, Gray Light, Gray, Dark Blue, Light Blue, Gray Dark, Dark.
   The lime accent is intentionally retained for unit cards and their summary. */
/* e-KOSSTA palette v3.15: FCFAEE, 035A52, D8E267, BDF806.
   Light and dark themes share the same page accents and geometry. */
const EK_PAGE_ACCENTS_={
  dashboard:'#D8E267',
  analysis:'#E6EEEE',
  unit:'#D8E267',
  'unit-overview':'#C0D6D4',
  penempatan:'#F5F8D9',
  attendance:'#BDF806',
  activity:'#C0D6D4',
  'activity-participants':'#FBFCF0',
  pencapaian:'#035A52',
  reports:'#E4EB95',
  'reports-edit':'#FCFAEE', 'report-templates':'#D1FA51',
  murid:'#F2F7F6',
  guru:'#EDF2BB',
  users:'#EEFDC1',
  'system-settings':'#035A52'
};
const EK_PAGE_ACCENT_INKS_={
  dashboard:'#035A52', analysis:'#035A52', unit:'#035A52', 'unit-overview':'#035A52',
  penempatan:'#035A52', attendance:'#035A52', activity:'#035A52',
  'activity-participants':'#035A52', pencapaian:'#FCFAEE', reports:'#035A52',
  'reports-edit':'#035A52', 'report-templates':'#035A52', murid:'#035A52', guru:'#035A52',
  users:'#035A52', 'system-settings':'#FCFAEE'
};
const EK_PAGE_ACCENTS_DARK_={...EK_PAGE_ACCENTS_};
const EK_PAGE_ACCENT_DARK_INKS_={...EK_PAGE_ACCENT_INKS_};
function setPageAccent_(page){
  const root=document.documentElement;
  const key=String(page||'dashboard');
  root.style.setProperty('--page-accent',EK_PAGE_ACCENTS_[key]||'#D8E267');
  root.style.setProperty('--page-accent-ink',EK_PAGE_ACCENT_INKS_[key]||'#FFFFFF');
  root.style.setProperty('--page-accent-dark',EK_PAGE_ACCENTS_DARK_[key]||'#024640');
  root.style.setProperty('--page-accent-dark-ink',EK_PAGE_ACCENT_DARK_INKS_[key]||'#FFFFFF');
  root.dataset.currentPage=key;
}

function pageGroupForPage_(page){
  if(['unit','unit-overview','unit-ajk','penempatan','attendance','activity','activity-participants','pencapaian'].includes(page))return 'kokurikulum';
  if(['reports','reports-edit'].includes(page))return 'laporan';
  if(['guru','murid','users','system-settings','report-templates'].includes(page))return 'tetapan';
  return '';
}
function defaultPageForGroup_(key){
  const role=state.user?.role||'';
  if(key==='kokurikulum')return 'unit';
  if(key==='laporan')return 'reports';
  if(key==='tetapan')return role==='ADMIN'?'murid':'murid';
  return 'dashboard';
}
function renderPageSubnav_(page){
  const host=$('pageSubnav');if(!host)return;
  // Halaman peserta ialah halaman kontekstual yang hanya dibuka melalui butang Peserta pada Aktiviti.
  // Jangan paparkan submenu Kokurikulum global di halaman ini.
  if(page==='activity-participants'||(page==='pencapaian'&&PENCAPAIAN_RECORD_MODE_)){host.hidden=true;host.innerHTML='';return;}
  const groupKey=pageGroupForPage_(page);
  const config={
    kokurikulum:{label:'KOKURIKULUM',items:[
      ['unit','Unit Kokurikulum'],['attendance','Kehadiran'],['activity','Aktiviti & Acara'],['pencapaian','Pencapaian']
    ]},
    laporan:{label:'LAPORAN & DOKUMEN',items:[['reports','Jana Laporan']]},
    tetapan:{label:'PENGURUSAN DATA',items:[['murid','Murid'],['guru','Guru'],['users','Pengurusan Pengguna'],['report-templates','Edit Templat'],['system-settings','Tetapan Sistem']]}
  };
  const cfg=config[groupKey];
  if(!cfg){host.hidden=true;host.innerHTML='';return;}
  const isAdmin=state.user?.role==='ADMIN';
  const items=cfg.items.filter(([p,label,disabled])=>{
    if(['murid','guru','users','system-settings','report-templates','penempatan'].includes(p)&&!isAdmin)return false;
    return true;
  });
  const current=(['unit-overview','unit-ajk'].includes(page)?'unit':(page==='reports-edit'?'reports':page));
  host.hidden=false;
  host.innerHTML=`<div class="page-subnav-top"><span class="page-subnav-kicker">${cfg.label}</span><span class="page-subnav-current">${(items.find(x=>x[0]===current)||[])[1]||''}</span></div><div class="page-subnav-tabs" role="tablist" aria-label="${cfg.label}">${items.map(([p,label,disabled])=>{
    const off=!!disabled;
    return `<button class="subnav-tab ${current===p?'active':''} ${off?'disabled':''}" type="button" role="tab" aria-selected="${current===p?'true':'false'}" data-subnav-page="${p}" ${off?'disabled':''}>${label}${off?'<span class="subnav-soon">Akan datang</span>':''}</button>`;
  }).join('')}</div>`;
  host.querySelectorAll('[data-subnav-page]').forEach(btn=>btn.addEventListener('click',()=>showPage(btn.dataset.subnavPage)));
}
function switchAnalysisView_(view){
  const isPajsk=view==='pajsk';
  const overview=$('analysisOverviewView'),pajsk=$('analysisPajskView');
  if(overview)overview.hidden=isPajsk;
  if(pajsk)pajsk.hidden=!isPajsk;
  const tabA=$('analysisOverviewTab'),tabB=$('analysisPajskTab');
  if(tabA){tabA.classList.toggle('active',!isPajsk);tabA.setAttribute('aria-selected',String(!isPajsk));}
  if(tabB){tabB.classList.toggle('active',isPajsk);tabB.setAttribute('aria-selected',String(isPajsk));}
  if(isPajsk&&!PAJSK_CACHE_.loaded)loadPajskClassReport_(false);
}
function pajskEsc_(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function pajskAchievementLabel_(achievement,fallbackActivity=''){
  const involvement=String(achievement?.TAJUK_PENGLIBATAN??'').trim();
  const name=String(achievement?.NAMA_PENCAPAIAN||fallbackActivity||'Pencapaian').trim();
  const position=String(achievement?.KEDUDUKAN||'').trim();
  const parts=[];
  if(involvement)parts.push(`Penglibatan ${involvement}`);
  if(name)parts.push(name);
  if(position)parts.push(position);
  return parts.join(' — ')||'Rekod pencapaian';
}
function pajskUnitAchievementRecords_(student,category,unit){
  const catKey=analysisCategoryKey_(category);
  const unitId=String(unit?.UNIT_ID||'').trim();
  const unitName=String(unit?.NAMA_UNIT||'').trim().toLocaleLowerCase('ms');
  const categoryUnits=((student?.CATEGORIES&&student.CATEGORIES[category])||[]);
  const result=[];
  const seen=new Set();
  (student?.EVENTS||[]).forEach(event=>{
    (event.PENCAPAIAN||[]).forEach(a=>{
      const achievementCategory=analysisCategoryKey_(a.KATEGORI_PENYERTAAN||a.KATEGORI||event.KATEGORI||'');
      if(achievementCategory!==catKey)return;
      const achievementUnitId=String(a.UNIT_ID||'').trim();
      const achievementUnitName=String(event.NAMA_UNIT||'').trim().toLocaleLowerCase('ms');
      let matches=false;
      if(achievementUnitId&&unitId)matches=achievementUnitId===unitId;
      else if(achievementUnitName)matches=achievementUnitName===unitName;
      else if(categoryUnits.length===1)matches=true;
      if(!matches)return;
      const label=pajskAchievementLabel_(a,event.NAMA_AKTIVITI||'');
      const key=String(a.PENCAPAIAN_ID||'')+'|'+label+'|'+String(event.AKTIVITI_ID||'');
      if(seen.has(key))return;
      seen.add(key);
      result.push({label,achievement:a,event});
    });
  });
  return result;
}
function pajskCategoryCell_(student,category){
  const units=(student.CATEGORIES&&student.CATEGORIES[category])||[];
  const events=(student.EVENTS||[]).filter(e=>analysisCategoryKey_(e.KATEGORI)===analysisCategoryKey_(category));
  const unitHtml=units.length?units.map(u=>{
    const awards=pajskUnitAchievementRecords_(student,category,u);
    const awardHtml=awards.map(x=>`<span class="analysis-pajsk-achievement">${pajskEsc_(x.label)}</span>`).join('');
    return `<div class="analysis-pajsk-unit-record"><b>${pajskEsc_(u.NAMA_UNIT||'Unit')}</b>${awardHtml}</div>`;
  }).join(''):'<b>Tiada unit dipautkan</b>';
  const activityCount=events.length;
  const unassignedAchievements=[];
  if(!units.length){
    events.forEach(e=>(e.PENCAPAIAN||[]).forEach(a=>{
      if(analysisCategoryKey_(a.KATEGORI_PENYERTAAN||a.KATEGORI||e.KATEGORI||'')===analysisCategoryKey_(category))unassignedAchievements.push(pajskAchievementLabel_(a,e.NAMA_AKTIVITI||''));
    }));
  }
  const unassignedHtml=unassignedAchievements.map(label=>`<span class="analysis-pajsk-achievement">${pajskEsc_(label)}</span>`).join('');
  return `<div class="analysis-pajsk-category-cell">${unitHtml}<small>${units.length?units.length+' unit':''}${units.length&&activityCount?' • ':''}${activityCount} aktiviti berkaitan</small>${unassignedHtml}</div>`;
}
function pajskEventCell_(events){
  if(!events.length)return '<span class="analysis-no-data">TIADA REKOD</span>';
  const ordered=events.slice().sort((a,b)=>Number((b.PENCAPAIAN||[]).length>0)-Number((a.PENCAPAIAN||[]).length>0));
  const visible=ordered.slice(0,3);
  const rows=visible.map(e=>{
    const achievements=(e.PENCAPAIAN||[]).map(a=>`<span class="analysis-pajsk-achievement">${pajskEsc_(pajskAchievementLabel_(a,e.NAMA_AKTIVITI||''))}</span>`).join('');
    const meta=[e.PERINGKAT,analysisDateLabel_(e.TARIKH)].filter(x=>x&&x!=='-').join(' • ');
    return `<div class="analysis-pajsk-event-record"><b>${pajskEsc_(e.NAMA_AKTIVITI||'Aktiviti')}</b>${meta?`<small>${pajskEsc_(meta)}</small>`:''}${achievements}</div>`;
  }).join('');
  const more=ordered.length>visible.length?`<span class="analysis-pajsk-more">+${ordered.length-visible.length} lagi</span>`:'';
  return `<div class="analysis-pajsk-category-cell"><b>${events.length} acara / penyertaan</b>${rows}${more}</div>`;
}
async function loadPajskClassReport_(force=false){
  if(!$('analysisPajskView')||!state.token)return;
  const year=String($('analysisPajskYearFilter')?.value||new Date().getFullYear());
  // Modul memaparkan semua kelas. Kelas terpilih digunakan khusus untuk cetakan sahaja.
  if(!force&&PAJSK_CACHE_.loaded&&PAJSK_CACHE_.year===year){renderPajskClassReport_();updatePajskPrintScope_();return;}
  const status=$('analysisPajskStatus');if(status)status.textContent=`Memuatkan rekod PAJSK semua kelas (${year})...`;
  ['analysisPajskPrintBtn','analysisPajskExportBtn'].forEach(id=>{const b=$(id);if(b)b.disabled=true;});
  const host=$('analysisPajskTableWrap');if(host)host.innerHTML='<div class="analysis-empty">Mengambil rekod semua kelas daripada Google Sheets...</div>';
  try{
    const d=await apiGet('getPajskClassReport',{token:state.token,tahun:year,kelas:''});
    if(!d||d.ok===false)throw Error(d?.error||'Data PAJSK tidak dapat dimuatkan.');
    const selectedYear=String($('analysisPajskYearFilter')?.value||year);
    PAJSK_CACHE_={loaded:true,year:String(d.year||year),kelas:'',classes:Array.isArray(d.classes)?d.classes:[],years:Array.isArray(d.years)?d.years:[],data:Array.isArray(d.data)?d.data:[],scoreNote:String(d.scoreNote||'')};
    const yearSelect=$('analysisPajskYearFilter');
    if(yearSelect){
      const yearList=[...new Set([...PAJSK_CACHE_.years,selectedYear,String(new Date().getFullYear())])].filter(x=>/^\d{4}$/.test(String(x))).sort((a,b)=>Number(b)-Number(a));
      const current=selectedYear;yearSelect.innerHTML=yearList.map(y=>`<option value="${pajskEsc_(y)}">${pajskEsc_(y)}</option>`).join('');yearSelect.value=yearList.includes(current)?current:PAJSK_CACHE_.year;
    }
    const classSelect=$('analysisPajskClassFilter');
    if(classSelect){
      const current=String(classSelect.value||'');
      classSelect.innerHTML='<option value="">Semua Kelas</option>'+PAJSK_CACHE_.classes.map(c=>`<option value="${pajskEsc_(c)}">${pajskEsc_(c)}</option>`).join('');
      classSelect.value=PAJSK_CACHE_.classes.includes(current)?current:'';
    }
    // Hanya perubahan tahun perlu memuat semula data. Dropdown kelas ialah skop cetakan sahaja.
    if(String($('analysisPajskYearFilter')?.value||year)!==year){
      PAJSK_CACHE_.loaded=false;return loadPajskClassReport_(true);
    }
    renderPajskClassReport_();
    const printBtn=$('analysisPajskPrintBtn'),exportBtn=$('analysisPajskExportBtn');
    if(printBtn)printBtn.disabled=PAJSK_CACHE_.data.length===0;
    if(exportBtn)exportBtn.disabled=PAJSK_CACHE_.data.length===0;
    if(status)status.textContent=`Paparan semua kelas • ${PAJSK_CACHE_.data.length} murid • Tahun ${PAJSK_CACHE_.year}. Penapis kelas hanya digunakan untuk cetakan; carian tidak mengehadkan cetakan.`;
    updatePajskPrintScope_();
  }catch(e){
    PAJSK_CACHE_.loaded=false;
    if(host)host.innerHTML=`<div class="analysis-empty">${pajskEsc_(e.message||'Gagal memuatkan data PAJSK.')}<br><button type="button" class="btn secondary" id="analysisPajskRetryBtn">Cuba Semula</button></div>`;
    if(status)status.textContent='Ralat memuatkan Analisis PAJSK. Semak URL Apps Script dan pastikan backend v15 telah dideploy.';
    $('analysisPajskRetryBtn')?.addEventListener('click',()=>loadPajskClassReport_(true));
    toast(e.message||'Data PAJSK gagal dimuatkan.');
  }
}
function renderPajskClassReport_(){
  const host=$('analysisPajskTableWrap');if(!host)return;
  const all=PAJSK_CACHE_.data||[];
  const selectedClass=String($('analysisPajskClassFilter')?.value||'').trim();
  const selectedClassKey=selectedClass.toLocaleLowerCase('ms');
  const q=String($('analysisPajskSearch')?.value||'').trim().toLowerCase();
  // Penapis kelas mengehadkan senarai pada skrin; eksport dan cetakan masih menggunakan skop tersendiri.
  const rows=all.filter(s=>{
    const studentClass=String(s.KELAS||'').trim();
    const classMatch=!selectedClass||studentClass.toLocaleLowerCase('ms')===selectedClassKey;
    const searchMatch=!q||[s.NAMA,s.NO_KP,s.KELAS,s.TINGKATAN].join(' ').toLowerCase().includes(q);
    return classMatch&&searchMatch;
  });
  const hasTwo=all.filter(s=>Number(s.CATEGORY_COUNT)>=2).length;
  const hasEvents=all.filter(s=>Number(s.ACTIVITY_COUNT)>0).length;
  const incomplete=all.filter(s=>s.NEEDS_REVIEW).length;
  analysisSetKpi_('analysisPajskKpiStudents',all.length.toLocaleString('ms-MY'));
  analysisSetKpi_('analysisPajskKpiCategories',hasTwo.toLocaleString('ms-MY'));
  analysisSetKpi_('analysisPajskKpiEvents',hasEvents.toLocaleString('ms-MY'));
  analysisSetKpi_('analysisPajskKpiIncomplete',incomplete.toLocaleString('ms-MY'));
  const count=$('analysisPajskStudentCount');if(count)count.textContent=`${rows.length} MURID`;
  if(!rows.length){host.innerHTML='<div class="analysis-empty">Tiada murid sepadan dengan kelas atau carian yang dipilih.</div>';return;}
  host.innerHTML=`<table class="analysis-table analysis-pajsk-table"><thead><tr><th>MURID</th><th>KELAB / PERSATUAN</th><th>BADAN BERUNIFORM</th><th>SUKAN / PERMAINAN</th><th>ACARA / PENYERTAAN</th><th>JUMLAH REKOD</th><th>GRED</th><th>TINDAKAN</th></tr></thead><tbody>${rows.map(s=>{
    const events=(s.EVENTS||[]);
    const eventHtml=pajskEventCell_(events);
    return `<tr><td><div class="analysis-pajsk-student-cell"><b>${pajskEsc_(s.NAMA)}</b><small>${pajskEsc_(s.KELAS)}</small></div></td><td>${pajskCategoryCell_(s,'KELAB / PERSATUAN')}</td><td>${pajskCategoryCell_(s,'UNIT BERUNIFORM')}</td><td>${pajskCategoryCell_(s,'SUKAN / PERMAINAN')}</td><td>${eventHtml}</td><td><span class="analysis-pajsk-record-count">${Number(s.JUMLAH_REKOD)||0}</span><small>aktiviti direkod</small></td><td><span class="analysis-status-pill is-pending" title="Skor PAJSK rasmi belum dikira">—</span><small class="analysis-pajsk-grade-note">Belum dikira</small></td><td><button class="btn secondary small" type="button" data-pajsk-detail="${pajskEsc_(s.NO_KP)}">◉ Detail</button></td></tr>`;
  }).join('')}</tbody></table>`;
  host.querySelectorAll('[data-pajsk-detail]').forEach(btn=>btn.addEventListener('click',()=>openPajskStudentDetail_(btn.dataset.pajskDetail)));
  const updated=$('analysisPajskUpdatedAt');if(updated)updated.textContent=`KEMAS KINI TERAKHIR: ${new Date().toLocaleString('ms-MY',{dateStyle:'medium',timeStyle:'short'})} • TAHUN ${PAJSK_CACHE_.year}`;
}
function pajskStudentDetailHTML_(s){
  const cats=PAJSK_CATEGORIES_.map(cat=>{
    const units=(s.CATEGORIES&&s.CATEGORIES[cat])||[];
    if(!units.length)return `<tr><td>${pajskEsc_(PAJSK_CATEGORY_LABELS_[cat])}</td><td>Tiada penempatan aktif</td><td>—</td><td>—</td><td>${(s.EVENTS||[]).filter(e=>e.KATEGORI===cat).length}</td><td>—</td></tr>`;
    return units.map((u,i)=>{const awards=pajskUnitAchievementRecords_(s,cat,u);const awardHtml=awards.map(x=>`<small class="analysis-pajsk-achievement">${pajskEsc_(x.label)}</small>`).join('');return `<tr><td>${i===0?pajskEsc_(PAJSK_CATEGORY_LABELS_[cat]):''}</td><td><b>${pajskEsc_(u.NAMA_UNIT)}</b>${awardHtml}</td><td>${pajskEsc_(u.JAWATAN||'Tiada jawatan')}</td><td>${u.JUMLAH_KEHADIRAN?`${Number(u.HADIR||0)}/${Number(u.JUMLAH_KEHADIRAN)} (${u.PERATUS_KEHADIRAN}%)`:'Tiada rekod kehadiran'}</td><td>${(s.EVENTS||[]).filter(e=>analysisCategoryKey_(e.KATEGORI)===analysisCategoryKey_(cat)).length}</td><td>${awards.length||((s.EVENTS||[]).filter(e=>analysisCategoryKey_(e.KATEGORI)===analysisCategoryKey_(cat)).reduce((n,e)=>n+(e.PENCAPAIAN||[]).length,0))}</td></tr>`}).join('');
  }).join('');
  const ev=(s.EVENTS||[]).map(e=>`<tr><td>${pajskEsc_(e.NAMA_AKTIVITI)}</td><td>${pajskEsc_(PAJSK_CATEGORY_LABELS_[e.KATEGORI]||e.KATEGORI||'Acara / Penyertaan')}</td><td>${pajskEsc_(e.NAMA_UNIT||'—')}</td><td>${pajskEsc_(analysisDateLabel_(e.TARIKH))}</td><td>${pajskEsc_(e.PERINGKAT||'—')}</td><td>${pajskEsc_(e.PERANAN||'PESERTA')}</td><td>${(e.PENCAPAIAN||[]).length?(e.PENCAPAIAN||[]).map(a=>`<span class="analysis-pajsk-achievement">${pajskEsc_(pajskAchievementLabel_(a,e.NAMA_AKTIVITI||''))}</span>`).join(''):'—'}</td></tr>`).join('');
  return `<div class="analysis-pajsk-detail-kpis"><div><small>UNIT AKTIF</small><b>${PAJSK_CATEGORIES_.reduce((n,c)=>n+((s.CATEGORIES&&s.CATEGORIES[c])||[]).length,0)}</b></div><div><small>AKTIVITI DIREKOD</small><b>${(s.EVENTS||[]).length}</b></div><div><small>PENCAPAIAN</small><b>${Number(s.ACHIEVEMENT_COUNT)||0}</b></div><div><small>GRED</small><b>—</b></div></div>
  <section class="analysis-panel analysis-table-panel"><div class="analysis-panel-heading"><div><h3>Ringkasan Komponen</h3><p>Kedudukan jawatan dan kehadiran dipaparkan daripada rekod sebenar.</p></div></div><div class="table-wrap"><table class="analysis-table analysis-pajsk-detail-table"><thead><tr><th>KOMPONEN</th><th>UNIT</th><th>JAWATAN</th><th>KEHADIRAN</th><th>PENYERTAAN</th><th>PENCAPAIAN</th></tr></thead><tbody>${cats}</tbody></table></div></section>
  <section class="analysis-panel analysis-table-panel"><div class="analysis-panel-heading"><div><h3>Aktiviti / Acara yang Disertai</h3><p>Senarai berasal daripada pendaftaran peserta dan rekod pencapaian aktif.</p></div><span class="analysis-count">${(s.EVENTS||[]).length} REKOD</span></div><div class="table-wrap">${ev?`<table class="analysis-table analysis-pajsk-detail-table"><thead><tr><th>AKTIVITI</th><th>KATEGORI</th><th>UNIT</th><th>TARIKH</th><th>PERINGKAT</th><th>PERANAN</th><th>PENCAPAIAN</th></tr></thead><tbody>${ev}</tbody></table>`:'<div class="analysis-empty">Tiada rekod aktiviti atau acara untuk murid ini.</div>'}</div></section>
  <p class="analysis-pajsk-note"><b>PERINGATAN</b><span>Jumlah penyertaan dan pencapaian bukan skor rasmi PAJSK. Skor /110 dan gred hanya boleh dijana selepas rubrik pemarkahan rasmi sekolah dimasukkan ke sistem.</span></p>`;
}
function openPajskStudentDetail_(noKp){
  const student=(PAJSK_CACHE_.data||[]).find(s=>String(s.NO_KP||'')===String(noKp||''));if(!student)return toast('Rekod murid tidak ditemui dalam tapisan semasa.');
  const modal=$('analysisPajskDetailModal');if(!modal)return;
  $('analysisPajskDetailTitle').textContent=student.NAMA||'Butiran Murid';
  $('analysisPajskDetailMeta').textContent=`Tahun ${PAJSK_CACHE_.year} • Kelas ${student.KELAS}`;
  $('analysisPajskDetailContent').innerHTML=pajskStudentDetailHTML_(student);
  modal.dataset.studentKp=String(student.NO_KP);modal.hidden=false;
}
function closePajskStudentDetail_(){const modal=$('analysisPajskDetailModal');if(modal)modal.hidden=true;}
function pajskPrintWindow_(title,content,orientation='landscape'){
  if(window.__EKOSSTA_CLEAN_PRIVACY_HTML__)content=window.__EKOSSTA_CLEAN_PRIVACY_HTML__(content);
  const win=window.open('','_blank');if(!win){toast('Pelayar menyekat tetingkap cetakan. Benarkan pop-up untuk '+getAppName_()+'.');return null;}
  const css=`@page{size:A4 ${orientation};margin:10mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff!important;color:#14211b!important;font:9pt Arial,sans-serif;line-height:1.35}.print-wrap{max-width:100%;margin:0 auto}.print-topline{display:flex;justify-content:space-between;gap:10px;border-bottom:2px solid #035A52;padding-bottom:6px;color:#035A52;font-size:8pt;font-weight:700;letter-spacing:.06em}.print-title{text-align:center;margin:10px 0 8px}.print-title h1{font-size:16pt;margin:0 0 4px}.print-title p{margin:2px 0;font-size:8pt}.print-meta{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:6px 0;margin-bottom:6px;border-bottom:1px solid #b7c7bd;font-size:8pt}.print-section{font-size:10pt;margin:10px 0 4px;padding-bottom:4px;border-bottom:1px solid #83a696}.print-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:7.5pt} .print-table th{background:#172A22!important;color:#D8E267!important;text-align:left;font-size:7pt;letter-spacing:.03em}.print-table th,.print-table td{border:1px solid #aabbb1;padding:4px 5px;vertical-align:top;overflow-wrap:anywhere}.print-table tr{break-inside:avoid;page-break-inside:avoid}.print-small{font-size:7pt;color:#52655b;display:block;margin-top:2px}.print-list{margin:2px 0 0;padding-left:12px}.print-note{margin-top:8px;padding:7px;border:1px solid #b4c7bd;background:#f2f5e9;font-size:7.5pt}.print-signatures{display:grid;grid-template-columns:1fr 1fr;gap:35mm;margin-top:22mm;font-size:8pt;text-align:center}.print-signatures div{border-top:1px solid #596e63;padding-top:5px}@media screen{body{padding:10mm;background:#eef1e9!important}.print-wrap{background:#fff;padding:10mm;box-shadow:0 0 0 1px #d7ded7}}`;
  win.document.open();win.document.write(`<!doctype html><html lang="ms"><head><meta charset="utf-8"><title>${pajskEsc_(title)}</title><style>${css}</style></head><body><main class="print-wrap">${content}</main><script>window.addEventListener('load',function(){setTimeout(function(){window.focus();window.print()},450)});<\/script></body></html>`);win.document.close();return win;
}
function pajskClassPrintHtml_(dataOverride,kelasOverride){
  const data=Array.isArray(dataOverride)?dataOverride:(PAJSK_CACHE_.data||[]);const year=PAJSK_CACHE_.year||new Date().getFullYear();const kelas=String(kelasOverride||'').trim()||'Semua Kelas';
  const categoryContent=(s,cat)=>{
    const units=(s.CATEGORIES&&s.CATEGORIES[cat])||[];
    const ev=(s.EVENTS||[]).filter(e=>analysisCategoryKey_(e.KATEGORI)===analysisCategoryKey_(cat));
    let out=units.map(u=>{
      const awards=pajskUnitAchievementRecords_(s,cat,u);
      return `<div><b>${pajskEsc_(u.NAMA_UNIT)}</b>${awards.map(x=>`<span class="print-small">${pajskEsc_(x.label)}</span>`).join('')}</div>`;
    }).join('');
    if(ev.length)out+=`${out?'<br>':''}<span class="print-small">${ev.map(e=>`${pajskEsc_(e.NAMA_AKTIVITI)}${(e.PENCAPAIAN||[]).length?' — '+e.PENCAPAIAN.map(a=>pajskEsc_(pajskAchievementLabel_(a,e.NAMA_AKTIVITI||''))).join('; '):''}`).join('<br>')}</span>`;
    return out||'<span class="print-small">Tiada rekod</span>';
  };
  const rows=data.map(s=>`<tr><td><b>${pajskEsc_(s.NAMA)}</b><span class="print-small">${pajskEsc_(s.KELAS)} • Ting. ${pajskEsc_(s.TINGKATAN)}</span></td><td>${categoryContent(s,'KELAB / PERSATUAN')}</td><td>${categoryContent(s,'UNIT BERUNIFORM')}</td><td>${categoryContent(s,'SUKAN / PERMAINAN')}</td><td>${(s.EVENTS||[]).length?(s.EVENTS||[]).map(e=>`<div><b>${pajskEsc_(e.NAMA_AKTIVITI)}</b><span class="print-small">${pajskEsc_(e.PERINGKAT||'')} ${e.TARIKH?'• '+pajskEsc_(analysisDateLabel_(e.TARIKH)):''}${e.PENCAPAIAN&&e.PENCAPAIAN.length?' • '+e.PENCAPAIAN.map(a=>pajskEsc_(pajskAchievementLabel_(a,e.NAMA_AKTIVITI||''))).join('; '):''}</span></div>`).join(''):'<span class="print-small">Tiada acara direkod</span>'}</td><td style="text-align:center"><b>${Number(s.JUMLAH_REKOD)||0}</b></td><td style="text-align:center">—<span class="print-small">Belum dikira</span></td></tr>`).join('');
  const recorded=data.reduce((n,s)=>n+Number(s.JUMLAH_REKOD||0),0);
  return `<div class="print-topline"><span>${pajskEsc_(getAppName_())} • SISTEM KOKURIKULUM</span><span>ANALISIS PAJSK</span></div><header class="print-title"><h1>Ringkasan PAJSK / Penyertaan Kokurikulum Murid</h1><p>Tahun ${pajskEsc_(year)} • Kelas: ${pajskEsc_(kelas)}</p><p>Data direkod melalui unit kokurikulum dan aktiviti/acara.</p></header><div class="print-meta"><span>Bilangan murid: <b>${data.length}</b></span><span>Jumlah rekod aktiviti: <b>${recorded}</b></span><span>Dijana: ${pajskEsc_(new Date().toLocaleDateString('ms-MY',{day:'2-digit',month:'long',year:'numeric'}))}</span></div><h2 class="print-section">Senarai Pemarkahan PAJSK Murid</h2><table class="print-table"><colgroup><col style="width:16%"><col style="width:12%"><col style="width:12%"><col style="width:12%"><col style="width:34%"><col style="width:7%"><col style="width:7%"></colgroup><thead><tr><th>MURID</th><th>KELAB / PERSATUAN</th><th>BADAN BERUNIFORM</th><th>SUKAN / PERMAINAN</th><th>ACARA / PENYERTAAN</th><th>JUMLAH REKOD</th><th>GRED</th></tr></thead><tbody>${rows}</tbody></table><div class="print-note"><b>Nota:</b> Laporan ini ialah ringkasan rekod penyertaan dan pencapaian yang tersedia dalam e-KOSSTA. Skor /110 dan gred rasmi PAJSK tidak dijana kerana rubrik pemarkahan tidak dikonfigurasi dalam struktur data semasa.</div><div class="print-signatures"><div>Disediakan oleh / Guru Kelas</div><div>Disemak oleh / Penyelaras Kokurikulum</div></div>`;
}
function updatePajskPrintScope_(){
  const selected=String($('analysisPajskClassFilter')?.value||'').trim();
  const btn=$('analysisPajskPrintBtn');
  if(btn)btn.textContent=selected?'▣ Cetak Kelas / PDF':'▣ Cetak Semua Kelas / PDF';
  const status=$('analysisPajskStatus');
  if(status&&PAJSK_CACHE_.loaded){
    if(selected){
      const selectedKey=selected.toLocaleLowerCase('ms');
      const classRows=(PAJSK_CACHE_.data||[]).filter(s=>String(s.KELAS||'').trim().toLocaleLowerCase('ms')===selectedKey);
      const query=String($('analysisPajskSearch')?.value||'').trim();
      status.textContent=`Paparan ditapis kepada kelas ${selected} (${classRows.length} murid).${query?' Carian turut menapis senarai di skrin.':' '} Cetakan merangkumi semua murid kelas ini.`;
    }else{
      status.textContent=`Paparan semua kelas • ${(PAJSK_CACHE_.data||[]).length} murid • Tahun ${PAJSK_CACHE_.year}. Carian menapis senarai di skrin; cetakan merangkumi semua kelas.`;
    }
  }
}
function printPajskClass_(){
  if(!PAJSK_CACHE_.loaded)return toast('Muatkan data PAJSK terlebih dahulu.');
  const selected=String($('analysisPajskClassFilter')?.value||'').trim();
  const all=PAJSK_CACHE_.data||[];
  const data=selected?all.filter(s=>String(s.KELAS||'').trim().toLocaleLowerCase('ms')===selected.toLocaleLowerCase('ms')):all;
  if(!data.length)return toast(selected?`Tiada murid untuk kelas ${selected}.`:'Tiada murid untuk dicetak.');
  const title=`PAJSK ${selected||'Semua-Kelas'} ${PAJSK_CACHE_.year}`;
  pajskPrintWindow_(title,pajskClassPrintHtml_(data,selected),'landscape');
}
function printPajskStudent_(){
  const modal=$('analysisPajskDetailModal');const kp=modal?.dataset.studentKp;const s=(PAJSK_CACHE_.data||[]).find(x=>String(x.NO_KP)===String(kp));if(!s)return toast('Murid tidak ditemui.');
  const catRows=PAJSK_CATEGORIES_.map(cat=>{
    const units=(s.CATEGORIES&&s.CATEGORIES[cat])||[];
    if(!units.length)return `<tr><td>${pajskEsc_(PAJSK_CATEGORY_LABELS_[cat])}</td><td>Tiada penempatan aktif</td><td>—</td><td>—</td><td>0</td><td>0</td></tr>`;
    return units.map((u,i)=>{const awards=pajskUnitAchievementRecords_(s,cat,u);const awardHtml=awards.map(x=>`<span class="print-small">${pajskEsc_(x.label)}</span>`).join('');return `<tr><td>${i===0?pajskEsc_(PAJSK_CATEGORY_LABELS_[cat]):''}</td><td><b>${pajskEsc_(u.NAMA_UNIT)}</b>${awardHtml}</td><td>${pajskEsc_(u.JAWATAN||'Ahli')}</td><td>${u.JUMLAH_KEHADIRAN?`${Number(u.HADIR||0)}/${Number(u.JUMLAH_KEHADIRAN)} (${Number(u.PERATUS_KEHADIRAN)||0}%)`:'Tiada rekod'}</td><td>${(s.EVENTS||[]).filter(e=>analysisCategoryKey_(e.KATEGORI)===analysisCategoryKey_(cat)).length}</td><td>${awards.length||((s.EVENTS||[]).filter(e=>analysisCategoryKey_(e.KATEGORI)===analysisCategoryKey_(cat)).reduce((n,e)=>n+(e.PENCAPAIAN||[]).length,0))}</td></tr>`}).join('');
  }).join('');
  const events=(s.EVENTS||[]).map(e=>`<tr><td>${pajskEsc_(e.NAMA_AKTIVITI||'Aktiviti')}</td><td>${pajskEsc_(PAJSK_CATEGORY_LABELS_[e.KATEGORI]||e.KATEGORI||'Acara / Penyertaan')}</td><td>${pajskEsc_(e.NAMA_UNIT||'—')}</td><td>${pajskEsc_(analysisDateLabel_(e.TARIKH))}</td><td>${pajskEsc_(e.PERINGKAT||'—')}</td><td>${pajskEsc_(e.PERANAN||'PESERTA')}</td><td>${(e.PENCAPAIAN||[]).map(a=>`<span class="analysis-pajsk-achievement">${pajskEsc_(pajskAchievementLabel_(a,e.NAMA_AKTIVITI||''))}</span>`).join('')||'—'}</td></tr>`).join('');
  const wrapper=`<div class="print-topline"><span>${pajskEsc_(getAppName_())} • SISTEM KOKURIKULUM</span><span>ANALISIS PAJSK</span></div><header class="print-title"><h1>Rekod Penyertaan Kokurikulum Murid</h1><h2>${pajskEsc_(s.NAMA)}</h2><p>Tahun ${pajskEsc_(PAJSK_CACHE_.year)} • Kelas ${pajskEsc_(s.KELAS)} • Tingkatan ${pajskEsc_(s.TINGKATAN)}</p></header><h2 class="print-section">Ringkasan Komponen</h2><table class="print-table"><thead><tr><th>KOMPONEN</th><th>UNIT</th><th>JAWATAN</th><th>KEHADIRAN</th><th>PENYERTAAN</th><th>PENCAPAIAN</th></tr></thead><tbody>${catRows}</tbody></table><h2 class="print-section">Aktiviti / Acara yang Disertai</h2><table class="print-table"><thead><tr><th>AKTIVITI</th><th>KATEGORI</th><th>UNIT</th><th>TARIKH</th><th>PERINGKAT</th><th>PERANAN</th><th>PENCAPAIAN</th></tr></thead><tbody>${events||'<tr><td colspan="7">Tiada rekod aktiviti atau acara.</td></tr>'}</tbody></table><div class="print-note"><b>Nota:</b> Laporan ini memaparkan rekod penyertaan, kehadiran dan pencapaian yang tersedia dalam sistem. Skor /110 dan gred rasmi PAJSK tidak dikira kerana rubrik pemarkahan belum dikonfigurasi.</div><div class="print-signatures"><div>Guru Kelas</div><div>Penyelaras Kokurikulum</div></div>`;
  pajskPrintWindow_(`PAJSK ${s.NAMA}`,wrapper,'landscape');
}
const PAJSK_EXPORT_LEVELS_=[
  {key:'ANTARABANGSA',label:'ANTARABANGSA',rank:6},
  {key:'KEBANGSAAN',label:'KEBANGSAAN',rank:5},
  {key:'NEGERI',label:'NEGERI',rank:4},
  {key:'BAHAGIAN_SABAH_SARAWAK',label:'BAHAGIAN (SABAH/SARAWAK)',rank:3},
  {key:'ZON_DAERAH',label:'ZON/DAERAH',rank:2},
  {key:'SEKOLAH',label:'SEKOLAH',rank:1}
];
const PAJSK_EXPORT_POSITIONS_=[
  {key:'JOHAN',rank:1},
  {key:'NAIB_JOHAN',rank:2},
  {key:'KETIGA',rank:3},
  {key:'KEEMPAT',rank:4},
  {key:'KELIMA',rank:5}
];
const PAJSK_EXPORT_COMPONENTS_=[
  {prefix:'KELAB_PERSATUAN',label:'Kelab / Persatuan',category:'KELAB / PERSATUAN'},
  {prefix:'BADAN_BERUNIFORM',label:'Badan Beruniform',category:'UNIT BERUNIFORM'},
  {prefix:'SUKAN_PERMAINAN',label:'Sukan / Permainan',category:'SUKAN / PERMAINAN'}
];
const PAJSK_EXPORT_COMMITMENTS_=[
  'MENUNJUKKAN_KEPIMPINAN','MENGURUS_AKTIVITI','MENYEDIA_PERALATAN','MEMBANTU_GURU_ATAU_RAKAN',
  'MENGEMAS_PERALATAN','MEMBERSIH_KAWASAN','MENEPATI_WAKTU','MENUNJUKKAN_MINAT',
  'MENUNJUKKAN_KESUNGGUHAN','MENGIKUT_ARAHAN','MENCUBA','MEMBERI_KERJASAMA','NILAI_MURNI'
];
const PAJSK_EXPORT_SERVICES_=[
  'ATLET_ATAU_PESERTA_PROGRAM','KEMAHIRAN_KHUSUS_TEKNIKAL','PERSEMBAHAN_SELINGAN','MEMBANTU_MENJAYAKAN_AKTIVITI'
];
const PAJSK_EXPORT_EXTRA_COMMUNITY_=[
  'KEJIRANAN_KOMUNITI','ALAM_SEKITAR','BENCANA_ALAM','KEROHANIAN',
  'KHIDMAT_JABATAN_AGENSI','KEBUDAYAAN_KESENIAN_INTEGRASI','INSANIAH'
];
const PAJSK_EXPORT_EXTRA_AWARDS_=[
  'ANUGERAH_REMAJA_PERDANA','PROGRAM_KEPIMPINAN_GENERASI_MADANI_TIER_3','PROGRAM_KEPIMPINAN_GENERASI_MADANI_TIER_2',
  'ANUGERAH_PENGAKAP_RAJA_RAMBU_PENGAKAP_KANAK_KANAK',
  'ANUGERAH_PANDU_PUTERI_RAJA_PANDU_PUTERI_TUNAS','ANUGERAH_PUTERI_AZ_ZAHRAH_PUTERI_BONGSU_PPIM',
  'ANUGERAH_GRAND_PRIOR_PERISAI_PERKHIDMATAN_KHAS_1000_JAM_EMAS_SIJAM','ANUGERAH_KHAS_KOKURIKULUM_DAN_SUKAN_KEBANGSAAN',
  'ANUGERAH_KHAS_KOKURIKULUM_DAN_SUKAN_NEGERI','ANUGERAH_KHAS_KOKURIKULUM_DAN_SUKAN_SEKOLAH',
  'ANUGERAH_KHAS_LAIN_KEBANGSAAN','ANUGERAH_KHAS_LAIN_NEGERI','ANUGERAH_KHAS_LAIN_ZON_DAERAH_BAHAGIAN'
];
function pajskExportLevelKey_(value){
  const v=String(value||'').trim().toUpperCase().replace(/[–—]/g,'-').replace(/\s+/g,' ');
  if(v.includes('ANTARABANGSA'))return 'ANTARABANGSA';
  if(v.includes('KEBANGSAAN'))return 'KEBANGSAAN';
  if(v==='NEGERI'||v.includes(' PERINGKAT NEGERI'))return 'NEGERI';
  if(v.includes('BAHAGIAN')||v.includes('SABAH')||v.includes('SARAWAK'))return 'BAHAGIAN_SABAH_SARAWAK';
  if(v.includes('ZON')||v.includes('DAERAH'))return 'ZON_DAERAH';
  if(v.includes('SEKOLAH'))return 'SEKOLAH';
  return '';
}
function pajskExportPositionKey_(value){
  const v=String(value||'').trim().toUpperCase().replace(/[.]/g,'').replace(/\s+/g,' ');
  if(v==='JOHAN'||v==='JUARA')return 'JOHAN';
  if(v==='NAIB JOHAN'||v==='NAIB-JOHAN'||v==='RUNNER UP'||v==='NAIBJUARA')return 'NAIB_JOHAN';
  if(v==='KETIGA'||v==='TEMPAT KETIGA'||v==='3')return 'KETIGA';
  if(v==='KEEMPAT'||v==='TEMPAT KEEMPAT'||v==='4')return 'KEEMPAT';
  if(v==='KELIMA'||v==='TEMPAT KELIMA'||v==='5')return 'KELIMA';
  return '';
}
function pajskExportHeader_(){
  const h=['TAHUN','NO_KP','NAMA','JANTINA','TINGKATAN','KELAS'];
  PAJSK_EXPORT_COMPONENTS_.forEach(c=>{
    h.push(`${c.prefix}_DITAKSIR`,`${c.prefix}_AKTIVITI_KOKURIKULUM`,`${c.prefix}_JAWATAN`,`${c.prefix}_BILANGAN_UNIT`,`${c.prefix}_PELIBATAN_TERTINGGI`);
    PAJSK_EXPORT_LEVELS_.forEach(l=>[1,2,3].forEach(n=>h.push(`${c.prefix}_PELIBATAN_${l.key}_${n}`)));
    h.push(`${c.prefix}_TAHAP_PENCAPAIAN_TERTINGGI`);
    PAJSK_EXPORT_LEVELS_.forEach(l=>PAJSK_EXPORT_POSITIONS_.forEach(pos=>h.push(`${c.prefix}_PENCAPAIAN_${l.key}_${pos.key}`)));
    PAJSK_EXPORT_COMMITMENTS_.forEach((k,i)=>h.push(`${c.prefix}_KOMITMEN_${String(i+1).padStart(2,'0')}_${k}`));
    PAJSK_EXPORT_SERVICES_.forEach((k,i)=>h.push(`${c.prefix}_KHIDMAT_SUMBANGAN_${String(i+1).padStart(2,'0')}_${k}`));
    h.push(`${c.prefix}_KEHADIRAN`,`${c.prefix}_KEHADIRAN_REKOD`,`${c.prefix}_MARKAH_ELEMEN`,`${c.prefix}_MARKAH_PERATUS`,`${c.prefix}_REKOD_AKTIVITI_PENCAPAIAN`);
  });
  h.push('EKSTRA_PERKHIDMATAN','EKSTRA_ANUGERAH_KHAS');
  PAJSK_EXPORT_EXTRA_AWARDS_.forEach((k,i)=>h.push(`EKSTRA_ANUGERAH_KHAS_${String(i+1).padStart(2,'0')}_${k}`));
  ['PENERIMA','EMAS','PERAK','GANGSA'].forEach(k=>h.push(`EKSTRA_ANUGERAH_TAHAP_${k}`));
  PAJSK_EXPORT_EXTRA_COMMUNITY_.forEach(k=>h.push(`EKSTRA_KHIDMAT_MASYARAKAT_${k}`));
  h.push('EKSTRA_PROGRAM_NILAM_BINTANG','EKSTRA_TIMSS_PISA','EKSTRA_MARKAH_AKTIVITI','EKSTRA_JUMLAH_AKTIVITI_DIREKOD','EKSTRA_REKOD_AKTIVITI');
  h.push('JUMLAH_UNIT_AKTIF','JUMLAH_AKTIVITI_PENYERTAAN','JUMLAH_PENCAPAIAN','SKOR_PAJSK_RASMI','GRED_PAJSK_RASMI','NOTA_STATUS_DATA');
  return h;
}
function pajskExportStudentRow_(s){
  const row={TAHUN:PAJSK_CACHE_.year,NO_KP:s.NO_KP||'',NAMA:s.NAMA||'',JANTINA:s.JANTINA||'',TINGKATAN:s.TINGKATAN||'',KELAS:s.KELAS||''};
  const allAchievements=[];
  (s.EVENTS||[]).forEach(e=>{
    (e.PENCAPAIAN||[]).forEach(a=>{
      allAchievements.push(Object.assign({EVENT_NAME:e.NAMA_AKTIVITI||'',EVENT_DATE:e.TARIKH||'',EVENT_CATEGORY:e.KATEGORI||'',EVENT_UNIT_NAME:e.NAMA_UNIT||'',EVENT_ROLE:e.PERANAN||''},a));
    });
  });
  let totalUnits=0;
  PAJSK_EXPORT_COMPONENTS_.forEach(c=>{
    const units=((s.CATEGORIES&&s.CATEGORIES[c.category])||[]);
    const unitNames=units.map(u=>String(u.NAMA_UNIT||'').trim()).filter(Boolean);
    const roles=[...new Set(units.map(u=>String(u.JAWATAN||'').trim()).filter(Boolean))];
    const role=roles.length?roles.join(' / '):(units.length?'AHLI AKTIF':'');
    const achievements=allAchievements.filter(a=>{
      const cat=analysisCategoryKey_(a.KATEGORI_PENYERTAAN||a.KATEGORI||a.EVENT_CATEGORY||'');
      return cat===c.category;
    });
    const prefix=c.prefix;
    row[`${prefix}_DITAKSIR`]=units.length?1:0;
    row[`${prefix}_AKTIVITI_KOKURIKULUM`]=unitNames.join(' | ');
    row[`${prefix}_JAWATAN`]=role;
    row[`${prefix}_BILANGAN_UNIT`]=units.length;
    const involvementRecords=[];
    achievements.forEach(a=>{
      const n=Number(String(a.TAJUK_PENGLIBATAN||'').trim());
      const level=pajskExportLevelKey_(a.PERINGKAT);
      if(level&&[1,2,3].includes(n)){
        const key=`${prefix}_PELIBATAN_${level}_${n}`;
        row[key]=1;involvementRecords.push({level,n});
      }
    });
    PAJSK_EXPORT_LEVELS_.forEach(l=>[1,2,3].forEach(n=>{const key=`${prefix}_PELIBATAN_${l.key}_${n}`;if(row[key]===undefined)row[key]=0;}));
    const highestInvolvement=involvementRecords.slice().sort((a,b)=>{
      const la=PAJSK_EXPORT_LEVELS_.find(x=>x.key===a.level)?.rank||0;
      const lb=PAJSK_EXPORT_LEVELS_.find(x=>x.key===b.level)?.rank||0;
      return lb-la||a.n-b.n;
    })[0];
    row[`${prefix}_PELIBATAN_TERTINGGI`]=highestInvolvement?`${highestInvolvement.level}:${highestInvolvement.n}`:'';
    const achievementsWithPosition=achievements.map(a=>({a,level:pajskExportLevelKey_(a.PERINGKAT),position:pajskExportPositionKey_(a.KEDUDUKAN)})).filter(x=>x.level&&x.position);
    achievementsWithPosition.sort((x,y)=>{
      const lr=(PAJSK_EXPORT_LEVELS_.find(z=>z.key===y.level)?.rank||0)-(PAJSK_EXPORT_LEVELS_.find(z=>z.key===x.level)?.rank||0);
      return lr||((PAJSK_EXPORT_POSITIONS_.find(z=>z.key===x.position)?.rank||99)-(PAJSK_EXPORT_POSITIONS_.find(z=>z.key===y.position)?.rank||99));
    });
    const highestAchievement=achievementsWithPosition[0]||null;
    PAJSK_EXPORT_LEVELS_.forEach(l=>PAJSK_EXPORT_POSITIONS_.forEach(pos=>{row[`${prefix}_PENCAPAIAN_${l.key}_${pos.key}`]=highestAchievement&&highestAchievement.level===l.key&&highestAchievement.position===pos.key?1:0;}));
    row[`${prefix}_TAHAP_PENCAPAIAN_TERTINGGI`]=highestAchievement?`${highestAchievement.level}:${highestAchievement.position}`:'';
    // Fields below are intentionally blank: current e-KOSSTA data does not store these form selections.
    PAJSK_EXPORT_COMMITMENTS_.forEach((k,i)=>row[`${prefix}_KOMITMEN_${String(i+1).padStart(2,'0')}_${k}`]='');
    PAJSK_EXPORT_SERVICES_.forEach((k,i)=>row[`${prefix}_KHIDMAT_SUMBANGAN_${String(i+1).padStart(2,'0')}_${k}`]='');
    const actualHadir=units.reduce((n,u)=>n+Number(u.HADIR||0),0);
    row[`${prefix}_KEHADIRAN`]=units.length?Math.min(12,actualHadir):'';
    row[`${prefix}_KEHADIRAN_REKOD`]=units.length?actualHadir:'';
    row[`${prefix}_MARKAH_ELEMEN`]='';
    row[`${prefix}_MARKAH_PERATUS`]='';
    row[`${prefix}_REKOD_AKTIVITI_PENCAPAIAN`]=achievements.map(a=>`Penglibatan ${a.TAJUK_PENGLIBATAN||'-'} | ${a.NAMA_PENCAPAIAN||a.EVENT_NAME||'Pencapaian'} | ${a.KEDUDUKAN||'Kedudukan belum direkod'} | ${a.EVENT_UNIT_NAME||a.NAMA_UNIT||unitNames.join(', ')||''} | ${a.PERINGKAT||''}`.trim()).join(' ; ');
    totalUnits+=units.length;
  });
  // Ekstra Kokurikulum fields are included for the extension. They remain blank until the system stores them;
  // known uncategorised event participation is exported separately instead of pretending it is a score.
  row.EKSTRA_PERKHIDMATAN='';row.EKSTRA_ANUGERAH_KHAS='';
  PAJSK_EXPORT_EXTRA_AWARDS_.forEach((k,i)=>row[`EKSTRA_ANUGERAH_KHAS_${String(i+1).padStart(2,'0')}_${k}`]='');
  ['PENERIMA','EMAS','PERAK','GANGSA'].forEach(k=>row[`EKSTRA_ANUGERAH_TAHAP_${k}`]='');
  PAJSK_EXPORT_EXTRA_COMMUNITY_.forEach(k=>row[`EKSTRA_KHIDMAT_MASYARAKAT_${k}`]='');
  row.EKSTRA_PROGRAM_NILAM_BINTANG='';row.EKSTRA_TIMSS_PISA='';row.EKSTRA_MARKAH_AKTIVITI='';
  const extraEvents=(s.EVENTS||[]).filter(e=>!['KELAB / PERSATUAN','UNIT BERUNIFORM','SUKAN / PERMAINAN','RUMAH SUKAN'].includes(analysisCategoryKey_(e.KATEGORI||'')));
  row.EKSTRA_JUMLAH_AKTIVITI_DIREKOD=extraEvents.length;
  row.EKSTRA_REKOD_AKTIVITI=extraEvents.map(e=>`${e.NAMA_AKTIVITI||'Aktiviti'} | ${e.TARIKH||''} | ${e.PERINGKAT||''} | ${e.PERANAN||'PESERTA'}`).join(' ; ');
  row.JUMLAH_UNIT_AKTIF=totalUnits;
  row.JUMLAH_AKTIVITI_PENYERTAAN=(s.EVENTS||[]).length;
  row.JUMLAH_PENCAPAIAN=Number(s.ACHIEVEMENT_COUNT)||0;
  row.SKOR_PAJSK_RASMI='';row.GRED_PAJSK_RASMI='';
  row.NOTA_STATUS_DATA='Medan kosong bermaksud belum direkod dalam e-KOSSTA; skor rasmi tidak direka.';
  return row;
}
function pajskExtensionCsvText_(){
  const header=pajskExportHeader_();
  const rows=(PAJSK_CACHE_.data||[]).map(pajskExportStudentRow_);
  const quote=value=>`"${String(value??'').replace(/"/g,'""')}"`;
  return '\uFEFF'+[header,...rows.map(obj=>header.map(k=>obj[k]??''))].map(r=>r.map(quote).join(',')).join('\r\n');
}
function exportPajskClassCsv_(){
  if(!PAJSK_CACHE_.loaded||!(PAJSK_CACHE_.data||[]).length)return toast('Tiada data PAJSK untuk dieksport.');
  const csv=pajskExtensionCsvText_();
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download=`e-KOSSTA-PAJSK-Extension-${PAJSK_CACHE_.year}.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  toast(`CSV terperinci untuk extension dimuat turun: ${PAJSK_CACHE_.data.length} murid, ${header.length} kolum. Medan yang belum disimpan dikosongkan.`);
}

function analysisNum_(value){const n=Number(value);return Number.isFinite(n)?n:0;}
function analysisYear_(value){const match=String(value??'').match(/^(\d{4})/);return match?match[1]:'';}
function analysisEsc_(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function analysisActive_(row){return String(row?.STATUS??'AKTIF').trim().toUpperCase()==='AKTIF';}
function analysisCategoryKey_(value){
  const v=String(value||'').trim().toUpperCase().replace(/\s*\/\s*/g,' / ').replace(/\s+/g,' ');
  if(v==='UNIT BERUNIFORM')return 'UNIT BERUNIFORM';
  if(['KELAB','KELAB / PERSATUAN','KELAB/PERSATUAN','KELAB & PERSATUAN','KELAB DAN PERSATUAN'].includes(v))return 'KELAB / PERSATUAN';
  if(['SUKAN','SUKAN / PERMAINAN','SUKAN/PERMAINAN','SUKAN DAN PERMAINAN'].includes(v))return 'SUKAN / PERMAINAN';
  if(v==='RUMAH SUKAN')return 'RUMAH SUKAN';
  return v||'TANPA KATEGORI';
}
function analysisCategoryLabel_(value){
  const key=analysisCategoryKey_(value);
  return ({'UNIT BERUNIFORM':'Unit Beruniform','KELAB / PERSATUAN':'Kelab / Persatuan','SUKAN / PERMAINAN':'Sukan / Permainan','RUMAH SUKAN':'Rumah Sukan','TANPA KATEGORI':'Tanpa Kategori'})[key]||String(value||'Tanpa Kategori');
}
function analysisDateLabel_(value){
  if(!value)return '-';const s=String(value);const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(m)return `${m[3]}/${m[2]}/${m[1]}`;
  const d=new Date(value);return isNaN(d.getTime())?s.slice(0,10):d.toLocaleDateString('ms-MY',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function analysisSetKpi_(id,value){const el=$(id);if(el)el.textContent=value;}
function analysisFillYearOptions_(){
  const sel=$('analysisYearFilter');if(!sel)return;
  const prior=sel.value;const set=new Set([String(new Date().getFullYear())]);
  [...ANALYSIS_CACHE_.units,...ANALYSIS_CACHE_.activities,...ANALYSIS_CACHE_.achievementActivities].forEach(r=>{
    const y=analysisYear_(r.TAHUN)||analysisYear_(r.TARIKH);if(/^\d{4}$/.test(y))set.add(y);
  });
  const years=[...set].sort((a,b)=>Number(b)-Number(a));
  sel.innerHTML=years.map(y=>`<option value="${y}">${y}</option>`).join('');
  sel.value=years.includes(prior)?prior:(years.includes(String(new Date().getFullYear()))?String(new Date().getFullYear()):years[0]||'');
}
async function loadAnalysisModule_(force=false){
  if(!$('analysisSection')||!state.token)return;
  const status=$('analysisStatus');if(status)status.textContent=force?'Mengemas kini data analisis...':'Memuatkan ringkasan analisis...';
  if(force||!ANALYSIS_CACHE_.loaded){
    const jobs=[
      ['students',()=>apiGet('getMurid',{token:state.token,allData:true})],
      ['units',()=>apiGet('getUnit',{token:state.token,allData:true})],
      ['activities',()=>apiGet('getAktiviti',{token:state.token})],
      ['achievementActivities',()=>apiGet('getPencapaianAktivitiList',{token:state.token})],
      ['reportsOverview',()=>apiGet('getReportsOverview',{token:state.token,allData:true})]
    ];
    const results=await Promise.allSettled(jobs.map(([,run])=>run()));
    const errors=[];
    results.forEach((result,i)=>{
      const key=jobs[i][0];
      if(result.status==='fulfilled'){
        const d=result.value||{};
        if(key==='students')ANALYSIS_CACHE_.students=Array.isArray(d.data)?d.data:[];
        if(key==='units')ANALYSIS_CACHE_.units=Array.isArray(d.data)?d.data:[];
        if(key==='activities')ANALYSIS_CACHE_.activities=Array.isArray(d.data)?d.data:[];
        if(key==='achievementActivities')ANALYSIS_CACHE_.achievementActivities=Array.isArray(d.data)?d.data:[];
        if(key==='reportsOverview')ANALYSIS_CACHE_.reports=Array.isArray(d.reports)?d.reports:[];
      }else{
        errors.push(`${key}: ${result.reason?.message||'gagal dimuat'}`);
        if(key==='students')ANALYSIS_CACHE_.students=[];
        if(key==='units')ANALYSIS_CACHE_.units=[];
        if(key==='activities')ANALYSIS_CACHE_.activities=[];
        if(key==='achievementActivities')ANALYSIS_CACHE_.achievementActivities=[];
        if(key==='reportsOverview')ANALYSIS_CACHE_.reports=[];
      }
    });
    ANALYSIS_CACHE_.errors=errors;
    ANALYSIS_CACHE_.loaded=true;
    analysisFillYearOptions_();
  }
  const year=String($('analysisYearFilter')?.value||new Date().getFullYear());
  if(force||!Object.prototype.hasOwnProperty.call(ANALYSIS_CACHE_.attendanceByYear,year)){
    const statusNow=$('analysisStatus');if(statusNow)statusNow.textContent=`Memuatkan rekod kehadiran bagi ${year}...`;
    try{
      const d=await apiGet('getAttendanceRecords',{token:state.token,tahun:year,allData:true});
      ANALYSIS_CACHE_.attendanceByYear[year]=Array.isArray(d.data)?d.data:[];
      ANALYSIS_CACHE_.errors=ANALYSIS_CACHE_.errors.filter(x=>!x.startsWith('attendance:'));
    }catch(e){
      ANALYSIS_CACHE_.attendanceByYear[year]=[];
      ANALYSIS_CACHE_.errors=ANALYSIS_CACHE_.errors.filter(x=>!x.startsWith('attendance:'));
      ANALYSIS_CACHE_.errors.push(`attendance: ${e.message||'gagal dimuat'}`);
    }
  }
  renderAnalysisModule_(year);
}
function analysisAttendanceStats_(rows){
  const stats={meetings:0,records:0,present:0,absent:0,excused:0,leave:0,rate:0};
  (rows||[]).forEach(r=>{
    stats.meetings++;
    const j=analysisNum_(r.JUM??(analysisNum_(r.HADIR)+analysisNum_(r.TIDAK_HADIR)+analysisNum_(r.BERSEBAB)+analysisNum_(r.CUTI)));
    stats.records+=j;stats.present+=analysisNum_(r.HADIR);stats.absent+=analysisNum_(r.TIDAK_HADIR);stats.excused+=analysisNum_(r.BERSEBAB);stats.leave+=analysisNum_(r.CUTI);
  });
  stats.rate=stats.records?Math.round(stats.present/stats.records*100):0;
  return stats;
}
function renderAnalysisModule_(year){
  const activeStudents=ANALYSIS_CACHE_.students.filter(analysisActive_);
  const selectedCategory=String($('analysisCategoryFilter')?.value||'');
  const search=String($('analysisUnitSearch')?.value||'').trim().toLowerCase();
  const yearUnits=ANALYSIS_CACHE_.units.filter(r=>analysisYear_(r.TAHUN)===String(year));
  const filteredUnits=yearUnits.filter(r=>{
    const categoryOk=!selectedCategory||analysisCategoryKey_(r.KATEGORI)===analysisCategoryKey_(selectedCategory);
    const hay=[r.NAMA_UNIT,r.KATEGORI,r.GURU_PENASIHAT,r.UNIT_ID].join(' ').toLowerCase();
    return categoryOk&&(!search||hay.includes(search));
  });
  const activeFilteredUnits=filteredUnits.filter(analysisActive_);
  const unitIds=new Set(filteredUnits.map(r=>String(r.UNIT_ID||'')));
  const allAttendance=ANALYSIS_CACHE_.attendanceByYear[String(year)]||[];
  const filteredAttendance=allAttendance.filter(r=>unitIds.has(String(r.UNIT_ID||'')));
  const attendanceAllStats=analysisAttendanceStats_(filteredAttendance);
  const activities=ANALYSIS_CACHE_.activities.filter(r=>analysisYear_(r.TARIKH)===String(year));
  const achievementById=new Map(ANALYSIS_CACHE_.achievementActivities.map(a=>[String(a.AKTIVITI_ID||''),a]));
  const activityData=activities.map(a=>Object.assign({},achievementById.get(String(a.AKTIVITI_ID||''))||{},a));
  const activityDataIds=new Set(activityData.map(a=>String(a.AKTIVITI_ID||'')));
  const selectedAchievementRows=ANALYSIS_CACHE_.achievementActivities.filter(a=>activityDataIds.has(String(a.AKTIVITI_ID||'')));
  const totalAchievementRecords=selectedAchievementRows.reduce((sum,a)=>sum+analysisNum_(a.REKOD),0);
  const activitiesWithAchievements=selectedAchievementRows.filter(a=>analysisNum_(a.REKOD)>0).length;
  const selectedActivityIds=new Set(activityData.map(a=>String(a.AKTIVITI_ID||'')));
  const reportsThisYear=ANALYSIS_CACHE_.reports.filter(r=>{
    const updatedYear=analysisYear_(r.UPDATED_AT);
    return (r.ACTIVITY_ID&&selectedActivityIds.has(String(r.ACTIVITY_ID)))||(!r.ACTIVITY_ID&&updatedYear===String(year));
  });

  analysisSetKpi_('analysisKpiStudents',activeStudents.length.toLocaleString('ms-MY'));
  analysisSetKpi_('analysisKpiUnits',activeFilteredUnits.length.toLocaleString('ms-MY'));
  analysisSetKpi_('analysisKpiMembers',activeFilteredUnits.reduce((sum,r)=>sum+analysisNum_(r.JUMLAH_AHLI),0).toLocaleString('ms-MY'));
  analysisSetKpi_('analysisKpiAttendance',attendanceAllStats.records?`${attendanceAllStats.rate}%`:'—');
  analysisSetKpi_('analysisKpiActivities',activities.length.toLocaleString('ms-MY'));
  analysisSetKpi_('analysisKpiAchievements',totalAchievementRecords.toLocaleString('ms-MY'));
  analysisSetKpi_('analysisKpiReports',reportsThisYear.length.toLocaleString('ms-MY'));
  analysisSetKpi_('analysisRecordedActivities',activitiesWithAchievements.toLocaleString('ms-MY'));
  analysisSetKpi_('analysisPendingActivities',Math.max(0,activities.length-activitiesWithAchievements).toLocaleString('ms-MY'));
  renderAnalysisCategoryChart_(activeFilteredUnits);
  renderAnalysisStudentLevelChart_(activeStudents);
  renderAnalysisGenderChart_(activeStudents);
  renderAnalysisActivityLevelChart_(activityData);
  renderAnalysisAttendanceChart_(filteredAttendance);
  renderAnalysisUnitGenderSlider_(year);
  const tableUnits=ANALYSIS_CACHE_.units.filter(r=>analysisYear_(r.TAHUN)===String(year));
  syncAnalysisUnitTableFilters_(tableUnits);
  renderAnalysisUnitTable_(tableUnits,allAttendance);
  renderAnalysisActivitiesTable_(activityData,selectedAchievementRows,ANALYSIS_CACHE_.reports);
  const activityCount=$('analysisActivityCount');if(activityCount)activityCount.textContent=`${activityData.length} AKTIVITI`;
  const errors=ANALYSIS_CACHE_.errors||[];
  const message=errors.length?`Data separa dipaparkan. ${errors.join(' • ')}. Tekan Kemas Kini Analisis untuk cuba semula.`:`Analisis ${year} dimuatkan • ${activeFilteredUnits.length} unit aktif dalam tapisan • ${filteredAttendance.length} rekod perjumpaan.`;
  const status=$('analysisStatus');if(status)status.textContent=message;
  const updated=$('analysisUpdatedAt');if(updated)updated.textContent=`KEMAS KINI TERAKHIR: ${new Date().toLocaleString('ms-MY',{dateStyle:'medium',timeStyle:'short'})} • TAHUN ${year}`;
  ANALYSIS_LAST_VIEW_={year,units:filteredUnits,attendance:filteredAttendance,activityRows:activityData};
}
function renderAnalysisCategoryChart_(units){
  const host=$('analysisCategoryChart');if(!host)return;
  const map=new Map();(units||[]).forEach(u=>{const key=analysisCategoryKey_(u.KATEGORI);map.set(key,(map.get(key)||0)+analysisNum_(u.JUMLAH_AHLI));});
  if(!map.size){host.innerHTML='<div class="analysis-empty">Tiada unit aktif untuk kategori/tahun ini.</div>';return;}
  const entries=[...map.entries()].sort((a,b)=>b[1]-a[1]);const max=Math.max(1,...entries.map(x=>x[1]));
  host.innerHTML=entries.map(([key,value],i)=>`<div class="analysis-bar-row"><div class="analysis-bar-label"><span>${analysisEsc_(analysisCategoryLabel_(key))}</span><b>${value.toLocaleString('ms-MY')}</b></div><div class="analysis-bar-track"><span class="analysis-bar-fill tone-${i%4}" style="width:${Math.max(value?2:0,value/max*100)}%"></span></div></div>`).join('');
}
function renderAnalysisStudentLevelChart_(students){
  const host=$('analysisStudentLevelChart');if(!host)return;
  const map=new Map();(students||[]).forEach(m=>{const key=String(m.TINGKATAN||'Tidak Dinyatakan').trim()||'Tidak Dinyatakan';map.set(key,(map.get(key)||0)+1);});
  if(!map.size){host.innerHTML='<div class="analysis-empty">Tiada data murid aktif.</div>';return;}
  const entries=[...map.entries()].sort((a,b)=>{
    const na=Number(a[0]),nb=Number(b[0]);
    if(Number.isFinite(na)&&Number.isFinite(nb))return na-nb;
    if(Number.isFinite(na))return -1;if(Number.isFinite(nb))return 1;
    return a[0].localeCompare(b[0],'ms');
  });
  const max=Math.max(1,...entries.map(x=>x[1]));
  host.innerHTML=entries.map(([name,value],i)=>`<div class="analysis-bar-row"><div class="analysis-bar-label"><span>${analysisEsc_(/^\d+$/.test(name)?`Tingkatan ${name}`:name)}</span><b>${value.toLocaleString('ms-MY')}</b></div><div class="analysis-bar-track"><span class="analysis-bar-fill tone-${i%4}" style="width:${Math.max(value?2:0,value/max*100)}%"></span></div></div>`).join('');
}
function renderAnalysisGenderChart_(students){
  const host=$('analysisGenderChart');if(!host)return;
  const map=new Map([['Lelaki',0],['Perempuan',0],['Tidak Dinyatakan',0]]);
  (students||[]).forEach(m=>{
    const raw=String(m.JANTINA||'').trim().toUpperCase();
    if(['L','LELAKI','MALE','M'].includes(raw))map.set('Lelaki',map.get('Lelaki')+1);
    else if(['P','PEREMPUAN','FEMALE','F'].includes(raw))map.set('Perempuan',map.get('Perempuan')+1);
    else map.set('Tidak Dinyatakan',map.get('Tidak Dinyatakan')+1);
  });
  const entries=[...map.entries()].filter(([,value])=>value>0);
  if(!entries.length){host.innerHTML='<div class="analysis-empty">Tiada data jantina untuk murid aktif.</div>';return;}
  const total=entries.reduce((sum,x)=>sum+x[1],0),max=Math.max(1,...entries.map(x=>x[1]));
  host.innerHTML=entries.map(([name,value],i)=>`<div class="analysis-bar-row"><div class="analysis-bar-label"><span>${name}</span><b>${value.toLocaleString('ms-MY')} · ${Math.round(value/total*100)}%</b></div><div class="analysis-bar-track"><span class="analysis-bar-fill tone-${i%4}" style="width:${Math.max(value?2:0,value/max*100)}%"></span></div></div>`).join('');
}
function renderAnalysisActivityLevelChart_(activities){
  const host=$('analysisActivityLevelChart');if(!host)return;
  const map=new Map();(activities||[]).forEach(a=>{const key=String(a.PERINGKAT||'Tanpa Peringkat').trim()||'Tanpa Peringkat';map.set(key,(map.get(key)||0)+1);});
  if(!map.size){host.innerHTML='<div class="analysis-empty">Tiada aktiviti berdaftar pada tahun ini.</div>';return;}
  const entries=[...map.entries()].sort((a,b)=>b[1]-a[1]);const max=Math.max(1,...entries.map(x=>x[1]));
  host.innerHTML=entries.map(([name,value],i)=>`<div class="analysis-bar-row"><div class="analysis-bar-label"><span>${analysisEsc_(name)}</span><b>${value}</b></div><div class="analysis-bar-track"><span class="analysis-bar-fill tone-${i%4}" style="width:${Math.max(value?2:0,value/max*100)}%"></span></div></div>`).join('');
}
function renderAnalysisAttendanceChart_(rows){
  const host=$('analysisAttendanceChart');if(!host)return;
  const weeks=Array.from({length:15},(_,i)=>i+1).map(week=>{
    const set=(rows||[]).filter(r=>Number(r.MINGGU)===week);const stats=analysisAttendanceStats_(set);return {week,stats,has:set.length>0};
  });
  if(!weeks.some(w=>w.has)){host.innerHTML='<div class="analysis-empty">Belum ada rekod kehadiran bagi unit dan tahun yang ditapis.</div>';return;}
  host.innerHTML=weeks.map(w=>`<div class="analysis-week-row"><span class="analysis-week-label">M${String(w.week).padStart(2,'0')}</span><div class="analysis-week-track"><span style="width:${w.has?w.stats.rate:0}%"></span></div><strong>${w.has?w.stats.rate+'%':'—'}</strong><small>${w.has?w.stats.records.toLocaleString('ms-MY')+' rekod':'tiada data'}</small></div>`).join('');
}
function analysisUnitAttendanceMap_(rows){
  const map=new Map();(rows||[]).forEach(r=>{const id=String(r.UNIT_ID||'');if(!map.has(id))map.set(id,[]);map.get(id).push(r);});return map;
}
function renderAnalysisUnitGenderSlider_(year){
  const host=$('analysisUnitGenderSlide');if(!host)return;
  const categories=ANALYSIS_UNIT_SLIDER_CATEGORIES_;
  if(ANALYSIS_UNIT_SLIDER_INDEX_<0)ANALYSIS_UNIT_SLIDER_INDEX_=0;
  if(ANALYSIS_UNIT_SLIDER_INDEX_>=categories.length)ANALYSIS_UNIT_SLIDER_INDEX_=categories.length-1;
  const category=categories[ANALYSIS_UNIT_SLIDER_INDEX_];
  const allYearUnits=(ANALYSIS_CACHE_.units||[]).filter(u=>analysisYear_(u.TAHUN)===String(year));
  const units=allYearUnits.filter(u=>analysisCategoryKey_(u.KATEGORI)===category)
    .sort((a,b)=>String(a.NAMA_UNIT||'').localeCompare(String(b.NAMA_UNIT||''),'ms'));
  const totals=units.reduce((acc,u)=>{
    acc.members+=analysisNum_(u.JUMLAH_AHLI);
    acc.male+=analysisNum_(u.LELAKI);
    acc.female+=analysisNum_(u.PEREMPUAN);
    return acc;
  },{members:0,male:0,female:0});
  const label=analysisCategoryLabel_(category);
  const position=$('analysisUnitSlidePosition');if(position)position.textContent=`${ANALYSIS_UNIT_SLIDER_INDEX_+1} / ${categories.length} • ${label}`;
  const prev=$('analysisUnitSlidePrev'),next=$('analysisUnitSlideNext');
  if(prev)prev.disabled=ANALYSIS_UNIT_SLIDER_INDEX_===0;
  if(next)next.disabled=ANALYSIS_UNIT_SLIDER_INDEX_===categories.length-1;
  const meta=$('analysisUnitSliderMeta');
  if(meta)meta.innerHTML=`<div class="analysis-unit-gender-total"><span>JUMLAH UNIT <b>${units.length}</b></span><span>JUMLAH AHLI <b>${totals.members.toLocaleString('ms-MY')}</b></span><span>LELAKI <b>${totals.male.toLocaleString('ms-MY')}</b></span><span>PEREMPUAN <b>${totals.female.toLocaleString('ms-MY')}</b></span></div>`;
  if(!units.length){host.innerHTML=`<div class="analysis-empty">Tiada unit aktif dalam kategori ${analysisEsc_(label)} bagi tahun ${analysisEsc_(year)}.</div>`;return;}
  host.innerHTML=`<div class="table-wrap"><table class="analysis-table analysis-unit-gender-table"><thead><tr><th>UNIT</th><th>JUMLAH AHLI</th><th>LELAKI</th><th>PEREMPUAN</th><th>AGIHAN JANTINA</th><th>STATUS</th></tr></thead><tbody>${units.map(u=>{
    const total=analysisNum_(u.JUMLAH_AHLI),male=analysisNum_(u.LELAKI),female=analysisNum_(u.PEREMPUAN);
    const mPct=total?Math.round(male/total*100):0,fPct=total?Math.round(female/total*100):0;
    return `<tr><td><b>${analysisEsc_(u.NAMA_UNIT||'-')}</b><small>${analysisEsc_(u.UNIT_ID||'')}</small></td><td class="analysis-number-cell"><b>${total.toLocaleString('ms-MY')}</b></td><td class="analysis-number-cell"><span class="analysis-gender-count is-male">${male.toLocaleString('ms-MY')}</span></td><td class="analysis-number-cell"><span class="analysis-gender-count is-female">${female.toLocaleString('ms-MY')}</span></td><td><div class="analysis-gender-stacked" aria-label="Lelaki ${mPct} peratus, perempuan ${fPct} peratus"><span class="is-male" style="width:${mPct}%"></span><span class="is-female" style="width:${fPct}%"></span></div><small>${mPct}% lelaki • ${fPct}% perempuan</small></td><td><span class="analysis-status-pill ${analysisActive_(u)?'is-active':'is-inactive'}">${analysisActive_(u)?'AKTIF':'TIDAK AKTIF'}</span></td></tr>`;
  }).join('')}</tbody></table></div>`;
}
function syncAnalysisUnitTableFilters_(units){
  const categorySelect=$('analysisUnitTableCategoryFilter'),unitSelect=$('analysisUnitTableUnitFilter');
  if(!categorySelect||!unitSelect)return;
  const priorCategory=categorySelect.value,priorUnit=unitSelect.value;
  const category=priorCategory;
  const filtered=(units||[]).filter(u=>!category||analysisCategoryKey_(u.KATEGORI)===analysisCategoryKey_(category));
  const sorted=[...filtered].sort((a,b)=>String(a.NAMA_UNIT||'').localeCompare(String(b.NAMA_UNIT||''),'ms'));
  unitSelect.innerHTML='<option value="">Semua Unit</option>'+sorted.map(u=>`<option value="${analysisEsc_(String(u.UNIT_ID||''))}">${analysisEsc_(u.NAMA_UNIT||u.UNIT_ID||'Unit')}</option>`).join('');
  if(sorted.some(u=>String(u.UNIT_ID||'')===priorUnit))unitSelect.value=priorUnit;
  else unitSelect.value='';
}
function renderAnalysisUnitTableFromFilters_(){
  const year=String($('analysisYearFilter')?.value||new Date().getFullYear());
  const units=(ANALYSIS_CACHE_.units||[]).filter(u=>analysisYear_(u.TAHUN)===year);
  const attendance=ANALYSIS_CACHE_.attendanceByYear[year]||[];
  syncAnalysisUnitTableFilters_(units);
  renderAnalysisUnitTable_(units,attendance);
}
function renderAnalysisUnitTable_(units,attendance){
  const host=$('analysisUnitTableWrap');if(!host)return;
  const selectedCategory=String($('analysisUnitTableCategoryFilter')?.value||'');
  const selectedUnit=String($('analysisUnitTableUnitFilter')?.value||'');
  const filtered=(units||[]).filter(u=>!selectedCategory||analysisCategoryKey_(u.KATEGORI)===analysisCategoryKey_(selectedCategory))
    .filter(u=>!selectedUnit||String(u.UNIT_ID||'')===selectedUnit);
  const count=$('analysisUnitCount');if(count)count.textContent=`${filtered.length} UNIT`;
  if(!filtered.length){host.innerHTML='<div class="analysis-empty">Tiada unit sepadan dengan penapis untuk tahun yang dipilih.</div>';return;}
  const byUnit=analysisUnitAttendanceMap_(attendance);
  const rows=[...filtered].sort((a,b)=>analysisNum_(b.JUMLAH_AHLI)-analysisNum_(a.JUMLAH_AHLI)||String(a.NAMA_UNIT||'').localeCompare(String(b.NAMA_UNIT||''),'ms'));
  host.innerHTML=`<table class="analysis-table"><thead><tr><th>UNIT</th><th>KATEGORI</th><th>GURU PENASIHAT</th><th>AHLI</th><th>PERJUMPAAN</th><th>REKOD KEHADIRAN</th><th>% HADIR</th><th>STATUS</th></tr></thead><tbody>${rows.map(u=>{
    const rs=byUnit.get(String(u.UNIT_ID||''))||[];const stats=analysisAttendanceStats_(rs);const active=analysisActive_(u);
    const rateLabel=stats.records?`<span class="analysis-rate-pill ${stats.rate>=75?'rate-good':stats.rate>=50?'rate-mid':'rate-low'}">${stats.rate}%</span>`:'<span class="analysis-no-data">TIADA REKOD</span>';
    return `<tr><td><b>${analysisEsc_(u.NAMA_UNIT||'-')}</b><small>${analysisEsc_(u.UNIT_ID||'')}</small></td><td>${analysisEsc_(analysisCategoryLabel_(u.KATEGORI))}</td><td>${analysisEsc_(u.GURU_PENASIHAT||'-')}</td><td class="analysis-number-cell">${analysisNum_(u.JUMLAH_AHLI)}</td><td class="analysis-number-cell">${stats.meetings}</td><td class="analysis-number-cell">${stats.records}</td><td>${rateLabel}</td><td><span class="analysis-status-pill ${active?'is-active':'is-inactive'}">${active?'AKTIF':'TIDAK AKTIF'}</span></td></tr>`;
  }).join('')}</tbody></table>`;
}
function renderAnalysisActivitiesTable_(activities,achievementRows,reports){
  const host=$('analysisActivitiesTableWrap');if(!host)return;
  if(!activities.length){host.innerHTML='<div class="analysis-empty">Tiada aktiviti berdaftar pada tahun yang dipilih.</div>';return;}
  const achievementById=new Map((achievementRows||[]).map(a=>[String(a.AKTIVITI_ID||''),a]));
  const reportById=new Map();(reports||[]).forEach(r=>{const id=String(r.ACTIVITY_ID||'');if(id&&!reportById.has(id))reportById.set(id,r);});
  const rows=[...activities].sort((a,b)=>String(b.TARIKH||'').localeCompare(String(a.TARIKH||''))).slice(0,50);
  host.innerHTML=`<table class="analysis-table"><thead><tr><th>AKTIVITI</th><th>TARIKH</th><th>PERINGKAT</th><th>PESERTA</th><th>REKOD PENCAPAIAN</th><th>LAPORAN</th></tr></thead><tbody>${rows.map(a=>{
    const id=String(a.AKTIVITI_ID||'');const achievement=achievementById.get(id)||{};const report=reportById.get(id);const rec=analysisNum_(achievement.REKOD);const participants=analysisNum_(achievement.PESERTA);
    return `<tr><td><b>${analysisEsc_(a.NAMA_AKTIVITI||'-')}</b><small>${analysisEsc_(id)}</small></td><td>${analysisEsc_(analysisDateLabel_(a.TARIKH))}</td><td>${analysisEsc_(a.PERINGKAT||'-')}</td><td class="analysis-number-cell">${participants}</td><td><span class="analysis-status-pill ${rec>0?'is-active':'is-pending'}">${rec} rekod</span></td><td>${report?`<span class="analysis-status-pill is-active">ADA</span><small>${analysisEsc_(report.TITLE||'Laporan tersimpan')}</small>`:'<span class="analysis-status-pill is-pending">BELUM ADA</span>'}</td></tr>`;
  }).join('')}</tbody></table>`;
}
function exportAnalysisUnitsCsv_(){
  const view=ANALYSIS_LAST_VIEW_;const units=view.units||[];const byUnit=analysisUnitAttendanceMap_(view.attendance||[]);
  const header=['Tahun','Unit ID','Nama Unit','Kategori','Guru Penasihat','Jumlah Ahli','Perjumpaan Direkodkan','Rekod Kehadiran','Hadir','Tidak Hadir','Bersebab','Cuti','Peratus Kehadiran','Status'];
  const rows=units.map(u=>{const st=analysisAttendanceStats_(byUnit.get(String(u.UNIT_ID||''))||[]);return [view.year,u.UNIT_ID,u.NAMA_UNIT,analysisCategoryLabel_(u.KATEGORI),u.GURU_PENASIHAT,analysisNum_(u.JUMLAH_AHLI),st.meetings,st.records,st.present,st.absent,st.excused,st.leave,st.rate+'%',u.STATUS||'AKTIF'];});
  const quote=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  const csv='\uFEFF'+[header,...rows].map(r=>r.map(quote).join(',')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`e-KOSSTA-Analisis-Unit-${view.year||new Date().getFullYear()}.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  toast(`CSV analisis dimuat turun (${rows.length} unit).`);
}

function showPage(page){
  const role=state.user?.role||'';
  const adminOnlyPages=['murid','guru','users','system-settings','report-templates','penempatan'];
  if(adminOnlyPages.includes(page)&&role!=='ADMIN')return toast('Akses ditolak. Menu Pengurusan Data hanya untuk ADMIN.');
  if(page==='pencapaian'){PENCAPAIAN_RECORD_MODE_=false;if($('pencapaianListView'))$('pencapaianListView').hidden=false;if($('pencapaianRecordView'))$('pencapaianRecordView').hidden=true;}
  if(page==='users'&&role!=='ADMIN')return toast('Akses ditolak.');
  if(page==='guru'&&role!=='ADMIN')return toast('Akses ditolak.');
  if(page==='system-settings'&&role!=='ADMIN')return toast('Akses ditolak.');
  if(page==='report-templates'&&role!=='ADMIN')return toast('Edit Templat hanya untuk ADMIN.');
  if(page==='reports-edit')REPORT_WORKFLOW_MODE_='form';
  if(page==='report-templates')REPORT_WORKFLOW_MODE_='template';

  const map={
    dashboard:'Dashboard',murid:'Murid',guru:'Guru',unit:'Unit Kokurikulum',
    penempatan:'Penempatan Unit',users:'Pengurusan Pengguna',analysis:'Analisis',
    reports:'Jana Laporan','reports-edit':'Isi Laporan Aktiviti','report-templates':'Edit Templat',activity:'Aktiviti & Acara','activity-participants':'Daftar Peserta',pencapaian:'Pencapaian Kokurikulum',
    'system-settings':'Tetapan Sistem',attendance:'Kehadiran','unit-overview':'Ringkasan Unit','unit-ajk':'Pengurusan AJK'
  };
  CURRENT_PAGE=page;
  setPageAccent_(page);
  document.querySelectorAll('.page-section').forEach(el=>el.hidden=true);
  // Set active states deterministically: only the current page or its parent main module is selected.
  const currentGroup=pageGroupForPage_(page);
  document.querySelectorAll('.nav-item[data-page]').forEach(el=>{
    const active=el.dataset.page===page;
    el.classList.toggle('active',active);
    if(el.closest('#sidebar') && el.classList.contains('main-nav-item')){
      if(active)el.setAttribute('aria-current','page');
      else el.removeAttribute('aria-current');
    }
  });
  document.querySelectorAll('#sidebar .main-nav-item[data-main-group]').forEach(el=>{
    const active=page!=='dashboard' && !!currentGroup && el.dataset.mainGroup===currentGroup;
    el.classList.toggle('active',active);
    if(active)el.setAttribute('aria-current','page');
    else el.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-mobile-open-group]').forEach(el=>el.classList.toggle('active',el.dataset.mobileOpenGroup===currentGroup));
  document.querySelectorAll('.page-'+page).forEach(el=>el.hidden=false);
  const title=map[page]||'Dashboard';
  ['desktopPageTitle','mobilePageTitle'].forEach(id=>{const el=$(id);if(el)el.textContent=title;});
  renderPageSubnav_(page);
  if($('mobileMenu')&&!$('mobileMenu').hidden)buildMobileMenu_();
  if(page==='dashboard'){updateDashboardSessionUi_();if(role==='ADMIN')loadMurid(false);loadUnit();loadDashboardAnalytics_();}
  if(page==='reports'||page==='reports-edit'||page==='report-templates'){openDocumentsModule_();updateReportWorkspaceMode_();}
  if(page==='murid')loadMurid();
  if(page==='guru')loadGuru();
  if(page==='unit')loadUnit();
  if(page==='attendance')loadAttendancePage();
  if(page==='activity')loadAktivitiPage();
  if(page==='activity-participants')loadAktivitiPesertaPage();
  if(page==='pencapaian')loadPencapaianPage();
  if(page==='unit-overview')loadUnitOverview();
  if(page==='unit-ajk')loadUnitAjkPage_();
  if(page==='users')loadUsers();
  if(page==='system-settings')loadSystemSettings_(true);
  if(page==='analysis')loadAnalysisModule_();
  if(!$('appView').hidden)applyAppBranding_();
}

function init(){
  document.documentElement.classList.toggle('dark',state.dark);
  setupNavigation();
  setThemeIcons_();
  const bind=(id,event,fn)=>{const e=$(id);if(e)e.addEventListener(event,fn)};
  bind('loginBtn','click',login);
  bind('showRegisterBtn','click',()=>showLoginMode_('register'));
  bind('showLoginBtn','click',()=>showLoginMode_('login'));
  bind('registerBtn','click',registerAccount_);
  bind('saveUnitSelectionBtn','click',saveMyUnitSelection_);
  bind('unitSetupLogoutBtn','click',logout);
  bind('saveApiUrlBtn','click',saveLoginApiUrl_);
  bind('passwordRevealBtn','click',toggleLoginPassword_);
  bind('dashboardRefreshBtn','click',refreshDashboardData_);
  bind('dashboardAttendanceSlider','input',e=>{DASHBOARD_ATTENDANCE_SLIDE_=Number(e.target.value)||0;renderDashboardUnitSlider_('attendance');});
  bind('dashboardMembersSlider','input',e=>{DASHBOARD_MEMBERS_SLIDE_=Number(e.target.value)||0;renderDashboardUnitSlider_('members');});
  bind('dashboardAttendancePrev','click',()=>{DASHBOARD_ATTENDANCE_SLIDE_=(DASHBOARD_ATTENDANCE_SLIDE_+DASHBOARD_UNIT_CATEGORIES_.length-1)%DASHBOARD_UNIT_CATEGORIES_.length;renderDashboardUnitSlider_('attendance');});
  bind('dashboardAttendanceNext','click',()=>{DASHBOARD_ATTENDANCE_SLIDE_=(DASHBOARD_ATTENDANCE_SLIDE_+1)%DASHBOARD_UNIT_CATEGORIES_.length;renderDashboardUnitSlider_('attendance');});
  bind('dashboardMembersPrev','click',()=>{DASHBOARD_MEMBERS_SLIDE_=(DASHBOARD_MEMBERS_SLIDE_+DASHBOARD_UNIT_CATEGORIES_.length-1)%DASHBOARD_UNIT_CATEGORIES_.length;renderDashboardUnitSlider_('members');});
  bind('dashboardMembersNext','click',()=>{DASHBOARD_MEMBERS_SLIDE_=(DASHBOARD_MEMBERS_SLIDE_+1)%DASHBOARD_UNIT_CATEGORIES_.length;renderDashboardUnitSlider_('members');});
  ['username','password'].forEach(id=>bind(id,'keydown',e=>{if(e.key==='Enter'){e.preventDefault();login();}}));
  bind('logoutBtn','click',logout);
  bind('meBtn','click',me);
  bind('loadBtn','click',loadMurid);
  bind('refreshBtn','click',loadMurid);
  bind('muridCsvTemplateBtn','click',downloadMuridCsvTemplate_);
  bind('muridCsvUploadBtn','click',uploadMuridCsv_);
  bind('muridBulkDeleteBtn','click',deleteSelectedMuridBulk_);
  bind('muridBulkDeleteAllBtn','click',deleteAllMuridBulk_);
  bind('addMuridOpenBtn','click',openAddMuridModal_);
  bind('addMuridForm','submit',e=>{e.preventDefault();addMurid();});
  document.querySelectorAll('[data-add-murid-close]').forEach(el=>el.addEventListener('click',closeAddMuridModal_));
  bind('saveSystemSettingsBtn','click',saveSystemSettings_);
  bind('systemSchoolLogo','change',handleSystemLogoSelection_);
  bind('systemLogoClearBtn','click',clearSystemLogoDraft_);
  bind('addUserBtn','click',addUser);
  bind('usersRefreshBtn','click',loadUsers);
  bind('analysisRefreshBtn','click',()=>loadAnalysisModule_(true));
  bind('analysisYearFilter','change',()=>loadAnalysisModule_());
  bind('analysisCategoryFilter','change',()=>renderAnalysisModule_(String($('analysisYearFilter')?.value||new Date().getFullYear())));
  bind('analysisUnitSearch','input',()=>renderAnalysisModule_(String($('analysisYearFilter')?.value||new Date().getFullYear())));
  bind('analysisUnitSlidePrev','click',()=>{ANALYSIS_UNIT_SLIDER_INDEX_=Math.max(0,ANALYSIS_UNIT_SLIDER_INDEX_-1);renderAnalysisUnitGenderSlider_(String($('analysisYearFilter')?.value||new Date().getFullYear()));});
  bind('analysisUnitSlideNext','click',()=>{ANALYSIS_UNIT_SLIDER_INDEX_=Math.min(ANALYSIS_UNIT_SLIDER_CATEGORIES_.length-1,ANALYSIS_UNIT_SLIDER_INDEX_+1);renderAnalysisUnitGenderSlider_(String($('analysisYearFilter')?.value||new Date().getFullYear()));});
  bind('analysisUnitTableCategoryFilter','change',()=>{const y=String($('analysisYearFilter')?.value||new Date().getFullYear());syncAnalysisUnitTableFilters_((ANALYSIS_CACHE_.units||[]).filter(u=>analysisYear_(u.TAHUN)===y));renderAnalysisUnitTableFromFilters_();});
  bind('analysisUnitTableUnitFilter','change',renderAnalysisUnitTableFromFilters_);
  bind('analysisUnitTableFilterReset','click',()=>{if($('analysisUnitTableCategoryFilter'))$('analysisUnitTableCategoryFilter').value='';if($('analysisUnitTableUnitFilter'))$('analysisUnitTableUnitFilter').value='';renderAnalysisUnitTableFromFilters_();});
  bind('analysisExportBtn','click',exportAnalysisUnitsCsv_);
  bind('analysisOverviewTab','click',()=>switchAnalysisView_('overview'));
  bind('analysisPajskTab','click',()=>switchAnalysisView_('pajsk'));
  bind('analysisPajskRefreshBtn','click',()=>loadPajskClassReport_(true));
  bind('analysisPajskYearFilter','change',()=>loadPajskClassReport_(true));
  bind('analysisPajskClassFilter','change',()=>{renderPajskClassReport_();updatePajskPrintScope_();});
  bind('analysisPajskSearch','input',renderPajskClassReport_);
  bind('analysisPajskPrintBtn','click',printPajskClass_);
  bind('analysisPajskExportBtn','click',exportPajskClassCsv_);
  bind('analysisPajskPrintStudentBtn','click',printPajskStudent_);
  document.querySelectorAll('[data-pajsk-detail-close]').forEach(el=>el.addEventListener('click',closePajskStudentDetail_));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePajskStudentDetail_();closeAddMuridModal_();}});
  bind('guruRefreshBtn','click',loadGuru);
  bind('addGuruBtn','click',saveGuru);
  bind('cancelGuruBtn','click',cancelGuru);
  // Borang tambah unit dan tambah ahli tidak lagi diletakkan pada halaman utama Unit.
  bind('unitAddMemberBtn','click',openAddUnitMemberModal_);
  bind('unitOverviewAjkAddBtn','click',openUnitAjkPage_);
  bind('unitOverviewMemberClassFilter','change',()=>renderUnitOverviewMembers_(UNIT_OVERVIEW_MEMBER_ROWS_));
  bind('unitOverviewMemberGenderFilter','change',()=>renderUnitOverviewMembers_(UNIT_OVERVIEW_MEMBER_ROWS_));
  setupUnitOverviewTabs_();
  bind('unitOverviewMembersPrintBtn','click',()=>printUnitOverview_('unit'));
  bind('unitOverviewAttendancePrintBtn','click',()=>printUnitOverview_('attendance'));
  bind('unitOverviewMemberAttendancePrintBtn','click',()=>printUnitOverview_('member-attendance'));
  bind('unitOverviewAjkPrintBtn','click',()=>printUnitOverview_('ajk'));
  bind('unitAjkBackBtn','click',()=>showPage('unit-overview'));
  bind('unitAjkRefreshBtn','click',loadUnitAjkPage_);
  bind('unitAjkPrintBtn','click',printUnitAjkPage_);
  bind('unitAjkClassFilter','change',renderUnitAjkCandidates_);
  bind('unitAjkSearch','input',renderUnitAjkCandidates_);
  $('unitAjkCandidateTableWrap')?.addEventListener('change',e=>{const radio=e.target.closest('[data-ajk-select]');if(radio){UNIT_AJK_SELECTED_KP=String(radio.value||'');updateUnitAjkSaveButton_();}});
  bind('unitAjkPositionSelect','change',updateUnitAjkSaveButton_);
  bind('unitAjkSaveBtn','click',saveSelectedUnitAjk_);
  bind('unitMemberForm','submit',saveUnitMemberFromModal_);
  bind('unitMemberStudentSearch','input',filterUnitMemberOptions_);
  document.querySelectorAll('[data-unit-member-close]').forEach(el=>el.addEventListener('click',closeAddUnitMemberModal_));
  bind('attCategoryFilter','change',updateAttendanceUnitFilter_);
  bind('attendanceRefreshBtn','click',loadAttendancePage);
  bind('activityAddBtn','click',()=>openAktivitiModal());
  bind('activityRefreshBtn','click',loadAktivitiPage);
  bind('pencapaianRefreshBtn','click',loadPencapaianPage);
  bind('pencapaianActivitySearch','input',renderPencapaianActivityTable_);
  bind('pencapaianActivityFilterYear','change',renderPencapaianActivityTable_);
  bind('pencapaianActivityFilterLevel','change',renderPencapaianActivityTable_);
  bind('pencapaianRecordBackBtn','click',backToPencapaianActivityList_);
  bind('pencapaianRecordBackBottomBtn','click',backToPencapaianActivityList_);
  bind('pencapaianNewEventBtn','click',newPencapaianEventRecord_);
  bind('pencapaianRefreshRecordBtn','click',()=>refreshPencapaianRecordData_(false));
  bind('pencapaianActivityRecordForm','submit',e=>savePencapaianActivityRecord_(e,false));
  bind('pencapaianSaveAndBackBtn','click',()=>savePencapaianActivityRecord_(null,true));
  bind('pencapaianRecordDate','change',()=>{syncPencapaianRecordYear_();schedulePencapaianUnitPreview_();});
  bind('pencapaianRecordYear','change',schedulePencapaianUnitPreview_);
  bind('pencapaianRecordYear','input',schedulePencapaianUnitPreview_);
  bind('pencapaianRecordCategory','change',schedulePencapaianUnitPreview_);
  bind('pencapaianRecordPosition','change',()=>selectPencapaianRank_($('pencapaianRecordPosition').value));
  bind('pencapaianRecordParticipantSearch','input',renderPencapaianParticipants_);
  bind('pencapaianRecordParticipantClass','change',renderPencapaianParticipants_);
  bind('pencapaianSelectAllBtn','click',()=>setAllPencapaianParticipants_(true));
  bind('pencapaianClearAllBtn','click',()=>setAllPencapaianParticipants_(false));
  document.querySelectorAll('[data-pencapaian-rank]').forEach(btn=>btn.addEventListener('click',()=>selectPencapaianRank_(btn.dataset.pencapaianRank)));
  bind('activitySearch','input',filterAktivitiTable);
  bind('activityYear','change',filterAktivitiTable);
  bind('activityLevel','change',filterAktivitiTable);
  bind('activityDate','change',updateActivityDay_);
  bind('activityForm','submit',saveAktiviti);
  bind('activityParticipantsBackBtn','click',()=>showPage('activity'));
  bind('activityParticipantsSaveBtn','click',saveAktivitiPeserta);
  bind('docNewBtn','click',newEditorDocument_);
  bind('reportOverviewRefreshBtn','click',loadReportsOverview_);
  bind('reportActivitySearch','input',renderReportsOverview_);
  bind('reportYearFilter','change',renderReportsOverview_);
  bind('reportResetFilterBtn','click',()=>{if($('reportActivitySearch'))$('reportActivitySearch').value='';if($('reportYearFilter'))$('reportYearFilter').value='';renderReportsOverview_();});
  bind('reportNewMeetingBtn','click',startManualMeetingReport_);
  bind('reportAddParticipantsBtn','click',openReportParticipantModal_);
  bind('reportNoParticipantsBtn','click',()=>{setStandaloneParticipantMode_('none');if($('docEditorStatus'))$('docEditorStatus').textContent='Laporan tanpa peserta dipilih. Halaman kedua tidak akan disimpan atau dicetak.';});
  bind('reportParticipantClassFilter','change',renderReportParticipantCandidates_);
  bind('reportParticipantSearch','input',renderReportParticipantCandidates_);
  bind('reportParticipantSelectVisibleBtn','click',()=>{const kelas=String($('reportParticipantClassFilter')?.value||'');const q=String($('reportParticipantSearch')?.value||'').trim().toLocaleLowerCase('ms');REPORT_STANDALONE_STUDENT_ROWS_.filter(p=>(!kelas||String(p.KELAS||'')===kelas)&&(!q||[p.NAMA,p.NO_KP,p.KELAS,p.TINGKATAN].some(v=>String(v||'').toLocaleLowerCase('ms').includes(q)))).forEach(p=>REPORT_STANDALONE_SELECTED_IDS_.add(String(p.NO_KP||'')));renderReportParticipantCandidates_();});
  bind('reportParticipantClearVisibleBtn','click',()=>{const kelas=String($('reportParticipantClassFilter')?.value||'');const q=String($('reportParticipantSearch')?.value||'').trim().toLocaleLowerCase('ms');REPORT_STANDALONE_STUDENT_ROWS_.filter(p=>(!kelas||String(p.KELAS||'')===kelas)&&(!q||[p.NAMA,p.NO_KP,p.KELAS,p.TINGKATAN].some(v=>String(v||'').toLocaleLowerCase('ms').includes(q)))).forEach(p=>REPORT_STANDALONE_SELECTED_IDS_.delete(String(p.NO_KP||'')));renderReportParticipantCandidates_();});
  $('reportParticipantListWrap')?.addEventListener('change',e=>{const checkbox=e.target.closest('[data-report-student-id]');if(!checkbox)return;const id=String(checkbox.dataset.reportStudentId||'');if(checkbox.checked)REPORT_STANDALONE_SELECTED_IDS_.add(id);else REPORT_STANDALONE_SELECTED_IDS_.delete(id);updateReportParticipantSelectionCount_();});
  bind('reportParticipantSaveBtn','click',saveReportParticipantSelection_);
  document.querySelectorAll('[data-report-participant-close]').forEach(el=>el.addEventListener('click',closeReportParticipantModal_));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('reportParticipantModal')&&!$('reportParticipantModal').hidden)closeReportParticipantModal_();});
  bind('reportFormBackBtn','click',()=>showPage('reports'));
  bind('reportFormTitle','input',()=>{if($('docTitle'))$('docTitle').value=$('reportFormTitle').value;updateReportPreviewFromForm_();});
  bind('reportObjectiveInput','input',updateReportPreviewFromForm_);
  bind('reportSummaryInput','input',updateReportPreviewFromForm_);
  bind('reportImpactInput','input',updateReportPreviewFromForm_);
  document.querySelectorAll('[data-report-new-meeting]').forEach(b=>b.addEventListener('click',startManualMeetingReport_));
  [1,2,3,4].forEach(n=>bind('reportPhoto'+n,'change',e=>handleReportPhotoSelection_(n,e.target.files&&e.target.files[0])));
  bind('docLoadLetterTemplateBtn','click',loadPermissionTemplateIntoEditor_);
  bind('docLoadReportTemplateBtn','click',loadReportTemplateIntoEditor_);
  bind('docListRefreshBtn','click',loadSavedDocuments_);
  bind('docStartReportBtn','click',()=>buildActivityReportDraft_($('docActivitySelect')?.value||''));
  bind('docType','change',updateDocumentTypeUi_);
  bind('docTitle','input',updateDocumentTypeUi_);
  bind('docSearch','input',renderSavedDocuments_);
  bind('docListType','change',renderSavedDocuments_);
  bind('docSaveBtn','click',saveEditorDocument_);
  bind('docPrintBtn','click',printEditorDocument_);
  bind('editorLinkBtn','click',insertEditorLink_);
  bind('editorBlockFormat','change',applyEditorBlockFormat_);
  bind('editorTextColor','input',applyEditorTextColor_);
  document.querySelectorAll('[data-editor-cmd]').forEach(btn=>btn.addEventListener('click',()=>runEditorCommand_(btn.dataset.editorCmd)));
  bind('activityParticipantClass','change',renderAktivitiPesertaTable_);
  bind('activityParticipantSearch','input',renderAktivitiPesertaTable_);
  document.querySelectorAll('[data-activity-close]').forEach(e=>e.addEventListener('click',closeAktivitiModal));
  bind('attLoadBtn','click',loadAttendanceForm);
  bind('attSaveBtn','click',saveAttendance);
  bind('attRecordRefreshBtn','click',loadAttendanceRecords);
  document.querySelectorAll('[data-att-bulk]').forEach(btn=>btn.addEventListener('click',()=>bulkAttendanceStatus(btn.dataset.attBulk)));
  if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js',{updateViaCache:'none'}).catch(console.warn);
  refreshLoginConnectionUi_();
  if(state.token&&state.user)resumeExistingSession_();else showLogin();
}
const API_READ_CACHE_TTL_MS_ = 8000;
const API_READ_CACHEABLE_ACTIONS_ = new Set([
  'getRegistrationOptions','getDashboardAnalytics','getMurid','getUsers','getUnit','getUnitMembers',
  'getUnitOverview','getAttendanceForm','getAttendanceRecords','getUnitAjkCandidates','getAktiviti',
  'getAktivitiPeserta','getPencapaian','getPencapaianAktivitiList','getPencapaianAktivitiRecords',
  'getPencapaianUnitPreview','getDocuments','getReportsOverview','getPajskClassReport'
]);
const API_CACHE_INVALIDATE_ACTIONS_ = new Set([
  'login','logout','registerUser','saveMyUnits','addMurid','bulkAddMurid','bulkDeleteMurid','bulkDeleteAllMurid',
  'addUser','setUserStatus','resetUserPassword','changeUserRole','logoutUserSessions','deleteUser',
  'addGuru','updateGuru','setGuruStatus','deleteGuru','getGuru','addUnit','updateUnit','setUnitStatus',
  'addUnitMember','removeUnitMember','saveAttendance','saveUnitAjk','saveAktiviti','deleteAktiviti',
  'saveAktivitiPeserta','savePencapaian','setPencapaianStatus','savePencapaianAktivitiBatch',
  'saveDocument','saveSystemLogoChunk','saveAppSettings'
]);
const API_READ_MEMORY_CACHE_ = new Map();
const API_READ_INFLIGHT_ = new Map();
let API_CACHE_EPOCH_ = 0;
function apiStableKey_(action,params){
  const values={};Object.keys(params||{}).sort().forEach(k=>{if(params[k]!==undefined&&params[k]!==null)values[k]=String(params[k]);});
  return String(action)+'|'+JSON.stringify(values);
}
function clearApiReadCache_(){API_CACHE_EPOCH_++;API_READ_MEMORY_CACHE_.clear();API_READ_INFLIGHT_.clear();}
function apiGet(action,params={},timeoutMs=30000){
  const name=String(action||''),cacheable=API_READ_CACHEABLE_ACTIONS_.has(name),key=cacheable?apiStableKey_(name,params):'';
  if(cacheable){
    const hit=API_READ_MEMORY_CACHE_.get(key);
    if(hit&&hit.expiresAt>Date.now())return Promise.resolve(hit.value);
    if(hit)API_READ_MEMORY_CACHE_.delete(key);
    if(API_READ_INFLIGHT_.has(key))return API_READ_INFLIGHT_.get(key);
  }
  const startEpoch=API_CACHE_EPOCH_;
  const request=apiGetNetwork_(name,params,timeoutMs).then(data=>{
    if(API_CACHE_INVALIDATE_ACTIONS_.has(name))clearApiReadCache_();
    else if(cacheable&&startEpoch===API_CACHE_EPOCH_){
      API_READ_MEMORY_CACHE_.set(key,{value:data,expiresAt:Date.now()+API_READ_CACHE_TTL_MS_});
      while(API_READ_MEMORY_CACHE_.size>40)API_READ_MEMORY_CACHE_.delete(API_READ_MEMORY_CACHE_.keys().next().value);
    }
    return data;
  }).catch(error=>{throw error;}).finally(()=>{if(cacheable&&API_READ_INFLIGHT_.get(key)===request)API_READ_INFLIGHT_.delete(key);});
  if(cacheable)API_READ_INFLIGHT_.set(key,request);
  return request;
}

function apiGetNetwork_(action,params={},timeoutMs=30000){
  return new Promise((resolve,reject)=>{
    let u;
    try{
      u=new URL(state.apiUrl||prompt('Masukkan URL Apps Script /exec'));
    }catch(e){
      reject(Error('URL backend tidak sah.'));
      return;
    }

    u.search='';
    u.hash='';

    if(!state.apiUrl){
      state.apiUrl=u.toString();
      localStorage.setItem('ekossta_model_b_api_url',state.apiUrl);
    }

    const cb='__ekossta_v2_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const q=new URLSearchParams();
    q.set('action',String(action||''));
    q.set('callback',cb);
    q.set('_',String(Date.now()));

    Object.keys(params||{}).forEach(k=>{
      const v=params[k];
      if(v!==undefined&&v!==null) q.set(k,String(v));
    });

    const s=document.createElement('script');
    s.src=u.origin+u.pathname+'?'+q.toString();
    s.async=true;
    s.referrerPolicy='no-referrer-when-downgrade';

    let timer=null;
    let finished=false;

    const cleanup=()=>{
      if(timer)clearTimeout(timer);
      timer=null;
      try{delete window[cb]}catch(e){window[cb]=undefined}
      if(s.parentNode)s.parentNode.removeChild(s);
    };

    window[cb]=data=>{
      if(finished)return;
      finished=true;
      cleanup();

      if(!data){
        reject(Error('Backend menghantar respons kosong.'));
        return;
      }

      if(data.ok===false){
        reject(Error(data.error||'Backend error.'));
        return;
      }

      resolve(data);
    };

    s.onerror=()=>{
      if(finished)return;
      finished=true;
      cleanup();
      reject(Error('Gagal memuatkan respons Apps Script. Semak URL /exec dan deployment.'));
    };

    timer=setTimeout(()=>{
      if(finished)return;
      finished=true;
      cleanup();
      reject(Error(`Backend timeout selepas ${Math.ceil(Math.max(1000,Number(timeoutMs)||30000)/1000)} saat. Backend /exec boleh dicapai tetapi respons JSONP tidak sampai ke browser.`));
    },Math.max(1000,Number(timeoutMs)||30000));

    document.head.appendChild(s);
  });
}
function isValidAppsScriptUrl_(value){return /^https:\/\/script\.google\.com\/macros\/s\/[^\s]+\/exec(?:[?#].*)?$/i.test(String(value||'').trim());}
function refreshLoginConnectionUi_(){
  const input=$('loginApiUrl');if(input&&state.apiUrl&&!input.value)input.value=state.apiUrl;
  const status=$('loginApiStatus'),indicator=$('loginApiIndicator'),saveStatus=$('loginApiSaveStatus'),details=$('loginApiSettings');
  if(status)status.textContent=state.apiUrl?'BACKEND DIKONFIGURASI':'SAMBUNGAN BELUM DITETAPKAN';
  if(indicator)indicator.classList.toggle('is-configured',!!state.apiUrl);
  if(saveStatus&&state.apiUrl&&saveStatus.textContent==='Belum disahkan')saveStatus.textContent='URL disimpan dalam pelayar';
  if(details&&state.apiUrl&&details.dataset.initialized!=='1'){details.open=false;details.dataset.initialized='1';}
  if(details&&!state.apiUrl){details.open=true;details.dataset.initialized='1';}
}
function saveLoginApiUrl_(){
  const input=$('loginApiUrl'),status=$('loginApiSaveStatus'),value=String(input?.value||'').trim();
  if(!isValidAppsScriptUrl_(value)){if(status)status.textContent='URL tidak sah. Pastikan berakhir dengan /exec.';toast('URL Apps Script tidak sah.');return;}
  state.apiUrl=value.split('#')[0];localStorage.setItem('ekossta_model_b_api_url',state.apiUrl);
  if(status)status.textContent='URL disimpan. Cuba log masuk.';
  refreshLoginConnectionUi_();toast('URL Apps Script disimpan.');
}
function toggleLoginPassword_(){const input=$('password'),button=$('passwordRevealBtn');if(!input||!button)return;const reveal=input.type==='password';input.type=reveal?'text':'password';button.textContent=reveal?'SEMBUNYI':'PAPAR';button.setAttribute('aria-pressed',reveal?'true':'false');button.setAttribute('aria-label',reveal?'Sembunyikan kata laluan':'Paparkan kata laluan');input.focus();}

function showLoginMode_(mode){
  const registering=mode==='register';
  if($('loginModeSection'))$('loginModeSection').hidden=registering;
  if($('registerModeSection'))$('registerModeSection').hidden=!registering;
  if($('loginResult'))$('loginResult').textContent='';
  if($('registerResult'))$('registerResult').textContent='';
  if(registering)setTimeout(()=>$('registerNama')?.focus(),0);
  else setTimeout(()=>$('username')?.focus(),0);
}
async function registerAccount_(){
  const button=$('registerBtn'),result=$('registerResult');
  const nama=String($('registerNama')?.value||'').trim().replace(/\s+/g,' ');
  const email=String($('registerEmail')?.value||'').trim().toLowerCase();
  const password=String($('registerPassword')?.value||'');
  const role=String($('registerRole')?.value||'GURU').toUpperCase();
  // Unit selection is deliberately deferred until after ADMIN approves a Guru account.
  const unitIds=[];
  if(!nama||!email||!password){if(result)result.textContent='Lengkapkan nama penuh, e-mel dan kata laluan.';return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){if(result)result.textContent='Alamat e-mel tidak sah.';return;}
  if(password.length<8){if(result)result.textContent='Kata laluan mesti sekurang-kurangnya 8 aksara.';return;}
  if(!state.apiUrl){
    const fieldValue=String($('loginApiUrl')?.value||'').trim();const candidate=fieldValue||prompt('Masukkan URL Apps Script /exec');
    if(!candidate)return;
    if(!isValidAppsScriptUrl_(candidate)){if(result)result.textContent='URL Apps Script tidak sah. Gunakan URL /exec.';return;}
    state.apiUrl=String(candidate).trim().split('#')[0];localStorage.setItem('ekossta_model_b_api_url',state.apiUrl);refreshLoginConnectionUi_();
  }
  if(button){button.disabled=true;button.innerHTML='<span>Menyimpan akaun…</span><b aria-hidden="true">…</b>';}
  if(result)result.textContent='Menghantar maklumat akaun untuk kelulusan ADMIN…';
  try{
    const d=await apiGet('registerUser',{email,nama,password,role},30000);
    if($('registerPassword'))$('registerPassword').value='';
    if(result)result.textContent=d.message||'Pendaftaran diterima dan sedang menunggu kelulusan ADMIN.';
    toast(d.message||'Pendaftaran dihantar. Tunggu kelulusan ADMIN.');
  }catch(e){if(result)result.textContent=e.message||'Pendaftaran gagal.';toast(e.message||'Pendaftaran gagal.');}
  finally{if(button){button.disabled=false;button.innerHTML='<span>Hantar Pendaftaran</span><b aria-hidden="true">→</b>';}}
}
let UNIT_SETUP_OPTIONS_LOADED_=false;
async function resumeExistingSession_(){
  try{
    const d=await apiGet('me',{token:state.token});
    state.user=d.user||state.user;
    sessionStorage.setItem('ekossta_v2_user',JSON.stringify(state.user));
    if(state.user?.role==='GURU'&&(state.user.needsUnitSelection||!(state.user.unitIds||[]).length))showUnitSetup_();
    else showApp();
  }catch(e){
    // Invalid sessions are cleared; a unit setup session itself remains valid through the special /me endpoint.
    state.token='';state.user=null;sessionStorage.removeItem('ekossta_v2_token');sessionStorage.removeItem('ekossta_v2_user');showLogin();
  }
}
function showUnitSetup_(){
  document.body.classList.add('logged-out');
  if($('loginView'))$('loginView').hidden=true;
  if($('appView'))$('appView').hidden=true;
  if($('unitSetupView'))$('unitSetupView').hidden=false;
  if($('unitSetupGreeting'))$('unitSetupGreeting').textContent=`Pendaftaran anda telah diluluskan, ${state.user?.nama||state.user?.username||'Guru Penasihat'}. Sebelum membuka dashboard, pilih unit yang anda urus.`;
  if($('unitSetupResult'))$('unitSetupResult').textContent='';
  const sidebar=$('sidebar');if(sidebar)sidebar.setAttribute('aria-hidden','true');
  const mobileNav=$('mobileNav');if(mobileNav)mobileNav.setAttribute('aria-hidden','true');
  UNIT_SETUP_OPTIONS_LOADED_=false;
  loadUnitSetupOptions_();
  loadAppSettings_(true).catch(e=>console.warn('Tetapan identiti aplikasi tidak dapat dimuatkan:',e));
}
async function loadUnitSetupOptions_(){
  const host=$('unitSetupOptions');if(!host)return;
  host.innerHTML='<p class="unit-setup-empty">Memuatkan senarai unit aktif…</p>';
  try{
    if(!state.apiUrl)throw new Error('URL Google Apps Script belum ditetapkan. Buka Sambungan pada halaman log masuk untuk menetapkannya.');
    const d=await apiGet('getRegistrationOptions',{},20000),units=Array.isArray(d.units)?d.units:[];
    if(!units.length){host.innerHTML='<p class="unit-setup-empty">Tiada unit aktif untuk dipilih. Hubungi ADMIN sekolah supaya unit disediakan dahulu.</p>';return;}
    const already=new Set((state.user?.unitIds||[]).map(String));
    host.innerHTML=units.map(u=>`<label class="unit-setup-option"><input type="checkbox" data-my-unit="${escAttr(u.unitId)}" ${already.has(String(u.unitId))?'checked':''}><span class="unit-setup-option-copy"><b>${esc(u.nama||'Unit tanpa nama')}</b><small>${esc(u.kategori||'')} ${u.tahun?'· '+esc(u.tahun):''}</small></span></label>`).join('');
    UNIT_SETUP_OPTIONS_LOADED_=true;
  }catch(e){host.innerHTML=`<p class="unit-setup-empty">${esc(e.message||'Gagal memuatkan senarai unit.')}</p>`;}
}
async function saveMyUnitSelection_(){
  const button=$('saveUnitSelectionBtn'),result=$('unitSetupResult');
  const unitIds=[...document.querySelectorAll('[data-my-unit]:checked')].map(x=>String(x.dataset.myUnit||'').trim()).filter(Boolean);
  if(!unitIds.length){if(result)result.textContent='Pilih sekurang-kurangnya satu unit sebelum menyimpan.';return;}
  if(button){button.disabled=true;button.innerHTML='<span>Menyimpan pilihan unit…</span><b aria-hidden="true">…</b>';}
  if(result)result.textContent='Menyimpan unit pilihan ke akaun anda…';
  try{
    const d=await apiGet('saveMyUnits',{token:state.token,unitIds:JSON.stringify(unitIds)},30000);
    state.user=Object.assign({},state.user,{unitIds,needsUnitSelection:false});
    sessionStorage.setItem('ekossta_v2_user',JSON.stringify(state.user));
    if(result)result.textContent=d.message||'Pilihan unit berjaya disimpan.';
    toast('Unit berjaya disimpan. Dashboard sedang dibuka.');
    if($('unitSetupView'))$('unitSetupView').hidden=true;
    showApp();
  }catch(e){if(result)result.textContent=e.message||'Pilihan unit gagal disimpan.';toast(e.message||'Pilihan unit gagal disimpan.');}
  finally{if(button){button.disabled=false;button.innerHTML='<span>Simpan Pilihan &amp; Masuk</span><b aria-hidden="true">→</b>';}}
}
function updateDashboardSessionUi_(){
  const role=String(state.user?.role||'').toUpperCase();
  const roleLabel=role==='ADMIN'?'ADMINISTRATOR':role==='PENTADBIR'?'PENTADBIR':role==='GURU'?'GURU PENASIHAT':'PENGGUNA';
  const r=$('dashboardRole');if(r)r.textContent=roleLabel;
  const y=$('dashboardYear');if(y)y.textContent=String(new Date().getFullYear());
  const date=$('dashboardDate');if(date)date.textContent=new Date().toLocaleDateString('ms-MY',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
  document.querySelectorAll('[data-dashboard-admin-only]').forEach(el=>{el.hidden=role!=='ADMIN';});
  const note=$('dashboardDataNote');if(note)note.textContent='Muat semula untuk menyegerakkan ringkasan dengan data semasa.';
  updateDashboardSummary_();
}
function updateDashboardSummary_(){
  const units=Array.isArray(DASHBOARD_SUMMARY_CACHE_.units)?DASHBOARD_SUMMARY_CACHE_.units:null;
  const set=(id,value)=>{const el=$(id);if(el)el.textContent=value===null||value===undefined?'—':Number(value).toLocaleString('ms-MY');};
  if(units){
    const active=units.filter(u=>!String(u.STATUS||'AKTIF').trim()||String(u.STATUS||'AKTIF').toUpperCase()==='AKTIF');
    const memberships=active.reduce((sum,u)=>sum+Math.max(0,Number(u.JUMLAH_AHLI)||0),0);
    const cats=new Set(active.map(u=>String(u.KATEGORI||'').trim().toUpperCase()).filter(Boolean));
    set('dashboardUnitCount',active.length);set('dashboardMembershipCount',memberships);set('dashboardCategoryCount',cats.size);
  }
  const note=$('dashboardDataNote');
  if(note){
    const murid=DASHBOARD_SUMMARY_CACHE_.murid,unitsReady=Array.isArray(units),role=String(state.user?.role||'').toUpperCase();
    if(role!=='ADMIN'&&unitsReady)note.textContent=`Data unit dibaca: ${units.length.toLocaleString('ms-MY')} unit yang tersedia untuk peranan anda.`;
    else if(Array.isArray(murid)&&unitsReady)note.textContent=`Data berjaya dibaca: ${murid.length.toLocaleString('ms-MY')} murid • ${units.length.toLocaleString('ms-MY')} unit direkodkan.`;
    else if(Array.isArray(murid))note.textContent=`Data murid dibaca: ${murid.length.toLocaleString('ms-MY')} rekod. Menunggu data unit...`;
    else if(unitsReady)note.textContent=`Data unit dibaca: ${units.length.toLocaleString('ms-MY')} unit. Menunggu data murid...`;
  }
}
async function refreshDashboardData_(){
  const button=$('dashboardRefreshBtn');if(button){button.disabled=true;button.dataset.originalText=button.textContent;button.textContent='Menyegerakkan...';}
  try{const tasks=[loadUnit(),loadDashboardAnalytics_(true)];if(state.user?.role==='ADMIN')tasks.push(loadMurid(false));await Promise.all(tasks);toast('Ringkasan dashboard dikemas kini.');}
  finally{if(button){button.disabled=false;button.textContent='↻ Segar Semula Data';}}
}

function dashboardEsc_(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function dashboardCategoryKey_(value){
  const v=String(value||'').trim().toUpperCase().replace(/\s+/g,' ');
  if(v.includes('RUMAH SUKAN'))return 'RUMAH SUKAN';
  if(v.includes('UNIT BERUNIFORM')||v.includes('BADAN BERUNIFORM'))return 'UNIT BERUNIFORM';
  if(v.includes('KELAB')||v.includes('PERSATUAN'))return 'KELAB / PERSATUAN';
  if(v.includes('SUKAN')||v.includes('PERMAINAN'))return 'SUKAN / PERMAINAN';
  return v;
}
function dashboardDateLabel_(value){
  const v=String(value||'').trim();if(!v)return '—';
  const iso=v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(iso){const d=new Date(Number(iso[1]),Number(iso[2])-1,Number(iso[3]));return d.toLocaleDateString('ms-MY',{day:'2-digit',month:'short',year:'numeric'});}
  const d=new Date(v);return Number.isNaN(d.getTime())?v:d.toLocaleDateString('ms-MY',{day:'2-digit',month:'short',year:'numeric'});
}
async function loadDashboardAnalytics_(force=false){
  if(!state.token||!$('dashboardTopStudents'))return;
  if(DASHBOARD_ANALYTICS_CACHE_.loaded&&!force){renderDashboardAnalytics_();return;}
  const note=$('dashboardAnalyticsNote');if(note)note.textContent='Menyegerakkan data semua unit...';
  try{
    const d=await apiGet('getDashboardAnalytics',{token:state.token,tahun:String(new Date().getFullYear())},45000);
    DASHBOARD_ANALYTICS_CACHE_={loaded:true,year:String(d.year||new Date().getFullYear()),topStudents:Array.isArray(d.topStudents)?d.topStudents:[],activities:Array.isArray(d.activities)?d.activities:[],attendanceByUnit:Array.isArray(d.attendanceByUnit)?d.attendanceByUnit:[],membersByUnit:Array.isArray(d.membersByUnit)?d.membersByUnit:[],summary:d.summary||{}};
    renderDashboardAnalytics_();
  }catch(e){
    if(note)note.textContent='Data analitik tidak dapat dimuat: '+(e.message||'ralat sambungan');
    ['dashboardTopStudents','dashboardEventsTableWrap','dashboardAttendanceChart','dashboardMembersChart'].forEach(id=>{const el=$(id);if(el)el.innerHTML='<div class="dashboard-analytics-empty">Data tidak dapat dimuatkan. Tekan Segar Semula Data untuk cuba lagi.</div>';});
  }
}
function renderDashboardAnalytics_(){
  const data=DASHBOARD_ANALYTICS_CACHE_;const note=$('dashboardAnalyticsNote');
  if(note)note.textContent=`${Number(data.summary?.students||0).toLocaleString('ms-MY')} murid • ${Number(data.summary?.units||0).toLocaleString('ms-MY')} unit • ${data.year||new Date().getFullYear()}`;
  const year=$('dashboardAnalyticsYear');if(year)year.textContent=data.year||String(new Date().getFullYear());
  const top=$('dashboardTopStudents');
  if(top){
    if(!data.topStudents.length)top.innerHTML='<div class="dashboard-analytics-empty">Belum ada rekod pencapaian dengan kedudukan Johan hingga tempat kelima yang boleh diranking.</div>';
    else top.innerHTML=data.topStudents.map((s,i)=>`<div class="dashboard-rank-row"><span class="dashboard-rank-place">${String(i+1).padStart(2,'0')}</span><div class="dashboard-rank-student"><b>${dashboardEsc_(s.name)}</b><small>${dashboardEsc_([s.kelas,s.tingkatan?`Tingkatan ${s.tingkatan}`:''].filter(Boolean).join(' • ')||'Maklumat kelas tidak direkod')}</small><span>${dashboardEsc_(s.bestLevel)} · ${dashboardEsc_(s.bestPosition)}</span></div><button class="dashboard-achievement-count" type="button" data-dashboard-achievement-index="${i}" aria-label="Lihat senarai ${Number(s.achievementCount||0)} pencapaian ${dashboardEsc_(s.name)}"><b>${Number(s.achievementCount||0)}</b><small>pencapaian</small></button></div>`).join('');
    top.querySelectorAll('[data-dashboard-achievement-index]').forEach(button=>button.addEventListener('click',()=>showDashboardAchievementModal_(Number(button.dataset.dashboardAchievementIndex))));
  }
  const events=$('dashboardEventsTableWrap');
  if(events){
    if(!data.activities.length)events.innerHTML='<div class="dashboard-analytics-empty">Belum ada rekod aktiviti atau acara.</div>';
    else events.innerHTML=`<table class="dashboard-events-table"><thead><tr><th>AKTIVITI / ACARA</th><th>TARIKH</th><th>PERINGKAT</th><th>PESERTA</th><th>PENCAPAIAN</th></tr></thead><tbody>${data.activities.slice(0,12).map(a=>`<tr><td><b>${dashboardEsc_(a.name)}</b><small>${dashboardEsc_(a.place||'—')}</small></td><td>${dashboardEsc_(dashboardDateLabel_(a.date))}</td><td>${dashboardEsc_(a.level||'—')}</td><td>${Number(a.participants||0).toLocaleString('ms-MY')}</td><td><span class="dashboard-event-award-count">${Number(a.awards||0).toLocaleString('ms-MY')}</span></td></tr>`).join('')}</tbody></table>`;
  }
  renderDashboardUnitSlider_('attendance');renderDashboardUnitSlider_('members');
}
function renderDashboardUnitSlider_(type){
  const isAttendance=type==='attendance';
  const slide=isAttendance?DASHBOARD_ATTENDANCE_SLIDE_:DASHBOARD_MEMBERS_SLIDE_;
  const category=DASHBOARD_UNIT_CATEGORIES_[Math.max(0,Math.min(DASHBOARD_UNIT_CATEGORIES_.length-1,slide))];
  const slider=$(isAttendance?'dashboardAttendanceSlider':'dashboardMembersSlider');if(slider){slider.value=String(slide);slider.max=String(DASHBOARD_UNIT_CATEGORIES_.length-1);slider.setAttribute('aria-valuetext',category.label);}
  const label=$(isAttendance?'dashboardAttendanceCategoryLabel':'dashboardMembersCategoryLabel');if(label)label.textContent=category.label;
  const meta=$(isAttendance?'dashboardAttendanceSlideMeta':'dashboardMembersSlideMeta');if(meta)meta.textContent=`${slide+1} / ${DASHBOARD_UNIT_CATEGORIES_.length}`;
  const container=$(isAttendance?'dashboardAttendanceChart':'dashboardMembersChart');if(!container)return;
  const source=isAttendance?DASHBOARD_ANALYTICS_CACHE_.attendanceByUnit:DASHBOARD_ANALYTICS_CACHE_.membersByUnit;
  const rows=source.filter(u=>dashboardCategoryKey_(u.category)===category.key).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ms'));
  if(!rows.length){container.innerHTML='<div class="dashboard-analytics-empty">Tiada unit dalam kategori ini untuk tahun pengurusan yang dipilih.</div>';return;}
  if(isAttendance){
    container.innerHTML=rows.map(u=>{const rate=Math.max(0,Math.min(100,Number(u.percentage)||0));return `<div class="dashboard-bar-row"><div class="dashboard-bar-meta"><b>${dashboardEsc_(u.name)}</b><strong>${rate}%</strong></div><div class="dashboard-bar-track"><span style="width:${rate}%"></span></div><small>${Number(u.present||0).toLocaleString('ms-MY')} hadir daripada ${Number(u.total||0).toLocaleString('ms-MY')} rekod ${u.total?'':'· Tiada rekod kehadiran'}</small></div>`;}).join('');
  }else{
    container.innerHTML=rows.map(u=>{const total=Math.max(0,Number(u.total)||0),male=Math.max(0,Number(u.male)||0),female=Math.max(0,Number(u.female)||0),maleW=total?male/total*100:0,femaleW=total?female/total*100:0;return `<div class="dashboard-member-row"><div class="dashboard-bar-meta"><b>${dashboardEsc_(u.name)}</b><strong>${total.toLocaleString('ms-MY')} ahli</strong></div><div class="dashboard-gender-track"><span class="dashboard-gender-male" style="width:${maleW}%"></span><span class="dashboard-gender-female" style="width:${femaleW}%"></span></div><div class="dashboard-gender-counts"><span>Lelaki <b>${male.toLocaleString('ms-MY')}</b></span><span>Perempuan <b>${female.toLocaleString('ms-MY')}</b></span></div></div>`;}).join('');
  }
}
function showDashboardAchievementModal_(index){
  const student=DASHBOARD_ANALYTICS_CACHE_.topStudents[index];if(!student)return;
  document.querySelectorAll('[data-dashboard-achievement-modal]').forEach(el=>el.remove());
  const overlay=document.createElement('div');overlay.className='dashboard-achievement-modal-backdrop';overlay.dataset.dashboardAchievementModal='1';overlay.setAttribute('role','presentation');
  const events=Array.isArray(student.events)?student.events:[];
  overlay.innerHTML=`<section class="dashboard-achievement-modal" role="dialog" aria-modal="true" aria-labelledby="dashboardAchievementModalTitle"><div class="dashboard-achievement-modal-head"><div><span>REKOD PENCAPAIAN MURID</span><h3 id="dashboardAchievementModalTitle">${dashboardEsc_(student.name)}</h3><small>${dashboardEsc_([student.kelas,student.tingkatan?`Tingkatan ${student.tingkatan}`:''].filter(Boolean).join(' • '))}</small></div><button type="button" class="dashboard-achievement-modal-close" aria-label="Tutup">×</button></div><p class="dashboard-analysis-caption">${events.length} acara dengan kedudukan Johan hingga tempat kelima. Senarai disusun mengikut peringkat dan kedudukan tertinggi.</p><div class="dashboard-achievement-modal-list">${events.length?events.map((e,i)=>`<article class="dashboard-achievement-event"><span class="dashboard-achievement-event-number">${String(i+1).padStart(2,'0')}</span><div><b>${dashboardEsc_(e.name)}</b><small>${dashboardEsc_(dashboardDateLabel_(e.date))}${e.unit?` · ${dashboardEsc_(e.unit)}`:''}</small><div class="dashboard-achievement-event-tags"><span>${dashboardEsc_(e.level)}</span><strong>${dashboardEsc_(e.position)}</strong>${e.award&&e.award!==e.name?`<em>${dashboardEsc_(e.award)}</em>`:''}</div></div></article>`).join(''):'<div class="dashboard-analytics-empty">Tiada butiran pencapaian.</div>'}</div></section>`;
  const close=()=>{overlay.remove();document.removeEventListener('keydown',onKey);};
  const onKey=e=>{if(e.key==='Escape')close();};
  overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('.dashboard-achievement-modal-close'))close();});
  document.addEventListener('keydown',onKey);document.body.appendChild(overlay);overlay.querySelector('.dashboard-achievement-modal-close')?.focus();
}
async function login(){
  const b=$('loginBtn'),username=String($('username')?.value||'').trim(),password=String($('password')?.value||'');
  if(!username||!password){const r=$('loginResult');if(r)r.textContent='Masukkan username dan kata laluan.';toast('Masukkan username dan kata laluan.');return;}
  if(!state.apiUrl){
    const fieldValue=String($('loginApiUrl')?.value||'').trim();
    const candidate=fieldValue||prompt('Masukkan URL Apps Script /exec');
    if(!candidate)return;
    if(!isValidAppsScriptUrl_(candidate)){const r=$('loginResult');if(r)r.textContent='URL Apps Script tidak sah. Gunakan URL web app yang berakhir dengan /exec.';toast('URL /exec tidak sah.');return;}
    state.apiUrl=String(candidate).trim().split('#')[0];localStorage.setItem('ekossta_model_b_api_url',state.apiUrl);refreshLoginConnectionUi_();
  }
  if(b){b.disabled=true;b.innerHTML='<span>Mengesahkan...</span><b aria-hidden="true">…</b>';}
  const result=$('loginResult');if(result)result.textContent='Menyemak akaun dan sambungan sistem...';
  try{
    const d=await apiGet('login',{username,password});state.token=d.token;state.user=d.user;
    sessionStorage.setItem('ekossta_v2_token',state.token);sessionStorage.setItem('ekossta_v2_user',JSON.stringify(state.user));
    $('password').value='';
    if(state.user?.role==='GURU'&&(state.user.needsUnitSelection||!(state.user.unitIds||[]).length)){showUnitSetup_();toast('Akaun diluluskan. Pilih dan simpan unit sebelum masuk ke dashboard.');}
    else{showApp();toast('Log masuk berjaya.');}
  }catch(e){if(result)result.textContent=e.message||'Log masuk gagal. Semak akaun dan sambungan.';toast(e.message||'Log masuk gagal.');}
  finally{if(b){b.disabled=false;b.innerHTML='<span>Log Masuk</span><b aria-hidden="true">→</b>';}}
}
async function logout(){try{if(state.token)await apiGet('logout',{token:state.token})}catch(e){}state.token='';state.user=null;sessionStorage.removeItem('ekossta_v2_token');sessionStorage.removeItem('ekossta_v2_user');showLogin();toast('Logout berjaya.')}
async function me(){try{const d=await apiGet('me',{token:state.token});$('meResult').textContent='Session sah sehingga '+new Date(d.expiresAt).toLocaleString('ms-MY')}catch(e){toast(e.message);if(/Session/.test(e.message))logout()}}
async function loadMurid(showToast=true){try{const d=await apiGet('getMurid',{token:state.token});const rows=d.data||[];render(rows);DASHBOARD_SUMMARY_CACHE_.murid=rows;$('muridCount').textContent=rows.length.toLocaleString('ms-MY');updateDashboardSummary_();if(showToast)toast('Data dimuat.');}catch(e){if(showToast)toast(e.message);const n=$('dashboardDataNote');if(n)n.textContent='Gagal memuat data murid: '+e.message;}}
function openAddMuridModal_(){if(state.user?.role!=='ADMIN')return toast('Tambah murid hanya untuk ADMIN.');const modal=$('addMuridModal');if(!modal)return;const form=$('addMuridForm');if(form)form.reset();if($('addResult'))$('addResult').textContent='';modal.hidden=false;document.body.classList.add('unit-member-modal-open');requestAnimationFrame(()=>{modal.classList.add('show');$('nama')?.focus();});}
function closeAddMuridModal_(){const modal=$('addMuridModal');if(!modal)return;modal.classList.remove('show');document.body.classList.remove('unit-member-modal-open');setTimeout(()=>{modal.hidden=true;},160);}
async function addMurid(){if(state.user?.role!=='ADMIN')return toast('Pengurusan data murid hanya untuk ADMIN.');const b=$('addBtn'),p={token:state.token,nama:$('nama').value.trim(),noKp:$('noKp').value.trim(),jantina:$('jantina').value,tingkatan:$('tingkatan').value.trim(),kelas:$('kelas').value.trim()};if([p.nama,p.noKp,p.jantina,p.tingkatan,p.kelas].some(x=>!String(x||'').trim()))return toast('Lengkapkan semua medan murid.');b.disabled=true;b.textContent='⏳ Menyimpan...';if($('addResult'))$('addResult').textContent='Sedang menyimpan rekod murid...';try{const d=await apiGet('addMurid',p);if($('addResult'))$('addResult').textContent=d.message||'Murid berjaya ditambah.';$('addMuridForm')?.reset();await loadMurid();toast('Murid berjaya ditambah.');closeAddMuridModal_();}catch(e){if($('addResult'))$('addResult').textContent=e.message||'Gagal menambah murid.';toast(e.message||'Gagal menambah murid.');}finally{b.disabled=false;b.textContent='Simpan Murid';}}

async function loadUsers(){
  if(state.user?.role!=='ADMIN')return;
  try{const d=await apiGet('getUsers',{token:state.token});renderUsers(d.data||[]);}
  catch(e){toast(e.message);}
}
function renderUsers(rows){
  const wrap=$('usersTableWrap');
  if(!rows.length){wrap.innerHTML='<div class="empty">Tiada pengguna.</div>';return;}
  const t=document.createElement('table'),thead=document.createElement('thead'),hr=document.createElement('tr');
  ['ID','USERNAME','NAMA','ROLE','UNIT DIPILIH','STATUS','LAST_LOGIN','TINDAKAN'].forEach(c=>{const th=document.createElement('th');th.textContent=c;hr.appendChild(th)});thead.appendChild(hr);t.appendChild(thead);
  const tb=document.createElement('tbody');
  rows.forEach(r=>{const tr=document.createElement('tr');
    ['USER_ID','USERNAME','NAMA','ROLE','UNIT_DIPILIH','STATUS','LAST_LOGIN'].forEach(c=>{const td=document.createElement('td');td.textContent=r[c]||'-';tr.appendChild(td)});
    const td=document.createElement('td');td.className='user-actions-cell';
    const actions=document.createElement('div');actions.className='user-actions-grid';
    const role=document.createElement('select');role.setAttribute('aria-label','Tukar peranan '+String(r.USERNAME||''));['GURU','PENTADBIR','ADMIN'].forEach(x=>{const o=document.createElement('option');o.value=x;o.textContent=x;if(r.ROLE===x)o.selected=true;role.appendChild(o)});role.onchange=()=>changeRole(r.USER_ID,role.value);
    const status=document.createElement('button');status.className='btn secondary small';
    const pending=String(r.STATUS||'').toUpperCase()==='MENUNGGU_KELULUSAN';
    status.textContent=pending?'Luluskan Akaun':r.STATUS==='AKTIF'?'Nyahaktif':'Aktifkan';
    status.onclick=()=>setStatus(r.USER_ID,r.STATUS==='AKTIF'?'TIDAK_AKTIF':'AKTIF',pending);
    const reset=document.createElement('button');reset.className='btn secondary small';reset.textContent='Reset Password';reset.onclick=()=>resetPassword(r.USER_ID,r.USERNAME);
    const kick=document.createElement('button');kick.className='btn secondary small';kick.textContent='Logout Session';kick.onclick=()=>logoutSessions(r.USER_ID);
    const del=document.createElement('button');del.className='btn danger small';del.textContent='Padam';del.title='Padam akaun dan profil Guru yang dipautkan secara kekal';del.onclick=()=>deleteUserPermanently(r.USER_ID,r.USERNAME,r.ROLE);
    actions.append(role,status,reset,kick,del);td.appendChild(actions);tr.appendChild(td);tb.appendChild(tr);
  });t.appendChild(tb);wrap.replaceChildren(t);
}
async function addUser(){
  const b=$('addUserBtn'),p={token:state.token,username:$('newUsername').value.trim(),nama:$('newUserNama').value.trim(),role:$('newUserRole').value,password:$('newUserPassword').value};
  if(!p.username||!p.nama||!p.password)return toast('Lengkapkan semua medan pengguna.');
  b.disabled=true;b.textContent='⏳ Menyimpan...';
  try{const d=await apiGet('addUser',p);$('userResult').textContent=d.message||'Berjaya.';['newUsername','newUserNama','newUserPassword'].forEach(id=>$(id).value='');await loadUsers();toast('Pengguna ditambah.');}
  catch(e){$('userResult').textContent=e.message;toast(e.message)}finally{b.disabled=false;b.textContent='+ Tambah Pengguna'}
}
async function setStatus(userId,status,isApproval=false){if(isApproval&&!confirm('Luluskan akaun ini? Semak peranan dan unit yang dimohon terlebih dahulu.'))return;try{const d=await apiGet('setUserStatus',{token:state.token,userId,status});toast(d.message);loadUsers();}catch(e){toast(e.message)}}
async function resetPassword(userId,username){const password=prompt(`Password baharu untuk ${username}:`);if(password===null)return;if(password.length<8)return toast('Password minimum 8 aksara.');try{const d=await apiGet('resetUserPassword',{token:state.token,userId,password});toast(d.message);loadUsers();}catch(e){toast(e.message)}}
async function changeRole(userId,role){try{const d=await apiGet('changeUserRole',{token:state.token,userId,role});toast(d.message);loadUsers();}catch(e){toast(e.message);loadUsers()}}
async function logoutSessions(userId){try{const d=await apiGet('logoutUserSessions',{token:state.token,userId});toast(d.message);loadUsers();}catch(e){toast(e.message)}}
async function deleteUserPermanently(userId,username,role){
  const note=String(role||'').toUpperCase()==='GURU'?' Profil Guru, sesi dan pilihan unit yang dipautkan turut dipadam.':' Sesi dan pilihan unit akaun turut dipadam.';
  if(!confirm(`PADAM KEKAL akaun “${username}” (${role})?${note}\n\nRekod sejarah aktiviti, kehadiran dan pencapaian dikekalkan. Tindakan ini tidak boleh dibatalkan.`))return;
  try{const d=await apiGet('deleteUser',{token:state.token,userId});toast(d.message||'Akaun dipadam.');await Promise.all([loadUsers(),loadGuru()]);}
  catch(e){toast(e.message)}
}
async function loadGuru(){
  if(state.user?.role!=='ADMIN')return;
  try{
    const d=await apiGet('getGuru',{token:state.token});
    renderGuru(d.data||[]);
    await loadGuruUserOptions();
  }catch(e){toast(e.message)}
}
async function loadGuruUserOptions(){
  const s=$('guruUserId'); if(!s)return;
  try{
    const d=await apiGet('getUsers',{token:state.token});
    const current=s.value;
    s.replaceChildren(new Option('-- Tiada pautan --',''));
    (d.data||[]).filter(x=>x.STATUS==='AKTIF').forEach(x=>s.appendChild(new Option(`${x.USERNAME} — ${x.NAMA}`,x.USER_ID)));
    s.value=current;
  }catch(e){}
}
function renderGuru(rows){
  const wrap=$('guruTableWrap');
  if(!rows.length){wrap.innerHTML='<div class="empty">Tiada guru direkodkan.</div>';return}
  const t=document.createElement('table'),thead=document.createElement('thead'),hr=document.createElement('tr');
  ['NO_GURU','NAMA','EMAIL','NO_TEL','STATUS','USER_ID','TINDAKAN'].forEach(c=>{const th=document.createElement('th');th.textContent=c;hr.appendChild(th)});thead.appendChild(hr);t.appendChild(thead);
  const tb=document.createElement('tbody');
  rows.forEach(r=>{
    const tr=document.createElement('tr');
    ['NO_GURU','NAMA','EMAIL','NO_TEL','STATUS','USER_ID'].forEach(c=>{const td=document.createElement('td');td.textContent=r[c]||'-';tr.appendChild(td)});
    const td=document.createElement('td');td.className='guru-actions-cell';
    const actions=document.createElement('div');actions.className='guru-actions-grid';
    if(String(r.STATUS||'').trim().toUpperCase()==='MENUNGGU_KELULUSAN'){
      const pending=document.createElement('span');pending.className='guru-pending-status';pending.textContent='Menunggu kelulusan di Pengurusan Pengguna';actions.appendChild(pending);
    }else{
      const edit=document.createElement('button');edit.className='btn secondary small';edit.textContent='Edit';edit.onclick=()=>editGuru(r);
      const status=document.createElement('button');status.className='btn secondary small';status.textContent=r.STATUS==='AKTIF'?'Nyahaktif':'Aktifkan';status.onclick=()=>setGuruStatus(r.NO_GURU,r.STATUS==='AKTIF'?'TIDAK_AKTIF':'AKTIF');
      actions.append(edit,status);
    }
    const del=document.createElement('button');del.className='btn danger small';del.textContent='Padam';del.title='Padam profil guru dan akaun login yang dipautkan secara kekal';del.onclick=()=>deleteGuruPermanently(r.NO_GURU,r.NAMA,r.USER_ID,r.STATUS);
    actions.appendChild(del);td.appendChild(actions);tr.appendChild(td);tb.appendChild(tr);
  });
  t.appendChild(tb);wrap.replaceChildren(t);
}
function editGuru(r){
  $('guruOriginalNo').value=r.NO_GURU||'';$('guruNo').value=r.NO_GURU||'';$('guruNama').value=r.NAMA||'';$('guruEmail').value=r.EMAIL||'';$('guruTel').value=r.NO_TEL||'';$('guruStatus').value=r.STATUS||'AKTIF';$('guruUserId').value=r.USER_ID||'';
  $('addGuruBtn').textContent='Simpan Perubahan';$('cancelGuruBtn').hidden=false;window.scrollTo({top:$('guruSection').offsetTop-20,behavior:'smooth'});
}
function cancelGuru(){['guruOriginalNo','guruNo','guruNama','guruEmail','guruTel'].forEach(id=>$(id).value='');$('guruStatus').value='AKTIF';$('guruUserId').value='';$('addGuruBtn').textContent='+ Tambah Guru';$('cancelGuruBtn').hidden=true;}
async function saveGuru(){
  const b=$('addGuruBtn');
  const originalNoGuru=$('guruOriginalNo').value.trim();
  const p={token:state.token,originalNoGuru,noGuru:$('guruNo').value.trim(),nama:$('guruNama').value.trim(),email:$('guruEmail').value.trim(),noTel:$('guruTel').value.trim(),status:$('guruStatus').value,userId:$('guruUserId').value};
  if(!p.nama)return toast('Nama guru diperlukan. Tinggalkan No. Guru kosong untuk ID automatik.');
  b.disabled=true;b.textContent='⏳ Menyimpan...';
  try{
    const d=await apiGet(originalNoGuru?'updateGuru':'addGuru',p);$('guruResult').textContent=d.message||'Berjaya.';cancelGuru();await loadGuru();toast(d.message||'Berjaya.');
  }catch(e){$('guruResult').textContent=e.message;toast(e.message)}finally{b.disabled=false;if(!originalNoGuru)b.textContent='+ Tambah Guru';}
}
async function setGuruStatus(noGuru,status){try{const d=await apiGet('setGuruStatus',{token:state.token,noGuru,status});toast(d.message);loadGuru();}catch(e){toast(e.message)}}
async function deleteGuruPermanently(noGuru,nama,userId,status){
  const note=userId?` Akaun login yang dipautkan (${userId}), sesi dan pilihan unitnya juga akan dipadam.`:' Tiada akaun login dipautkan; hanya profil Guru ini akan dipadam.';
  if(!confirm(`PADAM KEKAL profil ${noGuru} — ${nama}?${note}\n\nRekod sejarah aktiviti, kehadiran dan pencapaian tidak dipadam. Tindakan ini tidak boleh dibatalkan.`))return;
  try{const d=await apiGet('deleteGuru',{token:state.token,noGuru});toast(d.message||'Profil guru dipadam.');if($('guruOriginalNo').value.trim()===String(noGuru))cancelGuru();await Promise.all([loadGuru(),loadUsers()]);}
  catch(e){toast(e.message)}
}

function render(rows){const wrap=$('tableWrap');if(!rows.length){wrap.innerHTML='<div class="empty">Tiada data.</div>';updateMuridBulkSelection_();return}const isAdmin=state.user?.role==='ADMIN',cols=['NAMA','JANTINA','TINGKATAN','KELAS','STATUS'],t=document.createElement('table'),thead=document.createElement('thead'),hr=document.createElement('tr');if(isAdmin){const th=document.createElement('th');th.textContent='PILIH';hr.appendChild(th)}cols.forEach(c=>{const th=document.createElement('th');th.textContent=c==='NO_KP'?'NO. KP':c;hr.appendChild(th)});thead.appendChild(hr);t.appendChild(thead);const tb=document.createElement('tbody');rows.forEach(r=>{const tr=document.createElement('tr');if(isAdmin){const td=document.createElement('td'),cb=document.createElement('input');cb.type='checkbox';cb.className='murid-bulk-check';cb.dataset.kp=String(r.NO_KP||'');cb.setAttribute('aria-label','Pilih '+String(r.NAMA||'murid'));cb.addEventListener('change',updateMuridBulkSelection_);td.appendChild(cb);tr.appendChild(td)}cols.forEach(c=>{const td=document.createElement('td');let value=r[c]??'';if(c==='JANTINA'){const g=String(value).trim().toUpperCase();value=g==='L'?'Lelaki':g==='P'?'Perempuan':value;}td.textContent=value;tr.appendChild(td)});tb.appendChild(tr)});t.appendChild(tb);wrap.replaceChildren(t);updateMuridBulkSelection_()}
function updateMuridBulkSelection_(){const b=$('muridBulkDeleteBtn');if(!b)return;const n=document.querySelectorAll('.murid-bulk-check:checked').length;b.textContent=`Padam Pilihan (${n})`;b.disabled=state.user?.role!=='ADMIN'||n===0}
function normalizeCsvHeader_(value){
  let h=String(value??'').replace(/^\uFEFF/,'').trim().toLocaleUpperCase('ms').replace(/\s+/g,' ').replace(/[._-]+/g,' ').trim();
  const aliases={
    'NO KP':'NO_KP','NO. KP':'NO_KP','NO K P':'NO_KP','NO KP MURID':'NO_KP','NO KP UJIAN':'NO_KP',
    'NAMA':'NAMA','JANTINA':'JANTINA','TINGKATAN':'TINGKATAN',
    'TING':'TINGKATAN','TINGKAT':'TINGKATAN','TINGKATAN MURID':'TINGKATAN',
    'NAMA KELAS':'NAMA_KELAS','KELAS':'KELAS','UNIT':'UNIT','KELAB':'KELAB',
    'SUKAN':'SUKAN','RUMAH SUKAN':'RUMAH_SUKAN','RUMAH':'RUMAH_SUKAN'
  };
  return aliases[h]||h.replace(/\s+/g,'_');
}
function detectCsvDelimiter_(text){
  const candidates=[',',';','\t','|'];
  const counts={',':0,';':0,'\t':0,'|':0};let quoted=false;
  const s=String(text||'').replace(/^\uFEFF/,'');
  for(let i=0;i<s.length;i++){
    const c=s[i];
    if(c==='"'){if(quoted&&s[i+1]==='"')i++;else quoted=!quoted;}
    else if(!quoted&&(c==='\n'||c==='\r'))break;
    else if(!quoted&&Object.prototype.hasOwnProperty.call(counts,c))counts[c]++;
  }
  return candidates.sort((a,b)=>counts[b]-counts[a])[0];
}
function decodeCsvFile_(file){
  return file.arrayBuffer().then(buffer=>{
    const bytes=new Uint8Array(buffer);
    if(bytes.length>=2&&bytes[0]===0xFF&&bytes[1]===0xFE)return new TextDecoder('utf-16le').decode(bytes.subarray(2)).replace(/^\uFEFF/,'');
    if(bytes.length>=2&&bytes[0]===0xFE&&bytes[1]===0xFF)return new TextDecoder('utf-16be').decode(bytes.subarray(2)).replace(/^\uFEFF/,'');
    return new TextDecoder('utf-8').decode(bytes).replace(/^\uFEFF/,'');
  });
}
function parseCsvRows_(text){
  const records=[];let row=[],field='',quoted=false,line=1,rowLine=1;
  text=String(text||'').replace(/^\uFEFF/,'');
  const delimiter=detectCsvDelimiter_(text);
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(c===delimiter&&!quoted){row.push(field);field='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(v=>String(v).trim()!==''))records.push({line:rowLine,values:row});row=[];field='';line++;rowLine=line;}
    else {field+=c;if(c==='\n')line++;}
  }
  row.push(field);if(row.some(v=>String(v).trim()!==''))records.push({line:rowLine,values:row});
  if(!records.length)return [];
  const headerRecord=records.shift(),headers=headerRecord.values.map(normalizeCsvHeader_);
  const required=[['NO_KP','NO KP'],['NAMA','NAMA'],['JANTINA','JANTINA'],['TINGKATAN','TINGKATAN'],['NAMA_KELAS','NAMA KELAS']];
  const missing=required.filter(([key])=>!headers.includes(key));
  if(missing.length){
    const found=headers.filter(Boolean).join(', ')||'(tajuk tidak dapat dibaca)';
    throw Error(`Header CSV tidak lengkap pada baris ${headerRecord.line}: ${missing.map(x=>x[1]).join(', ')}. Tajuk yang dibaca: ${found}. Pastikan lajur dipisahkan dengan betul dan fail disimpan sebagai CSV UTF-8.`);
  }
  const result=[];
  for(const rec of records){const obj={__csvRow:rec.line};headers.forEach((h,i)=>{if(h)obj[h]=String(rec.values[i]??'').trim();});result.push(obj);}
  return result;
}
function downloadMuridCsvTemplate_(){if(state.user?.role!=='ADMIN')return toast('Akses ditolak.');const blob=new Blob(['NO KP,NAMA,JANTINA,TINGKATAN,NAMA KELAS,UNIT,KELAB,SUKAN,RUMAH SUKAN\r\n100101011234,Ahmad Ali,L,4,4 Amanah,Kadet Remaja Sekolah,Kelab Bahasa Melayu,Bola Sepak,Rumah Sukan Merah\r\n'],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='templat-data-murid.csv';a.click();URL.revokeObjectURL(url)}
function formatImportEta_(seconds){
  if(!Number.isFinite(seconds)||seconds<0)return 'mengira masa...';
  const s=Math.ceil(seconds);if(s<60)return `± ${s} saat lagi`;
  const m=Math.floor(s/60),rem=s%60;return rem?`± ${m} min ${rem} saat lagi`:`± ${m} min lagi`;
}
function updateMuridImportProgress_(done,total,startMs,forceDone=false){
  const wrap=$('muridImportProgressWrap'),bar=$('muridImportProgress'),label=$('muridImportProgressLabel'),eta=$('muridImportEta');
  if(!wrap||!bar||!label||!eta)return;
  wrap.hidden=false;const pct=forceDone?100:(total?Math.min(99,Math.floor(done/total*100)):0);bar.value=pct;
  bar.setAttribute('aria-valuenow',String(pct));label.textContent=`${pct}% • ${done.toLocaleString('ms-MY')}/${total.toLocaleString('ms-MY')} murid`;
  if(forceDone||done>=total){eta.textContent='Selesai';return;}
  const elapsed=(Date.now()-startMs)/1000,rate=done>0?elapsed/done:0;
  eta.textContent='Anggaran baki: '+(done>0?formatImportEta_(rate*(total-done)):'mengira masa selepas kelompok pertama...');
}
async function uploadMuridCsv_(){
  if(state.user?.role!=='ADMIN')return toast('Akses ditolak.');
  const file=$('muridCsvFile')?.files?.[0];if(!file)return toast('Pilih fail CSV dahulu.');
  const status=$('muridBulkStatus'),button=$('muridCsvUploadBtn');
  const progressWrap=$('muridImportProgressWrap'),progressBar=$('muridImportProgress'),progressLabel=$('muridImportProgressLabel'),eta=$('muridImportEta');
  let clean=[],processed=0,startMs=0;
  try{
    const rows=parseCsvRows_(await decodeCsvFile_(file));if(!rows.length)throw Error('Fail CSV kosong atau tiada baris data.');
    clean=rows.map(r=>({sourceRow:r.__csvRow,nama:r.NAMA||'',noKp:r.NO_KP||'',jantina:String(r.JANTINA||'').trim().toUpperCase(),tingkatan:r.TINGKATAN||'',kelas:r.NAMA_KELAS||r.KELAS||'',memberships:[{type:'UNIT',name:r.UNIT||''},{type:'KELAB',name:r.KELAB||''},{type:'SUKAN',name:r.SUKAN||''},{type:'RUMAH SUKAN',name:r.RUMAH_SUKAN||''}].filter(x=>x.name&&x.name.trim())}));
    const requiredFields=[['noKp','NO KP'],['nama','NAMA'],['jantina','JANTINA'],['tingkatan','TINGKATAN'],['kelas','NAMA KELAS']];
    for(const r of clean){const missing=requiredFields.filter(([k])=>!String(r[k]??'').trim()).map(([,label])=>label);if(missing.length)throw Error(`Baris CSV ${r.sourceRow}: medan wajib kosong — ${missing.join(', ')}.`);if(!['L','P'].includes(r.jantina))throw Error(`Baris CSV ${r.sourceRow}: JANTINA tidak sah (“${r.jantina}”). Gunakan L untuk Lelaki atau P untuk Perempuan.`);}
    const seen=new Map();for(const r of clean){const k=r.noKp.trim().toLocaleLowerCase('ms');if(seen.has(k))throw Error(`Baris CSV ${r.sourceRow}: NO KP pendua (${r.noKp}); kali pertama muncul pada baris ${seen.get(k)}.`);seen.set(k,r.sourceRow);}
    if(!confirm(`Import ${clean.length} rekod murid dan padankan unit daripada kolum UNIT, KELAB, SUKAN dan RUMAH SUKAN? NO KP wajib. Rekod sedia ada dilangkau.`))return;
    button.disabled=true;button.textContent='⏳ Import 0%';status.textContent='Memulakan import...';progressWrap.hidden=false;progressBar.value=0;progressLabel.textContent=`0% • 0/${clean.length} murid`;eta.textContent='Anggaran baki: mengira masa selepas kelompok pertama...';startMs=Date.now();
    let added=0,skipped=0,placementsAdded=0,unitsCreated=0,unitsReactivated=0,placementsReactivated=0,unmatched=[];
    const batchSize=8,totalBatches=Math.ceil(clean.length/batchSize);
    for(let i=0;i<clean.length;i+=batchSize){
      const batch=clean.slice(i,i+batchSize),batchNumber=Math.floor(i/batchSize)+1;
      status.textContent=`Mengimport kelompok ${batchNumber}/${totalBatches}...`;
      const d=await apiGet('bulkAddMurid',{token:state.token,rows:JSON.stringify(batch)},60000);
      added+=Number(d.added||0);skipped+=Number(d.skipped||0);placementsAdded+=Number(d.placementsAdded||0);unitsCreated+=Number(d.unitsCreated||0);unitsReactivated+=Number(d.unitsReactivated||0);placementsReactivated+=Number(d.placementsReactivated||0);unmatched.push(...(d.unmatchedUnits||[]));
      processed=Math.min(i+batchSize,clean.length);updateMuridImportProgress_(processed,clean.length,startMs);button.textContent=`⏳ Import ${Math.floor(processed/clean.length*100)}%`;
    }
    updateMuridImportProgress_(clean.length,clean.length,startMs,true);
    status.textContent=`Import selesai. Murid baharu: ${added}; No. KP sedia ada dilangkau: ${skipped}; unit baharu: ${unitsCreated}; unit diaktifkan semula: ${unitsReactivated}; penempatan baharu: ${placementsAdded}; penempatan diaktifkan semula: ${placementsReactivated}.`;
    if(unmatched.length){const preview=unmatched.slice(0,5).map(x=>`baris ${x.sourceRow||'?'} ${x.type}: ${x.name}`).join(' • ');status.textContent+=` Unit tidak dipadankan: ${preview}${unmatched.length>5?' • ...':''}. Semak helaian UNIT.`;}
    await loadMurid();toast('Import CSV berjaya.');
  }catch(e){
    status.textContent=(processed>0?`Import terhenti selepas ${processed}/${clean.length} baris diproses. Rekod yang telah berjaya disimpan tidak dipadam. Cuba import semula fail yang sama; No. KP dan penempatan pendua akan dilangkau. `:'')+e.message;
    if(clean.length&&progressLabel)progressLabel.textContent=`${Math.floor(processed/clean.length*100)}% • ${processed}/${clean.length} murid`;
    if(eta)eta.textContent='Status: import terhenti';toast(e.message);
  }finally{button.disabled=false;button.textContent='↑ Import CSV';}
}
async function deleteSelectedMuridBulk_(){if(state.user?.role!=='ADMIN')return toast('Akses ditolak.');const ids=[...document.querySelectorAll('.murid-bulk-check:checked')].map(x=>x.dataset.kp).filter(Boolean);if(!ids.length)return toast('Pilih rekod murid dahulu.');if(!confirm(`AMARAN: Padam ${ids.length} rekod murid secara kekal? Rekod berkaitan unit, kehadiran dan aktiviti mungkin masih merujuk kepada murid ini. Tindakan tidak boleh dibatalkan.`))return;const b=$('muridBulkDeleteBtn');b.disabled=true;try{let deleted=0;for(let i=0;i<ids.length;i+=10){const d=await apiGet('bulkDeleteMurid',{token:state.token,noKpList:JSON.stringify(ids.slice(i,i+10))});deleted+=Number(d.deleted||0)}$('muridBulkStatus').textContent=`Rekod dipadam: ${deleted}.`;await loadMurid();toast(`Berjaya memadam ${deleted} rekod murid.`)}catch(e){toast(e.message)}finally{updateMuridBulkSelection_()}}
async function deleteAllMuridBulk_(){
  if(state.user?.role!=='ADMIN')return toast('Akses ditolak.');
  const phrase='PADAM SEMUA DATA MURID';
  const typed=prompt('AMARAN KEKAL: Fungsi ini mengosongkan semua rekod MURID, PENEMPATAN_UNIT, KEHADIRAN, AJK_UNIT, PESERTA_AKTIVITI serta pencapaian individu yang mempunyai NO_KP. Master UNIT, GURU, USERS, AKTIVITI, DOKUMEN dan pencapaian berkumpulan tanpa NO_KP dikekalkan.\n\nUntuk mengesahkan, taip tepat: '+phrase);
  if(typed===null)return;
  if(typed.trim()!==phrase)return toast('Pengesahan tidak sepadan. Tiada data dipadam.');
  if(!confirm('Pengesahan terakhir: semua profil murid dan rekod berkaitan yang diterangkan akan dikosongkan. Pencapaian berkumpulan tanpa NO_KP dikekalkan. Tindakan tidak boleh dibatalkan. Teruskan?'))return;
  const button=$('muridBulkDeleteAllBtn'),status=$('muridBulkStatus');if(button)button.disabled=true;
  if(status)status.textContent='Sedang membersihkan rekod murid...';
  try{
    const d=await apiGet('bulkDeleteAllMurid',{token:state.token,confirmation:phrase},60000);
    const summary=Object.entries(d.cleared||{}).map(([k,v])=>`${k}: ${v}`).join('; ');
    if(status)status.textContent=`Pembersihan selesai. Baris data dikosongkan: ${d.totalRowsCleared||0}. ${summary}. Header helaian dikekalkan.`;
    await loadMurid();
    toast('Data murid dan rekod berkaitan berjaya dikosongkan.');
  }catch(e){if(status)status.textContent='Pembersihan gagal: '+e.message;toast(e.message)}
  finally{if(button)button.disabled=false;updateMuridBulkSelection_();}
}

let UNIT_ROWS=[];
async function loadUnit(){
  try{
    const d=await apiGet('getUnit',{token:state.token});
    UNIT_ROWS=d.data||[];
    DASHBOARD_SUMMARY_CACHE_.units=UNIT_ROWS;
    updateDashboardSummary_();
    renderUnit(UNIT_ROWS);
  }catch(e){toast(e.message)}
}
function renderUnit(rows){
  const cards=$('unitCards');
  const summary=$('unitSummary');
  if(!cards||!summary)return;
  cards.dataset.layoutVersion='table-v2';
  if(!rows.length){
    summary.innerHTML='';
    cards.className='unit-grid unit-data-panel unit-data-panel-empty';
    cards.innerHTML='<div class="unit-empty-state"><div class="unit-empty-symbol" aria-hidden="true">⌕</div><h3>Belum ada unit kokurikulum</h3><p>Unit akan dipaparkan di sini apabila rekod unit tersedia dalam sistem.</p></div>';
    return;
  }

  const asNumber=value=>{const n=Number(value);return Number.isFinite(n)?n:0;};
  // Statistik KPI dibuang daripada paparan Unit Kokurikulum mengikut reka bentuk yang diluluskan.
  // Container dikekalkan kosong untuk keserasian struktur; data jadual kekal dinamik.
  summary.innerHTML='';

  const canonical=[
    {key:'unit-beruniform',title:'Unit Beruniform',match:['UNIT BERUNIFORM']},
    {key:'kelab-persatuan',title:'Kelab',match:['KELAB','KELAB / PERSATUAN','KELAB/PERSATUAN','KELAB & PERSATUAN','KELAB DAN PERSATUAN']},
    {key:'sukan-permainan',title:'Sukan / Permainan',match:['SUKAN / PERMAINAN','SUKAN/PERMAINAN','SUKAN DAN PERMAINAN']},
    {key:'rumah-sukan',title:'Rumah Sukan',match:['RUMAH SUKAN']}
  ];
  const normalizeCategory=value=>String(value||'Tanpa Kategori').trim().toUpperCase().replace(/\s*\/\s*/g,' / ').replace(/\s+/g,' ');
  const groups=new Map();
  rows.forEach(r=>{
    const normalized=normalizeCategory(r.KATEGORI);
    const matched=canonical.find(c=>c.match.some(m=>normalizeCategory(m)===normalized));
    const key=matched?matched.key:'other-'+normalized.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const title=matched?matched.title:(String(r.KATEGORI||'Tanpa Kategori').trim()||'Tanpa Kategori');
    if(!groups.has(key))groups.set(key,{key,title,rows:[]});
    groups.get(key).rows.push(r);
  });
  const canonicalKeys=canonical.map(c=>c.key);
  const ordered=[...groups.values()].sort((a,b)=>{
    const ai=canonicalKeys.indexOf(a.key),bi=canonicalKeys.indexOf(b.key);
    if(ai!==-1||bi!==-1)return (ai===-1?999:ai)-(bi===-1?999:bi);
    return a.title.localeCompare(b.title,'ms');
  });

  const renderGroup=group=>{
    const groupTotal=group.rows.reduce((sum,r)=>sum+asNumber(r.JUMLAH_AHLI),0);
    const rowsHtml=[...group.rows].sort((a,b)=>String(a.NAMA_UNIT||'').localeCompare(String(b.NAMA_UNIT||''),'ms')).map(r=>{
      const unitId=String(r.UNIT_ID||'');
      const year=String(r.TAHUN||new Date().getFullYear());
      const name=String(r.NAMA_UNIT||'Unit tanpa nama');
      const members=asNumber(r.JUMLAH_AHLI),male=asNumber(r.LELAKI),female=asNumber(r.PEREMPUAN);
      const percentage=groupTotal>0?(members/groupTotal*100):0;
      const status=String(r.STATUS||'AKTIF').toUpperCase();
      return `<tr class="unit-data-row">
        <td class="unit-name-cell"><span>${esc(name)}</span>${status!=='AKTIF'?`<small class="unit-row-status">${esc(status.replace(/_/g,' '))}</small>`:''}</td>
        <td class="unit-number-cell">${members}</td>
        <td class="unit-number-cell">${male}</td>
        <td class="unit-number-cell">${female}</td>
        <td class="unit-percent-cell">${percentage.toFixed(2)}</td>
        <td class="unit-action-cell"><button class="unit-row-open" type="button" data-open-unit="${escAttr(unitId)}" data-open-year="${escAttr(year)}" aria-label="Buka butiran ${escAttr(name)}" title="Buka ${escAttr(name)}" ${unitId?'':'disabled'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></td>
      </tr>`;
    }).join('');
    return `<section class="unit-category-section unit-category-section-${escAttr(group.key)}" data-unit-category="${escAttr(group.key)}">
      <div class="unit-section-heading"><h3>${esc(group.title)}</h3></div>
      <div class="unit-table-scroll"><table class="unit-data-table"><thead><tr><th scope="col">Unit</th><th scope="col">Jumlah</th><th scope="col">Lelaki</th><th scope="col">Perempuan</th><th scope="col">Peratus</th><th scope="col">Butiran</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>
    </section>`;
  };
  cards.className='unit-grid unit-data-panel';
  cards.innerHTML=ordered.map(renderGroup).join('');
  cards.querySelectorAll('[data-open-unit]').forEach(button=>{
    button.addEventListener('click',()=>{
      const unitId=button.dataset.openUnit;
      if(unitId)openUnitOverview(unitId,button.dataset.openYear);
    });
  });
}
function unitGenderDonut_(male,female,total,id){
  const c=2*Math.PI*27, m=total>0?c*(male/total):0, f=total>0?c*(female/total):0;
  const femaleOffset=-m;
  return `<div class="unit-donut-wrap"><svg class="unit-gender-donut" viewBox="0 0 72 72" role="img" aria-label="Jumlah ahli ${total}; lelaki ${male}; perempuan ${female}">
    <circle class="unit-donut-track" cx="36" cy="36" r="27" />
    <circle class="unit-donut-segment unit-donut-male" cx="36" cy="36" r="27" stroke-dasharray="${m} ${c-m}" stroke-dashoffset="0" transform="rotate(-90 36 36)" tabindex="0" role="button" aria-label="Lelaki ${male}" onclick="showUnitGender(event,'${id}','male',${male})" onkeydown="if(event.key==='Enter'||event.key===' ')showUnitGender(event,'${id}','male',${male})"><title>Lelaki: ${male}</title></circle>
    <circle class="unit-donut-segment unit-donut-female" cx="36" cy="36" r="27" stroke-dasharray="${f} ${c-f}" stroke-dashoffset="${femaleOffset}" transform="rotate(-90 36 36)" tabindex="0" role="button" aria-label="Perempuan ${female}" onclick="showUnitGender(event,'${id}','female',${female})" onkeydown="if(event.key==='Enter'||event.key===' ')showUnitGender(event,'${id}','female',${female})"><title>Perempuan: ${female}</title></circle>
    </svg><div class="unit-donut-center"><b id="${id}-value">${total}</b><small id="${id}-label">Jumlah ahli</small></div></div>`;
}
function showUnitGender(event,id,gender,count){
  if(event){event.stopPropagation();if(event.preventDefault)event.preventDefault();}
  const value=document.getElementById(id+'-value'),label=document.getElementById(id+'-label');
  if(value)value.textContent=String(count);
  if(label)label.textContent=gender==='male'?'Murid lelaki':'Murid perempuan';
}

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}function escAttr(v){return esc(v).replace(/`/g,'&#96;')}
async function toggleUnit(unitId,status){try{const d=await apiGet('setUnitStatus',{token:state.token,unitId,status});toast(d.message);await loadUnit()}catch(e){toast(e.message)}}
function getAppName_(){return String(APP_SETTINGS_?.appName||'e-KOSSTA').trim()||'e-KOSSTA';}
function appBrandReplaceText_(text){
  const target=getAppName_(),esc=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  let out=String(text??'');const holders=[];const keepCurrent='\uE000EKOSSTA_CURRENT_BRAND\uE001';
  out=out.replace(new RegExp(esc(target),'gi'),()=>keepCurrent);
  const aliases=[...APP_BRAND_ALIASES_].filter(a=>a&&String(a).toLowerCase()!==target.toLowerCase()).sort((a,b)=>b.length-a.length);
  aliases.forEach((alias,i)=>{const token=`\uE000EKOSSTA_OLD_BRAND_${i}\uE001`;const replaced=out.replace(new RegExp(esc(alias),'gi'),()=>token);if(replaced!==out){holders.push(token);out=replaced;}});
  out=out.split(keepCurrent).join(target);holders.forEach(token=>{out=out.split(token).join(target);});return out;
}
function appBrandNormalizeText_(text){
  let out=String(text??'');const aliases=[...APP_BRAND_ALIASES_].filter(a=>a&&String(a).toLowerCase()!=='e-kossta').sort((a,b)=>b.length-a.length);const tokens=[];
  aliases.forEach((alias,i)=>{const token=`\uE000EKOSSTA_NORMALIZE_${i}\uE001`;const escAlias=String(alias).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const replaced=out.replace(new RegExp(escAlias,'gi'),()=>token);if(replaced!==out){tokens.push(token);out=replaced;}});
  tokens.forEach(token=>{out=out.split(token).join('e-KOSSTA');});return out;
}
function applyAppBranding_(){
  const root=$('appView'),unitSetup=$('unitSetupView');
  const appVisible=!!root&&!root.hidden,unitSetupVisible=!!unitSetup&&!unitSetup.hidden;
  // Apply only to authenticated app surfaces; never rewrite the actual login/register page.
  if(!state.token||(!appVisible&&!unitSetupVisible))return;
  const name=getAppName_();document.title=name+' | Pengurusan Kokurikulum';
  const targets=[['#sidebar .brand b',name],['.mobile-topbar .mobile-brand-text > b',name],['.desktop-topbar .breadcrumb',name],['#dashboardTitle span',name],['.mobile-menu-panel strong',name]];
  targets.forEach(([selector,value])=>document.querySelectorAll(selector).forEach(el=>{if(!el.closest('#loginView'))el.textContent=value;}));
  const mark=document.querySelector('#sidebar .brand-mark');
  if(mark){if(APP_SETTINGS_.schoolLogoDataUrl){mark.innerHTML=`<img src="${APP_SETTINGS_.schoolLogoDataUrl}" alt="Logo sekolah">`;mark.classList.add('has-school-logo');}else{mark.textContent='e';mark.classList.remove('has-school-logo');}}
  const mobileLogo=$('mobileBrandLogo');if(mobileLogo){if(APP_SETTINGS_.schoolLogoDataUrl){mobileLogo.src=APP_SETTINGS_.schoolLogoDataUrl;mobileLogo.hidden=false;}else{mobileLogo.removeAttribute('src');mobileLogo.hidden=true;}}
  const footer=document.querySelector('.dashboard-footer-line');if(footer){const first=footer.querySelector('span');if(first)first.textContent=name+' / OPERASI PENGURUSAN KOKURIKULUM';}
  const roots=[];if(appVisible)roots.push(root);if(unitSetupVisible)roots.push(unitSetup);const mobileMenu=$('mobileMenu');if(mobileMenu&&!mobileMenu.hidden)roots.push(mobileMenu);
  roots.forEach(scope=>{const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const node of nodes){const parent=node.parentElement;if(!parent||parent.closest('#loginView')||parent.closest('script,style,textarea,input,select,option'))continue;const old=String(node.nodeValue||'');const updated=appBrandReplaceText_(old);if(updated!==old&&!parent.closest('.rich-editor'))node.nodeValue=updated;}});
}
async function loadAppSettings_(force=false){
  if(!state.token)return APP_SETTINGS_;
  if(!force&&APP_SETTINGS_LAST_LOADED_AT_&&Date.now()-APP_SETTINGS_LAST_LOADED_AT_<60000){applyAppBranding_();return APP_SETTINGS_;}
  if(APP_SETTINGS_LOADING_)return APP_SETTINGS_LOADING_;
  APP_SETTINGS_LOADING_=(async()=>{try{const res=await apiGet('getAppSettings',{token:state.token});const settings=res.settings||{};const incomingName=String(settings.appName||'e-KOSSTA');APP_BRAND_ALIASES_.add(getAppName_());APP_BRAND_ALIASES_.add(incomingName);APP_SETTINGS_={appName:incomingName,schoolLogoDataUrl:String(settings.schoolLogoDataUrl||''),schoolLogoMime:String(settings.schoolLogoMime||''),hasSchoolLogo:!!settings.hasSchoolLogo};APP_SETTINGS_LAST_LOADED_AT_=Date.now();applyAppBranding_();renderSystemSettingsForm_();return APP_SETTINGS_;}finally{APP_SETTINGS_LOADING_=null;}})();
  return APP_SETTINGS_LOADING_;
}
function renderSystemSettingsForm_(){
  if($('systemAppName')&&document.activeElement!==$('systemAppName'))$('systemAppName').value=getAppName_();
  const data=APP_SETTINGS_DRAFT_LOGO_===null?String(APP_SETTINGS_.schoolLogoDataUrl||''):String(APP_SETTINGS_DRAFT_LOGO_||'');
  const img=$('systemLogoPreview'),placeholder=$('systemLogoPlaceholder');if(img){if(data){img.src=data;img.hidden=false;}else{img.removeAttribute('src');img.hidden=true;}}if(placeholder)placeholder.hidden=!!data;
  if($('systemSettingsStatus')&&APP_SETTINGS_LAST_LOADED_AT_)$('systemSettingsStatus').textContent=APP_SETTINGS_.hasSchoolLogo?'Tetapan dimuatkan. Logo sekolah tersedia.':'Tetapan dimuatkan. Tiada logo sekolah disimpan.';
}
async function loadSystemSettings_(force=false){if(state.user?.role!=='ADMIN')return;try{await loadAppSettings_(force);renderSystemSettingsForm_();}catch(e){if($('systemSettingsStatus'))$('systemSettingsStatus').textContent='Tidak dapat memuatkan tetapan: '+(e.message||'Ralat');}}
function clearSystemLogoDraft_(){APP_SETTINGS_DRAFT_LOGO_='';if($('systemSchoolLogo'))$('systemSchoolLogo').value='';renderSystemSettingsForm_();if($('systemSettingsStatus'))$('systemSettingsStatus').textContent='Logo akan dibuang apabila anda menyimpan tetapan.';}
function compressSystemLogo_(file){
  return new Promise((resolve,reject)=>{if(!file||!/^image\/(png|jpe?g|webp)$/i.test(file.type))return reject(new Error('Pilih logo dalam format PNG, JPG atau WebP.'));if(file.size>12*1024*1024)return reject(new Error('Saiz fail logo asal melebihi 12 MB.'));const reader=new FileReader();reader.onerror=()=>reject(new Error('Tidak dapat membaca fail logo.'));reader.onload=()=>{const im=new Image();im.onerror=()=>reject(new Error('Fail logo tidak dapat dibuka.'));im.onload=()=>{const edge=[480,420,360,300,260];for(const max of edge){const ratio=Math.min(1,max/Math.max(im.width,im.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(im.width*ratio));canvas.height=Math.max(1,Math.round(im.height*ratio));const ctx=canvas.getContext('2d');ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(im,0,0,canvas.width,canvas.height);for(const q of [.82,.72,.62,.52,.42,.32]){const data=canvas.toDataURL('image/jpeg',q);if(data.length<=44000)return resolve(data);}}reject(new Error('Logo terlalu kompleks untuk disimpan. Cuba imej yang lebih kecil.'));};im.src=String(reader.result||'');};reader.readAsDataURL(file);});
}
async function handleSystemLogoSelection_(e){const file=e.target.files?.[0];if(!file)return;const status=$('systemSettingsStatus');if(status)status.textContent='Sedang memampatkan logo...';try{APP_SETTINGS_DRAFT_LOGO_=await compressSystemLogo_(file);renderSystemSettingsForm_();if(status)status.textContent='Logo siap dipilih. Tekan Simpan Tetapan untuk menggunakannya.';}catch(err){APP_SETTINGS_DRAFT_LOGO_=null;if(status)status.textContent=err.message||'Gagal memproses logo.';toast(err.message||'Gagal memproses logo.');}finally{e.target.value='';}}
async function saveSystemSettings_(){
  if(state.user?.role!=='ADMIN')return toast('Tetapan sistem hanya untuk ADMIN.');const btn=$('saveSystemSettingsBtn'),status=$('systemSettingsStatus');const appName=String($('systemAppName')?.value||'').trim();if(appName.length<2||appName.length>60){if(status)status.textContent='Nama aplikasi mesti antara 2 hingga 60 aksara.';return toast('Nama aplikasi mestilah antara 2 hingga 60 aksara.');}
  const draft=APP_SETTINGS_DRAFT_LOGO_;const logoAction=draft===null?'KEEP':draft===''?'CLEAR':'REPLACE';let uploadId='';btn.disabled=true;btn.textContent='Menyimpan...';try{
    if(logoAction==='REPLACE'){const comma=draft.indexOf(',');const base64=draft.slice(comma+1);if(comma<0||!base64)throw new Error('Data logo tidak sah.');uploadId='LOGO-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,9).toUpperCase();const size=2700,total=Math.ceil(base64.length/size);if(total>20)throw new Error('Logo terlalu besar selepas pemampatan.');for(let i=0;i<total;i++){if(status)status.textContent=`Memuat naik logo ${i+1}/${total}...`;await apiGet('saveSystemLogoChunk',{token:state.token,uploadId,chunkIndex:i+1,chunkTotal:total,mimeType:'image/jpeg',dataChunk:base64.slice(i*size,(i+1)*size)});}}
    if(status)status.textContent='Menyimpan nama aplikasi dan tetapan logo...';const r=await apiGet('saveAppSettings',{token:state.token,appName,logoAction,uploadId});APP_SETTINGS_DRAFT_LOGO_=null;APP_SETTINGS_LAST_LOADED_AT_=0;await loadAppSettings_(true);renderSystemSettingsForm_();if(status)status.textContent=r.message||'Tetapan sistem berjaya disimpan.';applyAppBranding_();toast(r.message||'Tetapan sistem berjaya disimpan.');
  }catch(e){if(status)status.textContent=e.message||'Gagal menyimpan tetapan.';toast(e.message||'Gagal menyimpan tetapan.');}finally{btn.disabled=false;btn.textContent='Simpan Tetapan';}
}
function brandDocumentHtml_(html){
  try{const template=document.createElement('template');template.innerHTML=String(html||'');template.content.querySelectorAll('[data-ekossta-auto-branding="1"]').forEach(el=>el.remove());const walker=document.createTreeWalker(template.content,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(n=>{const old=String(n.nodeValue||'');n.nodeValue=appBrandReplaceText_(old);});
    if(APP_SETTINGS_.schoolLogoDataUrl){const header=document.createElement('div');header.setAttribute('data-ekossta-auto-branding','1');header.className='ekossta-school-doc-brand';const img=document.createElement('img');img.src=APP_SETTINGS_.schoolLogoDataUrl;img.alt='Logo sekolah';header.append(img);const target=template.content.querySelector('.letter-header,.report-doc-header,.ek-report-document')||template.content.firstElementChild;if(target)target.insertBefore(header,target.firstChild);else template.content.prepend(header);}
    return template.innerHTML;
  }catch(e){return String(html||'');}
}

function showLogin(){
  document.title='e-KOSSTA | Pengurusan Kokurikulum';
  document.body.classList.add('logged-out');
  const mobileBrand=document.querySelector('.mobile-topbar .mobile-brand-text > b');if(mobileBrand)mobileBrand.textContent='e-KOSSTA';const mobileLogo=$('mobileBrandLogo');if(mobileLogo){mobileLogo.removeAttribute('src');mobileLogo.hidden=true;}
  $('loginView').hidden=false;
  $('appView').hidden=true;
  if($('unitSetupView'))$('unitSetupView').hidden=true;
  refreshLoginConnectionUi_();
  const sidebar=$('sidebar');
  if(sidebar)sidebar.setAttribute('aria-hidden','true');
  const mobileNav=$('mobileNav');
  if(mobileNav)mobileNav.setAttribute('aria-hidden','true');
}

function showApp(){
  const pendingRole=String(state.user?.role||'').toUpperCase();
  if(pendingRole==='GURU'&&(!Array.isArray(state.user?.unitIds)||state.user.unitIds.length===0)){showUnitSetup_();return;}
  document.body.classList.remove('logged-out');
  $('loginView').hidden=true;
  $('appView').hidden=false;
  if($('unitSetupView'))$('unitSetupView').hidden=true;

  const sidebar=$('sidebar');
  if(sidebar)sidebar.removeAttribute('aria-hidden');

  const mobileNav=$('mobileNav');
  if(mobileNav)mobileNav.removeAttribute('aria-hidden');

  $('welcome').textContent=
    `Selamat datang, ${state.user?.nama||state.user?.username||''}.`;

  const role=String(state.user?.role||'').toUpperCase();
  const isAdmin=role==='ADMIN';

  $('userSection').hidden=!isAdmin;
  if($('muridBulkSection'))$('muridBulkSection').hidden=!isAdmin;
  $('guruSection').hidden=!isAdmin;
  $('unitSection').hidden=false;
  if($('unitAdminArea'))$('unitAdminArea').hidden=!isAdmin;

  document.querySelectorAll('.admin-nav').forEach(el=>{el.hidden=!isAdmin;});
  document.querySelectorAll('[data-admin-template]').forEach(el=>{el.hidden=!isAdmin;});
  ['managementNavLabel','managementNavButton','mobileManagementMenuButton'].forEach(id=>{const el=$(id);if(el)el.hidden=!isAdmin;});
  document.querySelectorAll('[data-admin-only-section]').forEach(el=>{el.hidden=!isAdmin;});
  document.querySelectorAll('[data-dashboard-admin-only]').forEach(el=>{el.hidden=!isAdmin;});

  $('sideUserName').textContent=state.user?.nama||state.user?.username||'Pengguna';

  $('sideUserRole').textContent=role==='ADMIN'?'ADMINISTRATOR':role==='PENTADBIR'?'PENTADBIR':'GURU PENASIHAT';
  $('desktopUser').textContent=state.user?.nama||state.user?.username||'-';
  updateDashboardSessionUi_();

  showPage('dashboard');
  // Load persisted branding once after the authenticated shell is visible.
  // Branding deliberately does not target #loginView.
  loadAppSettings_(true).catch(e=>console.warn('Tetapan identiti aplikasi tidak dapat dimuatkan:',e));

  if(isAdmin){
    loadUsers();
    loadGuru();
  }
}
function themeIconMarkup_(isDark){
  return isDark
    ? '<svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>'
    : '<svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z"></path></svg>';
}
function setThemeIcons_(){
  ['themeBtn','desktopThemeBtn','sidebarThemeBtn'].forEach(id=>{const e=$(id);if(e)e.innerHTML=themeIconMarkup_(state.dark)});
}
function toggleTheme(){
  state.dark=!state.dark;
  document.documentElement.classList.toggle('dark',state.dark);
  localStorage.setItem('ekossta_model_b_dark',state.dark?'1':'0');
  setThemeIcons_();
}
function toast(m){const e=$('toast');e.textContent=m;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),3200)}



/* =========================================================
   V2.5 AKTIVITI & ACARA FRONTEND
========================================================= */
let AKTIVITI_ROWS=[];
function activityEsc_(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function activityDate_(v){const d=new Date(v);return isNaN(d.getTime())?'':d.toLocaleDateString('ms-MY')}
function activityDayFromDate_(v){if(!v)return '';const d=new Date(String(v)+'T00:00:00');if(isNaN(d.getTime()))return '';return ['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'][d.getDay()]}
async function loadAktivitiPage(){
  try{
    const d=await apiGet('getAktiviti',{token:state.token});
    AKTIVITI_ROWS=d.data||[];
    fillAktivitiYears_();
    renderAktivitiTable_(AKTIVITI_ROWS);
  }catch(e){toast(e.message||'Gagal memuatkan aktiviti.');}
}
function fillAktivitiYears_(){
  const sel=$('activityYear');if(!sel)return;
  const current=sel.value;
  const years=[...new Set(AKTIVITI_ROWS.map(r=>String(r.TARIKH||'').slice(0,4)).filter(x=>/^\d{4}$/.test(x)))].sort((a,b)=>b-a);
  sel.innerHTML='<option value="">Semua Tahun</option>'+years.map(y=>`<option value="${activityEsc_(y)}">${activityEsc_(y)}</option>`).join('');
  if(current)sel.value=current;
}
function filterAktivitiTable(){
  const q=String($('activitySearch')?.value||'').trim().toLowerCase();
  const y=String($('activityYear')?.value||'');
  const level=String($('activityLevel')?.value||'').toUpperCase();
  const rows=AKTIVITI_ROWS.filter(r=>{
    const hay=[r.NAMA_AKTIVITI,r.TEMPAT,r.OBJEKTIF,r.AKTIVITI,r.IMPAK].join(' ').toLowerCase();
    return (!q||hay.includes(q))&&(!y||String(r.TARIKH||'').slice(0,4)===y)&&(!level||String(r.PERINGKAT||'').toUpperCase()===level);
  });
  renderAktivitiTable_(rows);
}
function renderAktivitiTable_(rows){
  const wrap=$('activityTableWrap');if(!wrap)return;
  if(!rows.length){wrap.innerHTML='<div class="empty">Tiada aktiviti ditemui.</div>';return;}
  wrap.innerHTML=`<table class="activity-table"><thead><tr><th>AKTIVITI</th><th>TARIKH</th><th>TEMPAT</th><th>PERINGKAT</th><th>GURU</th><th>TINDAKAN</th></tr></thead><tbody>${rows.map(r=>{const canManage=r.CAN_MANAGE!==false;return `<tr><td><b>${activityEsc_(r.NAMA_AKTIVITI)}</b></td><td>${activityDate_(r.TARIKH)||'-'}${r.HARI?`<small class="activity-day">${activityEsc_(r.HARI)}</small>`:''}</td><td>${activityEsc_(r.TEMPAT||'-')}</td><td><span class="activity-level-badge">${activityEsc_(r.PERINGKAT||'-')}</span></td><td>${activityEsc_(r.NO_GURU||'-')}</td><td><div class="activity-actions"><button class="btn secondary small" type="button" onclick="openAktivitiPeserta('${activityEsc_(r.AKTIVITI_ID)}')">Peserta</button><button class="btn primary small activity-generate-letter-btn" type="button" aria-label="Jana surat kebenaran untuk aktiviti ini" onclick="openAktivitiPermissionLetter('${activityEsc_(r.AKTIVITI_ID)}')">Jana Surat</button>${canManage?`<button class="btn danger small" type="button" data-delete-activity="${activityEsc_(r.AKTIVITI_ID)}" data-delete-activity-name="${activityEsc_(r.NAMA_AKTIVITI)}">Padam</button><button class="btn secondary small" type="button" onclick="startActivityReport_('${activityEsc_(r.AKTIVITI_ID)}')">Laporan</button><button class="btn secondary small" type="button" onclick="openAktivitiModal('${activityEsc_(r.AKTIVITI_ID)}')">Edit</button>`:`<span class="activity-readonly-note">Paparan sahaja</span>`}</div></td></tr>`}).join('')}</tbody></table>`;
  wrap.querySelectorAll('[data-delete-activity]').forEach(button=>button.addEventListener('click',()=>deleteAktivitiFromTable_(button.dataset.deleteActivity,button.dataset.deleteActivityName)));
}
async function deleteAktivitiFromTable_(activityId,activityName){
  if(!activityId)return toast('ID aktiviti tidak sah.');
  const message=`Padam aktiviti ini secara kekal?\n\n${activityName||activityId}\n\nRekod peserta dan pencapaian yang dipautkan kepada aktiviti ini turut dipadam. Dokumen/laporan sedia ada dikekalkan. Tindakan ini tidak boleh dibatalkan.`;
  if(!window.confirm(message))return;
  const button=document.querySelector(`[data-delete-activity="${CSS.escape(String(activityId))}"]`);
  if(button){button.disabled=true;button.textContent='Memadam...';}
  try{const d=await apiGet('deleteAktiviti',{token:state.token,aktivitiId:activityId},60000);toast(d.message||'Aktiviti dipadam.');await loadAktivitiPage();}
  catch(e){toast(e.message||'Gagal memadam aktiviti.');if(button){button.disabled=false;button.textContent='Padam';}}
}

function defaultPermissionTemplate_(){
  // Default fallback template: used when no shared Surat Kebenaran template
  // has been saved yet. Keep these tokens aligned with openAktivitiPermissionLetter().
  return `<div class="permission-letter">
    <div class="letter-header">
      <div class="school-name">SMK TENGKU TEMENGGONG AHMAD</div>
      <div class="school-sub">KOKURIKULUM SEKOLAH</div>
      <h2 style="font-size:15px;margin:14px 0 0;">SURAT KEBENARAN IBU BAPA / PENJAGA</h2>
    </div>
    <p style="text-align:right;">Tarikh: {{TARIKH_AKTIVITI}}</p>
    <p>Kepada,<br><strong>Ibu Bapa / Penjaga</strong></p>
    <p><strong>PERKARA: KEBENARAN PENYERTAAN AKTIVITI KOKURIKULUM</strong></p>
    <p>Dengan hormatnya perkara di atas dirujuk.</p>
    <p>Dimaklumkan bahawa anak / jagaan tuan/puan seperti butiran berikut akan menyertai aktiviti kokurikulum yang dianjurkan oleh pihak sekolah. Mohon tuan/puan menyemak maklumat dan melengkapkan pengesahan di bahagian bawah surat ini.</p>
    <table class="letter-table"><tbody>
      <tr><th>Nama murid</th><td>{{NAMA_MURID}}</td></tr>
      <tr><th>Kelas</th><td>{{KELAS_MURID}}</td></tr>
      <tr><th>Nama aktiviti</th><td>{{NAMA_AKTIVITI}}</td></tr>
      <tr><th>Tarikh</th><td>{{TARIKH_AKTIVITI}}</td></tr>
      <tr><th>Masa</th><td>{{MASA_AKTIVITI}}</td></tr>
      <tr><th>Tempat</th><td>{{TEMPAT_AKTIVITI}}</td></tr>
      <tr><th>Peringkat</th><td>{{PERINGKAT_AKTIVITI}}</td></tr>
    </tbody></table>
    <p>Kerjasama dan sokongan tuan/puan amat dihargai. Sekian, terima kasih.</p>
    <div class="signature-block">
      <p><strong>PENGESAHAN IBU BAPA / PENJAGA</strong></p>
      <p>Saya <span class="line long">........................................................</span> ibu bapa / penjaga kepada murid di atas:</p>
      <p><strong>☐ BENARKAN</strong> / <strong>☐ TIDAK BENARKAN</strong> anak / jagaan saya menyertai aktiviti tersebut.</p>
      <p>Nama ibu bapa / penjaga: <span class="line long">................................................</span></p>
      <p>No. telefon: <span class="line short">............................</span></p>
      <p>Tandatangan: <span class="line long">....................................................</span></p>
      <p>Tarikh: <span class="line short">............................</span></p>
    </div>
    <div class="approval"><p>Sekian, terima kasih.</p><p><strong>Yang menjalankan amanah,</strong></p><p style="margin-top:36px;">........................................................</p><p>Pengetua<br>SMK TENGKU TEMENGGONG AHMAD</p></div>
  </div>`;
}

async function openAktivitiPermissionLetter(activityId){
  let w=null;
  const popupMessage_=(title,message,detail='')=>{
    if(!w||w.closed)return;
    const escHtml=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    try{
      w.document.open();
      w.document.write(`<!doctype html><html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(title)}</title><style>
        *{box-sizing:border-box}body{margin:0;background:#eef1e9;color:#14251d;font:16px Arial,sans-serif;padding:28px}.message{max-width:760px;margin:5vh auto;background:#fff;padding:30px;border:1px solid #bdcbbf;border-top:4px solid #d8e267;border-radius:8px;box-shadow:0 8px 30px #10201712}h1{font-size:22px;margin:0 0 14px;color:#075c52}p{line-height:1.6}.detail{background:#f4f6f0;border-left:3px solid #075c52;padding:12px;white-space:pre-wrap;overflow-wrap:anywhere;font:13px ui-monospace,monospace}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}button{border:0;background:#075c52;color:#fff;font-weight:700;padding:11px 17px;border-radius:4px;cursor:pointer}button.secondary{background:#e6ebdf;color:#173126}small{color:#647568}@media(prefers-color-scheme:dark){body{background:#101714;color:#e8eee7}.message{background:#172720;border-color:#34493f}.detail{background:#101714;color:#e8eee7}h1{color:#d8e267}small{color:#b2c0b5}}
        </style></head><body><main class="message"><h1>${escHtml(title)}</h1><p>${escHtml(message)}</p>${detail?`<div class="detail">${escHtml(detail)}</div>`:''}<div class="actions"><button onclick="window.close()">Tutup</button></div></main></body></html>`);
      w.document.close();w.focus();
    }catch(renderError){console.error('Tidak dapat memaparkan status surat:',renderError);}
  };
  try{
    if(!activityId){toast('ID aktiviti tidak sah.');return;}
    // Buka popup sejurus klik supaya Chrome tidak menyekatnya. Jangan gunakan
    // window.confirm selepas await kerana dialog boleh tersembunyi pada tab asal.
    w=window.open('','_blank');
    if(!w){toast('Popup disekat. Benarkan pop-up untuk e-KOSSTA.');return;}
    popupMessage_('Sedang menjana surat kebenaran','Sedang mengambil maklumat aktiviti dan senarai peserta. Sila tunggu.');

    const d=await apiGet('getAktivitiPeserta',{token:state.token,aktivitiId:activityId});
    const peserta=(d.data||[]).filter(x=>x.selected===true&&String(x.STATUS||'AKTIF').toUpperCase()==='AKTIF');
    const a=d.aktiviti||{};
    const nama=String(a.NAMA_AKTIVITI||'Aktiviti').trim();
    if(!peserta.length){
      popupMessage_('Tiada peserta untuk dijana',`Aktiviti: ${nama}. Tiada peserta aktif yang ditandakan untuk aktiviti ini. Kembali ke ${getAppName_()} dan simpan dahulu senarai peserta.`, 'Semak butang Peserta pada aktiviti ini, tandakan murid yang terlibat, kemudian klik Simpan Peserta.');
      toast('Tiada peserta aktif dipilih. Semak dan simpan senarai peserta dahulu.');
      return;
    }

    const date=activityDate_(a.TARIKH)||'-';
    const safe=v=>activityEsc_(v==null||v===''?'-':v);
    let permissionTemplate=defaultPermissionTemplate_();
    try{
      popupMessage_('Memuatkan templat surat',`Aktiviti: ${nama}\nJumlah peserta: ${peserta.length}. Menggunakan templat tersimpan jika tersedia.`);
      const saved=await apiGet('getDocuments',{token:state.token});
      const found=(saved.data||[]).find(r=>String(r.TYPE)==='SURAT_KEBENARAN'&&/templat surat kebenaran ibu bapa/i.test(String(r.TITLE||'')));
      if(found){
        const full=await apiGet('getDocument',{token:state.token,documentId:found.DOCUMENT_ID});
        if(full.document?.CONTENT_HTML)permissionTemplate=full.document.CONTENT_HTML;
      }
    }catch(templateError){
      console.warn('Templat tersimpan tidak dapat dimuatkan; templat lalai digunakan.',templateError);
    }

    popupMessage_('Menyusun surat',`Aktiviti: ${nama}\nJumlah surat: ${peserta.length}. Hampir selesai.`);
    const pages=peserta.map((p,i)=>{
      const values={
        NAMA_MURID:safe(p.NAMA),NO_KP_MURID:'',KELAS_MURID:safe(p.KELAS),
        NAMA_AKTIVITI:safe(a.NAMA_AKTIVITI),TARIKH_AKTIVITI:safe(date),MASA_AKTIVITI:safe(a.MASA),
        PERINGKAT_AKTIVITI:safe(a.PERINGKAT),TEMPAT_AKTIVITI:safe(a.TEMPAT)
      };
      const body=brandDocumentHtml_(replaceLetterTokens_(permissionTemplate,values));
      return `<section class="permission-page" aria-label="Surat ${i+1} daripada ${peserta.length}">${body}</section>`;
    }).join('');
    const brandedPages=pages; // Setiap surat telah diberi logo secara berasingan supaya setiap halaman mempunyai kepala surat.
    const sanitizedPages=window.__EKOSSTA_CLEAN_PRIVACY_HTML__?window.__EKOSSTA_CLEAN_PRIVACY_HTML__(brandedPages):brandedPages;

    w.document.open();
    w.document.write(`<!doctype html><html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Surat Kebenaran - ${safe(nama)}</title><style>
      @page{size:A4;margin:12mm}*{box-sizing:border-box}html,body{margin:0;padding:0;font-family:Arial,sans-serif;color:#111;background:#e8ece5}.print-toolbar{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 18px;margin:-20px -20px 20px;background:#101714;color:#edf2e7;border-bottom:2px solid #d8e267;font:13px Arial,sans-serif}.print-toolbar .actions{display:flex;gap:8px;flex-wrap:wrap}.print-toolbar button{border:1px solid #466053;border-radius:4px;padding:9px 14px;background:#d8e267;color:#102019;font-weight:700;cursor:pointer}.print-toolbar button.secondary{background:#1d3027;color:#edf2e7}.print-toolbar .hint{font-size:12px;color:#c5d0c8}.permission-page{width:100%;min-height:0;padding:0;page-break-after:always;break-after:page;position:relative;background:#fff}.permission-page:last-child{page-break-after:auto;break-after:auto}.letter-header{text-align:center;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:18px}.ekossta-school-doc-brand{display:flex;align-items:center;justify-content:center;width:100%;margin:0 0 10px;padding:0 0 8px;border-bottom:1px solid #aab9af;box-sizing:border-box}.ekossta-school-doc-brand img{display:block;width:auto;height:auto;max-width:76px;max-height:58px;object-fit:contain}.school-name{font-size:18px;font-weight:800}.school-sub{font-size:13px;font-weight:800;margin-top:8px}.permission-page p{font-size:11.5px;line-height:1.55;margin:9px 0}table,.letter-table{width:100%;border-collapse:collapse;margin:12px 0 16px;font-size:11px}table th,table td,.letter-table th,.letter-table td{border:1px solid #777;padding:7px;text-align:left;vertical-align:top}table th,.letter-table th{width:28%;font-weight:700}table td{overflow-wrap:anywhere}.line{display:inline-block;min-width:0;border:0;height:auto}.line.short,.line.long{min-width:0;width:auto;border:0}.signature-block,.witness-block,.approval{margin-top:18px;font-size:11px;line-height:1.45}.signature-block p,.witness-block p,.approval p{margin:5px 0}.witness-block{margin-top:22px}.section-label{margin-top:0!important}.signature-dots{margin-top:30px!important}.approval{margin-top:28px}.approval-row{display:flex;justify-content:space-between;gap:18px;margin-top:8px}.approval-row span{white-space:nowrap}.page-no{position:absolute;bottom:2mm;right:2mm;font-size:8px;color:#666}@media screen{body{padding:20px}.permission-page{background:#fff;max-width:794px;min-height:1123px;margin:0 auto 20px;padding:0;box-shadow:0 2px 12px rgba(0,0,0,.15)}}@media print{html,body{background:#fff!important}.print-toolbar{display:none!important}.permission-page{max-width:none;min-height:0;margin:0;box-shadow:none}.permission-page{page-break-after:always;break-after:page}.permission-page:last-child{page-break-after:auto;break-after:auto}}
      </style></head><body><div class="print-toolbar"><div><strong>${activityEsc_(getAppName_())} · SURAT KEBENARAN</strong><div class="hint">${peserta.length} surat untuk aktiviti ${safe(nama)}. Untuk PDF, pilih “Save as PDF” dalam dialog cetakan.</div></div><div class="actions"><button type="button" onclick="window.print()">Cetak / Simpan PDF</button><button class="secondary" type="button" onclick="window.close()">Tutup</button></div></div>${sanitizedPages}</body></html>`);
    w.document.close();
    w.focus();
    toast(`${peserta.length} surat kebenaran berjaya disediakan. Pilih Cetak / Simpan PDF pada tab surat.`);
  }catch(e){
    console.error('Janaan surat kebenaran gagal:',e);
    popupMessage_('Surat tidak dapat dijana',e.message||'Berlaku ralat semasa menjana surat kebenaran.','Semak sambungan API Apps Script dan senarai peserta bagi aktiviti ini.');
    toast(e.message||'Gagal menjana surat kebenaran.');
  }
}

async function loadActivityTeacherOptions_(selected=''){
  const sel=$('activityTeacher');if(!sel)return;
  const role=String(state.user?.role||'').toUpperCase(),field=sel.closest('.activity-field');
  if(role!=='ADMIN'){
    // Pentadbir dan akaun guru baharu tidak perlu dikaitkan secara paksa dengan rekod Guru Penasihat.
    sel.innerHTML='<option value="">Tidak dipautkan kepada Guru Penasihat</option>';sel.value='';sel.disabled=true;sel.required=false;if(field)field.hidden=true;return;
  }
  if(field)field.hidden=false;sel.required=true;sel.disabled=false;
  try{
    const d=await apiGet('getGuru',{token:state.token});
    const teachers=(d.data||[]).filter(x=>String(x.STATUS||'AKTIF').toUpperCase()==='AKTIF');
    sel.innerHTML='<option value="">-- Pilih Guru --</option>'+teachers.map(x=>`<option value="${activityEsc_(x.NO_GURU)}">${activityEsc_(x.NAMA)} — ${activityEsc_(x.NO_GURU)}</option>`).join('');
    if(selected)sel.value=selected;
  }catch(e){toast(e.message||'Gagal memuatkan guru.');}
}
function updateActivityDay_(){if($('activityDay'))$('activityDay').value=activityDayFromDate_($('activityDate')?.value||'')}
async function openAktivitiModal(id=''){
  const modal=$('activityModal');if(!modal)return;
  $('activityForm').reset();$('activityId').value=id||'';$('activityModalTitle').textContent=id?'Kemaskini Aktiviti':'Tambah Aktiviti';
  $('activityDay').value='';
  const r=AKTIVITI_ROWS.find(x=>String(x.AKTIVITI_ID)===String(id));
  await loadActivityTeacherOptions_(r?.NO_GURU||'');
  if(r){
    $('activityName').value=r.NAMA_AKTIVITI||'';
    $('activityDate').value=String(r.TARIKH||'').slice(0,10);
    $('activityDay').value=r.HARI||activityDayFromDate_(r.TARIKH);
    $('activityTime').value=r.MASA||'';
    $('activityPlace').value=r.TEMPAT||'';
    $('activityLevelForm').value=r.PERINGKAT||'';
  }
  modal.hidden=false;document.body.classList.add('activity-modal-open');requestAnimationFrame(()=>modal.classList.add('show'));
}
function closeAktivitiModal(){const modal=$('activityModal');if(!modal)return;modal.classList.remove('show');document.body.classList.remove('activity-modal-open');setTimeout(()=>{modal.hidden=true},160)}
async function saveAktiviti(e){
  e.preventDefault();
  const b=$('activitySaveBtn');
  const p={token:state.token,aktivitiId:$('activityId').value.trim(),namaAktiviti:$('activityName').value.trim(),tarikh:$('activityDate').value,masa:$('activityTime').value,tempat:$('activityPlace').value.trim(),peringkat:$('activityLevelForm').value,noGuru:$('activityTeacher').value};
  if(!p.namaAktiviti||!p.tarikh||!p.tempat||!p.peringkat)return toast('Lengkapkan maklumat asas aktiviti.');
  b.disabled=true;b.textContent='Menyimpan...';
  try{const d=await apiGet('saveAktiviti',p);toast(d.message||'Aktiviti berjaya disimpan.');closeAktivitiModal();await loadAktivitiPage();}
  catch(e){toast(e.message||'Gagal menyimpan aktiviti.');}
  finally{b.disabled=false;b.textContent='Simpan Aktiviti';}
}

/* =========================================================
   V2.4 UNIT OVERVIEW
========================================================= */
let UNIT_OVERVIEW_ID='';
let UNIT_OVERVIEW_YEAR='';
let UNIT_OVERVIEW_DATA=null;
let UNIT_AJK_DATA=null;
let UNIT_AJK_SELECTED_KP='';
const UNIT_AJK_POSITIONS_=[
  {value:'PENGERUSI',label:'Pengerusi'},
  {value:'TIMBALAN PENGERUSI',label:'Timbalan Pengerusi'},
  {value:'SETIAUSAHA',label:'Setiausaha'},
  {value:'PENOLONG SETIAUSAHA',label:'Penolong Setiausaha'},
  {value:'BENDAHARI',label:'Bendahari'},
  {value:'PENOLONG BENDAHARI',label:'Penolong Bendahari'},
  {value:'AJK',label:'Ahli Jawatankuasa (AJK)'}
];
function unitOverviewEsc_(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function unitStatusMark_(v){
  const s=String(v||'').toUpperCase();
  if(s==='HADIR')return '<span class="uo-status hadir">✓</span>';
  if(s==='TIDAK HADIR')return '<span class="uo-status tidak">✕</span>';
  if(s==='BERSEBAB')return '<span class="uo-status bersebab">B</span>';
  if(s==='CUTI')return '<span class="uo-status cuti">C</span>';
  return '<span class="uo-status kosong">–</span>';
}
function openUnitOverview(unitId,tahun){
  UNIT_OVERVIEW_ID=String(unitId||'');
  UNIT_OVERVIEW_YEAR=String(tahun||new Date().getFullYear());
  showPage('unit-overview');
}
async function loadUnitOverview(){
  switchUnitOverviewTab_('members');
  const title=$('unitOverviewTitle');
  if(!UNIT_OVERVIEW_ID){showPage('unit');return;}
  ['unitOverviewMembers','unitOverviewWeeks','unitOverviewMemberAttendance','unitOverviewAjk'].forEach(id=>{if($(id))$(id).innerHTML='<div class="empty">Memuatkan data...</div>';});
  try{
    const d=await apiGet('getUnitOverview',{token:state.token,unitId:UNIT_OVERVIEW_ID,tahun:UNIT_OVERVIEW_YEAR});
    UNIT_OVERVIEW_DATA=d;
    const u=d.unit||{};
    if(title)title.textContent=u.NAMA_UNIT||'Unit Kokurikulum';
    if($('unitOverviewMeta'))$('unitOverviewMeta').textContent=u.GURU_PENASIHAT?`Guru Penasihat: ${esc(u.GURU_PENASIHAT)}`:'';
    const st=d.stats||{};
    UNIT_OVERVIEW_ACTIVE_KP=new Set((d.ahli||[]).map(x=>String(x.NO_KP||'')));
    const addBtn=$('unitAddMemberBtn');if(addBtn)addBtn.hidden=String(state.user?.role||'').toUpperCase()!=='ADMIN';
    const canManageAjk=['ADMIN','GURU'].includes(String(state.user?.role||'').toUpperCase());
    ['unitOverviewAjkAddBtn'].forEach(id=>{const b=$(id);if(b)b.hidden=!canManageAjk;});
    $('unitOverviewStats').innerHTML=`<div><b>${st.jumlahAhli||0}</b><small>Jumlah Ahli</small></div><div><b>${st.jumlahAJK||0}</b><small>AJK</small></div><div><b>${st.jumlahMingguDirekodkan||0}</b><small>Minggu Direkodkan</small></div><div><b>${(d.minggu||[]).filter(x=>x.ADA_REKOD).length?Math.round((d.minggu||[]).filter(x=>x.ADA_REKOD).reduce((a,x)=>a+x.PERATUS,0)/(d.minggu||[]).filter(x=>x.ADA_REKOD).length):0}%</b><small>Purata Kehadiran</small></div>`;
    UNIT_OVERVIEW_MEMBER_ROWS_=d.ahli||[];
    renderUnitOverviewMembers_(UNIT_OVERVIEW_MEMBER_ROWS_);
    renderUnitOverviewWeeks_(d.minggu||[]);
    renderUnitOverviewMemberAttendance_(d.ahli||[]);
    renderUnitOverviewAjk_(d.ajk||[]);
  }catch(e){toast(e.message||'Gagal memuatkan butiran unit.');}
}
let UNIT_OVERVIEW_ACTIVE_KP=new Set();
let UNIT_OVERVIEW_MEMBER_ROWS_=[];
let UNIT_MEMBER_CANDIDATES=[];
let UNIT_MEMBER_FILTERED=[];
function openAddUnitMemberModal_(){
  if(state.user?.role!=='ADMIN')return toast('Hanya ADMIN boleh menambah ahli unit.');
  const modal=$('unitMemberModal');if(!modal)return;
  $('unitMemberForm').reset();
  $('unitMemberYear').value=UNIT_OVERVIEW_YEAR||String(new Date().getFullYear());
  $('unitMemberModalTitle').textContent='Tambah Ahli Unit';
  $('unitMemberModalMeta').textContent=`${$('unitOverviewTitle')?.textContent||'Unit'} • Tahun ${UNIT_OVERVIEW_YEAR||new Date().getFullYear()}`;
  $('unitMemberFormStatus').textContent='Memuatkan senarai murid...';
  $('unitMemberSaveBtn').disabled=true;
  modal.hidden=false;document.body.classList.add('unit-member-modal-open');
  requestAnimationFrame(()=>modal.classList.add('show'));
  loadUnitMemberCandidates_();
}
async function loadUnitMemberCandidates_(){
  try{
    const d=await apiGet('getMurid',{token:state.token});
    UNIT_MEMBER_CANDIDATES=(d.data||[]).filter(x=>String(x.STATUS||'AKTIF').toUpperCase()==='AKTIF'&&!UNIT_OVERVIEW_ACTIVE_KP.has(String(x.NO_KP||'')));
    filterUnitMemberOptions_();
    $('unitMemberFormStatus').textContent=UNIT_MEMBER_CANDIDATES.length?'Pilih murid untuk ditambah ke unit ini.':'Tiada murid aktif untuk ditambah. Semak modul Murid atau pastikan murid belum menjadi ahli unit ini.';
    $('unitMemberSaveBtn').disabled=!UNIT_MEMBER_CANDIDATES.length;
  }catch(e){
    $('unitMemberFormStatus').textContent=e.message||'Gagal memuatkan senarai murid.';
    toast(e.message||'Gagal memuatkan senarai murid.');
  }
}
function filterUnitMemberOptions_(){
  const sel=$('unitMemberStudent');if(!sel)return;
  const q=String($('unitMemberStudentSearch')?.value||'').trim().toLowerCase();
  UNIT_MEMBER_FILTERED=UNIT_MEMBER_CANDIDATES.filter(x=>[x.NAMA,x.NO_KP,x.KELAS,x.TINGKATAN].some(v=>String(v||'').toLowerCase().includes(q)));
  const current=sel.value;
  sel.innerHTML='<option value="">-- Pilih Murid --</option>'+UNIT_MEMBER_FILTERED.map(x=>`<option value="${escAttr(x.NO_KP)}">${esc(x.NAMA)}${x.KELAS?' ('+esc(x.KELAS)+')':''}</option>`).join('');
  if(UNIT_MEMBER_FILTERED.some(x=>String(x.NO_KP)===current))sel.value=current;
}
function closeAddUnitMemberModal_(){
  const modal=$('unitMemberModal');if(!modal)return;
  modal.classList.remove('show');document.body.classList.remove('unit-member-modal-open');
  setTimeout(()=>{modal.hidden=true;},160);
}
async function saveUnitMemberFromModal_(event){
  event.preventDefault();
  if(state.user?.role!=='ADMIN')return toast('Hanya ADMIN boleh menambah ahli unit.');
  const noKp=String($('unitMemberStudent')?.value||'').trim();
  const tahun=String($('unitMemberYear')?.value||UNIT_OVERVIEW_YEAR||'').trim();
  if(!UNIT_OVERVIEW_ID||!noKp||!tahun)return toast('Pilih nama murid dan pastikan tahun diisi.');
  const btn=$('unitMemberSaveBtn');btn.disabled=true;btn.textContent='Menyimpan...';
  $('unitMemberFormStatus').textContent='Menyimpan keahlian murid...';
  try{
    const d=await apiGet('addUnitMember',{token:state.token,unitId:UNIT_OVERVIEW_ID,noKp,tahun});
    toast(d.message||'Ahli berjaya ditambah.');
    closeAddUnitMemberModal_();
    await loadUnitOverview();
    await loadUnit();
  }catch(e){
    $('unitMemberFormStatus').textContent=e.message||'Gagal menambah ahli.';
    toast(e.message||'Gagal menambah ahli.');
  }finally{btn.disabled=false;btn.textContent='Simpan Ahli';}
}

const UNIT_OVERVIEW_TAB_KEYS_=['members','attendance','member-attendance','ajk'];
function setupUnitOverviewTabs_(){
  const tabs=Array.from(document.querySelectorAll('[data-unit-overview-tab]'));
  tabs.forEach((button,index)=>{
    button.addEventListener('click',()=>switchUnitOverviewTab_(button.dataset.unitOverviewTab));
    button.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      let next=index;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      else if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      tabs[next]?.focus();
      switchUnitOverviewTab_(tabs[next]?.dataset.unitOverviewTab);
    });
  });
  switchUnitOverviewTab_('members');
}
function switchUnitOverviewTab_(key){
  const active=UNIT_OVERVIEW_TAB_KEYS_.includes(String(key||''))?String(key):'members';
  document.querySelectorAll('[data-unit-overview-tab]').forEach(button=>{
    const selected=button.dataset.unitOverviewTab===active;
    button.setAttribute('aria-selected',selected?'true':'false');
    button.tabIndex=selected?0:-1;
    button.classList.toggle('is-active',selected);
  });
  document.querySelectorAll('[data-unit-overview-panel]').forEach(panel=>{
    const selected=panel.dataset.unitOverviewPanel===active;
    panel.hidden=!selected;
    panel.classList.toggle('is-active',selected);
  });
}

function renderUnitOverviewMembers_(rows){
  const w=$('unitOverviewMembers');if(!w)return;
  const source=Array.isArray(rows)?rows:UNIT_OVERVIEW_MEMBER_ROWS_;
  const classFilter=$('unitOverviewMemberClassFilter'),genderFilter=$('unitOverviewMemberGenderFilter');
  const currentClass=String(classFilter?.value||''),currentGender=String(genderFilter?.value||'');
  const classNames=[...new Set(source.map(r=>String(r.KELAS||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ms',{numeric:true}));
  if(classFilter){classFilter.innerHTML='<option value="">Semua Kelas</option>'+classNames.map(c=>`<option value="${unitOverviewEsc_(c)}">${unitOverviewEsc_(c)}</option>`).join('');classFilter.value=classNames.includes(currentClass)?currentClass:'';}
  if(!source.length){w.innerHTML='<div class="empty">Tiada ahli aktif bagi tahun ini.</div>';return;}
  const filtered=source.filter(r=>(!classFilter?.value||String(r.KELAS||'').trim()===classFilter.value)&&(!genderFilter?.value||String(r.JANTINA||'').trim().toUpperCase()===genderFilter.value));
  if(!filtered.length){w.innerHTML='<div class="empty">Tiada ahli sepadan dengan kelas dan jantina yang dipilih.</div>';return;}
  const genderRank=v=>{const g=String(v||'').trim().toUpperCase();return g==='L'?0:g==='P'?1:2;};
  const classGroups=new Map();
  [...filtered].sort((a,b)=>String(a.KELAS||'Tanpa kelas').localeCompare(String(b.KELAS||'Tanpa kelas'),'ms',{numeric:true})||genderRank(a.JANTINA)-genderRank(b.JANTINA)||String(a.NAMA||'').localeCompare(String(b.NAMA||''),'ms')).forEach(r=>{const klass=String(r.KELAS||'Tanpa kelas').trim()||'Tanpa kelas';if(!classGroups.has(klass))classGroups.set(klass,[]);classGroups.get(klass).push(r);});
  let index=0,body='';
  classGroups.forEach((classRows,klass)=>{
    body+=`<tr class="unit-member-class-band"><td colspan="6">KELAS: ${unitOverviewEsc_(klass)} <span>${classRows.length} MURID</span></td></tr>`;
    const genders=[['L','LELAKI'],['P','PEREMPUAN'],['OTHER','LAIN-LAIN']];
    genders.forEach(([key,label])=>{
      const members=classRows.filter(r=>key==='OTHER'?!['L','P'].includes(String(r.JANTINA||'').trim().toUpperCase()):String(r.JANTINA||'').trim().toUpperCase()===key);
      if(!members.length)return;
      body+=`<tr class="unit-member-gender-band"><td colspan="6">${label} <span>${members.length}</span></td></tr>`;
      members.forEach(r=>{index++;const gender=String(r.JANTINA||'').trim().toUpperCase();body+=`<tr><td>${index}</td><td><b>${unitOverviewEsc_(r.NAMA)}</b></td><td>${gender==='L'?'Lelaki':gender==='P'?'Perempuan':unitOverviewEsc_(r.JANTINA||'-')}</td><td>${unitOverviewEsc_(r.TINGKATAN||'-')}</td><td>${unitOverviewEsc_(r.KELAS||'-')}</td><td>${unitOverviewEsc_(r.STATUS||'AKTIF')}</td></tr>`;});
    });
  });
  w.innerHTML=`<table class="unit-overview-table unit-members-grouped-table"><thead><tr><th>#</th><th>Murid</th><th>Jantina</th><th>Tingkatan</th><th>Kelas</th><th>Status</th></tr></thead><tbody>${body}</tbody></table>`;
}
function renderUnitOverviewWeeks_(rows){
  const w=$('unitOverviewWeeks');if(!w)return;
  w.innerHTML=`<table class="unit-overview-table"><thead><tr><th>Minggu</th><th>Tarikh</th><th>Perjumpaan</th><th>Ahli</th><th>Hadir</th><th>Tidak Hadir</th><th>Bersebab</th><th>Cuti</th><th>Kehadiran</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.ADA_REKOD?'':'week-empty'}"><td><b>${r.MINGGU}</b></td><td>${r.TARIKH?new Date(r.TARIKH).toLocaleDateString('ms-MY'):'-'}</td><td>${r.NO_PERJUMPAAN||'-'}</td><td>${r.TOTAL}</td><td>${r.HADIR}</td><td>${r.TIDAK_HADIR}</td><td>${r.BERSEBAB}</td><td>${r.CUTI}</td><td><b>${r.PERATUS}%</b></td></tr>`).join('')}</tbody></table>`;
}
function renderUnitOverviewMemberAttendance_(rows){
  const w=$('unitOverviewMemberAttendance');if(!w)return;
  if(!rows.length){w.innerHTML='<div class="empty">Tiada ahli.</div>';return;}
  const weeks=Array.from({length:15},(_,i)=>i+1);
  w.innerHTML=`<div class="unit-overview-scroll"><table class="unit-overview-table unit-week-table"><thead><tr><th>Murid</th>${weeks.map(x=>`<th>M${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td><b>${unitOverviewEsc_(r.NAMA)}</b><small>${unitOverviewEsc_(r.KELAS)}</small></td>${weeks.map(w=>`<td>${unitStatusMark_((r.MINGGU||{})[w]?.STATUS)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="unit-week-legend"><span>✓ Hadir</span><span>✕ Tidak Hadir</span><span>B Bersebab</span><span>C Cuti</span><span>– Tiada rekod</span></div>`;
}
function unitAjkRoleRank_(role){
  const v=String(role||'').trim().toUpperCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ');
  const ranks={'PENGERUSI':1,'TIMBALAN PENGERUSI':2,'NAIB PENGERUSI':2,'SETIAUSAHA':3,'PENOLONG SETIAUSAHA':4,'BENDAHARI':5,'PENOLONG BENDAHARI':6,'AJK':7,'AHLI JAWATANKUASA':7};
  return ranks[v]||50;
}
function sortUnitAjkRows_(rows){return [...(rows||[])].sort((a,b)=>unitAjkRoleRank_(a.JAWATAN)-unitAjkRoleRank_(b.JAWATAN)||String(a.NAMA||'').localeCompare(String(b.NAMA||''),'ms'));}
function renderUnitOverviewAjk_(rows){
  const w=$('unitOverviewAjk');if(!w)return;
  const sorted=sortUnitAjkRows_(rows);
  if(!sorted.length){w.innerHTML='<div class="empty">Belum ada rekod AJK untuk unit ini bagi tahun tersebut.</div>';return;}
  w.innerHTML=`<table class="unit-overview-table"><thead><tr><th>#</th><th>Murid</th><th>Jawatan</th><th>Tingkatan</th><th>Kelas</th><th>Status</th></tr></thead><tbody>${sorted.map((r,i)=>`<tr><td>${i+1}</td><td><b>${unitOverviewEsc_(r.NAMA)}</b></td><td><span class="uo-role">${unitOverviewEsc_(r.JAWATAN)}</span></td><td>${unitOverviewEsc_(r.TINGKATAN)}</td><td>${unitOverviewEsc_(r.KELAS)}</td><td>${unitOverviewEsc_(r.STATUS)}</td></tr>`).join('')}</tbody></table>`;
}

/* =========================================================
   V2.5 UNIT AJK + CETAK REKOD UNIT
========================================================= */
function openUnitAjkPage_(){
  if(!UNIT_OVERVIEW_ID)return toast('Buka butiran unit dahulu.');
  showPage('unit-ajk');
}
function ajkEsc_(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function loadUnitAjkPage_(){
  if(!UNIT_OVERVIEW_ID){showPage('unit');return;}
  const status=$('unitAjkStatus');
  if(status)status.textContent='Memuatkan data AJK dan ahli unit...';
  const candidateWrap=$('unitAjkCandidateTableWrap'),currentWrap=$('unitAjkCurrentTableWrap');
  if(candidateWrap)candidateWrap.innerHTML='<div class="empty">Memuatkan calon AJK...</div>';
  if(currentWrap)currentWrap.innerHTML='<div class="empty">Memuatkan senarai AJK...</div>';
  try{
    const d=await apiGet('getUnitAjkCandidates',{token:state.token,unitId:UNIT_OVERVIEW_ID,tahun:UNIT_OVERVIEW_YEAR||String(new Date().getFullYear())});
    UNIT_AJK_DATA=d;
    const unit=d.unit||{};
    if($('unitAjkTitle'))$('unitAjkTitle').textContent='Pengurusan AJK — '+(unit.NAMA_UNIT||$('unitOverviewTitle')?.textContent||'Unit');
    if($('unitAjkMeta'))$('unitAjkMeta').textContent=`Tahun ${d.tahun||UNIT_OVERVIEW_YEAR}. Calon hanya dipilih daripada ahli aktif unit ini.`;
    const positionSelect=$('unitAjkPositionSelect');
    if(positionSelect){
      const previousPosition=positionSelect.value;
      positionSelect.innerHTML='<option value="">-- Pilih Jenis AJK --</option>'+UNIT_AJK_POSITIONS_.map(p=>`<option value="${ajkEsc_(p.value)}">${ajkEsc_(p.label)}</option>`).join('');
      if(UNIT_AJK_POSITIONS_.some(p=>p.value===previousPosition))positionSelect.value=previousPosition;
    }
    UNIT_AJK_SELECTED_KP='';
    const classes=[...new Set((d.candidates||[]).map(x=>String(x.KELAS||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ms'));
    const classSel=$('unitAjkClassFilter');
    if(classSel){const selected=classSel.value;classSel.innerHTML='<option value="">Semua Kelas</option>'+classes.map(x=>`<option value="${ajkEsc_(x)}">${ajkEsc_(x)}</option>`).join('');if(classes.includes(selected))classSel.value=selected;}
    renderUnitAjkCurrent_();renderUnitAjkCandidates_();
    if(status)status.textContent=(d.candidates||[]).length?`${d.candidates.length} ahli tersedia untuk dilantik.`:'Tiada calon tersedia. Pastikan murid sudah menjadi ahli aktif unit ini dan belum dilantik sebagai AJK.';
  }catch(e){
    if(status)status.textContent=e.message||'Gagal memuatkan data AJK.';
    if(candidateWrap)candidateWrap.innerHTML=`<div class="empty">${ajkEsc_(e.message||'Gagal memuatkan calon AJK.')}</div>`;
    toast(e.message||'Gagal memuatkan data AJK.');
  }
}
function renderUnitAjkCurrent_(){
  const wrap=$('unitAjkCurrentTableWrap');if(!wrap)return;
  const rows=sortUnitAjkRows_(UNIT_AJK_DATA?.ajk||[]);
  if(!rows.length){wrap.innerHTML='<div class="empty">Belum ada AJK bagi unit dan tahun ini.</div>';return;}
  wrap.innerHTML=`<table class="unit-overview-table unit-ajk-table"><thead><tr><th>#</th><th>Nama</th><th>Jawatan</th><th>Tingkatan</th><th>Kelas</th><th>Status</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td><b>${ajkEsc_(r.NAMA)}</b></td><td><span class="uo-role ${unitAjkRoleRank_(r.JAWATAN)===1?'uo-role-chair':''}">${ajkEsc_(r.JAWATAN)}</span></td><td>${ajkEsc_(r.TINGKATAN)}</td><td>${ajkEsc_(r.KELAS)}</td><td>${ajkEsc_(r.STATUS||'AKTIF')}</td></tr>`).join('')}</tbody></table>`;
}
function renderUnitAjkCandidates_(){
  const wrap=$('unitAjkCandidateTableWrap');if(!wrap)return;
  const all=UNIT_AJK_DATA?.candidates||[];
  const klass=String($('unitAjkClassFilter')?.value||'');
  const q=String($('unitAjkSearch')?.value||'').trim().toLowerCase();
  const rows=all.filter(r=>(!klass||String(r.KELAS||'')===klass)&&(!q||[r.NAMA,r.NO_KP,r.TINGKATAN,r.KELAS].some(v=>String(v||'').toLowerCase().includes(q))));
  if(!rows.some(r=>String(r.NO_KP)===UNIT_AJK_SELECTED_KP))UNIT_AJK_SELECTED_KP='';
  if($('unitAjkCandidateCount'))$('unitAjkCandidateCount').textContent=`${rows.length} calon dipaparkan daripada ${all.length} ahli yang belum dilantik.`;
  if(!rows.length){wrap.innerHTML='<div class="empty">Tiada murid sepadan dengan penapis ini.</div>';updateUnitAjkSaveButton_();return;}
  wrap.innerHTML=`<table class="unit-overview-table unit-ajk-candidate-table"><thead><tr><th>Pilih</th><th>Nama Murid</th><th>Tingkatan</th><th>Kelas</th><th>Status Keahlian</th></tr></thead><tbody>${rows.map((r,i)=>`<tr class="${String(r.NO_KP)===UNIT_AJK_SELECTED_KP?'ajk-candidate-selected':''}"><td><input type="radio" name="unitAjkCandidate" data-ajk-select value="${ajkEsc_(r.NO_KP)}" aria-label="Pilih ${ajkEsc_(r.NAMA)}" ${String(r.NO_KP)===UNIT_AJK_SELECTED_KP?'checked':''}></td><td><b>${ajkEsc_(r.NAMA)}</b></td><td>${ajkEsc_(r.TINGKATAN)}</td><td>${ajkEsc_(r.KELAS)}</td><td><span class="uo-role">AHLI AKTIF</span></td></tr>`).join('')}</tbody></table>`;
  wrap.querySelectorAll('[data-ajk-select]').forEach(radio=>radio.addEventListener('change',()=>{
    UNIT_AJK_SELECTED_KP=String(radio.value||'');
    wrap.querySelectorAll('tr.ajk-candidate-selected').forEach(row=>row.classList.remove('ajk-candidate-selected'));
    radio.closest('tr')?.classList.add('ajk-candidate-selected');
    updateUnitAjkSaveButton_();
  }));
  updateUnitAjkSaveButton_();
}
function updateUnitAjkSaveButton_(){
  const button=$('unitAjkSaveBtn');
  const candidate=(UNIT_AJK_DATA?.candidates||[]).find(x=>String(x.NO_KP)===UNIT_AJK_SELECTED_KP);
  const role=String($('unitAjkPositionSelect')?.value||'');
  if(button)button.disabled=!(candidate&&role);
}
async function saveSelectedUnitAjk_(){
  const noKp=String(UNIT_AJK_SELECTED_KP||'');
  const jawatan=String($('unitAjkPositionSelect')?.value||'');
  const candidate=(UNIT_AJK_DATA?.candidates||[]).find(x=>String(x.NO_KP)===noKp);
  if(!candidate||!jawatan)return toast('Pilih seorang murid, jenis jawatan AJK dan tekan Simpan Pelantikan.');
  const button=$('unitAjkSaveBtn');
  if(button){button.disabled=true;button.textContent='Menyimpan...';}
  if($('unitAjkStatus'))$('unitAjkStatus').textContent=`Menyimpan pelantikan ${candidate.NAMA} sebagai ${jawatan}. Elakkan menekan butang berulang kali.`;
  try{
    const d=await apiGet('saveUnitAjk',{token:state.token,unitId:UNIT_OVERVIEW_ID,tahun:UNIT_OVERVIEW_YEAR,noKp,jawatan},60000);
    // Update the local table from the server response instead of rereading all tabs.
    const appointed={...candidate,AJK_ID:d.ajkId||'',JAWATAN:jawatan,STATUS:'AKTIF'};
    if(!UNIT_AJK_DATA)UNIT_AJK_DATA={candidates:[],ajk:[]};
    UNIT_AJK_DATA.ajk=[...(UNIT_AJK_DATA.ajk||[]),appointed];
    UNIT_AJK_DATA.candidates=(UNIT_AJK_DATA.candidates||[]).filter(x=>String(x.NO_KP)!==noKp);
    if(UNIT_OVERVIEW_DATA){UNIT_OVERVIEW_DATA.ajk=[...(UNIT_OVERVIEW_DATA.ajk||[]),appointed];UNIT_OVERVIEW_DATA.stats=UNIT_OVERVIEW_DATA.stats||{};UNIT_OVERVIEW_DATA.stats.jumlahAJK=(UNIT_OVERVIEW_DATA.stats.jumlahAJK||0)+1;}
    UNIT_AJK_SELECTED_KP='';
    if($('unitAjkPositionSelect'))$('unitAjkPositionSelect').value='';
    renderUnitAjkCurrent_();renderUnitAjkCandidates_();
    const st=UNIT_OVERVIEW_DATA?.stats||{};
    if($('unitOverviewStats'))$('unitOverviewStats').innerHTML=`<div><b>${st.jumlahAhli||0}</b><small>Jumlah Ahli</small></div><div><b>${st.jumlahAJK||UNIT_AJK_DATA.ajk.length}</b><small>AJK</small></div><div><b>${st.jumlahMingguDirekodkan||0}</b><small>Minggu Direkodkan</small></div><div><b>${(UNIT_OVERVIEW_DATA?.minggu||[]).filter(x=>x.ADA_REKOD).length?Math.round((UNIT_OVERVIEW_DATA.minggu||[]).filter(x=>x.ADA_REKOD).reduce((a,x)=>a+x.PERATUS,0)/(UNIT_OVERVIEW_DATA.minggu||[]).filter(x=>x.ADA_REKOD).length):0}%</b><small>Purata Kehadiran</small></div>`;
    if($('unitAjkStatus'))$('unitAjkStatus').textContent=d.message||'Pelantikan berjaya disimpan.';
    toast(d.message||'Pelantikan AJK berjaya disimpan.');
  }catch(e){
    if($('unitAjkStatus'))$('unitAjkStatus').textContent=e.message||'Gagal menyimpan pelantikan.';
    toast(e.message||'Gagal menyimpan pelantikan AJK.');
  }finally{
    if(button){button.textContent='▣ Simpan Pelantikan';updateUnitAjkSaveButton_();}
  }
}
async function loadUnitOverviewDataOnly_(){
  if(!UNIT_OVERVIEW_ID)return;
  try{
    const d=await apiGet('getUnitOverview',{token:state.token,unitId:UNIT_OVERVIEW_ID,tahun:UNIT_OVERVIEW_YEAR});
    UNIT_OVERVIEW_DATA=d;const st=d.stats||{};
    if($('unitOverviewStats'))$('unitOverviewStats').innerHTML=`<div><b>${st.jumlahAhli||0}</b><small>Jumlah Ahli</small></div><div><b>${st.jumlahAJK||0}</b><small>AJK</small></div><div><b>${st.jumlahMingguDirekodkan||0}</b><small>Minggu Direkodkan</small></div><div><b>${(d.minggu||[]).filter(x=>x.ADA_REKOD).length?Math.round((d.minggu||[]).filter(x=>x.ADA_REKOD).reduce((a,x)=>a+x.PERATUS,0)/(d.minggu||[]).filter(x=>x.ADA_REKOD).length):0}%</b><small>Purata Kehadiran</small></div>`;
    renderUnitOverviewAjk_(d.ajk||[]);
  }catch(e){console.warn('Gagal menyegarkan ringkasan unit selepas pelantikan AJK:',e);}
}
function unitPrintEsc_(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function unitPrintStatus_(value){const s=String(value||'').toUpperCase();return s==='HADIR'?'✓ Hadir':s==='TIDAK HADIR'?'✕ Tidak Hadir':s==='BERSEBAB'?'Bersebab':s==='CUTI'?'Cuti':'–';}
function unitPrintDate_(v){if(!v)return '-';const d=new Date(v);return isNaN(d.getTime())?unitPrintEsc_(v):d.toLocaleDateString('ms-MY');}
function unitPrintHeader_(title,d){return `<header><div class="brandline">${activityEsc_(getAppName_())} • SISTEM KOKURIKULUM</div><h1>${unitPrintEsc_(title)}</h1><h2>${unitPrintEsc_(d.unit?.NAMA_UNIT||'Unit Kokurikulum')}</h2><p>Tahun: ${unitPrintEsc_(d.tahun||UNIT_OVERVIEW_YEAR)} · Dijana pada ${new Date().toLocaleDateString('ms-MY')}</p></header>`;}
function unitPrintTable_(headers,rows){return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${unitPrintEsc_(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${cell===null||cell===undefined?'':String(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function unitPrintSection_(title,content){return `<section><h3>${unitPrintEsc_(title)}</h3>${content||'<p>Tiada rekod.</p>'}</section>`;}
function unitPrintWeeks_(d){return unitPrintTable_(['Minggu','Tarikh','Perjumpaan','Ahli','Hadir','Tidak Hadir','Bersebab','Cuti','Kehadiran'],(d.minggu||[]).map(r=>[r.MINGGU,unitPrintDate_(r.TARIKH),unitPrintEsc_(r.NO_PERJUMPAAN||'-'),r.TOTAL,r.HADIR,r.TIDAK_HADIR,r.BERSEBAB,r.CUTI,`${r.PERATUS}%`].map(x=>x===undefined?'–':x)));}
function unitPrintAjk_(d){const rows=sortUnitAjkRows_(d.ajk||[]).map((r,i)=>[i+1,unitPrintEsc_(r.NAMA),unitPrintEsc_(r.JAWATAN),unitPrintEsc_(r.TINGKATAN),unitPrintEsc_(r.KELAS),unitPrintEsc_(r.STATUS||'AKTIF')]);return rows.length?unitPrintTable_(['#','Nama','Jawatan','Tingkatan','Kelas','Status'],rows):'<p>Belum ada rekod AJK untuk unit ini.</p>';}
function unitPrintMembers_(d){const genderRank=v=>{const g=String(v||'').trim().toUpperCase();return g==='L'?0:g==='P'?1:2;};const sorted=[...(d.ahli||[])].sort((a,b)=>String(a.KELAS||'Tanpa kelas').localeCompare(String(b.KELAS||'Tanpa kelas'),'ms',{numeric:true})||genderRank(a.JANTINA)-genderRank(b.JANTINA)||String(a.NAMA||'').localeCompare(String(b.NAMA||''),'ms'));const rows=sorted.map((r,i)=>[i+1,unitPrintEsc_(r.NAMA),unitPrintEsc_(String(r.JANTINA||'').toUpperCase()==='L'?'Lelaki':String(r.JANTINA||'').toUpperCase()==='P'?'Perempuan':r.JANTINA),unitPrintEsc_(r.TINGKATAN),unitPrintEsc_(r.KELAS),unitPrintEsc_(r.STATUS||'AKTIF')]);return rows.length?unitPrintTable_(['#','Nama','Jantina','Tingkatan','Kelas','Status'],rows):'<p>Tiada ahli aktif.</p>'; }
function unitPrintMemberAttendance_(d){const weeks=Array.from({length:15},(_,i)=>i+1);const rows=(d.ahli||[]).map(r=>[unitPrintEsc_(r.NAMA),unitPrintEsc_(r.KELAS),...weeks.map(w=>unitPrintEsc_(unitPrintStatus_((r.MINGGU||{})[w]?.STATUS)))]);return rows.length?unitPrintTable_(['Murid','Kelas',...weeks.map(w=>'M'+w)],rows):'<p>Tiada data kehadiran ahli.</p>';}
function openUnitPrintWindow_(title,content,landscape=false){
  if(window.__EKOSSTA_CLEAN_PRIVACY_HTML__)content=window.__EKOSSTA_CLEAN_PRIVACY_HTML__(content);
  const w=window.open('','_blank');if(!w)return toast('Popup disekat. Benarkan pop-up untuk laman '+getAppName_()+'.');
  const html=`<!doctype html><html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${unitPrintEsc_(title)}</title><style>
  @page{size:A4 ${landscape?'landscape':'portrait'};margin:12mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#edf1e8;color:#17251e;font:10pt Arial,sans-serif}.toolbar{position:sticky;top:0;background:#101714;color:#edf4e9;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:2px solid #d8e267}.toolbar button{padding:9px 14px;border:1px solid #d8e267;background:#d8e267;color:#101714;font-weight:bold;cursor:pointer}.sheet{background:#fff;max-width:1100px;margin:18px auto;padding:24px;box-shadow:0 2px 10px #0002}header{text-align:center;border-bottom:2px solid #035a52;padding-bottom:12px;margin-bottom:18px}.brandline{font-size:9pt;font-weight:700;letter-spacing:.12em;color:#035a52}h1{font-size:18pt;margin:8px 0}header h2{font-size:14pt;margin:0 0 6px}header p{font-size:9pt;margin:0;color:#52645a}section{margin:18px 0 22px}h3{font-size:12pt;margin:0 0 8px;padding-bottom:5px;border-bottom:1px solid #88a59a;color:#035a52}table{width:100%;border-collapse:collapse;font-size:8.5pt}th,td{border:1px solid #b5c2b9;padding:6px 7px;text-align:left;vertical-align:top}th{background:#163027;color:#d8e267;font-size:8pt;letter-spacing:.04em}tbody tr:nth-child(even){background:#f2f5ef}.table-wrap{overflow:visible}.hint{font-size:9pt;color:#d8e267}@media print{html,body{background:#fff!important}.toolbar{display:none!important}.sheet{max-width:none;margin:0;padding:0;box-shadow:none}section{break-inside:auto}tr{break-inside:avoid}th{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  </style></head><body><div class="toolbar"><div><strong>${activityEsc_(getAppName_())} • ${unitPrintEsc_(title)}</strong><div class="hint">Pilih Cetak / Simpan PDF untuk menghasilkan salinan.</div></div><button type="button" onclick="window.print()">Cetak / Simpan PDF</button></div><main class="sheet">${content}</main></body></html>`;
  w.document.open();w.document.write(html);w.document.close();w.focus();
}
function printUnitOverview_(kind='unit'){
  const d=UNIT_OVERVIEW_DATA;if(!d)return toast('Muat butiran unit terlebih dahulu.');
  let title='Senarai Ahli Unit';let content='';let landscape=false;
  if(kind==='attendance'){
    title='Rekod Kehadiran Mingguan';
    content=unitPrintHeader_(title,d)+unitPrintSection_('Rekod Kehadiran Minggu 1–15',unitPrintWeeks_(d));
    landscape=true;
  }else if(kind==='member-attendance'){
    title='Kehadiran Setiap Ahli';
    content=unitPrintHeader_(title,d)+unitPrintSection_('Kehadiran Setiap Ahli (Minggu 1–15)',unitPrintMemberAttendance_(d));
    landscape=true;
  }else if(kind==='ajk'){
    title='Senarai AJK Unit';
    content=unitPrintHeader_(title,d)+unitPrintSection_('Jawatankuasa / AJK',unitPrintAjk_(d));
  }else{
    title='Senarai Ahli Unit';
    content=unitPrintHeader_(title,d)+unitPrintSection_('Senarai Ahli Unit',unitPrintMembers_(d));
  }
  openUnitPrintWindow_(title,content,landscape);
}
function printUnitAjkPage_(){
  const d=UNIT_AJK_DATA;if(!d)return toast('Muatkan senarai AJK terlebih dahulu.');
  const data={unit:d.unit||{},tahun:d.tahun||UNIT_OVERVIEW_YEAR,ajk:d.ajk||[]};
  const content=unitPrintHeader_('Senarai AJK Unit',data)+unitPrintSection_('Jawatankuasa / AJK',unitPrintAjk_(data));
  openUnitPrintWindow_('Senarai AJK Unit',content,false);
}

/* =========================================================
   V2.4 KEHADIRAN FRONTEND
========================================================= */
let ATT_ROWS=[];
let ATT_UNITS=[];
function attYear_(){return String(new Date().getFullYear());}
function attDate_(){return new Date().toISOString().slice(0,10);}
function attEsc_(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function attSetKpi_(){
  const rows=ATT_ROWS||[]; const total=rows.length; const hadir=rows.filter(r=>r.STATUS==='HADIR').length; const tidak=rows.filter(r=>r.STATUS==='TIDAK HADIR').length;
  const pct=total?Math.round(hadir/total*100):0;
  if($('attKpiJumlah'))$('attKpiJumlah').textContent=total;
  if($('attKpiHadir'))$('attKpiHadir').textContent=hadir;
  if($('attKpiTidak'))$('attKpiTidak').textContent=tidak;
  if($('attKpiPeratus'))$('attKpiPeratus').textContent=pct+'%';
}
function attFillUnits_(units,selectId,placeholder){
  const el=$(selectId);if(!el)return;const current=el.value;
  el.innerHTML=`<option value="">${placeholder}</option>`+(units||[]).map(u=>`<option value="${attEsc_(u.UNIT_ID)}">${attEsc_(u.NAMA_UNIT)}</option>`).join('');
  if(current)el.value=current;
}
function attendanceCategory_(v){return String(v||'').trim().toUpperCase().replace(/\s*\/\s*/g,' / ').replace(/\s+/g,' ');}
function updateAttendanceUnitFilter_(){
  const category=String($('attCategoryFilter')?.value||'');
  const current=String($('attUnit')?.value||'');
  const filtered=ATT_UNITS.filter(u=>!category||attendanceCategory_(u.KATEGORI)===attendanceCategory_(category));
  const el=$('attUnit');if(!el)return;
  el.innerHTML='<option value="">-- Pilih Unit --</option>'+filtered.map(u=>`<option value="${attEsc_(u.UNIT_ID)}">${attEsc_(u.NAMA_UNIT)}</option>`).join('');
  if(filtered.some(u=>String(u.UNIT_ID)===current))el.value=current;
  else {el.value='';if($('attendanceEntryPanel'))$('attendanceEntryPanel').hidden=true;ATT_ROWS=[];attSetKpi_();}
}
async function loadAttendancePage(){
  const y=$('attTahun');const d=$('attTarikh');if(y&&!y.value)y.value=attYear_();if(d&&!d.value)d.value=attDate_();
  try{const data=await apiGet('getUnit',{token:state.token});ATT_UNITS=(data.data||[]).filter(u=>String(u.STATUS||'').toUpperCase()==='AKTIF');updateAttendanceUnitFilter_();attFillUnits_(ATT_UNITS,'attRecordUnit','Semua Unit');await loadAttendanceRecords();}catch(e){toast(e.message)}
}
async function loadAttendanceForm(){
  const unit=$('attUnit')?.value,tahun=$('attTahun')?.value,tarikh=$('attTarikh')?.value,minggu=$('attMinggu')?.value;
  if(!unit||!tahun||!tarikh)return toast('Pilih unit, tahun dan tarikh dahulu.');
  const b=$('attLoadBtn');b.disabled=true;b.textContent='Memuatkan...';
  try{
    const d=await apiGet('getAttendanceForm',{token:state.token,unitId:unit,tahun,tarikh});
    if($('attMinggu')&&!minggu&&d.minggu)$('attMinggu').value=d.minggu;
    if($('attNoPerjumpaan'))$('attNoPerjumpaan').value=d.noPerjumpaan||'';
    ATT_ROWS=(d.members||[]).map(x=>({...x}));renderAttendanceTable_();
    $('attendanceEntryPanel').hidden=false;$('attSaveBtn').disabled=!ATT_ROWS.length;$('attFormResult').textContent=`${ATT_ROWS.length} ahli aktif • Perjumpaan ${d.noPerjumpaan||'-'}`;attSetKpi_();
  }catch(e){toast(e.message);$('attendanceEntryPanel').hidden=true}finally{b.disabled=false;b.textContent='Muat Senarai Ahli'}
}
function renderAttendanceTable_(){
  const wrap=$('attendanceTableWrap');if(!wrap)return;
  if(!ATT_ROWS.length){wrap.innerHTML='<div class="empty">Tiada ahli aktif ditemui untuk unit dan tahun ini.</div>';return;}
  const rows=ATT_ROWS.map((r,i)=>`<tr data-att-row="${i}"><td>${i+1}</td><td><b>${attEsc_(r.NAMA)}</b></td><td>${attEsc_(r.KELAS||'-')}</td><td>${attEsc_(r.JANTINA||'-')}</td><td><select class="att-status" data-index="${i}"><option>HADIR</option><option>TIDAK HADIR</option><option>BERSEBAB</option><option>CUTI</option></select></td><td><input class="att-note" data-index="${i}" value="${attEsc_(r.CATATAN||'')}" placeholder="Catatan"></td></tr>`).join('');
  wrap.innerHTML=`<table class="attendance-table"><thead><tr><th>#</th><th>Murid</th><th>Kelas</th><th>Jantina</th><th>Status</th><th>Catatan</th></tr></thead><tbody>${rows}</tbody></table>`;
  wrap.querySelectorAll('.att-status').forEach(e=>{e.value=ATT_ROWS[Number(e.dataset.index)].STATUS||'HADIR';e.addEventListener('change',()=>{ATT_ROWS[Number(e.dataset.index)].STATUS=e.value;attSetKpi_()})});
  wrap.querySelectorAll('.att-note').forEach(e=>e.addEventListener('input',()=>{ATT_ROWS[Number(e.dataset.index)].CATATAN=e.value}));
}
function bulkAttendanceStatus(status){ATT_ROWS.forEach(r=>r.STATUS=status);renderAttendanceTable_();attSetKpi_()}
async function saveAttendance(){
  if(!ATT_ROWS.length)return toast('Tiada senarai murid untuk disimpan.');
  const minggu=$('attMinggu')?.value;if(!minggu)return toast('Masukkan Minggu Persekolahan.');
  const b=$('attSaveBtn');b.disabled=true;b.textContent='Menyimpan...';
  try{const p={token:state.token,unitId:$('attUnit').value,tahun:$('attTahun').value,tarikh:$('attTarikh').value,minggu,noPerjumpaan:$('attNoPerjumpaan').value,members:JSON.stringify(ATT_ROWS.map(r=>({NO_KP:r.NO_KP,STATUS:r.STATUS||'HADIR',CATATAN:r.CATATAN||''})))};const d=await apiGet('saveAttendance',p);$('attFormResult').textContent=d.message||'Berjaya.';toast(d.message||'Kehadiran berjaya disimpan.');await loadAttendanceRecords();}catch(e){toast(e.message)}finally{b.disabled=false;b.textContent='Simpan Kehadiran'}
}
async function loadAttendanceRecords(){
  if(!$('attendanceRecordsWrap'))return;
  try{const p={token:state.token,tahun:$('attTahun')?.value||attYear_(),unitId:$('attRecordUnit')?.value||'',minggu:$('attRecordMinggu')?.value||''};const d=await apiGet('getAttendanceRecords',p);renderAttendanceRecords_(d.data||[]);}catch(e){toast(e.message)}
}
function renderAttendanceRecords_(rows){
  const wrap=$('attendanceRecordsWrap');if(!wrap)return;if(!rows.length){wrap.innerHTML='<div class="empty">Belum ada rekod kehadiran.</div>';return;}
  wrap.innerHTML=`<table class="attendance-table"><thead><tr><th>Unit</th><th>Tarikh</th><th>Minggu</th><th>Perjumpaan</th><th>Hadir</th><th>Tidak Hadir</th><th>Kehadiran</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${attEsc_(r.NAMA_UNIT)}</td><td>${new Date(r.TARIKH).toLocaleDateString('ms-MY')}</td><td>${attEsc_(r.MINGGU)}</td><td>${attEsc_(r.NO_PERJUMPAAN)}</td><td>${r.HADIR}</td><td>${r.TIDAK_HADIR}</td><td><b>${r.PERATUS}%</b></td></tr>`).join('')}</tbody></table>`;
}


document.addEventListener('click',e=>{
  if(e.target && e.target.id==='unitOverviewBackBtn')showPage('unit');
  if(e.target && e.target.id==='unitOverviewRefreshBtn')loadUnitOverview();
  if(e.target && e.target.id==='unitAjkBackBtn')showPage('unit-overview');
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('unitMemberModal')&&!$('unitMemberModal').hidden)closeAddUnitMemberModal_();});
document.addEventListener('DOMContentLoaded',init);


let AKTIVITI_PESERTA_STATE={aktivitiId:'',aktiviti:null,rows:[],classes:[],canManage:false};
let AKTIVITI_PESERTA_LOAD_SEQ_=0;
async function openAktivitiPeserta(id){
  const nextId=String(id||'').trim();
  if(!nextId){toast('ID aktiviti tidak sah.');return;}
  // Reset state immediately. Never let checkbox state from the previous event
  // remain visible while the next event is being fetched.
  state.currentActivityId=nextId;
  AKTIVITI_PESERTA_STATE={aktivitiId:nextId,aktiviti:null,rows:[],classes:[],canManage:false};
  if($('activityParticipantsTitle'))$('activityParticipantsTitle').textContent='Memuatkan peserta...';
  if($('activityParticipantsMeta'))$('activityParticipantsMeta').textContent='';
  if($('activityParticipantsCount'))$('activityParticipantsCount').textContent='Memuatkan senarai peserta...';
  if($('activityParticipantsTableWrap'))$('activityParticipantsTableWrap').innerHTML='<div class="empty">Memuatkan peserta bagi aktiviti yang dipilih...</div>';
  showPage('activity-participants');
}
async function loadAktivitiPesertaPage(requestedActivityId){
  const id=String(requestedActivityId||state.currentActivityId||'').trim();
  if(!id){showPage('activity');return;}
  const requestSeq=++AKTIVITI_PESERTA_LOAD_SEQ_;
  if($('activityParticipantsTableWrap'))$('activityParticipantsTableWrap').innerHTML='<div class="empty">Memuatkan peserta bagi aktiviti yang dipilih...</div>';
  try{
    const d=await apiGet('getAktivitiPeserta',{token:state.token,aktivitiId:id});
    // A slow response for Event A must not overwrite Event B after navigation.
    if(requestSeq!==AKTIVITI_PESERTA_LOAD_SEQ_ || String(state.currentActivityId||'').trim()!==id || CURRENT_PAGE!=='activity-participants')return;
    const incoming=Array.isArray(d.data)?d.data:[];
    AKTIVITI_PESERTA_STATE={
      aktivitiId:id,
      aktiviti:d.aktiviti||null,
      canManage:d.canManage!==false,
      rows:incoming.map(r=>({...r,selected:r.selected===true||String(r.selected).toLowerCase()==='true',peranan:String(r.peranan||r.PERANAN||'PESERTA')})),
      classes:Array.isArray(d.classes)?d.classes:[]
    };
    // Check the returned ID explicitly. If a backend response is stale or mismatched,
    // do not render its checkboxes under another activity's heading.
    const returnedId=String(AKTIVITI_PESERTA_STATE.aktiviti?.AKTIVITI_ID||'').trim();
    if(returnedId && returnedId!==id){
      AKTIVITI_PESERTA_STATE={aktivitiId:id,aktiviti:null,rows:[],classes:[]};
      throw new Error('Respons peserta tidak sepadan dengan aktiviti yang dipilih. Muat semula dan cuba lagi.');
    }
    const a=AKTIVITI_PESERTA_STATE.aktiviti||{};
    if($('activityParticipantsTitle'))$('activityParticipantsTitle').textContent=(a.NAMA_AKTIVITI||'Daftar Peserta')+(AKTIVITI_PESERTA_STATE.canManage?'':' — Paparan Sahaja');
    if($('activityParticipantsMeta'))$('activityParticipantsMeta').textContent=[activityDate_(a.TARIKH),a.TEMPAT,a.PERINGKAT,AKTIVITI_PESERTA_STATE.canManage?'':'Rekod diuruskan oleh guru lain; anda boleh melihat senarai sahaja.'].filter(Boolean).join(' • ');
    const participantSave=$('activityParticipantsSaveBtn');if(participantSave)participantSave.hidden=!AKTIVITI_PESERTA_STATE.canManage;
    const sel=$('activityParticipantClass');if(sel){sel.innerHTML='<option value="">Semua Kelas</option>'+AKTIVITI_PESERTA_STATE.classes.map(x=>`<option value="${activityEsc_(x)}">${activityEsc_(x)}</option>`).join('');sel.value='';}
    if($('activityParticipantSearch'))$('activityParticipantSearch').value='';renderAktivitiPesertaTable_();
  }catch(e){
    if(requestSeq!==AKTIVITI_PESERTA_LOAD_SEQ_ || String(state.currentActivityId||'').trim()!==id)return;
    if($('activityParticipantsTitle'))$('activityParticipantsTitle').textContent='Daftar Peserta';
    if($('activityParticipantsTableWrap'))$('activityParticipantsTableWrap').innerHTML=`<div class="empty">${activityEsc_(e.message||'Gagal memuatkan peserta.')}</div>`;
    toast(e.message||'Gagal memuatkan peserta.');
  }
}
function renderAktivitiPesertaTable_(){
  const wrap=$('activityParticipantsTableWrap');if(!wrap)return;
  const cls=String($('activityParticipantClass')?.value||'');const q=String($('activityParticipantSearch')?.value||'').trim().toLowerCase();
  const rows=AKTIVITI_PESERTA_STATE.rows.filter(r=>(!cls||String(r.KELAS)===cls)&&(!q||String(r.NAMA).toLowerCase().includes(q)||String(r.NO_KP).toLowerCase().includes(q)));
  const selected=AKTIVITI_PESERTA_STATE.rows.filter(r=>r.selected===true).length;if($('activityParticipantsCount'))$('activityParticipantsCount').textContent=AKTIVITI_PESERTA_STATE.canManage?`${selected} peserta dipilih untuk aktiviti ini`:`${selected} peserta direkodkan • paparan sahaja`;
  wrap.innerHTML=`<table class="activity-participant-table"><thead><tr><th>PILIH</th><th>NAMA MURID</th><th>TINGKATAN</th><th>KELAS</th><th>JANTINA</th><th>PERANAN</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td><input class="activity-participant-check" type="checkbox" data-kp="${activityEsc_(r.NO_KP)}" ${r.selected?'checked':''} ${AKTIVITI_PESERTA_STATE.canManage?'':'disabled'}></td><td><b>${activityEsc_(r.NAMA)}</b></td><td>${activityEsc_(r.TINGKATAN||'-')}</td><td>${activityEsc_(r.KELAS||'-')}</td><td>${activityEsc_(r.JANTINA||'-')}</td><td><input class="activity-participant-role" data-kp="${activityEsc_(r.NO_KP)}" value="${activityEsc_(r.peranan||'PESERTA')}" ${r.selected&&AKTIVITI_PESERTA_STATE.canManage?'':'disabled'}></td></tr>`).join(''):'<tr><td colspan="6"><div class="empty">Tiada murid ditemui.</div></td></tr>'}</tbody></table>`;
  wrap.querySelectorAll('.activity-participant-check').forEach(ch=>ch.addEventListener('change',e=>{const r=AKTIVITI_PESERTA_STATE.rows.find(x=>String(x.NO_KP)===String(e.target.dataset.kp));if(!r)return;r.selected=e.target.checked;if(!r.selected)r.peranan='PESERTA';renderAktivitiPesertaTable_();}));
  wrap.querySelectorAll('.activity-participant-role').forEach(inp=>inp.addEventListener('input',e=>{const r=AKTIVITI_PESERTA_STATE.rows.find(x=>String(x.NO_KP)===String(e.target.dataset.kp));if(r)r.peranan=e.target.value;}));
}
async function saveAktivitiPeserta(){
  const id=String(state.currentActivityId||'').trim();
  if(!id)return;
  if(AKTIVITI_PESERTA_STATE.aktivitiId!==id){toast('Senarai peserta belum dimuatkan untuk aktiviti ini. Sila tunggu dan cuba semula.');return;}
  const selected=AKTIVITI_PESERTA_STATE.rows.filter(r=>r.selected===true).map(r=>({NO_KP:String(r.NO_KP||'').trim(),PERANAN:String(r.peranan||'PESERTA').trim()||'PESERTA'})).filter(r=>r.NO_KP);
  const b=$('activityParticipantsSaveBtn');if(b){b.disabled=true;b.textContent='Menyimpan...';}
  try{
    const d=await apiGet('saveAktivitiPeserta',{token:state.token,aktivitiId:id,peserta:JSON.stringify(selected)});
    toast(d.message||'Peserta berjaya disimpan.');
    if(String(state.currentActivityId||'').trim()===id && CURRENT_PAGE==='activity-participants')await loadAktivitiPesertaPage(id);
  }catch(e){toast(e.message||'Gagal menyimpan peserta.');}
  finally{if(b){b.disabled=false;b.textContent='Simpan Peserta';}}
}


/* =========================================================
   RICH TEXT EDITOR — PATCH V2.6
   Simpan metadata/kandungan melalui Apps Script; print-to-PDF
   dilakukan melalui dialog cetak pelayar.
========================================================= */
let EDITOR_DOCUMENT_ID = '';
let DOCUMENT_ACTIVITY_ROWS_=[];
let DOCUMENT_ROWS_CACHE_=[];
let DOCUMENT_LINKED_ACTIVITY_ID_='';
let DOCUMENT_LINKED_ACTIVITY_NAME_='';
let REPORT_WORKFLOW_MODE_='form';
let REPORT_FORM_AUTHOR_NAME_='';
let REPORT_FORM_KIND_='activity';
let REPORT_STANDALONE_PARTICIPANT_MODE_='unset'; // unset | none | participants | activity
let REPORT_STANDALONE_SELECTED_STUDENTS_=[];
let REPORT_STANDALONE_STUDENT_ROWS_=[];
let REPORT_STANDALONE_SELECTED_IDS_=new Set();

function editorEl_(){return $('docEditor');}
function isSharedTemplateClient_(r){
  const type=String(r?.TYPE||'');
  const title=String(r?.TITLE||'');
  return (type==='SURAT_KEBENARAN'&&/templat surat kebenaran ibu bapa/i.test(title)) ||
    (type==='LAPORAN'&&/(?:one\s*page\s*report|templat laporan aktiviti)/i.test(title)) ||
    (type==='SURAT_RASMI'&&/templat surat rasmi/i.test(title));
}
function updateDocumentTypeUi_(){
  const type=String($('docType')?.value||'LAIN');
  const title=String($('docTitle')?.value||'');
  const isTemplate=isSharedTemplateClient_({TYPE:type,TITLE:title});
  const mode=REPORT_WORKFLOW_MODE_||'form';
  const formMode=mode==='form';
  const templateMode=mode==='template';
  const panel=$('docLinkedActivityNote');
  const photoPanel=$('reportPhotoUploadPanel');
  const participantPanel=$('reportStandaloneParticipantsPanel');
  const form=$('reportFillingForm');
  const meta=$('docEditorMetaPanel');
  const toolbar=$('docEditorToolbarPanel');
  const saved=$('savedDocumentsPanel');
  const formActions=$('reportFormHeaderActions');
  const templateActions=$('reportTemplateHeaderActions');
  const previewHeading=$('reportPreviewHeading');
  if(form)form.hidden=!formMode;
  if(participantPanel)participantPanel.hidden=!(formMode&&REPORT_FORM_KIND_==='meeting'&&!String(DOCUMENT_LINKED_ACTIVITY_ID_||'').trim()&&type==='LAPORAN');
  if(meta)meta.hidden=!templateMode;
  if(toolbar)toolbar.hidden=!templateMode;
  if(saved)saved.hidden=!templateMode;
  const savedTitle=$('savedDocumentsTitle');if(savedTitle)savedTitle.textContent=templateMode?'Templat Tersimpan':'Dokumen Tersimpan';
  if(formActions)formActions.hidden=!formMode;
  if(templateActions)templateActions.hidden=!templateMode;
  if(previewHeading)previewHeading.hidden=templateMode;
  if(panel){panel.hidden=!(formMode&&type==='LAPORAN'&&DOCUMENT_LINKED_ACTIVITY_ID_);panel.textContent=DOCUMENT_LINKED_ACTIVITY_ID_?('Dipautkan kepada aktiviti: '+(DOCUMENT_LINKED_ACTIVITY_NAME_||DOCUMENT_LINKED_ACTIVITY_ID_)):'';}
  if(photoPanel)photoPanel.hidden=!(formMode&&type==='LAPORAN'&&!isTemplate);
  if(editorEl_())editorEl_().setAttribute('contenteditable',templateMode?'true':'false');
  const h=$('reportWorkspaceTitle'),desc=$('reportWorkspaceDescription');
  if(h)h.textContent=formMode?(REPORT_FORM_KIND_==='meeting'?'Isi Laporan Perjumpaan':'Isi Laporan Aktiviti'):'Edit Templat';
  if(desc)desc.textContent=formMode?(REPORT_FORM_KIND_==='meeting'?'Lengkapkan objektif, ringkasan dan impak untuk laporan umum tanpa pautan aktiviti. Gambar adalah pilihan.':'Lengkapkan objektif, ringkasan dan impak. Maklumat aktiviti dimasukkan secara automatik; senarai peserta dipaparkan pada halaman kedua.'):'ADMIN sahaja: kemas kini templat laporan atau surat. Perubahan akan menjadi templat aktif untuk janaan seterusnya.';
  const help=$('reportFormHelp');
  if(help)help.textContent=REPORT_FORM_KIND_==='meeting'&&!String(DOCUMENT_LINKED_ACTIVITY_ID_||'').trim()?'Laporan ini tidak dipautkan kepada aktiviti/acara. Pilih + Peserta untuk menambah nama murid daripada data kelas sebenar, atau Tiada Peserta untuk menyimpan laporan utama sahaja. Objektif, ringkasan dan impak wajib dilengkapkan; gambar adalah pilihan.':'Maklumat aktiviti dan senarai peserta diambil daripada rekod aktiviti yang dipilih. Lengkapkan objektif, ringkasan dan impak; gambar adalah pilihan. Senarai peserta aktiviti dipaparkan pada halaman kedua.';
  const saveBtn=$('docSaveBtn');
  if(saveBtn)saveBtn.textContent=formMode?'Simpan Laporan':(isTemplate?'Simpan Templat':'Simpan Dokumen');
  const printBtn=$('docPrintBtn');if(printBtn)printBtn.textContent=formMode?'Cetak Pratonton A4':'Cetak Templat A4';
  updateStandaloneParticipantControls_();
}
function newEditorDocument_(){
  if(REPORT_WORKFLOW_MODE_==='template'&&state.user?.role!=='ADMIN')return toast('Edit Templat hanya untuk ADMIN.');
  EDITOR_DOCUMENT_ID='';DOCUMENT_LINKED_ACTIVITY_ID_='';DOCUMENT_LINKED_ACTIVITY_NAME_='';REPORT_PHOTO_CACHE_={};resetReportPhotoInputs_();
  if(REPORT_WORKFLOW_MODE_==='template'){
    if($('docTitle'))$('docTitle').value='One Page Report';
    if($('docType'))$('docType').value='LAPORAN';
    if(editorEl_())editorEl_().innerHTML=brandDocumentHtml_(defaultOnePageReportTemplate_());
    if($('docEditorStatus'))$('docEditorStatus').textContent='Templat baharu belum disimpan. Sesiapa yang menjana laporan akan menggunakan templat ini selepas disimpan.';
  }else{
    REPORT_FORM_KIND_='meeting';REPORT_FORM_AUTHOR_NAME_=reportPreparedByName_();
    if($('docTitle'))$('docTitle').value='';if($('docType'))$('docType').value='LAPORAN';
    if(editorEl_())editorEl_().innerHTML=brandDocumentHtml_(defaultOnePageReportTemplate_());
    setReportFormValues_({title:'Laporan Perjumpaan Mingguan',preparedBy:REPORT_FORM_AUTHOR_NAME_,objective:'',summary:'',impact:''});
    ensureReportPhotoSlots_();
    if($('docEditorStatus'))$('docEditorStatus').textContent='Laporan perjumpaan baharu tanpa pautan aktiviti. Lengkapkan objektif, ringkasan dan impak; gambar adalah pilihan.';
  }
  updateDocumentTypeUi_();
  if(REPORT_WORKFLOW_MODE_==='form')updateReportPreviewFromForm_();
  editorEl_()?.focus();
}
function runEditorCommand_(cmd){const ed=editorEl_();if(!ed)return;ed.focus();try{document.execCommand(cmd,false,null);}catch(e){toast('Arahan format tidak disokong pelayar.');}}
function applyEditorBlockFormat_(){const ed=editorEl_();if(!ed)return;ed.focus();document.execCommand('formatBlock',false,$('editorBlockFormat')?.value||'p');}
function applyEditorTextColor_(){const ed=editorEl_();if(!ed)return;ed.focus();document.execCommand('foreColor',false,$('editorTextColor')?.value||'#222222');}
function insertEditorLink_(){const url=prompt('Masukkan URL pautan (https://...)');if(!url)return;if(!/^https?:\/\//i.test(url.trim()))return toast('Pautan mesti bermula dengan http:// atau https://');editorEl_()?.focus();document.execCommand('createLink',false,url.trim());}
function cleanEditorHtml_(html){
  const t=document.createElement('template');t.innerHTML=String(html||'');
  t.content.querySelectorAll('script,iframe,object,embed,form,button,input,textarea,select').forEach(n=>n.remove());
  t.content.querySelectorAll('*').forEach(n=>{[...n.attributes].forEach(a=>{if(/^on/i.test(a.name)||a.name==='contenteditable')n.removeAttribute(a.name);if(['href','src'].includes(a.name)&&/^\s*javascript:/i.test(a.value))n.removeAttribute(a.name);});});
  return t.innerHTML;
}
function replaceLetterTokens_(template,values){
  let result=String(template||'');
  Object.keys(values||{}).forEach(key=>{
    const token='{{'+key+'}}';
    // split/join replaces every occurrence literally; value may be safe HTML for table slots.
    result=result.split(token).join(String(values[key]==null?'':values[key]));
  });
  return result;
}
function reportHtmlText_(value,placeholder='........................................................'){
  const s=String(value==null?'':value).trim();
  return s?activityEsc_(s).replace(/\r?\n/g,'<br>'):placeholder;
}
function reportPreparedByName_(advisorName=''){
  const currentRole=String(state.user?.role||'').toUpperCase();
  const currentName=String(state.user?.nama||state.user?.name||'').trim();
  const username=String(state.user?.username||'').trim();
  if(currentRole==='GURU')return currentName||advisorName||username||'................................';
  return advisorName||currentName||username||'................................';
}
function setReportFormValues_(values={}){
  if($('reportFormTitle'))$('reportFormTitle').value=String(values.title||$('docTitle')?.value||'');
  if($('reportPreparedByDisplay'))$('reportPreparedByDisplay').value=String(values.preparedBy||REPORT_FORM_AUTHOR_NAME_||'');
  if($('reportObjectiveInput'))$('reportObjectiveInput').value=String(values.objective||'');
  if($('reportSummaryInput'))$('reportSummaryInput').value=String(values.summary||'');
  if($('reportImpactInput'))$('reportImpactInput').value=String(values.impact||'');
  if($('docTitle')&&$('reportFormTitle'))$('docTitle').value=$('reportFormTitle').value;
}
function reportFieldElement_(name){return editorEl_()?.querySelector(`[data-report-field="${name}"]`)||null;}
function updateReportPreviewFromForm_(){
  if(REPORT_WORKFLOW_MODE_!=='form'||!editorEl_())return;
  const title=String($('reportFormTitle')?.value||$('docTitle')?.value||'').trim();
  if($('docTitle'))$('docTitle').value=title;
  const fields=[['OBJEKTIF',$('reportObjectiveInput')?.value],['RINGKASAN',$('reportSummaryInput')?.value],['IMPAK',$('reportImpactInput')?.value]];
  fields.forEach(([key,value])=>{const node=reportFieldElement_(key);if(node)node.innerHTML=reportHtmlText_(value,'................................................................................................');});
}
function addReportObjectiveSection_(html,objectiveToken='{{OBJEKTIF_LAPORAN}}'){
  let out=String(html||'');
  if(/data-report-field=["']OBJEKTIF["']|\{\{OBJEKTIF_LAPORAN\}\}/i.test(out))return out;
  const block='<h3 class="report-section-heading"><span>03</span> OBJEKTIF AKTIVITI / PERJUMPAAN</h3><div class="report-fill-box report-objective-box" data-report-field="OBJEKTIF">'+objectiveToken+'</div>';
  const oldFocus=/<h3[^>]*class=["'][^"']*report-section-heading[^"']*["'][^>]*>\s*<span>03<\/span>\s*TAJUK\s*\/\s*FOKUS PERJUMPAAN[\s\S]*?<\/h3>\s*<div class=["']report-fill-box["']>\s*\{\{TAJUK_FOKUS\}\}\s*<\/div>/i;
  if(oldFocus.test(out))return out.replace(oldFocus,block);
  const marker=/<h3[^>]*class=["'][^"']*report-section-heading[^"']*["'][^>]*>\s*<span>01<\/span>\s*ANALISIS KEHADIRAN AHLI[\s\S]*?<\/h3>/i;
  if(marker.test(out))return out.replace(marker,block+marker.exec(out)[0]);
  const tableEnd=out.indexOf('</table>');
  if(tableEnd>=0)return out.slice(0,tableEnd+8)+block+out.slice(tableEnd+8);
  return block+out;
}
function removeReportKpiStatistics_(html){
  const tpl=document.createElement('template');tpl.innerHTML=String(html||'');
  tpl.content.querySelectorAll('.report-kpi-row').forEach(n=>n.remove());
  return tpl.innerHTML;
}
function ensureReportTemplateForForm_(html){
  let out=removeReportKpiStatistics_(String(html||''));
  out=addReportObjectiveSection_(out);
  if(!/data-report-field=["']RINGKASAN["']|\{\{RINGKASAN_LAPORAN\}\}/i.test(out)){
    out=out.replace(/<div class=["']report-fill-box report-large-fill["']>\s*\{\{RINGKASAN_AKTIVITI\}\}\s*<\/div>/i,'<div class="report-fill-box report-large-fill" data-report-field="RINGKASAN">{{RINGKASAN_LAPORAN}}</div>');
  }
  if(!/data-report-field=["']IMPAK["']|\{\{IMPAK_LAPORAN\}\}/i.test(out)){
    out=out.replace(/<div class=["']report-fill-box report-small-fill["']>\s*\{\{REFLEKSI_IMPAK\}\}\s*<\/div>/i,'<div class="report-fill-box report-small-fill" data-report-field="IMPAK">{{IMPAK_LAPORAN}}</div>');
  }
  // Use a separate report creator token in the signature, without overwriting the assigned advisor field.
  out=out.replace(/<p>Nama:\s*\{\{NAMA_GURU\}\}<\/p>/i,'<p>Nama: {{DISEDIAKAN_OLEH}}</p>');
  return ensureParticipantsAppendixPage_(out);
}
function ensureParticipantsAppendixPage_(html){
  const source=String(html||'');
  if(/class=["'][^"']*report-appendix-page/i.test(source))return source;
  const tpl=document.createElement('template');tpl.innerHTML=source;
  const root=tpl.content.querySelector('.ek-report-document')||tpl.content.firstElementChild;
  if(!root)return source;
  const headings=[...root.querySelectorAll('.report-section-heading, h1, h2, h3, h4')];
  const participantHeading=headings.find(h=>/PESERTA\s*(?:\/|&|DAN)?\s*(?:MURID\s*)?TERLIBAT|MURID\s*TERLIBAT|SENARAI\s*PESERTA/i.test(String(h.textContent||'')));
  if(!participantHeading)return tpl.innerHTML;
  const tables=[...root.querySelectorAll('table.report-data-table, table')];
  const participantTable=tables.find(table=>{
    const heads=[...table.querySelectorAll('thead th')].map(th=>String(th.textContent||'').toUpperCase()).join(' ');
    return /NAMA\s*MURID|PESERTA/.test(heads) && /KELAS/.test(heads);
  }) || tables.find(table=>(participantHeading.compareDocumentPosition(table)&Node.DOCUMENT_POSITION_FOLLOWING)!==0);
  if(!participantTable)return tpl.innerHTML;
  // Capture the original grid/column before detaching nodes, then remove the empty participant column.
  const originalGrid=participantHeading.closest('.report-two-columns');
  const originalColumn=originalGrid?[...originalGrid.children].find(col=>col.contains(participantHeading)||col.contains(participantTable)):participantHeading.parentElement;
  const hint=participantHeading.nextElementSibling&&participantHeading.nextElementSibling.matches('.report-section-hint,p')?participantHeading.nextElementSibling:null;
  const appendix=document.createElement('section');appendix.className='report-appendix-page';
  const appendixHeader=document.createElement('div');appendixHeader.className='report-appendix-header';
  appendixHeader.innerHTML='<div class="report-doc-topline"><span>KOKURIKULUM SEKOLAH</span><span>LAMPIRAN • ONE PAGE REPORT</span></div><h1>SENARAI PESERTA TERLIBAT</h1><p>Senarai peserta yang direkodkan bagi laporan ini.</p>';
  appendix.appendChild(appendixHeader);
  participantHeading.remove();
  if(hint){hint.remove();appendix.appendChild(hint);}
  participantTable.remove();appendix.appendChild(participantTable);
  if(originalColumn){
    const hasContent=String(originalColumn.textContent||'').trim()||originalColumn.querySelector('img,table,input,textarea,select,[data-report-field]');
    if(!hasContent)originalColumn.remove();
  }
  if(originalGrid){
    [...originalGrid.children].forEach(col=>{
      if(!String(col.textContent||'').trim()&&!col.querySelector('img,table,input,textarea,select,[data-report-field]'))col.remove();
    });
    if(originalGrid.children.length<=1)originalGrid.classList.remove('report-two-columns','one-page-fields');
  }
  root.appendChild(appendix);
  return tpl.innerHTML;
}
function isStandaloneMeetingReport_(){
  return REPORT_WORKFLOW_MODE_==='form'&&REPORT_FORM_KIND_==='meeting'&&!String(DOCUMENT_LINKED_ACTIVITY_ID_||'').trim()&&String($('docType')?.value||'LAPORAN')==='LAPORAN';
}
function updateStandaloneParticipantControls_(){
  const panel=$('reportStandaloneParticipantsPanel');
  const active=isStandaloneMeetingReport_();
  if(panel)panel.hidden=!active;
  const add=$('reportAddParticipantsBtn'),none=$('reportNoParticipantsBtn'),status=$('reportParticipantChoiceStatus');
  if(add){add.classList.toggle('primary',REPORT_STANDALONE_PARTICIPANT_MODE_==='participants');add.classList.toggle('secondary',REPORT_STANDALONE_PARTICIPANT_MODE_!=='participants');}
  if(none){none.classList.toggle('primary',REPORT_STANDALONE_PARTICIPANT_MODE_==='none');none.classList.toggle('secondary',REPORT_STANDALONE_PARTICIPANT_MODE_!=='none');}
  if(status){
    if(REPORT_STANDALONE_PARTICIPANT_MODE_==='participants')status.textContent=`${REPORT_STANDALONE_SELECTED_STUDENTS_.length} peserta dipilih. Senarai nama akan dipaparkan pada halaman kedua.`;
    else if(REPORT_STANDALONE_PARTICIPANT_MODE_==='none')status.textContent='Tiada peserta. Laporan utama sahaja akan disimpan dan dicetak.';
    else status.textContent='Pilih + Peserta atau Tiada Peserta sebelum menyimpan laporan.';
  }
}
function reportDocumentRoot_(){const ed=editorEl_();return ed?.querySelector('.ek-report-document')||ed;}
function readStandaloneReportParticipantsFromEditor_(){
  const root=reportDocumentRoot_(),table=root?.querySelector('.report-appendix-page .report-data-table');
  if(!table)return [];
  return [...table.querySelectorAll('tbody tr')].map(tr=>{
    const cells=[...tr.querySelectorAll('td')];
    if(cells.length<3||cells.some(td=>td.hasAttribute('colspan')))return null;
    const name=String(cells[1]?.innerText||cells[1]?.textContent||'').trim();
    const kelas=String(cells[2]?.innerText||cells[2]?.textContent||'').trim();
    if(!name||/tiada peserta|tiada murid|belum ada peserta|tiada rekod/i.test(name))return null;
    return {NO_KP:String(tr.dataset.studentId||''),NAMA:name,KELAS:kelas,PERANAN:String(cells[3]?.innerText||cells[3]?.textContent||'PESERTA').trim()||'PESERTA'};
  }).filter(Boolean);
}
function renderStandaloneParticipantsAppendix_(){
  if(!isStandaloneMeetingReport_())return;
  const ed=editorEl_(),root=reportDocumentRoot_();if(!ed||!root)return;
  root.querySelectorAll('.report-appendix-page').forEach(n=>n.remove());
  if(REPORT_STANDALONE_PARTICIPANT_MODE_!=='participants'||!REPORT_STANDALONE_SELECTED_STUDENTS_.length)return;
  const section=document.createElement('section');section.className='report-appendix-page';
  const rows=REPORT_STANDALONE_SELECTED_STUDENTS_.map((p,i)=>`<tr data-student-id="${activityEsc_(p.NO_KP||'')}"><td>${i+1}</td><td>${activityEsc_(p.NAMA||'-')}</td><td>${activityEsc_(p.KELAS||'-')}</td><td>${activityEsc_(p.PERANAN||'PESERTA')}</td></tr>`).join('');
  section.innerHTML=`<div class="report-appendix-header"><div class="report-doc-topline"><span>KOKURIKULUM SEKOLAH</span><span>LAMPIRAN • LAPORAN UMUM</span></div><h1>SENARAI PESERTA TERLIBAT</h1><p>Senarai nama murid yang dipilih untuk laporan ini.</p></div><table class="report-data-table"><thead><tr><th style="width:8%">BIL.</th><th>NAMA MURID</th><th>KELAS</th><th>PERANAN</th></tr></thead><tbody>${rows}</tbody></table>`;
  root.appendChild(section);
}
function setStandaloneParticipantMode_(mode){
  if(!isStandaloneMeetingReport_())return;
  if(mode==='none'){
    REPORT_STANDALONE_PARTICIPANT_MODE_='none';REPORT_STANDALONE_SELECTED_STUDENTS_=[];REPORT_STANDALONE_SELECTED_IDS_=new Set();
  }else if(mode==='participants'){
    REPORT_STANDALONE_PARTICIPANT_MODE_='participants';
  }
  renderStandaloneParticipantsAppendix_();updateStandaloneParticipantControls_();
}
function closeReportParticipantModal_(){
  const modal=$('reportParticipantModal');if(!modal)return;
  modal.classList.remove('show');document.body.classList.remove('report-participant-modal-open');
  setTimeout(()=>{modal.hidden=true;},170);
}
function renderReportParticipantCandidates_(){
  const wrap=$('reportParticipantListWrap');if(!wrap)return;
  const kelas=String($('reportParticipantClassFilter')?.value||'');
  const q=String($('reportParticipantSearch')?.value||'').trim().toLocaleLowerCase('ms');
  const rows=REPORT_STANDALONE_STUDENT_ROWS_.filter(p=>(!kelas||String(p.KELAS||'')===kelas)&&(!q||[p.NAMA,p.NO_KP,p.KELAS,p.TINGKATAN].some(v=>String(v||'').toLocaleLowerCase('ms').includes(q))));
  if(!rows.length){wrap.innerHTML='<div class="empty report-participant-empty">Tiada murid aktif sepadan dengan pilihan kelas atau carian.</div>';}
  else wrap.innerHTML=rows.map(p=>{
    const id=String(p.NO_KP||''),checked=REPORT_STANDALONE_SELECTED_IDS_.has(id)?' checked':'';
    return `<label class="report-participant-option"><input type="checkbox" data-report-student-id="${activityEsc_(id)}"${checked}><span class="report-participant-name">${activityEsc_(p.NAMA||'-')}<small>${activityEsc_(p.KELAS||'-')}${p.TINGKATAN?' · Tingkatan '+activityEsc_(p.TINGKATAN):''}</small></span><span class="report-participant-check" aria-hidden="true">✓</span></label>`;
  }).join('');
  updateReportParticipantSelectionCount_();
}
function updateReportParticipantSelectionCount_(){
  const el=$('reportParticipantSelectedCount');if(el)el.textContent=`${REPORT_STANDALONE_SELECTED_IDS_.size} murid dipilih`;
  const save=$('reportParticipantSaveBtn');if(save)save.disabled=REPORT_STANDALONE_SELECTED_IDS_.size===0;
}
async function openReportParticipantModal_(){
  if(!isStandaloneMeetingReport_())return toast('Pilihan peserta ini hanya untuk laporan tanpa aktiviti/acara.');
  const modal=$('reportParticipantModal');if(!modal)return toast('Popup peserta tidak ditemui. Muat semula halaman.');
  const status=$('reportParticipantModalStatus'),save=$('reportParticipantSaveBtn');
  const previous=REPORT_STANDALONE_SELECTED_STUDENTS_.slice();
  REPORT_STANDALONE_SELECTED_IDS_=new Set(previous.map(p=>String(p.NO_KP||'')).filter(Boolean));
  if(status)status.textContent='Memuatkan senarai murid sebenar daripada data kelas...';
  if(save)save.disabled=true;
  const list=$('reportParticipantListWrap');if(list)list.innerHTML='<div class="empty report-participant-empty">Memuatkan senarai murid...</div>';
  modal.hidden=false;document.body.classList.add('report-participant-modal-open');requestAnimationFrame(()=>modal.classList.add('show'));
  try{
    const d=await apiGet('getMurid',{token:state.token,allData:true});
    REPORT_STANDALONE_STUDENT_ROWS_=(d.data||[]).filter(p=>String(p.STATUS||'AKTIF').toUpperCase()!=='TIDAK_AKTIF'&&String(p.NO_KP||'').trim()&&String(p.NAMA||'').trim()).sort((a,b)=>String(a.KELAS||'').localeCompare(String(b.KELAS||''),'ms',{numeric:true})||String(a.NAMA||'').localeCompare(String(b.NAMA||''),'ms'));
    // Compatibility for older saved reports which did not persist student IDs: match real records by name and class.
    if(previous.some(p=>!String(p.NO_KP||''))){
      previous.forEach(old=>{if(old.NO_KP)return;const match=REPORT_STANDALONE_STUDENT_ROWS_.find(p=>String(p.NAMA||'').trim().toLocaleLowerCase('ms')===String(old.NAMA||'').trim().toLocaleLowerCase('ms')&&String(p.KELAS||'').trim().toLocaleLowerCase('ms')===String(old.KELAS||'').trim().toLocaleLowerCase('ms'));if(match)REPORT_STANDALONE_SELECTED_IDS_.add(String(match.NO_KP));});
    }
    const select=$('reportParticipantClassFilter'),current=select?.value||'';
    if(select){const classes=[...new Set(REPORT_STANDALONE_STUDENT_ROWS_.map(p=>String(p.KELAS||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ms',{numeric:true}));select.innerHTML='<option value="">Semua kelas</option>'+classes.map(c=>`<option value="${activityEsc_(c)}">${activityEsc_(c)}</option>`).join('');if(classes.includes(current))select.value=current;}
    if(status)status.textContent=REPORT_STANDALONE_STUDENT_ROWS_.length?'Pilih seorang atau beberapa murid. Nama dan kelas diambil terus daripada data sebenar e-KOSSTA.':'Tiada murid aktif ditemui dalam data sistem.';
    renderReportParticipantCandidates_();
  }catch(e){if(status)status.textContent=e.message||'Gagal memuatkan data murid.';if(list)list.innerHTML='<div class="empty report-participant-empty">Senarai murid tidak dapat dimuatkan. Semak sambungan backend dan cuba lagi.</div>';if(save)save.disabled=true;}
}
function saveReportParticipantSelection_(){
  if(!isStandaloneMeetingReport_())return closeReportParticipantModal_();
  const selected=REPORT_STANDALONE_STUDENT_ROWS_.filter(p=>REPORT_STANDALONE_SELECTED_IDS_.has(String(p.NO_KP||'')));
  if(!selected.length)return toast('Pilih sekurang-kurangnya seorang murid, atau pilih Tiada Peserta.');
  REPORT_STANDALONE_SELECTED_STUDENTS_=selected.map(p=>({NO_KP:String(p.NO_KP||''),NAMA:String(p.NAMA||''),KELAS:String(p.KELAS||''),TINGKATAN:String(p.TINGKATAN||''),PERANAN:'PESERTA'}));
  REPORT_STANDALONE_PARTICIPANT_MODE_='participants';renderStandaloneParticipantsAppendix_();updateStandaloneParticipantControls_();closeReportParticipantModal_();
  if($('docEditorStatus'))$('docEditorStatus').textContent=`${selected.length} peserta dimasukkan pada halaman kedua. Simpan laporan untuk mengekalkan pilihan ini.`;
  toast(`${selected.length} peserta ditambah ke laporan.`);
}

function ensureReportContentFields_(){
  const ed=editorEl_();if(!ed)return;
  if(!reportFieldElement_('OBJEKTIF')){
    const box=document.createElement('div');box.className='report-fill-box report-objective-box';box.dataset.reportField='OBJEKTIF';
    box.textContent='................................................................................................';
    const heading=document.createElement('h3');heading.className='report-section-heading';heading.innerHTML='<span>03</span> OBJEKTIF AKTIVITI / PERJUMPAAN';
    const focus=[...ed.querySelectorAll('.report-section-heading')].find(n=>/TAJUK\s*\/\s*FOKUS/i.test(n.textContent));
    if(focus){focus.before(heading,box);}else{const table=ed.querySelector('.report-meta-table');if(table)table.after(heading,box);else ed.prepend(heading,box);}
  }
  if(!reportFieldElement_('RINGKASAN')){
    const n=ed.querySelector('.report-large-fill');if(n)n.dataset.reportField='RINGKASAN';
  }
  if(!reportFieldElement_('IMPAK')){
    const headers=[...ed.querySelectorAll('.report-section-heading')];const h=headers.find(n=>/REFLEKSI\s*\/\s*IMPAK/i.test(n.textContent));
    const n=h?.nextElementSibling;if(n&&n.classList.contains('report-fill-box'))n.dataset.reportField='IMPAK';
  }
}
function valueFromReport_(name){
  const node=reportFieldElement_(name);return node?node.innerText.trim():'';
}
function updateReportWorkspaceMode_(){
  updateDocumentTypeUi_();
  if(REPORT_WORKFLOW_MODE_==='form'){
    ensureReportContentFields_();
    setReportFormValues_({title:$('reportFormTitle')?.value||$('docTitle')?.value||'',preparedBy:REPORT_FORM_AUTHOR_NAME_,objective:$('reportObjectiveInput')?.value||valueFromReport_('OBJEKTIF'),summary:$('reportSummaryInput')?.value||valueFromReport_('RINGKASAN'),impact:$('reportImpactInput')?.value||valueFromReport_('IMPAK')});
    updateReportPreviewFromForm_();
  }
}
function defaultReportTemplate_(){
  return `<div class="ek-report-document">
  <div class="report-doc-topline"><span>KOKURIKULUM SEKOLAH</span><span>SESI PERSEKOLAHAN {{TAHUN}}</span></div>
  <header class="report-doc-header"><h1>SMK TENGKU TEMENGGONG AHMAD</h1><h2>LAPORAN PERJUMPAAN MINGGUAN KOKURIKULUM</h2><div class="report-doc-ribbon">DOKUMENTASI RASMI KOKURIKULUM</div></header>
  <table class="report-meta-table"><tbody>
   <tr><th>UNIT / AKTIVITI</th><td>{{NAMA_UNIT}}</td><th>BIL. PERJUMPAAN</th><td>{{BIL_PERJUMPAAN}}</td></tr>
   <tr><th>TARIKH & HARI</th><td>{{TARIKH_AKTIVITI}}</td><th>MASA</th><td>{{MASA_AKTIVITI}}</td></tr>
   <tr><th>TEMPAT</th><td>{{TEMPAT_AKTIVITI}}</td><th>PERINGKAT / JENIS</th><td>{{PERINGKAT_AKTIVITI}}</td></tr>
   <tr><th>PPKBM / SIVIK</th><td>{{PPKBM_SIVIK}}</td><th>TOPIK / FOKUS</th><td>{{TOPIK_PPKBM}}</td></tr>
   <tr><th>GURU PEMBIMBING HADIR</th><td colspan="3">{{NAMA_GURU}}</td></tr>
  </tbody></table>
  <h3 class="report-section-heading"><span>01</span> BUTIRAN LAPORAN</h3>
  <h3 class="report-section-heading"><span>02</span> ANALISIS KEHADIRAN GURU PENASIHAT</h3>
  <table class="report-data-table"><thead><tr><th style="width:8%">BIL.</th><th>NAMA GURU PENASIHAT</th><th>PERANAN / JAWATAN</th><th style="width:20%">STATUS KEHADIRAN</th></tr></thead><tbody>{{JADUAL_KEHADIRAN_GURU}}</tbody></table>
  <h3 class="report-section-heading"><span>03</span> OBJEKTIF AKTIVITI / PERJUMPAAN</h3><div class="report-fill-box report-objective-box" data-report-field="OBJEKTIF">{{OBJEKTIF_LAPORAN}}</div>
  <h3 class="report-section-heading"><span>04</span> RINGKASAN AKTIVITI YANG DIJALANKAN</h3><div class="report-fill-box report-large-fill" data-report-field="RINGKASAN">{{RINGKASAN_LAPORAN}}</div>
  <h3 class="report-section-heading"><span>05</span> PESERTA / MURID TERLIBAT</h3><p class="report-section-hint">Senarai ini dimasukkan secara automatik daripada peserta aktiviti yang telah direkodkan. Guru boleh menyunting maklumat ini sebelum menyimpan.</p>
  <table class="report-data-table"><thead><tr><th style="width:8%">BIL.</th><th>NAMA MURID</th><th>KELAS</th><th>ACARA / PERANAN</th></tr></thead><tbody>{{JADUAL_PESERTA}}</tbody></table>
  <div class="report-two-columns"><div><h3 class="report-section-heading"><span>06</span> REFLEKSI / IMPAK</h3><div class="report-fill-box report-small-fill" data-report-field="IMPAK">{{IMPAK_LAPORAN}}</div></div><div><h3 class="report-section-heading"><span>07</span> CATATAN / ULASAN TAMBAHAN</h3><div class="report-fill-box report-small-fill">{{CATATAN_TAMBAHAN}}</div></div></div>
  <h3 class="report-section-heading"><span>08</span> LAPORAN BERGAMBAR AKTIVITI</h3><div class="report-photos-grid">
   <figure class="report-photo-slot" data-report-photo-slot="1"><div class="report-photo-empty">Muat naik Foto 1</div><figcaption>FOTO AKTIVITI 1</figcaption></figure>
   <figure class="report-photo-slot" data-report-photo-slot="2"><div class="report-photo-empty">Muat naik Foto 2</div><figcaption>FOTO AKTIVITI 2</figcaption></figure>
   <figure class="report-photo-slot" data-report-photo-slot="3"><div class="report-photo-empty">Muat naik Foto 3</div><figcaption>FOTO AKTIVITI 3</figcaption></figure>
   <figure class="report-photo-slot" data-report-photo-slot="4"><div class="report-photo-empty">Muat naik Foto 4</div><figcaption>FOTO AKTIVITI 4</figcaption></figure>
  </div>
  <div class="report-signature-grid"><div><b>DISEDIAKAN OLEH:</b><p>Nama: {{DISEDIAKAN_OLEH}}</p><p>Jawatan: ........................................................</p><p>Tarikh: ....................................</p><p class="report-sign-line">Tandatangan: .............................................</p></div><div><b>DISAHKAN OLEH:</b><p>Nama: ........................................................</p><p>Jawatan: Penolong Kanan Kokurikulum / Pengurusan</p><p>Tarikh: ....................................</p><p class="report-sign-line">Tandatangan / Cop: ....................................</p></div></div>
  <footer class="report-doc-footer">e-KOSSTA • Dokumentasi Kokurikulum Sekolah</footer>
  </div>`;
}
let REPORT_OVERVIEW_ROWS_=[];
let REPORT_OVERVIEW_DOCS_=[];
let REPORT_PHOTO_CACHE_={};
async function openDocumentsModule_(){
  await Promise.allSettled([loadSavedDocuments_(),loadReportsOverview_()]);
  updateDocumentTypeUi_();
}
async function loadReportsOverview_(){
  const wrap=$('reportActivityListWrap');if(!wrap)return;
  wrap.innerHTML='<div class="empty">Memuatkan aktiviti dan laporan...</div>';
  try{
    const d=await apiGet('getReportsOverview',{token:state.token});
    REPORT_OVERVIEW_ROWS_=d.activities||[];REPORT_OVERVIEW_DOCS_=d.reports||[];
    const yearsSet=new Set();
    REPORT_OVERVIEW_ROWS_.forEach(r=>{const y=String(r.TARIKH||'').slice(0,4);if(/^\d{4}$/.test(y))yearsSet.add(y);});
    REPORT_OVERVIEW_DOCS_.forEach(r=>{const y=String(r.UPDATED_AT||'').slice(0,4);if(/^\d{4}$/.test(y))yearsSet.add(y);});
    const years=[...yearsSet].sort((a,b)=>Number(b)-Number(a));
    const ys=$('reportYearFilter');if(ys){const prev=ys.value;ys.innerHTML='<option value="">Semua tahun</option>'+years.map(y=>`<option value="${activityEsc_(y)}">${activityEsc_(y)}</option>`).join('');if(years.includes(prev))ys.value=prev;}
    renderReportsOverview_();
  }catch(e){REPORT_OVERVIEW_ROWS_=[];REPORT_OVERVIEW_DOCS_=[];wrap.innerHTML='<div class="empty">Gagal memuatkan senarai laporan: '+activityEsc_(e.message||'Ralat')+'</div>';}
}
function reportDocumentDateLabel_(value){
  if(!value)return '-';const d=new Date(value);return isNaN(d.getTime())?String(value).slice(0,10):d.toLocaleDateString('ms-MY',{day:'2-digit',month:'short',year:'numeric'});
}
function renderReportsOverview_(){
  const wrap=$('reportActivityListWrap');if(!wrap)return;
  const q=String($('reportActivitySearch')?.value||'').trim().toLowerCase();
  const y=String($('reportYearFilter')?.value||'');
  const rows=REPORT_OVERVIEW_ROWS_.filter(r=>(!y||String(r.TARIKH||'').slice(0,4)===y)&&(!q||[r.NAMA_AKTIVITI,r.TEMPAT,r.PERINGKAT,r.NO_GURU].join(' ').toLowerCase().includes(q)));
  const standalone=REPORT_OVERVIEW_DOCS_.filter(r=>!String(r.ACTIVITY_ID||'').trim()&&(!y||String(r.UPDATED_AT||'').slice(0,4)===y)&&(!q||[r.TITLE,r.ACTIVITY_NAME,'laporan umum','tanpa aktiviti'].join(' ').toLowerCase().includes(q)));
  if($('reportActivityCount'))$('reportActivityCount').textContent=rows.length+' aktiviti · '+standalone.length+' laporan umum';
  const activityHtml=rows.length?'<table class="report-overview-table"><thead><tr><th>BIL.</th><th>AKTIVITI</th><th>TARIKH</th><th>TEMPAT</th><th>PERINGKAT</th><th>PESERTA</th><th>LAPORAN</th><th>TINDAKAN</th></tr></thead><tbody>'+rows.map((r,i)=>{
    const doc=r.REPORT_DOCUMENT_ID?'<span class="report-status-pill has-report">SUDAH ADA</span>':'<span class="report-status-pill no-report">BELUM ADA</span>';
    const action=r.REPORT_DOCUMENT_ID?`<button class="btn secondary small compact-btn" type="button" data-report-edit="${activityEsc_(r.REPORT_DOCUMENT_ID)}">Sunting Borang</button><button class="btn secondary small compact-btn" type="button" data-report-print="${activityEsc_(r.REPORT_DOCUMENT_ID)}">Cetak</button>`:`<button class="btn primary small compact-btn" type="button" data-report-create="${activityEsc_(r.AKTIVITI_ID)}">Rekod</button>`;
    return `<tr><td>${i+1}</td><td><b>${activityEsc_(r.NAMA_AKTIVITI||'-')}</b><small class="report-table-sub">${activityEsc_(r.NO_GURU||'')}</small></td><td>${activityEsc_(activityDate_(r.TARIKH)||'-')}</td><td>${activityEsc_(r.TEMPAT||'-')}</td><td>${activityEsc_(r.PERINGKAT||'-')}</td><td><span class="report-count-pill">${Number(r.JUMLAH_PESERTA||0)}</span></td><td>${doc}</td><td><div class="report-row-actions">${action}</div></td></tr>`;
  }).join('')+'</tbody></table>':'<div class="empty">Tiada aktiviti sepadan dengan carian. Anda masih boleh membuat laporan umum tanpa aktiviti menggunakan One Page Report.</div>';
  const standaloneHtml=standalone.length?'<section class="report-standalone-saved"><div class="reports-list-heading"><div><h3>Laporan Umum / Tanpa Aktiviti</h3><small class="muted">Laporan ini disimpan secara berasingan dan tidak memerlukan rekod Aktiviti/Acara.</small></div><span class="report-count-pill">'+standalone.length+' laporan</span></div><div class="table-wrap"><table class="report-overview-table"><thead><tr><th>BIL.</th><th>TAJUK LAPORAN</th><th>TARIKH SIMPANAN</th><th>TINDAKAN</th></tr></thead><tbody>'+standalone.map((r,i)=>`<tr><td>${i+1}</td><td><b>${activityEsc_(r.TITLE||'Laporan Umum')}</b></td><td>${activityEsc_(reportDocumentDateLabel_(r.UPDATED_AT))}</td><td><div class="report-row-actions"><button class="btn secondary small compact-btn" type="button" data-report-standalone-edit="${activityEsc_(r.DOCUMENT_ID)}">Buka / Sunting</button><button class="btn secondary small compact-btn" type="button" data-report-standalone-print="${activityEsc_(r.DOCUMENT_ID)}">Cetak</button></div></td></tr>`).join('')+'</tbody></table></div></section>':'';
  wrap.innerHTML=activityHtml+standaloneHtml;
  wrap.querySelectorAll('[data-report-create]').forEach(b=>b.addEventListener('click',()=>startActivityReport_(b.dataset.reportCreate)));
  wrap.querySelectorAll('[data-report-edit]').forEach(b=>b.addEventListener('click',()=>editSavedReport_(b.dataset.reportEdit)));
  wrap.querySelectorAll('[data-report-print]').forEach(b=>b.addEventListener('click',()=>printSavedReport_(b.dataset.reportPrint)));
  wrap.querySelectorAll('[data-report-standalone-edit]').forEach(b=>b.addEventListener('click',()=>editSavedReport_(b.dataset.reportStandaloneEdit)));
  wrap.querySelectorAll('[data-report-standalone-print]').forEach(b=>b.addEventListener('click',()=>printSavedReport_(b.dataset.reportStandalonePrint)));
}
function defaultOnePageReportTemplate_(){
  return `<div class="ek-report-document ekossta-one-page-report">
  <div class="report-primary-page">
    <div class="report-doc-topline"><span>KOKURIKULUM SEKOLAH</span><span>ONE PAGE REPORT • {{TAHUN}}</span></div>
    <header class="report-doc-header"><h1>ONE PAGE REPORT</h1><h2>{{NAMA_UNIT}}</h2><div class="report-doc-ribbon">LAPORAN RINGKAS AKTIVITI / ACARA</div></header>
    <table class="report-meta-table"><tbody><tr><th>TARIKH</th><td>{{TARIKH_AKTIVITI}}</td><th>MASA</th><td>{{MASA_AKTIVITI}}</td></tr><tr><th>TEMPAT</th><td>{{TEMPAT_AKTIVITI}}</td><th>PERINGKAT</th><td>{{PERINGKAT_AKTIVITI}}</td></tr><tr><th>DISEDIAKAN OLEH</th><td colspan="3">{{DISEDIAKAN_OLEH}}</td></tr></tbody></table>
    <div class="report-two-columns one-page-fields"><div><h3 class="report-section-heading"><span>01</span> OBJEKTIF</h3><div class="report-fill-box report-objective-box" data-report-field="OBJEKTIF">{{OBJEKTIF_LAPORAN}}</div></div><div><h3 class="report-section-heading"><span>02</span> RINGKASAN AKTIVITI</h3><div class="report-fill-box report-large-fill" data-report-field="RINGKASAN">{{RINGKASAN_LAPORAN}}</div></div></div>
    <h3 class="report-section-heading"><span>03</span> IMPAK</h3><div class="report-fill-box report-small-fill" data-report-field="IMPAK">{{IMPAK_LAPORAN}}</div>
    <h3 class="report-section-heading"><span>04</span> GAMBAR AKTIVITI</h3><div class="report-photos-grid one-page-photos"><figure class="report-photo-slot" data-report-photo-slot="1"><div class="report-photo-empty">Muat naik Foto 1</div><figcaption>FOTO 1</figcaption></figure><figure class="report-photo-slot" data-report-photo-slot="2"><div class="report-photo-empty">Muat naik Foto 2</div><figcaption>FOTO 2</figcaption></figure><figure class="report-photo-slot" data-report-photo-slot="3"><div class="report-photo-empty">Muat naik Foto 3</div><figcaption>FOTO 3</figcaption></figure><figure class="report-photo-slot" data-report-photo-slot="4"><div class="report-photo-empty">Muat naik Foto 4</div><figcaption>FOTO 4</figcaption></figure></div>
    <div class="report-signature-grid one-page-signature"><div><b>DISEDIAKAN OLEH</b><p>{{DISEDIAKAN_OLEH}}</p><p class="report-sign-line">Tandatangan / Tarikh</p></div><div><b>DISAHKAN OLEH</b><p>............................................</p><p class="report-sign-line">Tandatangan / Tarikh</p></div></div>
    <div class="report-doc-footer">e-KOSSTA • One Page Report</div>
  </div>
  <section class="report-appendix-page"><div class="report-appendix-header"><div class="report-doc-topline"><span>KOKURIKULUM SEKOLAH</span><span>LAMPIRAN • ONE PAGE REPORT</span></div><h1>SENARAI PESERTA TERLIBAT</h1><p>Senarai peserta yang direkodkan bagi laporan ini.</p></div><table class="report-data-table"><thead><tr><th style="width:8%">BIL.</th><th>NAMA MURID</th><th>KELAS</th><th>PERANAN</th></tr></thead><tbody>{{JADUAL_PESERTA}}</tbody></table></section>
  </div>`;
}
async function startManualMeetingReport_(){
  REPORT_WORKFLOW_MODE_='form';REPORT_FORM_KIND_='meeting';REPORT_STANDALONE_PARTICIPANT_MODE_='unset';REPORT_STANDALONE_SELECTED_STUDENTS_=[];REPORT_STANDALONE_SELECTED_IDS_=new Set();
  showPage('reports-edit');
  EDITOR_DOCUMENT_ID='';DOCUMENT_LINKED_ACTIVITY_ID_='';DOCUMENT_LINKED_ACTIVITY_NAME_='';REPORT_PHOTO_CACHE_={};resetReportPhotoInputs_();
  let template=defaultOnePageReportTemplate_();
  try{const doc=await findSharedTemplate_('LAPORAN',/one\s*page\s*report/i);if(doc?.CONTENT_HTML)template=doc.CONTENT_HTML;}catch(e){/* Gunakan One Page Report terbina dalam */}
  template=ensureReportTemplateForForm_(template);
  const now=new Date();const date=now.toLocaleDateString('en-CA');
  REPORT_FORM_AUTHOR_NAME_=reportPreparedByName_();
  const values={TAHUN:String(now.getFullYear()),NAMA_UNIT:'Perjumpaan Unit',BIL_PERJUMPAAN:'........................',TARIKH_AKTIVITI:date+' • '+now.toLocaleDateString('ms-MY',{weekday:'long'}),MASA_AKTIVITI:'........................',TEMPAT_AKTIVITI:'................................................',PERINGKAT_AKTIVITI:'PERJUMPAAN UNIT',PPKBM_SIVIK:'................................................',TOPIK_PPKBM:'Perjumpaan / mesyuarat unit',NAMA_GURU:activityEsc_(REPORT_FORM_AUTHOR_NAME_),DISEDIAKAN_OLEH:activityEsc_(REPORT_FORM_AUTHOR_NAME_),JUMLAH_HADIR:'........',ENROLMEN_AHLI:'........',PERATUS_KEHADIRAN:'........%',JADUAL_KEHADIRAN_GURU:'<tr><td>1</td><td>'+activityEsc_(REPORT_FORM_AUTHOR_NAME_)+'</td><td>Guru Penasihat</td><td>Hadir</td></tr>',TAJUK_FOKUS:'Perjumpaan unit',OBJEKTIF_LAPORAN:'................................................................................................',RINGKASAN_LAPORAN:'................................................................................................',IMPAK_LAPORAN:'................................................................................................',RINGKASAN_AKTIVITI:'................................................................................................',JADUAL_PESERTA:'<tr><td colspan="4">Tiada peserta khusus direkodkan untuk laporan umum ini.</td></tr>',REFLEKSI_IMPAK:'................................................................................................',CATATAN_TAMBAHAN:'................................................................................................'};
  $('docType').value='LAPORAN';$('docTitle').value='Laporan Perjumpaan Unit - '+date;
  editorEl_().innerHTML=cleanEditorHtml_(brandDocumentHtml_(replaceLetterTokens_(template,values)));
  ensureReportContentFields_();
  setReportFormValues_({title:$('docTitle').value,preparedBy:REPORT_FORM_AUTHOR_NAME_,objective:'',summary:'',impact:''});
  const formSummary=$('reportFormActivitySummary');if(formSummary)formSummary.innerHTML='<b>Laporan Perjumpaan Unit</b><div>Tanpa acara khusus · '+activityEsc_(REPORT_FORM_AUTHOR_NAME_)+' · '+date+'</div>';
  ensureReportPhotoSlots_();renderStandaloneParticipantsAppendix_();updateDocumentTypeUi_();updateReportPreviewFromForm_();
  if($('docEditorStatus'))$('docEditorStatus').textContent='Laporan umum tanpa pautan aktiviti. Pilih + Peserta atau Tiada Peserta, kemudian lengkapkan objektif, ringkasan dan impak.';
  editorEl_().focus();
}
async function editSavedReport_(id){
  REPORT_WORKFLOW_MODE_='form';
  await openSavedDocument_(id);
}
async function printSavedReport_(id){
  const printWindow=window.open('about:blank','_blank');if(!printWindow)return toast('Popup disekat. Benarkan pop-up untuk cetakan A4.');
  try{printWindow.document.open();printWindow.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Menyediakan cetakan...</title></head><body style="font:16px Arial;padding:24px">Menyediakan laporan untuk dicetak...</body></html>');printWindow.document.close();}catch(e){}
  const loaded=await openSavedDocument_(id);if(!loaded){try{printWindow.close()}catch(e){}return;}
  await printEditorDocument_(printWindow);
}
async function loadDocumentActivities_(){
  const sel=$('docActivitySelect');if(!sel)return;
  const previous=sel.value;
  try{
    const d=await apiGet('getAktiviti',{token:state.token});
    DOCUMENT_ACTIVITY_ROWS_=d.data||[];
    sel.innerHTML='<option value="">-- Pilih Aktiviti / Acara --</option>'+DOCUMENT_ACTIVITY_ROWS_.map(a=>`<option value="${activityEsc_(a.AKTIVITI_ID)}">${activityEsc_(a.NAMA_AKTIVITI)} — ${activityEsc_(activityDate_(a.TARIKH)||'-')}</option>`).join('');
    if(DOCUMENT_LINKED_ACTIVITY_ID_)sel.value=DOCUMENT_LINKED_ACTIVITY_ID_;else if(previous)sel.value=previous;
    if($('docActivityStatus'))$('docActivityStatus').textContent=DOCUMENT_ACTIVITY_ROWS_.length?'Pilih aktiviti berdaftar untuk menghasilkan draf yang boleh disunting.':'Tiada aktiviti berdaftar yang boleh diakses. Daftarkan aktiviti terlebih dahulu.';
  }catch(e){
    DOCUMENT_ACTIVITY_ROWS_=[];sel.innerHTML='<option value="">Tidak dapat memuatkan aktiviti</option>';
    if($('docActivityStatus'))$('docActivityStatus').textContent='Gagal memuatkan aktiviti: '+(e.message||'Ralat');
  }
}
async function findSharedTemplate_(type,titleRegex){
  const d=await apiGet('getDocuments',{token:state.token});
  const found=(d.data||[]).find(r=>String(r.TYPE||'')===type&&titleRegex.test(String(r.TITLE||'')));
  if(!found)return null;
  const full=await apiGet('getDocument',{token:state.token,documentId:found.DOCUMENT_ID});
  return full.document||null;
}
async function loadReportTemplateIntoEditor_(){
  if(state.user?.role!=='ADMIN')return toast('Edit Templat hanya untuk ADMIN.');
  REPORT_WORKFLOW_MODE_='template';
  let html=defaultOnePageReportTemplate_(),docId='';
  try{const doc=await findSharedTemplate_('LAPORAN',/one\s*page\s*report/i);if(doc?.CONTENT_HTML){html=doc.CONTENT_HTML;docId=doc.DOCUMENT_ID||'';}}catch(e){toast('Templat One Page Report tersimpan tidak dapat dimuatkan. Templat asas digunakan.');}
  html=ensureReportTemplateForForm_(brandDocumentHtml_(html));
  EDITOR_DOCUMENT_ID=docId;DOCUMENT_LINKED_ACTIVITY_ID_='';DOCUMENT_LINKED_ACTIVITY_NAME_='';REPORT_WORKFLOW_MODE_='template';
  $('docTitle').value='One Page Report';$('docType').value='LAPORAN';editorEl_().innerHTML=cleanEditorHtml_(html);
  $('docEditorStatus').textContent=docId?'Templat One Page Report dimuatkan. Edit dan simpan sebagai ADMIN.':'Templat One Page Report asas dimuatkan. ADMIN boleh mengubahnya dan menyimpan versi aktif.';
  if($('docActivityStatus'))$('docActivityStatus').textContent='Ini templat bersama, bukan laporan untuk satu aktiviti tertentu.';
  updateDocumentTypeUi_();editorEl_().focus();
}
async function loadPermissionTemplateIntoEditor_(){
  if(state.user?.role!=='ADMIN')return toast('Edit Templat hanya untuk ADMIN.');
  REPORT_WORKFLOW_MODE_='template';
  let html=defaultPermissionTemplate_(),docId='';
  try{const doc=await findSharedTemplate_('SURAT_KEBENARAN',/templat surat kebenaran ibu bapa/i);if(doc?.CONTENT_HTML){html=doc.CONTENT_HTML;docId=doc.DOCUMENT_ID||'';}}
  catch(e){toast('Templat surat tersimpan tidak dapat dimuatkan. Templat asal digunakan.');}
  EDITOR_DOCUMENT_ID=docId;DOCUMENT_LINKED_ACTIVITY_ID_='';DOCUMENT_LINKED_ACTIVITY_NAME_='';REPORT_WORKFLOW_MODE_='template';
  $('docTitle').value='Templat Surat Kebenaran Ibu Bapa';$('docType').value='SURAT_KEBENARAN';editorEl_().innerHTML=cleanEditorHtml_(brandDocumentHtml_(html));
  $('docEditorStatus').textContent=docId?'Templat surat bersama dimuatkan. Edit dan simpan sebagai ADMIN.':'Templat surat asal dimuatkan. ADMIN boleh mengubahnya dan menyimpan versi aktif.';
  if($('docActivityStatus'))$('docActivityStatus').textContent='Ini templat bersama. Jana Surat dalam modul Aktiviti akan menggunakan versi terakhir yang disimpan.';
  updateDocumentTypeUi_();editorEl_().focus();
}
async function startActivityReport_(activityId){
  REPORT_WORKFLOW_MODE_='form';REPORT_FORM_KIND_='activity';
  if(!activityId)return toast('Pilih aktiviti terlebih dahulu.');
  showPage('reports-edit');
  if(!REPORT_OVERVIEW_ROWS_.length)await loadReportsOverview_();
  await loadDocumentActivities_();
  const sel=$('docActivitySelect');if(sel)sel.value=activityId;
  await buildActivityReportDraft_(activityId);
}
async function buildActivityReportDraft_(activityId){
  const id=String(activityId||'').trim();if(!id)return toast('Pilih aktiviti / acara dahulu.');
  let activity=DOCUMENT_ACTIVITY_ROWS_.find(a=>String(a.AKTIVITI_ID)===id);
  if(!activity){await loadDocumentActivities_();activity=DOCUMENT_ACTIVITY_ROWS_.find(a=>String(a.AKTIVITI_ID)===id);}
  if(!activity){if(!REPORT_OVERVIEW_ROWS_.length)await loadReportsOverview_();activity=REPORT_OVERVIEW_ROWS_.find(a=>String(a.AKTIVITI_ID)===id);}
  if(!activity)return toast('Aktiviti tidak ditemui atau anda tiada akses.');
  REPORT_WORKFLOW_MODE_='form';REPORT_FORM_KIND_='activity';showPage('reports-edit');
  const btn=$('docStartReportBtn');if(btn){btn.disabled=true;btn.textContent='Membina borang...';}
  try{
    let template=defaultOnePageReportTemplate_();
    try{const doc=await findSharedTemplate_('LAPORAN',/one\s*page\s*report/i);if(doc?.CONTENT_HTML)template=doc.CONTENT_HTML;}catch(e){/* templat One Page Report terbina dalam */}
    template=ensureReportTemplateForForm_(template);
    let participantRows=[];let teacherDisplay=String(activity.NO_GURU||'-');
    try{const pd=await apiGet('getAktivitiPeserta',{token:state.token,aktivitiId:id});participantRows=(pd.data||[]).filter(p=>p.selected&&String(p.STATUS||'AKTIF').toUpperCase()==='AKTIF');if(pd.aktiviti)activity=Object.assign({},activity,pd.aktiviti);}catch(e){console.warn('Peserta aktiviti tidak dapat dimuatkan:',e);}
    try{const gd=await apiGet('getGuru',{token:state.token});const g=(gd.data||[]).find(x=>String(x.NO_GURU||'')===String(activity.NO_GURU||''));if(g&&g.NAMA)teacherDisplay=String(g.NAMA);}catch(e){/* Kekalkan maklumat guru daripada rekod aktiviti jika nama tidak tersedia. */}
    const partRows=participantRows.length?participantRows.map((p,i)=>`<tr><td>${i+1}</td><td>${activityEsc_(p.NAMA||'-')}</td><td>${activityEsc_(p.KELAS||'-')}</td><td>${activityEsc_(p.PERANAN||'PESERTA')}</td></tr>`).join(''):'<tr><td colspan="4">Tiada peserta aktif yang direkodkan untuk aktiviti ini.</td></tr>';
    const today=new Date();
    REPORT_FORM_AUTHOR_NAME_=reportPreparedByName_(teacherDisplay);
    const values={
      TAHUN:String(String(activity.TARIKH||'').slice(0,4)||today.getFullYear()),NAMA_UNIT:activityEsc_('Kokurikulum / '+String(activity.NAMA_AKTIVITI||'Aktiviti')),BIL_PERJUMPAAN:'- ',
      TARIKH_AKTIVITI:activityEsc_(activityDate_(activity.TARIKH)||'-'),MASA_AKTIVITI:activityEsc_(activity.MASA||'-'),TEMPAT_AKTIVITI:activityEsc_(activity.TEMPAT||'-'),
      PERINGKAT_AKTIVITI:activityEsc_(activity.PERINGKAT||'-'),PPKBM_SIVIK:'- ',TOPIK_PPKBM:activityEsc_(activity.NAMA_AKTIVITI||'-'),NAMA_GURU:activityEsc_(teacherDisplay||'-'),DISEDIAKAN_OLEH:activityEsc_(REPORT_FORM_AUTHOR_NAME_),
      JUMLAH_HADIR:'........',ENROLMEN_AHLI:'........',PERATUS_KEHADIRAN:'........%',
      JADUAL_KEHADIRAN_GURU:`<tr><td>1</td><td>${activityEsc_(teacherDisplay||'-')}</td><td>Guru Penasihat</td><td>................................</td></tr>`,
      TAJUK_FOKUS:activityEsc_(activity.NAMA_AKTIVITI||'................................................'),
      OBJEKTIF_LAPORAN:reportHtmlText_(activity.OBJEKTIF,'................................................................................................'),
      RINGKASAN_LAPORAN:reportHtmlText_(activity.AKTIVITI,'................................................................................................'),
      IMPAK_LAPORAN:reportHtmlText_(activity.IMPAK,'................................................................................................'),
      RINGKASAN_AKTIVITI:reportHtmlText_(activity.AKTIVITI,'................................................................................................'),
      JADUAL_PESERTA:partRows,
      REFLEKSI_IMPAK:reportHtmlText_(activity.IMPAK,'................................................................................................'),
      CATATAN_TAMBAHAN:'................................................................................................',
      NAMA_AKTIVITI:activityEsc_(activity.NAMA_AKTIVITI||'-'),JUMLAH_PESERTA:String(participantRows.length),
      OBJEKTIF_AKTIVITI:reportHtmlText_(activity.OBJEKTIF,'................................................................................................'),
      IMPAK_AKTIVITI:reportHtmlText_(activity.IMPAK,'................................................................................................'),
      SENARAI_PESERTA:participantRows.length?'<ol>'+participantRows.map(p=>`<li>${activityEsc_(p.NAMA||p.NO_KP)} — ${activityEsc_(p.KELAS||'-')}</li>`).join('')+'</ol>':'<p>Tiada peserta aktif yang direkodkan.</p>'
    };
    EDITOR_DOCUMENT_ID='';DOCUMENT_LINKED_ACTIVITY_ID_=id;DOCUMENT_LINKED_ACTIVITY_NAME_=String(activity.NAMA_AKTIVITI||'');REPORT_STANDALONE_PARTICIPANT_MODE_='activity';REPORT_STANDALONE_SELECTED_STUDENTS_=[];REPORT_STANDALONE_SELECTED_IDS_=new Set();REPORT_PHOTO_CACHE_={};resetReportPhotoInputs_();
    $('docType').value='LAPORAN';$('docTitle').value='Laporan Aktiviti - '+String(activity.NAMA_AKTIVITI||'Aktiviti');
    editorEl_().innerHTML=cleanEditorHtml_(brandDocumentHtml_(replaceLetterTokens_(template,values)));
    ensureReportContentFields_();
    setReportFormValues_({title:$('docTitle').value,preparedBy:REPORT_FORM_AUTHOR_NAME_,objective:String(activity.OBJEKTIF||''),summary:String(activity.AKTIVITI||''),impact:String(activity.IMPAK||'')});
    const formSummary=$('reportFormActivitySummary');if(formSummary)formSummary.innerHTML='<b>'+activityEsc_(activity.NAMA_AKTIVITI||'Aktiviti')+'</b><div>'+activityEsc_(activityDate_(activity.TARIKH)||'-')+' · '+activityEsc_(activity.TEMPAT||'-')+' · '+participantRows.length+' peserta dipautkan</div>';
    ensureReportPhotoSlots_();
    if($('docEditorStatus'))$('docEditorStatus').textContent='Draf laporan disediakan daripada rekod aktiviti. Lengkapkan objektif, ringkasan dan impak; gambar adalah pilihan. Senarai peserta berada pada halaman kedua.';
    updateDocumentTypeUi_();updateReportPreviewFromForm_();editorEl_().focus();
  }catch(e){toast(e.message||'Gagal membina borang laporan.');}
  finally{if(btn){btn.disabled=false;btn.textContent='Bina Draf Laporan';}}
}
function renderSavedDocuments_(){
  const wrap=$('savedDocsWrap');if(!wrap)return;
  const q=String($('docSearch')?.value||'').trim().toLowerCase();const type=String($('docListType')?.value||'');
  const source=REPORT_WORKFLOW_MODE_==='template'?DOCUMENT_ROWS_CACHE_.filter(r=>isSharedTemplateClient_(r)):DOCUMENT_ROWS_CACHE_;
  const rows=source.filter(r=>(!type||String(r.TYPE||'')===type)&&(!q||[r.TITLE,r.ACTIVITY_NAME,r.ACTIVITY_ID,r.TYPE].join(' ').toLowerCase().includes(q)));
  if(!rows.length){wrap.innerHTML='<div class="empty">Tiada dokumen sepadan dengan carian ini.</div>';return;}
  wrap.innerHTML='<table class="saved-documents-table"><thead><tr><th>TAJUK</th><th>JENIS</th><th>AKTIVITI / UNIT</th><th>DIKEMAS KINI</th><th>TINDAKAN</th></tr></thead><tbody>'+rows.map(r=>`<tr><td><b>${activityEsc_(r.TITLE||'Tanpa tajuk')}</b></td><td>${activityEsc_(documentTypeLabel_(r.TYPE))}${isSharedTemplateClient_(r)?'<small class="document-shared-label">Templat bersama</small>':''}</td><td>${activityEsc_(r.ACTIVITY_NAME||'-')}</td><td>${activityEsc_(r.UPDATED_AT||'-')}</td><td><div class="report-row-actions"><button class="btn secondary small compact-btn" type="button" data-doc-open="${activityEsc_(r.DOCUMENT_ID)}">Buka / Edit</button><button class="btn secondary small compact-btn" type="button" data-doc-print="${activityEsc_(r.DOCUMENT_ID)}">Cetak</button></div></td></tr>`).join('')+'</tbody></table>';
  wrap.querySelectorAll('[data-doc-open]').forEach(btn=>btn.addEventListener('click',()=>openSavedDocument_(btn.dataset.docOpen)));
  wrap.querySelectorAll('[data-doc-print]').forEach(btn=>btn.addEventListener('click',()=>printSavedReport_(btn.dataset.docPrint)));
}
function documentTypeLabel_(type){return ({LAPORAN:'Laporan Aktiviti',SURAT_RASMI:'Surat Rasmi',SURAT_KEBENARAN:'Surat Kebenaran Ibu Bapa',LAIN:'Dokumen Lain'})[String(type||'')]||String(type||'-');}
async function saveEditorDocument_(){
  if(!state.token)return toast('Sila log masuk semula.');
  if(REPORT_WORKFLOW_MODE_==='template'&&state.user?.role!=='ADMIN')return toast('Edit Templat hanya untuk ADMIN.');
  if(REPORT_WORKFLOW_MODE_==='form'){
    const objective=String($('reportObjectiveInput')?.value||'').trim();
    const summary=String($('reportSummaryInput')?.value||'').trim();
    const impact=String($('reportImpactInput')?.value||'').trim();
    if(!objective||!summary||!impact)return toast('Lengkapkan Objektif, Ringkasan Aktiviti dan Impak sebelum menyimpan.');
    if($('reportFormTitle'))$('docTitle').value=String($('reportFormTitle').value||'').trim();
    $('docType').value='LAPORAN';
    updateReportPreviewFromForm_();
    if(isStandaloneMeetingReport_()) {
      if(REPORT_STANDALONE_PARTICIPANT_MODE_==='unset')return toast('Pilih + Peserta atau Tiada Peserta sebelum menyimpan laporan.');
      renderStandaloneParticipantsAppendix_();
    }
  }
  const title=String($('docTitle')?.value||'').trim();const type=String($('docType')?.value||'LAIN');
  if(!title)return toast('Masukkan tajuk dokumen.');
  const isTemplate=isSharedTemplateClient_({TYPE:type,TITLE:title});
  if(isTemplate&&state.user?.role!=='ADMIN')return toast('Hanya ADMIN boleh mengubah templat bersama.');
  if(type==='LAPORAN'&&!isTemplate)ensureReportPhotoSlots_();
  const clone=editorEl_().cloneNode(true);
  clone.querySelectorAll('[data-ekossta-auto-branding="1"]').forEach(el=>el.remove());
  const saveWalker=document.createTreeWalker(clone,NodeFilter.SHOW_TEXT);const saveNodes=[];while(saveWalker.nextNode())saveNodes.push(saveWalker.currentNode);saveNodes.forEach(n=>{n.nodeValue=appBrandNormalizeText_(n.nodeValue);});
  const photoIds=[...new Set([...clone.querySelectorAll('img[data-report-photo-id]')].map(img=>String(img.dataset.reportPhotoId||'')).filter(Boolean))];
  const b=$('docSaveBtn');if(b){b.disabled=true;b.textContent=photoIds.length?'Mengesahkan gambar...':'Menyimpan laporan...';}
  try{
    // Foto biasanya sudah dimuat naik semasa pengguna melengkapkan borang. Tunggu yang masih berjalan;
    // hanya cuba semula jika muat naik latar gagal.
    for(let i=0;i<photoIds.length;i++){
      const pid=photoIds[i],cache=REPORT_PHOTO_CACHE_[pid];
      if(cache?.dataUrl&&!cache.uploaded){
        if(cache.uploadPromise)await cache.uploadPromise;
        if(!cache.uploaded){if(b)b.textContent=`Muat naik foto ${i+1}/${photoIds.length}...`;await uploadReportPhotoChunks_(pid,cache);cache.uploaded=true;cache.uploadError='';}
      }
      const img=clone.querySelector(`img[data-report-photo-id="${CSS.escape(pid)}"]`);if(img)img.removeAttribute('src');
    }
    const content=cleanEditorHtml_(clone.innerHTML);
    if(!content.replace(/<[^>]*>/g,'').trim())throw new Error('Kandungan dokumen masih kosong.');
    if(b)b.textContent='Menyimpan laporan...';
    const activityId=(type==='LAPORAN'&&!isTemplate)?DOCUMENT_LINKED_ACTIVITY_ID_:'';
    const activityName=activityId?DOCUMENT_LINKED_ACTIVITY_NAME_:'';
    const d=await apiGet('saveDocument',{token:state.token,documentId:EDITOR_DOCUMENT_ID,title,type,content,activityId,activityName,photoIds:photoIds.join(',')});
    EDITOR_DOCUMENT_ID=d.documentId||EDITOR_DOCUMENT_ID;
    if($('docEditorStatus'))$('docEditorStatus').textContent='Berjaya disimpan pada '+new Date().toLocaleString('ms-MY')+'.';
    toast(d.message||'Laporan berjaya disimpan.');
    // Refresh the lists in the background. Do not keep Save disabled while the two lists reload.
    Promise.allSettled([loadSavedDocuments_(),loadReportsOverview_()]);
  }catch(e){if($('docEditorStatus'))$('docEditorStatus').textContent=e.message||'Gagal menyimpan dokumen.';toast(e.message||'Gagal menyimpan dokumen.');}
  finally{if(b){b.disabled=false;const t=String($('docType')?.value||'LAIN');b.textContent=isSharedTemplateClient_({TYPE:t,TITLE:$('docTitle')?.value})?'Simpan Templat':(t==='LAPORAN'?'Simpan Laporan':'Simpan Dokumen');}}
}
async function loadSavedDocuments_(){
  const wrap=$('savedDocsWrap');if(!wrap)return;
  wrap.innerHTML='<div class="empty">Memuatkan dokumen...</div>';
  try{const d=await apiGet('getDocuments',{token:state.token});DOCUMENT_ROWS_CACHE_=d.data||[];renderSavedDocuments_();}
  catch(e){DOCUMENT_ROWS_CACHE_=[];wrap.innerHTML='<div class="empty">Tidak dapat memuatkan dokumen: '+activityEsc_(e.message||'Ralat')+'</div>';}
}
async function openSavedDocument_(id){
  try{
    const d=await apiGet('getDocument',{token:state.token,documentId:id});const r=d.document||{};
    const template=isSharedTemplateClient_(r);
    if(template){if(state.user?.role!=='ADMIN')throw new Error('Edit Templat hanya untuk ADMIN.');REPORT_WORKFLOW_MODE_='template';showPage('report-templates');}
    else {REPORT_WORKFLOW_MODE_='form';REPORT_FORM_KIND_='activity';showPage('reports-edit');}
    EDITOR_DOCUMENT_ID=String(r.DOCUMENT_ID||'');DOCUMENT_LINKED_ACTIVITY_ID_=String(r.ACTIVITY_ID||'');DOCUMENT_LINKED_ACTIVITY_NAME_=String(r.ACTIVITY_NAME||'');REPORT_FORM_KIND_=DOCUMENT_LINKED_ACTIVITY_ID_?'activity':'meeting';REPORT_PHOTO_CACHE_={};
    $('docTitle').value=r.TITLE||'';$('docType').value=r.TYPE||'LAIN';let openedHtml=cleanEditorHtml_(brandDocumentHtml_(r.CONTENT_HTML||''));if(String(r.TYPE||'')==='LAPORAN'&&!template){openedHtml=removeReportKpiStatistics_(openedHtml);openedHtml=ensureParticipantsAppendixPage_(openedHtml);}editorEl_().innerHTML=openedHtml;
    let legacyObjective='';
    if(String(r.TYPE||'')==='LAPORAN'&&!template&&!reportFieldElement_('OBJEKTIF')){
      const oldHead=[...editorEl_().querySelectorAll('.report-section-heading')].find(n=>/CATATAN\s*\/\s*ULASAN TAMBAHAN/i.test(n.textContent));
      if(oldHead&&oldHead.nextElementSibling)legacyObjective=oldHead.nextElementSibling.innerText.trim();
      ensureReportContentFields_();
    }else if(String(r.TYPE||'')==='LAPORAN'&&!template){ensureReportContentFields_();}
    if(String(r.TYPE||'')==='LAPORAN'&&!template){
      if(DOCUMENT_LINKED_ACTIVITY_ID_){REPORT_STANDALONE_PARTICIPANT_MODE_='activity';REPORT_STANDALONE_SELECTED_STUDENTS_=[];REPORT_STANDALONE_SELECTED_IDS_=new Set();}
      else {REPORT_STANDALONE_SELECTED_STUDENTS_=readStandaloneReportParticipantsFromEditor_();REPORT_STANDALONE_PARTICIPANT_MODE_=REPORT_STANDALONE_SELECTED_STUDENTS_.length?'participants':'none';REPORT_STANDALONE_SELECTED_IDS_=new Set(REPORT_STANDALONE_SELECTED_STUDENTS_.map(p=>String(p.NO_KP||'')).filter(Boolean));renderStandaloneParticipantsAppendix_();}
    }
    resetReportPhotoInputs_();updateDocumentTypeUi_();
    await hydrateReportPhotosInEditor_(EDITOR_DOCUMENT_ID);
    if(String(r.TYPE||'')==='LAPORAN'&&!template){
      const objective=valueFromReport_('OBJEKTIF')||legacyObjective,summary=valueFromReport_('RINGKASAN'),impact=valueFromReport_('IMPAK');
      const creatorNode=editorEl_().querySelector('.report-signature-grid > div:first-child p');
      const savedCreator=creatorNode?creatorNode.innerText.replace(/^Nama:\s*/i,'').trim():'';
      const teacherName=savedCreator||String(state.user?.nama||state.user?.name||state.user?.username||'');REPORT_FORM_AUTHOR_NAME_=teacherName;
      const activitySummary=$('reportFormActivitySummary');if(activitySummary)activitySummary.innerHTML='<b>'+activityEsc_(r.ACTIVITY_NAME||r.TITLE||'Laporan aktiviti')+'</b><div>Laporan tersimpan · Disediakan oleh '+activityEsc_(teacherName)+'</div>';
      setReportFormValues_({title:r.TITLE||'',preparedBy:teacherName,objective,summary,impact});
      updateReportPreviewFromForm_();
    }
    if($('docEditorStatus'))$('docEditorStatus').textContent=template?'Templat dibuka. Perubahan hanya boleh disimpan oleh ADMIN.':'Laporan dibuka. Ubah objektif, ringkasan atau impak kemudian simpan semula.';
    updateDocumentTypeUi_();editorEl_().focus();return true;
  }catch(e){toast(e.message||'Gagal membuka dokumen.');return false;}
}
async function printEditorDocument_(providedWindow=null){
  if(isStandaloneMeetingReport_()){if(REPORT_STANDALONE_PARTICIPANT_MODE_==='unset')return toast('Pilih + Peserta atau Tiada Peserta sebelum mencetak laporan.');renderStandaloneParticipantsAppendix_();}
  const w=providedWindow||window.open('about:blank','_blank');if(!w)return toast('Popup disekat. Benarkan pop-up untuk cetakan A4.');
  try{
    if(REPORT_WORKFLOW_MODE_==='form')updateReportPreviewFromForm_();
    const ed=editorEl_();if(!ed)throw new Error('Pratonton laporan tidak ditemui.');
    let content=cleanEditorHtml_(ed.innerHTML);
    const ids=[...new Set([...ed.querySelectorAll('img[data-report-photo-id]')].map(n=>String(n.dataset.reportPhotoId||'')).filter(Boolean))];
    for(const id of ids){const imgData=REPORT_PHOTO_CACHE_[id]?.dataUrl;if(imgData){const holder=document.createElement('div');holder.innerHTML=content;const target=holder.querySelector(`img[data-report-photo-id="${CSS.escape(id)}"]`);if(target)target.setAttribute('src',imgData);content=holder.innerHTML;}}
    content=brandDocumentHtml_(content);
    if(window.__EKOSSTA_CLEAN_PRIVACY_HTML__)content=window.__EKOSSTA_CLEAN_PRIVACY_HTML__(content);
    const css=`@page{size:A4;margin:12mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#142033}body{font-family:Arial,sans-serif;font-size:9pt;line-height:1.4}.print-action-bar{position:sticky;top:0;z-index:10;display:flex;justify-content:flex-end;gap:8px;padding:10px 14px;background:#10221b;color:#fff;border-bottom:2px solid #d8e267}.print-action-bar button{padding:8px 12px;border:1px solid #d8e267;background:#d8e267;color:#10221b;font-weight:700;cursor:pointer}.print-content{width:186mm;max-width:186mm;margin:0 auto;overflow-wrap:anywhere}h1{font-size:16pt}h2{font-size:13pt}h3{font-size:9.5pt}table{border-collapse:collapse;width:100%;page-break-inside:auto}thead{display:table-header-group}tr{page-break-inside:avoid;break-inside:avoid}td,th{border:1px solid #c6ced8;padding:5px 6px;vertical-align:top}th{background:#f0f4f9;color:#142033}img{max-width:100%;height:auto}.ekossta-school-doc-brand{display:flex;align-items:center;justify-content:center;width:100%;margin:0 0 10px;padding:0 0 8px;border-bottom:1px solid #aab9af;box-sizing:border-box}.ekossta-school-doc-brand img{display:block;width:auto;height:auto;max-width:68px;max-height:48px;object-fit:contain}.ek-report-document{font-family:Arial,sans-serif;color:#172339;font-size:9pt;line-height:1.4}.report-doc-topline{display:flex;justify-content:space-between;gap:8px;padding-bottom:5px;border-bottom:1px solid #c9d3df;color:#65748a;font-size:7pt;font-weight:800;letter-spacing:.05em}.report-doc-header{text-align:center;padding:10px 0 8px;border-bottom:2px solid #1f2d42;margin-bottom:9px}.report-doc-header h1{font-size:16pt;line-height:1.2;margin:0 0 4px;font-weight:800;color:#14213a}.report-doc-header h2{font-size:11pt;line-height:1.25;margin:0 0 7px;font-weight:800;color:#1f2d42}.report-doc-ribbon{display:inline-block;padding:4px 12px;border-radius:3px;background:#123b62;color:#fff;font-size:7pt;font-weight:800;letter-spacing:.05em}.report-meta-table,.report-data-table{width:100%;border-collapse:collapse;margin:7px 0 10px;font-size:8pt;min-width:0;background:#fff;color:#172339}.report-meta-table th,.report-meta-table td,.report-data-table th,.report-data-table td{border:1px solid #cbd4df;padding:5px 6px;text-align:left;vertical-align:top}.report-meta-table th{background:#f1f5f9;font-size:7pt;font-weight:800;color:#43516a;width:17%}.report-meta-table td{width:33%;font-weight:600;overflow-wrap:anywhere}.report-section-heading{display:flex;align-items:center;gap:6px;margin:10px 0 5px;padding:0 0 4px;border-bottom:1px solid #d8e0e9;font-size:8pt;font-weight:800;color:#153d61;letter-spacing:.03em}.report-section-heading>span{display:inline-grid;place-items:center;flex:0 0 17px;height:17px;border-radius:50%;background:#dce9f6;color:#153d61;font-size:7pt}.report-kpi-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:6px 0 10px}.report-kpi-row>div{display:flex;min-height:45px;flex-direction:column;justify-content:center;align-items:center;gap:2px;padding:5px;border:1px solid #d0dae6;border-radius:5px;background:#f4f7fb;text-align:center}.report-kpi-row small{font-size:6.5pt;font-weight:800;color:#607087}.report-kpi-row b{font-size:14pt;line-height:1.15;color:#153d61}.report-kpi-row span{font-size:6.5pt;color:#66768b}.report-data-table th{background:#edf2f7;font-size:7pt;font-weight:800;color:#3a4a60}.report-data-table td{font-size:8pt}.report-fill-box{min-height:20px;padding:7px 8px;border:1px solid #d2dbe6;border-radius:4px;background:#fff;overflow-wrap:anywhere}.report-large-fill{min-height:35px}.report-small-fill{min-height:42px}.report-section-hint{font-size:7pt;color:#66768b;margin:0 0 5px}.report-two-columns{display:grid;grid-template-columns:1fr 1fr;gap:9px}.report-photos-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:7px 0 10px}.report-photo-slot{margin:0;min-width:0;border:1px solid #c9d2df;border-radius:5px;padding:4px;background:#fff;color:#182234;break-inside:avoid;page-break-inside:avoid}.report-photo-slot img{display:block;width:100%;height:35mm;object-fit:contain;border-radius:3px;background:#eef2f7}.report-photo-empty{display:grid;place-items:center;height:35mm;padding:8px;text-align:center;border:1px dashed #aab7c7;border-radius:3px;color:#65748a;font-size:8pt;background:#f5f7fa}.report-photo-slot figcaption{padding:4px 2px 1px;text-align:center;font-size:6pt;font-weight:800;letter-spacing:.05em;color:#4b5a6f}.report-signature-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:18px;padding-top:8px;border-top:1px solid #8b98a9;color:#172339;font-size:7pt;break-inside:avoid;page-break-inside:avoid}.report-signature-grid b{font-size:7pt;letter-spacing:.04em}.report-signature-grid p{margin:5px 0}.report-sign-line{margin-top:14px!important;border-top:1px dotted #9aa6b5;padding-top:4px}.report-doc-footer{margin-top:10px;padding-top:5px;border-top:1px solid #d7dfe8;color:#768397;font-size:6pt;text-align:center}.ekossta-one-page-report{font-size:7pt!important;line-height:1.12!important}.ekossta-one-page-report .report-doc-header{padding:4px 0 5px;margin-bottom:5px}.ekossta-one-page-report .report-doc-header h1{font-size:12pt;margin:0 0 2px}.ekossta-one-page-report .report-doc-header h2{font-size:9pt;margin:0 0 3px}.ekossta-one-page-report .report-doc-ribbon{padding:2px 8px;font-size:6pt}.ekossta-one-page-report .report-meta-table,.ekossta-one-page-report .report-data-table{font-size:6.5pt;margin:4px 0 5px}.ekossta-one-page-report .report-meta-table th,.ekossta-one-page-report .report-meta-table td,.ekossta-one-page-report .report-data-table th,.ekossta-one-page-report .report-data-table td{padding:2px 3px}.ekossta-one-page-report .report-kpi-row{gap:4px;margin:4px 0 5px}.ekossta-one-page-report .report-kpi-row>div{min-height:27px;padding:3px;gap:0}.ekossta-one-page-report .report-kpi-row b{font-size:10pt}.ekossta-one-page-report .report-section-heading{font-size:6.5pt;margin:4px 0 2px;padding-bottom:2px}.ekossta-one-page-report .report-section-heading>span{flex-basis:13px;height:13px;font-size:6pt}.ekossta-one-page-report .report-fill-box{min-height:18px;padding:3px 4px;font-size:7pt}.ekossta-one-page-report .report-two-columns{gap:6px}.ekossta-one-page-report .report-photos-grid{gap:4px;margin:4px 0}.ekossta-one-page-report .report-photo-slot{padding:2px}.ekossta-one-page-report .report-photo-slot img,.ekossta-one-page-report .report-photo-empty{height:16mm;min-height:16mm;font-size:6pt}.ekossta-one-page-report .report-photo-slot figcaption{font-size:5pt;padding:2px}.ekossta-one-page-report .report-signature-grid{gap:12px;margin-top:6px;padding-top:4px;font-size:6pt}.ekossta-one-page-report .report-signature-grid p{margin:2px 0}.ekossta-one-page-report .report-sign-line{margin-top:5px!important;padding-top:2px}.ekossta-one-page-report .report-doc-footer{margin-top:4px;padding-top:3px;font-size:5.5pt}.report-appendix-page{break-before:page;page-break-before:always;margin-top:16mm;padding-top:5mm}.report-appendix-header{text-align:center;margin-bottom:14px}.report-appendix-header h1{font-size:16pt;color:#14213a;margin:14px 0 5px}.report-appendix-header p{font-size:9pt;color:#526175;margin:0}.report-appendix-page .report-data-table{font-size:9pt}.report-appendix-page .report-data-table th,.report-appendix-page .report-data-table td{padding:6px 8px}@media print{.print-action-bar{display:none!important}.print-content{margin:0 auto}.report-appendix-page{break-before:page;page-break-before:always;margin-top:0;padding-top:0}.report-appendix-page thead{display:table-header-group}.report-appendix-page tr{break-inside:avoid;page-break-inside:avoid}.report-doc-header,.report-meta-table,.report-kpi-row,.report-section-heading,.report-signature-grid{break-inside:avoid;page-break-inside:avoid}}`;
    w.document.open();w.document.write(`<!doctype html><html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${activityEsc_($('docTitle')?.value||'Laporan e-KOSSTA')}</title><style>${css}</style></head><body><div class="print-action-bar"><button type="button" onclick="window.focus();window.print()">Cetak / Simpan PDF</button><button type="button" onclick="window.close()">Tutup</button></div><main class="print-content">${content}</main><script>window.addEventListener('load',function(){setTimeout(function(){window.focus();try{window.print()}catch(e){}},500)});<\/script></body></html>`);w.document.close();w.focus();
  }catch(e){try{w.close()}catch(x){}toast(e.message||'Gagal menyediakan cetakan.');}
}
function resetReportPhotoInputs_(){
  [1,2,3,4].forEach(n=>{const input=$('reportPhoto'+n);if(input)input.value='';const label=$('reportPhotoName'+n);if(label)label.textContent='Pilih gambar';});
}
function ensureReportPhotoSlots_(){
  const ed=editorEl_();if(!ed)return;
  const existing=ed.querySelectorAll('[data-report-photo-slot]');
  if(existing.length>=4)return;
  let grid=ed.querySelector('.report-photos-grid');
  if(!grid){
    const heading=document.createElement('h3');heading.className='report-section-heading';heading.innerHTML='<span>08</span> LAPORAN BERGAMBAR AKTIVITI';
    grid=document.createElement('div');grid.className='report-photos-grid';
    ed.appendChild(heading);ed.appendChild(grid);
  }
  const seen=new Set([...grid.querySelectorAll('[data-report-photo-slot]')].map(el=>Number(el.dataset.reportPhotoSlot)));
  for(let slot=1;slot<=4;slot++)if(!seen.has(slot)){
    const fig=document.createElement('figure');fig.className='report-photo-slot';fig.dataset.reportPhotoSlot=String(slot);fig.innerHTML='<div class="report-photo-empty">Muat naik Foto '+slot+'</div><figcaption>FOTO AKTIVITI '+slot+'</figcaption>';grid.appendChild(fig);
  }
}
function createReportPhotoId_(){return 'IMG-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,9).toUpperCase();}
function compressReportImage_(file){
  return new Promise((resolve,reject)=>{
    if(!file||!/^image\//i.test(file.type))return reject(new Error('Pilih fail gambar sahaja.'));
    if(file.size>12*1024*1024)return reject(new Error('Saiz gambar asal terlalu besar. Had 12 MB setiap foto.'));
    const reader=new FileReader();reader.onerror=()=>reject(new Error('Tidak dapat membaca fail gambar.'));
    reader.onload=()=>{const image=new Image();image.onerror=()=>reject(new Error('Fail gambar tidak dapat dibuka.'));image.onload=()=>{
      const maxW=620,maxH=460,ratio=Math.min(1,maxW/image.width,maxH/image.height);const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));
      const ctx=canvas.getContext('2d');ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
      let q=.62,data=canvas.toDataURL('image/jpeg',q);while(data.length>90000&&q>.36){q-=.06;data=canvas.toDataURL('image/jpeg',q);}if(data.length>120000)return reject(new Error('Foto masih terlalu besar selepas pemampatan. Pilih gambar lain.'));
      resolve({dataUrl:data,mimeType:'image/jpeg',fileName:String(file.name||'foto.jpg').replace(/[^a-zA-Z0-9._-]/g,'_'),uploaded:false});
    };image.src=reader.result;};reader.readAsDataURL(file);
  });
}
async function handleReportPhotoSelection_(slot,file){
  if(!file)return;
  try{
    const photo=await compressReportImage_(file);const id=createReportPhotoId_();REPORT_PHOTO_CACHE_[id]=photo;
    const slotEl=editorEl_()?.querySelector(`[data-report-photo-slot="${slot}"]`);
    if(!slotEl){toast('Templat tidak mempunyai slot gambar. Muat templat laporan dahulu.');delete REPORT_PHOTO_CACHE_[id];return;}
    slotEl.innerHTML=`<img src="${photo.dataUrl}" data-report-photo-id="${id}" alt="Foto aktiviti ${slot}"><figcaption contenteditable="true">FOTO AKTIVITI ${slot}</figcaption>`;
    const label=$('reportPhotoName'+slot);if(label)label.textContent=file.name+' • sedang dimuat naik';
    if($('docEditorStatus'))$('docEditorStatus').textContent='Foto '+slot+' telah dimampatkan. Muat naik latar sedang berjalan; anda boleh terus melengkapkan laporan.';
    // Upload while the user continues filling the report instead of blocking the Save button later.
    photo.uploadPromise=uploadReportPhotoChunks_(id,photo).then(()=>{
      photo.uploaded=true;photo.uploadError='';
      if(label)label.textContent=file.name+' • sedia';
      if($('docEditorStatus'))$('docEditorStatus').textContent='Foto '+slot+' sedia disimpan bersama laporan.';
      return true;
    }).catch(error=>{
      photo.uploaded=false;photo.uploadError=error?.message||'Muat naik gagal';
      if(label)label.textContent=file.name+' • cuba semula ketika simpan';
      if($('docEditorStatus'))$('docEditorStatus').textContent='Foto '+slot+' belum selesai dimuat naik. Sistem akan cuba semula semasa simpan.';
      console.warn('Muat naik foto laporan gagal:',error);
      return false;
    });
  }catch(e){toast(e.message||'Gagal memproses foto.');}
}
async function uploadReportPhotoChunks_(photoId,photo){
  const base64=String(photo.dataUrl||'').split(',')[1]||'';if(!base64)throw new Error('Data foto tidak sah.');
  const size=2800,total=Math.ceil(base64.length/size);if(total>45)throw new Error('Foto melebihi saiz simpanan yang dibenarkan. Pilih foto lebih kecil.');
  for(let start=0;start<total;start+=3){
    const batch=[];for(let index=start;index<Math.min(start+3,total);index++){const chunk=base64.slice(index*size,(index+1)*size);batch.push(apiGet('saveReportImageChunk',{token:state.token,photoId,fileName:photo.fileName,mimeType:photo.mimeType,chunkIndex:index+1,chunkTotal:total,dataChunk:chunk}));}
    await Promise.all(batch);
  }
}
async function hydrateReportPhotosInEditor_(documentId){
  const ed=editorEl_();if(!ed||!documentId)return;
  const ids=[...new Set([...ed.querySelectorAll('img[data-report-photo-id]')].map(n=>String(n.dataset.reportPhotoId||'')).filter(Boolean))];if(!ids.length)return;
  try{const d=await apiGet('getReportImages',{token:state.token,documentId});const imgs=d.images||[];
    imgs.forEach(img=>{const id=String(img.PHOTO_ID||'');if(!id||!ids.includes(id)||!img.DATA_URL)return;REPORT_PHOTO_CACHE_[id]={dataUrl:img.DATA_URL,mimeType:img.MIME_TYPE||'image/jpeg',fileName:img.FILE_NAME||'foto.jpg',uploaded:true};ed.querySelectorAll(`img[data-report-photo-id="${CSS.escape(id)}"]`).forEach(el=>el.setAttribute('src',img.DATA_URL));});
    imgs.forEach(img=>{const slot=ed.querySelector(`img[data-report-photo-id="${CSS.escape(String(img.PHOTO_ID||''))}"]`)?.closest('[data-report-photo-slot]');if(slot){const label=$('reportPhotoName'+slot.dataset.reportPhotoSlot);if(label)label.textContent=img.FILE_NAME||'Foto tersimpan';}});
  }catch(e){console.warn('Foto laporan tidak dapat dimuatkan:',e);toast('Dokumen dibuka tetapi foto gagal dimuatkan: '+(e.message||'Ralat'));}
}



/* =========================================================
   V3.8 PENCAPAIAN BERDASARKAN AKTIVITI
   Setiap borang merekod satu acara dan mencipta/kemas kini rekod bagi murid yang ditandakan.
========================================================= */
let PENCAPAIAN_ACTIVITY_LIST_=[];
let PENCAPAIAN_CURRENT_ACTIVITY_=null;
let PENCAPAIAN_RECORD_PARTICIPANTS_=[];
let PENCAPAIAN_RECORDS_=[];
let PENCAPAIAN_GROUPS_=[];
let PENCAPAIAN_SELECTED_KP_=new Set();
let PENCAPAIAN_CURRENT_GROUP_ID_='';
let PENCAPAIAN_CURRENT_LEGACY_KEY_=null;

function pencapaianEsc_(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function pencapaianDateText_(v){
  if(!v)return '-';
  const s=String(v);
  const match=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(match){const d=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));return d.toLocaleDateString('ms-MY',{day:'2-digit',month:'short',year:'numeric'});}
  const d=new Date(v);if(isNaN(d.getTime()))return s.slice(0,10);
  return d.toLocaleDateString('ms-MY',{day:'2-digit',month:'short',year:'numeric'});
}
function pencapaianDateInput_(v){
  if(!v)return '';
  const s=String(v);const m=s.match(/^(\d{4}-\d{2}-\d{2})/);if(m)return m[1];
  const d=new Date(v);if(isNaN(d.getTime()))return '';
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function pencapaianLevelText_(v){return String(v||'-').replace(/_/g,' ');}
async function loadPencapaianPage(){
  const wrap=$('pencapaianActivitiesTableWrap');if(!wrap)return;
  wrap.innerHTML='<div class="empty">Memuatkan aktiviti berdaftar...</div>';
  try{
    const d=await apiGet('getPencapaianAktivitiList',{token:state.token});
    PENCAPAIAN_ACTIVITY_LIST_=d.data||[];
    const years=[...new Set(PENCAPAIAN_ACTIVITY_LIST_.map(a=>String(a.TARIKH||'').slice(0,4)).filter(y=>/^\d{4}$/.test(y)))].sort((a,b)=>Number(b)-Number(a));
    const yearSel=$('pencapaianActivityFilterYear'),prior=yearSel?.value||'';
    if(yearSel){yearSel.innerHTML='<option value="">Semua Tahun</option>'+years.map(y=>`<option value="${pencapaianEsc_(y)}">${pencapaianEsc_(y)}</option>`).join('');yearSel.value=years.includes(prior)?prior:'';}
    renderPencapaianActivityTable_();
  }catch(e){wrap.innerHTML=`<div class="empty">Gagal memuatkan aktiviti: ${pencapaianEsc_(e.message||e)}</div>`;toast(e.message||'Gagal memuatkan aktiviti berdaftar.');}
}
function renderPencapaianActivityTable_(){
  const wrap=$('pencapaianActivitiesTableWrap');if(!wrap)return;
  const q=String($('pencapaianActivitySearch')?.value||'').trim().toLowerCase();
  const year=String($('pencapaianActivityFilterYear')?.value||'');
  const level=String($('pencapaianActivityFilterLevel')?.value||'').toUpperCase();
  const rows=PENCAPAIAN_ACTIVITY_LIST_.filter(a=>{
    const hay=[a.NAMA_AKTIVITI,a.TEMPAT,a.PERINGKAT].join(' ').toLowerCase();
    return (!q||hay.includes(q))&&(!year||String(a.TARIKH||'').slice(0,4)===year)&&(!level||String(a.PERINGKAT||'').toUpperCase()===level);
  });
  const count=$('pencapaianActivityCount');if(count)count.textContent=`${rows.length} aktiviti berdaftar`;
  if(!rows.length){wrap.innerHTML='<div class="empty">Tiada aktiviti berdaftar yang sepadan. Daftarkan aktiviti terlebih dahulu dalam Aktiviti & Acara.</div>';return;}
  wrap.innerHTML='<table class="pencapaian-activity-table"><thead><tr><th>AKTIVITI</th><th>TARIKH</th><th>TEMPAT</th><th>PERINGKAT</th><th>PESERTA</th><th>REKOD</th><th>STATUS</th><th>TINDAKAN</th></tr></thead><tbody>'+rows.map((a,i)=>{
    const status=Number(a.REKOD||0)>0?'TELAH DIREKOD':'BELUM DIREKOD';
    return `<tr><td><b>${pencapaianEsc_(a.NAMA_AKTIVITI||'-')}</b><small>${pencapaianEsc_(a.AKTIVITI_ID||'')}</small></td><td>${pencapaianEsc_(pencapaianDateText_(a.TARIKH))}</td><td>${pencapaianEsc_(a.TEMPAT||'-')}</td><td><span class="pencapaian-level">${pencapaianEsc_(a.PERINGKAT||'-')}</span></td><td class="pencapaian-count-cell"><b>${Number(a.PESERTA||0)}</b></td><td class="pencapaian-count-cell"><b>${Number(a.REKOD||0)}</b></td><td><span class="pencapaian-status-pill ${status==='TELAH DIREKOD'?'is-recorded':'is-pending'}">${status}</span></td><td><button class="btn ${a.CAN_MANAGE===false?'secondary':'primary'} small" type="button" data-pencapaian-open-activity="${pencapaianEsc_(a.AKTIVITI_ID)}">${a.CAN_MANAGE===false?'Lihat':'✎ Rekod'}</button></td></tr>`;
  }).join('')+'</tbody></table>';
  wrap.querySelectorAll('[data-pencapaian-open-activity]').forEach(btn=>btn.addEventListener('click',()=>openPencapaianActivityRecord_(btn.dataset.pencapaianOpenActivity)));
}
async function openPencapaianActivityRecord_(activityId,groupToOpen=null){
  const activity=PENCAPAIAN_ACTIVITY_LIST_.find(a=>String(a.AKTIVITI_ID)===String(activityId));
  PENCAPAIAN_READ_ONLY_=activity?.CAN_MANAGE===false;
  const status=$('pencapaianRecordStatus');if(status)status.textContent='Memuatkan peserta dan rekod sedia ada...';
  try{
    const d=await apiGet('getPencapaianAktivitiRecords',{token:state.token,aktivitiId:activityId});
    PENCAPAIAN_READ_ONLY_=d.canManage===false||activity?.CAN_MANAGE===false;
    PENCAPAIAN_CURRENT_ACTIVITY_=d.aktiviti||activity||null;
    PENCAPAIAN_RECORD_PARTICIPANTS_=d.participants||[];
    PENCAPAIAN_RECORDS_=d.records||[];
    PENCAPAIAN_GROUPS_=groupPencapaianRecords_(PENCAPAIAN_RECORDS_);
    PENCAPAIAN_CURRENT_GROUP_ID_='';PENCAPAIAN_CURRENT_LEGACY_KEY_=null;
    const title=PENCAPAIAN_CURRENT_ACTIVITY_?.NAMA_AKTIVITI||'Aktiviti';
    $('pencapaianRecordActivityId').value=String(activityId);
    $('pencapaianRecordActivityTitle').textContent=title;
    $('pencapaianRecordActivityMeta').textContent=[pencapaianDateText_(PENCAPAIAN_CURRENT_ACTIVITY_?.TARIKH),PENCAPAIAN_CURRENT_ACTIVITY_?.TEMPAT,PENCAPAIAN_CURRENT_ACTIVITY_?.PERINGKAT].filter(Boolean).join(' • ');
    $('pencapaianRecordYear').value=String(PENCAPAIAN_CURRENT_ACTIVITY_?.TARIKH||'').slice(0,4)||String(new Date().getFullYear());
    $('pencapaianRecordDate').value=pencapaianDateInput_(PENCAPAIAN_CURRENT_ACTIVITY_?.TARIKH)||pencapaianDateInput_(new Date());
    $('pencapaianRecordLevel').value=String(PENCAPAIAN_CURRENT_ACTIVITY_?.PERINGKAT||'').toUpperCase();
    $('pencapaianRecordName').value='';$('pencapaianRecordEngagementTitle').value='';$('pencapaianRecordPosition').value='';$('pencapaianRecordCategory').value='';$('pencapaianRecordNotes').value='';$('pencapaianRecordEvidence').value='';
    $('pencapaianRecordGroupId').value='';$('pencapaianRecordLegacyKey').value='';
    $('pencapaianRecordParticipantSearch').value='';
    const classes=[...new Set(PENCAPAIAN_RECORD_PARTICIPANTS_.map(x=>String(x.KELAS||'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ms'));
    $('pencapaianRecordParticipantClass').innerHTML='<option value="">Semua Kelas</option>'+classes.map(c=>`<option value="${pencapaianEsc_(c)}">${pencapaianEsc_(c)}</option>`).join('');
    // Acara baharu: semua peserta berdaftar dipilih secara lalai.
    PENCAPAIAN_SELECTED_KP_=new Set(PENCAPAIAN_RECORD_PARTICIPANTS_.map(x=>String(x.NO_KP)));
    renderPencapaianParticipants_();renderPencapaianExistingGroups_();
    PENCAPAIAN_RECORD_MODE_=true;
    $('pencapaianListView').hidden=true;$('pencapaianRecordView').hidden=false;
    renderPageSubnav_('pencapaian');
    if(status)status.textContent=PENCAPAIAN_READ_ONLY_?'Paparan sahaja: anda boleh melihat rekod acara dan pencapaian, tetapi hanya guru pengurus aktiviti boleh mengubah atau menyimpan rekod.':'';
    applyPencapaianReadOnly_();
    if(groupToOpen){const group=PENCAPAIAN_GROUPS_.find(g=>g.groupKey===groupToOpen);if(group)openPencapaianRecordGroup_(groupToOpen);}
    else if(!PENCAPAIAN_READ_ONLY_)schedulePencapaianUnitPreview_();
  }catch(e){if(status)status.textContent=e.message||String(e);toast(e.message||'Gagal membuka rekod aktiviti.');}
}
function applyPencapaianReadOnly_(){
  const form=$('pencapaianActivityRecordForm');
  const newEvent=$('pencapaianNewEventBtn'),refresh=$('pencapaianRefreshRecordBtn');
  if(newEvent)newEvent.hidden=PENCAPAIAN_READ_ONLY_;
  if(refresh)refresh.hidden=PENCAPAIAN_READ_ONLY_;
  const formButtons=['pencapaianSelectAllBtn','pencapaianClearAllBtn','pencapaianSaveAndBackBtn','pencapaianRecordSaveBtn'];
  formButtons.forEach(id=>{const el=$(id);if(!el)return;if(id==='pencapaianSaveAndBackBtn'||id==='pencapaianRecordSaveBtn')el.hidden=PENCAPAIAN_READ_ONLY_;else el.disabled=PENCAPAIAN_READ_ONLY_;});
  if(form){form.querySelectorAll('input:not([type="hidden"]),select,textarea,button[data-pencapaian-rank]').forEach(el=>{if(el.id==='pencapaianRecordBackBottomBtn')return;el.disabled=PENCAPAIAN_READ_ONLY_;});}
}
function groupPencapaianRecords_(records){
  const map=new Map();
  (records||[]).forEach(r=>{
    const groupId=String(r.KUMPULAN_REKOD_ID||'').trim();
    const legacyKey={AKTIVITI_ID:String(r.AKTIVITI_ID||''),NAMA_PENCAPAIAN:String(r.NAMA_PENCAPAIAN||''),TARIKH:pencapaianDateInput_(r.TARIKH),TAHUN:String(r.TAHUN||''),PERINGKAT:String(r.PERINGKAT||''),KEDUDUKAN:String(r.KEDUDUKAN||''),KATEGORI_PENYERTAAN:String(r.KATEGORI_PENYERTAAN||''),TAJUK_PENGLIBATAN:String(r.TAJUK_PENGLIBATAN||'')};
    const groupKey=groupId?'ID:'+groupId:'LEGACY:'+JSON.stringify(legacyKey);
    if(!map.has(groupKey))map.set(groupKey,{groupKey,groupId,legacyKey,first:r,records:[]});
    map.get(groupKey).records.push(r);
  });
  return [...map.values()].sort((a,b)=>new Date(b.first.TARIKH||0)-new Date(a.first.TARIKH||0));
}
function renderPencapaianExistingGroups_(){
  const wrap=$('pencapaianExistingGroupsWrap');if(!wrap)return;
  if(!PENCAPAIAN_GROUPS_.length){wrap.innerHTML='<div class="empty">Belum ada rekod pencapaian untuk aktiviti ini. Isi acara di atas dan simpan untuk merekod murid yang terlibat.</div>';return;}
  wrap.innerHTML='<div class="pencapaian-existing-list">'+PENCAPAIAN_GROUPS_.map((g,i)=>{
    const r=g.first;const students=[...new Set(g.records.map(x=>String(x.NAMA_MURID||x.NO_KP||'')).filter(Boolean))];
    return `<article class="pencapaian-existing-item"><div class="pencapaian-existing-main"><b>${pencapaianEsc_(r.NAMA_PENCAPAIAN||'Acara tanpa tajuk')}</b><small>${pencapaianEsc_(pencapaianDateText_(r.TARIKH))} • ${pencapaianEsc_(r.PERINGKAT||'-')} • ${pencapaianEsc_(r.KEDUDUKAN||'-')}</small><small>${students.length} murid direkodkan</small></div><button type="button" class="btn secondary small" data-pencapaian-open-group="${i}">Buka Rekod</button></article>`;
  }).join('')+'</div>';
  wrap.querySelectorAll('[data-pencapaian-open-group]').forEach(btn=>btn.addEventListener('click',()=>openPencapaianRecordGroup_(PENCAPAIAN_GROUPS_[Number(btn.dataset.pencapaianOpenGroup)].groupKey)));
}
function openPencapaianRecordGroup_(groupKey){
  const g=PENCAPAIAN_GROUPS_.find(x=>x.groupKey===groupKey);if(!g)return toast('Kumpulan rekod tidak ditemui.');
  const r=g.first;
  PENCAPAIAN_CURRENT_GROUP_ID_=String(g.groupId||'');PENCAPAIAN_CURRENT_LEGACY_KEY_=g.groupId?null:g.legacyKey;
  $('pencapaianRecordGroupId').value=PENCAPAIAN_CURRENT_GROUP_ID_;
  $('pencapaianRecordLegacyKey').value=PENCAPAIAN_CURRENT_LEGACY_KEY_?JSON.stringify(PENCAPAIAN_CURRENT_LEGACY_KEY_):'';
  $('pencapaianRecordName').value=String(r.NAMA_PENCAPAIAN||'');
  $('pencapaianRecordEngagementTitle').value=String(r.TAJUK_PENGLIBATAN||'');
  $('pencapaianRecordYear').value=String(r.TAHUN||String(r.TARIKH||'').slice(0,4));
  $('pencapaianRecordDate').value=pencapaianDateInput_(r.TARIKH);
  $('pencapaianRecordLevel').value=String(r.PERINGKAT||'').toUpperCase();
  $('pencapaianRecordPosition').value=String(r.KEDUDUKAN||'').toUpperCase();
  $('pencapaianRecordCategory').value=String(r.KATEGORI_PENYERTAAN||'').toUpperCase()||'';
  $('pencapaianRecordNotes').value=String(r.CATATAN||'');$('pencapaianRecordEvidence').value=String(r.PAUTAN_BUKTI||'');
  PENCAPAIAN_SELECTED_KP_=new Set(g.records.map(x=>String(x.NO_KP||'')).filter(Boolean));
  renderPencapaianParticipants_();
  $('pencapaianRecordStatus').textContent=PENCAPAIAN_READ_ONLY_?'Paparan sahaja: rekod acara ini diurus oleh guru lain. Anda boleh menyemak maklumat, murid dan pencapaian yang telah direkod.':'Anda sedang membuka rekod acara yang telah disimpan. Semak senarai murid sebelum menyimpan perubahan.';
  selectPencapaianRank_(String(r.KEDUDUKAN||'').toUpperCase());
  if(!PENCAPAIAN_READ_ONLY_)$('pencapaianRecordName').focus();
  if(!PENCAPAIAN_READ_ONLY_)schedulePencapaianUnitPreview_();
  applyPencapaianReadOnly_();
}
function renderPencapaianParticipants_(){
  const wrap=$('pencapaianRecordParticipantsWrap');if(!wrap)return;
  const q=String($('pencapaianRecordParticipantSearch')?.value||'').trim().toLowerCase();
  const cls=String($('pencapaianRecordParticipantClass')?.value||'');
  const rows=PENCAPAIAN_RECORD_PARTICIPANTS_.filter(m=>{
    const hay=[m.NAMA,m.NO_KP,m.KELAS,m.TINGKATAN].join(' ').toLowerCase();
    return (!q||hay.includes(q))&&(!cls||String(m.KELAS||'')===cls);
  });
  const total=PENCAPAIAN_RECORD_PARTICIPANTS_.length,selected=PENCAPAIAN_SELECTED_KP_.size;
  const count=$('pencapaianRecordParticipantsCount');if(count)count.textContent=`${total} peserta berdaftar • ${selected} dipilih`;
  if(!rows.length){wrap.innerHTML='<div class="empty">Tiada murid berdaftar sepadan. Pastikan peserta telah didaftarkan dalam Aktiviti & Acara.</div>';return;}
  wrap.innerHTML=rows.map((m,i)=>{
    const kp=String(m.NO_KP||''),checked=PENCAPAIAN_SELECTED_KP_.has(kp);
    return `<label class="pencapaian-participant-row ${checked?'selected':''}"><span class="pencapaian-participant-index">${i+1}</span><input type="checkbox" data-pencapaian-student="${pencapaianEsc_(kp)}" ${checked?'checked':''} ${PENCAPAIAN_READ_ONLY_?'disabled':''}><span class="pencapaian-participant-info"><b>${pencapaianEsc_(m.NAMA||'-')}</b><small>${pencapaianEsc_([m.KELAS].filter(Boolean).join(' • '))}</small></span><span class="pencapaian-participant-badge">${checked?'DIPILIH':'TIDAK DIPILIH'}</span></label>`;
  }).join('');
  wrap.querySelectorAll('[data-pencapaian-student]').forEach(input=>input.addEventListener('change',()=>{
    const kp=String(input.dataset.pencapaianStudent||'');
    if(input.checked)PENCAPAIAN_SELECTED_KP_.add(kp);else PENCAPAIAN_SELECTED_KP_.delete(kp);
    input.closest('.pencapaian-participant-row')?.classList.toggle('selected',input.checked);
    const badge=input.closest('.pencapaian-participant-row')?.querySelector('.pencapaian-participant-badge');if(badge)badge.textContent=input.checked?'DIPILIH':'TIDAK DIPILIH';
    const c=$('pencapaianRecordParticipantsCount');if(c)c.textContent=`${PENCAPAIAN_RECORD_PARTICIPANTS_.length} peserta berdaftar • ${PENCAPAIAN_SELECTED_KP_.size} dipilih`;
    renderPencapaianUnitPreview_();
  }));
}
let PENCAPAIAN_UNIT_PREVIEW_CACHE_=[];
let PENCAPAIAN_UNIT_PREVIEW_CACHE_KEY_='';
let PENCAPAIAN_UNIT_PREVIEW_TIMER_=null;
let PENCAPAIAN_UNIT_PREVIEW_REQUEST_=0;
function schedulePencapaianUnitPreview_(){
  if(PENCAPAIAN_UNIT_PREVIEW_TIMER_)clearTimeout(PENCAPAIAN_UNIT_PREVIEW_TIMER_);
  PENCAPAIAN_UNIT_PREVIEW_REQUEST_++;
  PENCAPAIAN_UNIT_PREVIEW_CACHE_KEY_='';
  PENCAPAIAN_UNIT_PREVIEW_TIMER_=setTimeout(loadPencapaianUnitPreview_,280);
}
async function loadPencapaianUnitPreview_(){
  const host=$('pencapaianUnitMappingPreview');if(!host)return;
  const activityId=String($('pencapaianRecordActivityId')?.value||'');
  const category=String($('pencapaianRecordCategory')?.value||'');
  const year=String($('pencapaianRecordYear')?.value||'').trim();
  if(!category||!/^\d{4}$/.test(year)||!activityId){
    PENCAPAIAN_UNIT_PREVIEW_CACHE_=[];
    host.innerHTML='<span class="pencapaian-preview-muted">Pilih kategori dan tahun untuk menyemak unit bagi setiap peserta.</span>';
    return;
  }
  const requestId=++PENCAPAIAN_UNIT_PREVIEW_REQUEST_;
  const cacheKey=[activityId,category,year].join('|');
  host.innerHTML='<span class="pencapaian-preview-muted">Menyemak penempatan unit murid...</span>';
  try{
    const d=await apiGet('getPencapaianUnitPreview',{token:state.token,aktivitiId:activityId,kategoriPenyertaan:category,tahun:year});
    if(requestId!==PENCAPAIAN_UNIT_PREVIEW_REQUEST_)return;
    PENCAPAIAN_UNIT_PREVIEW_CACHE_=d.data||[];
    PENCAPAIAN_UNIT_PREVIEW_CACHE_KEY_=cacheKey;
    renderPencapaianUnitPreview_();
  }catch(e){
    if(requestId!==PENCAPAIAN_UNIT_PREVIEW_REQUEST_)return;
    host.innerHTML='<span class="pencapaian-preview-error">Tidak dapat menyemak pemetaan unit: '+pencapaianEsc_(e.message||String(e))+'</span>';
  }
}
function renderPencapaianUnitPreview_(){
  const host=$('pencapaianUnitMappingPreview');if(!host)return;
  const category=String($('pencapaianRecordCategory')?.value||'');
  const year=String($('pencapaianRecordYear')?.value||'').trim();
  if(!category||!/^\d{4}$/.test(year)){
    host.innerHTML='<span class="pencapaian-preview-muted">Pilih kategori dan tahun untuk menyemak unit bagi setiap peserta.</span>';return;
  }
  const selected=new Set([...PENCAPAIAN_SELECTED_KP_].map(String));
  if(!selected.size){host.innerHTML='<span class="pencapaian-preview-muted">Tiada murid dipilih. Pilih murid untuk melihat unit yang akan dikaitkan dengan rekod.</span>';return;}
  const expectedKey=[String($('pencapaianRecordActivityId')?.value||''),category,year].join('|');
  if(PENCAPAIAN_UNIT_PREVIEW_CACHE_KEY_!==expectedKey){host.innerHTML='<span class="pencapaian-preview-muted">Pemetaan unit sedang dimuatkan...</span>';return;}
  const rows=PENCAPAIAN_UNIT_PREVIEW_CACHE_.filter(x=>selected.has(String(x.NO_KP||'')));
  const ok=rows.filter(x=>x.STATUS_PEMETAAN==='OK').length;
  const missing=rows.filter(x=>x.STATUS_PEMETAAN==='TIADA_UNIT').length;
  const ambiguous=rows.filter(x=>x.STATUS_PEMETAAN==='BERGANDA').length;
  const head=`<div class="pencapaian-unit-preview-head"><b>Pemetaan unit bagi ${rows.length} murid dipilih</b><span>${pencapaianEsc_(category)} • ${pencapaianEsc_(year)}</span></div>`;
  if(!rows.length){host.innerHTML=head+'<p class="pencapaian-preview-muted">Tiada peserta aktiviti yang sepadan dengan pilihan sekarang.</p>';return;}
  const list=rows.map(x=>{
    const status=x.STATUS_PEMETAAN||'TIADA_UNIT';
    const unit=status==='OK'?x.NAMA_UNIT:(status==='BERGANDA'?(x.NAMA_UNIT||'Semak penempatan'):'Tiada unit sepadan');
    const cls=status==='OK'?'is-mapped':'is-unmapped';
    const msg=status==='OK'?'Rekod akan dipautkan ke unit ini':(x.MESSAGE||'Sila semak PENEMPATAN_UNIT');
    return `<div class="pencapaian-unit-preview-row ${cls}"><div class="pencapaian-unit-preview-student"><b>${pencapaianEsc_(x.NAMA||'Murid')}</b><small>${pencapaianEsc_(x.KELAS||'')}</small></div><div class="pencapaian-unit-preview-target"><b>${pencapaianEsc_(unit)}</b><small>${pencapaianEsc_(msg)}</small></div></div>`;
  }).join('');
  const summary=`<div class="pencapaian-unit-preview-summary"><span class="ok">${ok} dipautkan</span>${missing?`<span class="bad">${missing} tiada penempatan</span>`:''}${ambiguous?`<span class="bad">${ambiguous} penempatan berganda</span>`:''}</div>`;
  host.innerHTML=head+summary+`<div class="pencapaian-unit-preview-list">${list}</div>`;
}
function setAllPencapaianParticipants_(checked){
  PENCAPAIAN_SELECTED_KP_=new Set(checked?PENCAPAIAN_RECORD_PARTICIPANTS_.map(x=>String(x.NO_KP)):[]);
  renderPencapaianParticipants_();
  renderPencapaianUnitPreview_();
}
function selectPencapaianRank_(position){
  const select=$('pencapaianRecordPosition');if(select&&position)select.value=position;
  document.querySelectorAll('[data-pencapaian-rank]').forEach(btn=>btn.classList.toggle('active',btn.dataset.pencapaianRank===position));
}
function syncPencapaianRecordYear_(){const d=$('pencapaianRecordDate')?.value||'';if(d&&$('pencapaianRecordYear'))$('pencapaianRecordYear').value=d.slice(0,4);}
function newPencapaianEventRecord_(){
  PENCAPAIAN_CURRENT_GROUP_ID_='';PENCAPAIAN_CURRENT_LEGACY_KEY_=null;
  $('pencapaianRecordGroupId').value='';$('pencapaianRecordLegacyKey').value='';
  $('pencapaianRecordName').value='';$('pencapaianRecordPosition').value='';$('pencapaianRecordCategory').value='';$('pencapaianRecordNotes').value='';$('pencapaianRecordEvidence').value='';
  if(PENCAPAIAN_CURRENT_ACTIVITY_){
    $('pencapaianRecordDate').value=pencapaianDateInput_(PENCAPAIAN_CURRENT_ACTIVITY_.TARIKH)||pencapaianDateInput_(new Date());
    $('pencapaianRecordYear').value=$('pencapaianRecordDate').value.slice(0,4);
    $('pencapaianRecordLevel').value=String(PENCAPAIAN_CURRENT_ACTIVITY_.PERINGKAT||'').toUpperCase();
  }
  PENCAPAIAN_SELECTED_KP_=new Set(PENCAPAIAN_RECORD_PARTICIPANTS_.map(x=>String(x.NO_KP)));
  selectPencapaianRank_('');renderPencapaianParticipants_();schedulePencapaianUnitPreview_();
  $('pencapaianRecordStatus').textContent='Acara baharu. Semua peserta berdaftar ditandakan secara automatik.';
  $('pencapaianRecordName').focus();
}
async function refreshPencapaianRecordData_(silent=false){
  const id=String($('pencapaianRecordActivityId')?.value||'');if(!id)return;
  const groupId=PENCAPAIAN_CURRENT_GROUP_ID_;
  try{
    const d=await apiGet('getPencapaianAktivitiRecords',{token:state.token,aktivitiId:id});
    PENCAPAIAN_RECORD_PARTICIPANTS_=d.participants||[];PENCAPAIAN_RECORDS_=d.records||[];PENCAPAIAN_GROUPS_=groupPencapaianRecords_(PENCAPAIAN_RECORDS_);
    PENCAPAIAN_SELECTED_KP_=new Set(PENCAPAIAN_RECORD_PARTICIPANTS_.map(x=>String(x.NO_KP)));
    if(groupId){const g=PENCAPAIAN_GROUPS_.find(x=>x.groupId===groupId);if(g)PENCAPAIAN_SELECTED_KP_=new Set(g.records.map(x=>String(x.NO_KP||'')));}
    const classes=[...new Set(PENCAPAIAN_RECORD_PARTICIPANTS_.map(x=>String(x.KELAS||'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ms'));
    $('pencapaianRecordParticipantClass').innerHTML='<option value="">Semua Kelas</option>'+classes.map(c=>`<option value="${pencapaianEsc_(c)}">${pencapaianEsc_(c)}</option>`).join('');
    renderPencapaianParticipants_();renderPencapaianExistingGroups_();schedulePencapaianUnitPreview_();
    if(!silent)toast('Senarai peserta dan rekod dikemas kini.');
  }catch(e){toast(e.message||'Gagal memuatkan peserta.');}
}
async function backToPencapaianActivityList_(){
  PENCAPAIAN_RECORD_MODE_=false;PENCAPAIAN_READ_ONLY_=false;
  if($('pencapaianListView'))$('pencapaianListView').hidden=false;
  if($('pencapaianRecordView'))$('pencapaianRecordView').hidden=true;
  renderPageSubnav_('pencapaian');
  await loadPencapaianPage();
}
async function savePencapaianActivityRecord_(event,returnAfterSave){
  if(event)event.preventDefault();
  const btn=$('pencapaianRecordSaveBtn'),status=$('pencapaianRecordStatus');
  const activityId=String($('pencapaianRecordActivityId').value||'');
  const selected=[...PENCAPAIAN_SELECTED_KP_];
  const p={
    token:state.token,aktivitiId:activityId,acaraPencapaian:$('pencapaianRecordName').value.trim(),
    tajukPenglibatan:$('pencapaianRecordEngagementTitle').value,
    kategoriPenyertaan:$('pencapaianRecordCategory').value,peringkat:$('pencapaianRecordLevel').value,
    kedudukan:$('pencapaianRecordPosition').value,tarikh:$('pencapaianRecordDate').value,tahun:$('pencapaianRecordYear').value,
    muridDipilih:JSON.stringify(selected),kumpulanId:$('pencapaianRecordGroupId').value||'',legacyMatchKey:$('pencapaianRecordLegacyKey').value||'',
    catatan:$('pencapaianRecordNotes').value.trim(),pautanBukti:$('pencapaianRecordEvidence').value.trim()
  };
  if(!p.acaraPencapaian||!p.tajukPenglibatan||!p.kategoriPenyertaan||!p.peringkat||!p.kedudukan||!p.tarikh||!p.tahun){toast('Lengkapkan Acara/Pencapaian, Tajuk Penglibatan, Tahun, Peringkat, Kedudukan, Kategori Penyertaan dan Tarikh.');return;}
  if(!selected.length){toast('Pilih sekurang-kurangnya seorang murid yang terlibat.');return;}
  if(btn){btn.disabled=true;btn.textContent='Menyimpan...';}
  if(status)status.textContent='Menyimpan rekod pencapaian bagi murid yang dipilih...';
  try{
    const d=await apiGet('savePencapaianAktivitiBatch',p);
    PENCAPAIAN_CURRENT_GROUP_ID_=String(d.kumpulanId||'');PENCAPAIAN_CURRENT_LEGACY_KEY_=null;
    $('pencapaianRecordGroupId').value=PENCAPAIAN_CURRENT_GROUP_ID_;$('pencapaianRecordLegacyKey').value='';
    if(status)status.textContent=d.message||'Rekod pencapaian berjaya disimpan.';
    toast(d.message||'Rekod pencapaian berjaya disimpan.');
    if(returnAfterSave){await backToPencapaianActivityList_();}
    else{await refreshPencapaianRecordData_(true);await loadPencapaianPage();}
  }catch(e){if(status)status.textContent=e.message||String(e);toast(e.message||'Gagal menyimpan rekod pencapaian.');}
  finally{if(btn){btn.disabled=false;btn.textContent='Simpan Rekod';}}
}

/* Material box/table surface build marker; no app logic changed. */
window.__EKOSSTA_PANEL_LIME_BUILD__ = "SURFACE_LIME_V8_20261022";


/* PRIVASI: sembunyikan NO_KP daripada semua paparan webapp, termasuk kandungan yang dirender dinamik.
   Nilai NO_KP kekal dalam state/atribut data dan backend supaya padanan rekod serta fungsi sedia ada tidak rosak. */
(function installNoKpPrivacyGuard_(){
  if (window.__EKOSSTA_NO_KP_PRIVACY_GUARD__) return;
  const kpPattern = /\b\d{6}(?:[-\s]?\d{2})[-\s]?\d{4}\b/g;
  const normalizeHeader = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const isKpHeader = value => /^NOKP(?:MURID|PELAJAR|PESERTA|UJIAN)?$/.test(normalizeHeader(value));
  function cleanPrivacyText_(value){
    let text=String(value ?? '');
    text=text.replace(/No\.?\s*K\.?\s*P\.?(?:\s*(?:murid|pelajar|peserta|ujian))?\s*[:：-]?\s*\d{6}(?:[-\s]?\d{2})[-\s]?\d{4}\b/gi,'');
    text=text.replace(/\s*[•·|—–-]\s*\d{6}(?:[-\s]?\d{2})[-\s]?\d{4}\b/g,'');
    text=text.replace(kpPattern,'');
    return text.replace(/[ \t]{2,}/g,' ').replace(/\s+([,;])/g,'$1');
  }
  function applyNoKpPrivacyGuard_(root){
    if(!root)return;
    const doc=root.ownerDocument||document;
    const tables=[];
    if(root.matches?.('table'))tables.push(root);
    if(root.querySelectorAll)tables.push(...root.querySelectorAll('table'));
    tables.forEach(table=>{
      const headerRow=table.querySelector('thead tr') || table.rows?.[0];
      if(headerRow){
        const indices=[];
        [...headerRow.cells].forEach((cell,index)=>{if(isKpHeader(cell.textContent))indices.push(index);});
        [...table.rows].forEach(row=>{
          const hasLabelCell=[...row.cells].some(cell=>cell.tagName==='TH'&&isKpHeader(cell.textContent));
          const inHeader=!!row.closest('thead');
          if(hasLabelCell&&!inHeader&&row.cells.length>1){
            row.dataset.ekosstaKpRowHidden='1';
            row.style.setProperty('display','none','important');
          }else if(row.dataset.ekosstaKpRowHidden){
            delete row.dataset.ekosstaKpRowHidden;row.style.removeProperty('display');
          }
          [...row.cells].forEach((cell,index)=>{
            if(indices.includes(index)){
              cell.dataset.ekosstaKpCellHidden='1';cell.style.setProperty('display','none','important');
            }else if(cell.dataset.ekosstaKpCellHidden){
              delete cell.dataset.ekosstaKpCellHidden;cell.style.removeProperty('display');
            }
          });
        });
      }
    });
    const walker=doc.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const textNodes=[];let node;
    while((node=walker.nextNode())){
      const parent=node.parentElement;
      if(!parent||parent.closest('script,style,textarea,template'))continue;
      textNodes.push(node);
    }
    textNodes.forEach(textNode=>{
      const original=textNode.nodeValue||'';
      const cleaned=cleanPrivacyText_(original);
      if(cleaned!==original)textNode.nodeValue=cleaned;
    });
    const attrSelector='[title],[aria-label],[placeholder]';
    const els=[];
    if(root.matches?.(attrSelector))els.push(root);
    if(root.querySelectorAll)els.push(...root.querySelectorAll(attrSelector));
    els.forEach(el=>['title','aria-label','placeholder'].forEach(name=>{
      const value=el.getAttribute(name);if(value==null)return;
      const cleaned=cleanPrivacyText_(value);if(cleaned!==value)el.setAttribute(name,cleaned);
    }));
  }
  window.__EKOSSTA_APPLY_NO_KP_PRIVACY__=applyNoKpPrivacyGuard_;
  window.__EKOSSTA_CLEAN_PRIVACY_HTML__=function(html){
    const template=document.createElement('template');template.innerHTML=String(html??'');
    applyNoKpPrivacyGuard_(template.content);return template.innerHTML;
  };
  const run=()=>applyNoKpPrivacyGuard_(document.body);
  run();
  const observer=new MutationObserver(()=>{
    if(observer._scheduled)return;observer._scheduled=true;
    Promise.resolve().then(()=>{observer._scheduled=false;run();});
  });
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  window.__EKOSSTA_NO_KP_PRIVACY_GUARD__=observer;
})();
