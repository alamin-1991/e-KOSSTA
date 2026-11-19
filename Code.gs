const APP_NAME = 'e-KOSSTA V3.12 Laporan Aktiviti & Dokumen';
const COORDINATOR_ACCOUNT_FEATURE_VERSION_ = '1.0.0';
const SHEETS = { MURID:'MURID', LOG:'AUDIT_LOG', USERS:'USERS', SESSIONS:'SESSIONS', GURU:'GURU', UNIT:'UNIT', USER_UNITS:'USER_UNITS', PLACEMENT:'PENEMPATAN_UNIT', ATTENDANCE:'KEHADIRAN', AJK:'AJK_UNIT', ACTIVITY:'AKTIVITI', PARTICIPANTS:'PESERTA_AKTIVITI', ACHIEVEMENT:'PENCAPAIAN', DOCUMENTS:'DOKUMEN', REPORT_IMAGES:'LAPORAN_GAMBAR', SYSTEM_SETTINGS:'SYSTEM_SETTINGS', SYSTEM_LOGO_CHUNKS:'SYSTEM_LOGO_CHUNKS' };
const SESSION_HOURS = 6;

// Cache tuning: sheet data lives in ScriptCache for 60 seconds and is invalidated
// by successful writes to cacheable school data. Report-image chunks are excluded because
// they only write to a non-cacheable image sheet. Long/large sheets are split into
// small cache items; unusually large cells/sheets automatically fall back to Sheets.
const EKOSSTA_DATA_CACHE_TTL_SECONDS_ = 60;
const EKOSSTA_RESPONSE_CACHE_TTL_SECONDS_ = 25;
const EKOSSTA_CACHEABLE_SHEETS_ = new Set([
  'MURID','UNIT','PENEMPATAN_UNIT','KEHADIRAN','AJK_UNIT','AKTIVITI',
  'PESERTA_AKTIVITI','PENCAPAIAN','GURU','USER_UNITS'
]);
const EKOSSTA_RESPONSE_CACHE_ACTIONS_ = new Set(['getDashboardAnalytics','getRegistrationOptions']);
const EKOSSTA_MUTATING_ACTIONS_ = new Set([
  'registerUser','saveMyUnits','assignCoordinatorUnits','addMurid','bulkAddMurid','bulkDeleteMurid','bulkDeleteAllMurid',
  'addUser','setUserStatus','resetUserPassword','changeUserRole','logoutUserSessions','deleteUser',
  'addGuru','updateGuru','setGuruStatus','deleteGuru','addUnit','updateUnit','setUnitStatus',
  'addUnitMember','removeUnitMember','saveAttendance','saveUnitAjk','saveAktiviti','deleteAktiviti',
  'saveAktivitiPeserta','savePencapaian','setPencapaianStatus','savePencapaianAktivitiBatch',
  'saveDocument','saveSystemLogoChunk','saveAppSettings','logout'
]);
var EKOSSTA_REQUEST_OBJECTS_CACHE_ = {};
var EKOSSTA_REQUEST_VALUES_CACHE_ = {};
var EKOSSTA_CACHE_GENERATION_REQUEST_ = null;
var EKOSSTA_DISABLE_DATA_CACHE_ = false;

function doGet(e){
  const p=(e&&e.parameter)||{}, action=String(p.action||'health').trim();
  EKOSSTA_REQUEST_OBJECTS_CACHE_ = {};
  EKOSSTA_REQUEST_VALUES_CACHE_ = {};
  EKOSSTA_CACHE_GENERATION_REQUEST_ = null;
  EKOSSTA_DISABLE_DATA_CACHE_ = EKOSSTA_MUTATING_ACTIONS_.has(action) || action==='getGuru';
  try{
    const cachedResponse = getApiResponseCache_(action,p);
    if(cachedResponse !== null) return jsonOrJsonp_(cachedResponse,p.callback);
    let result;
    switch(action){
      case 'health': result=health_(); break;
      case 'setup': throw new Error('Endpoint setup dinyahaktifkan. Jalankan setupModelBV2() secara manual daripada editor Apps Script.');
      case 'login': result=login_(p); break;
      case 'getRegistrationOptions': result=getRegistrationOptions_(); break;
      case 'registerUser': result=registerUser_(p); break;
      case 'saveMyUnits': result=saveMyUnits_(p); break;
      case 'assignCoordinatorUnits': result=assignCoordinatorUnitsSecure_(p); break;
      case 'logout': result=logout_(p); break;
      case 'me': result=requireSession_(p.token); break;
      case 'getMurid': result=getMuridSecure_(p.token, String(p.allData||'').toLowerCase()==='true'); break;
      case 'getDashboardAnalytics': result=getDashboardAnalyticsSecure_(p); break;
      case 'getPajskClassReport': result=getPajskClassReportSecure_(p); break;
      case 'addMurid': result=addMuridSecure_(p); break;
      case 'bulkAddMurid': result=bulkAddMuridSecure_(p); break;
      case 'bulkDeleteMurid': result=bulkDeleteMuridSecure_(p); break;
      case 'bulkDeleteAllMurid': result=bulkDeleteAllMuridSecure_(p); break;
      case 'getUsers': result=getUsersSecure_(p.token); break;
      case 'addUser': result=addUserSecure_(p); break;
      case 'setUserStatus': result=setUserStatusSecure_(p); break;
      case 'resetUserPassword': result=resetUserPasswordSecure_(p); break;
      case 'changeUserRole': result=changeUserRoleSecure_(p); break;
      case 'logoutUserSessions': result=logoutUserSessionsSecure_(p); break;
      case 'deleteUser': result=deleteUserSecure_(p); break;
      case 'getGuru': result=getGuruSecure_(p); break;
      case 'addGuru': result=addGuruSecure_(p); break;
      case 'updateGuru': result=updateGuruSecure_(p); break;
      case 'setGuruStatus': result=setGuruStatusSecure_(p); break;
      case 'deleteGuru': result=deleteGuruSecure_(p); break;
      case 'getUnit': result=getUnitSecure_(p); break;
      case 'addUnit': result=addUnitSecure_(p); break;
      case 'updateUnit': result=updateUnitSecure_(p); break;
      case 'setUnitStatus': result=setUnitStatusSecure_(p); break;
      case 'getUnitMembers': result=getUnitMembersSecure_(p); break;
      case 'addUnitMember': result=addUnitMemberSecure_(p); break;
      case 'removeUnitMember': result=removeUnitMemberSecure_(p); break;
      case 'getAttendanceForm': result=getAttendanceFormSecure_(p); break;
      case 'saveAttendance': result=saveAttendanceSecure_(p); break;
      case 'getAttendanceRecords': result=getAttendanceRecordsSecure_(p); break;
      case 'getUnitOverview': result=getUnitOverviewSecure_(p); break;
      case 'getUnitAjkCandidates': result=getUnitAjkCandidatesSecure_(p); break;
      case 'saveUnitAjk': result=saveUnitAjkSecure_(p); break;
      case 'getAktiviti': result=getAktivitiSecure_(p); break;
      case 'saveAktiviti': result=saveAktivitiSecure_(p); break;
      case 'deleteAktiviti': result=deleteAktivitiSecure_(p); break;
      case 'getAktivitiPeserta': result=getAktivitiPesertaSecure_(p); break;
      case 'saveAktivitiPeserta': result=saveAktivitiPesertaSecure_(p); break;
      case 'getPencapaian': result=getPencapaianSecure_(p); break;
      case 'savePencapaian': result=savePencapaianSecure_(p); break;
      case 'setPencapaianStatus': result=setPencapaianStatusSecure_(p); break;
      case 'getPencapaianAktivitiList': result=getPencapaianAktivitiListSecure_(p); break;
      case 'getPencapaianAktivitiRecords': result=getPencapaianAktivitiRecordsSecure_(p); break;
      case 'getPencapaianUnitPreview': result=getPencapaianUnitPreviewSecure_(p); break;
      case 'savePencapaianAktivitiBatch': result=savePencapaianAktivitiBatchSecure_(p); break;
      case 'getAppSettings': result=getAppSettingsSecure_(p.token); break;
      case 'saveSystemLogoChunk': result=saveSystemLogoChunkSecure_(p); break;
      case 'saveAppSettings': result=saveAppSettingsSecure_(p); break;
      case 'getDocuments': result=getDocumentsSecure_(p.token); break;
      case 'getDocument': result=getDocumentSecure_(p); break;
      case 'saveDocument': result=saveDocumentSecure_(p); break;
      case 'getReportsOverview': result=getReportsOverviewSecure_(p); break;
      case 'saveReportImageChunk': result=saveReportImageChunkSecure_(p); break;
      case 'getReportImages': result=getReportImagesSecure_(p); break;
      default: throw new Error('Action tidak dikenali: '+action);
    }
    if (result && result.ok !== false) {
      if (EKOSSTA_MUTATING_ACTIONS_.has(action) || action==='getGuru') invalidateEkosstaDataCache_();
      putApiResponseCache_(action,p,result);
    }
    return jsonOrJsonp_(result,p.callback);
  }catch(err){
    // A failed write can still have partially completed before an exception;
    // invalidating on failed mutations prevents stale reads in that case.
    if (EKOSSTA_MUTATING_ACTIONS_.has(action) || action==='getGuru') invalidateEkosstaDataCache_();
    return jsonOrJsonp_({ok:false,error:err&&err.message?err.message:String(err)},p.callback);
  }
}

function getEkosstaCacheGeneration_(){
  if(EKOSSTA_CACHE_GENERATION_REQUEST_!==null) return EKOSSTA_CACHE_GENERATION_REQUEST_;
  try{EKOSSTA_CACHE_GENERATION_REQUEST_=PropertiesService.getScriptProperties().getProperty('EKOSSTA_DATA_CACHE_GENERATION')||'1';}
  catch(e){EKOSSTA_CACHE_GENERATION_REQUEST_='1';}
  return EKOSSTA_CACHE_GENERATION_REQUEST_;
}
function invalidateEkosstaDataCache_(){
  const next=Date.now().toString(36)+'-'+Utilities.getUuid().replace(/-/g,'').slice(0,8);
  try{PropertiesService.getScriptProperties().setProperty('EKOSSTA_DATA_CACHE_GENERATION',next);}catch(e){}
  EKOSSTA_CACHE_GENERATION_REQUEST_=next;
  EKOSSTA_REQUEST_OBJECTS_CACHE_={};
  EKOSSTA_REQUEST_VALUES_CACHE_={};
}
function cacheKeyDigest_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value),Utilities.Charset.UTF_8).map(b=>(b+256)%256).map(b=>b.toString(16).padStart(2,'0')).join('');}
function apiResponseCacheKey_(action,p){
  const clean={};Object.keys(p||{}).sort().forEach(k=>{if(k!=='callback'&&k!=='_'&&k!=='token')clean[k]=String(p[k]);});
  const tokenPart=p&&p.token?hashPassword_(p.token):'public';
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  return 'EK_API_'+cacheKeyDigest_([ss?ss.getId():'',getEkosstaCacheGeneration_(),action,tokenPart,JSON.stringify(clean)].join('|')).slice(0,60);
}
function getApiResponseCache_(action,p){
  if(!EKOSSTA_RESPONSE_CACHE_ACTIONS_.has(action))return null;
  let raw='';
  try{raw=CacheService.getScriptCache().get(apiResponseCacheKey_(action,p))||'';}catch(e){return null;}
  if(!raw)return null;
  if(action==='getDashboardAnalytics'){
    // A cache hit still validates the current session and role. Dashboard analytics
    // is explicitly global for ADMIN, GURU and PENTADBIR by product design.
    const session=getSession_(p.token);
    if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(session.ROLE))throw new Error('Akses ditolak.');
  }
  try{return JSON.parse(raw);}catch(e){return null;}
}
function putApiResponseCache_(action,p,result){
  if(!EKOSSTA_RESPONSE_CACHE_ACTIONS_.has(action)||!result||result.ok===false)return;
  try{
    const text=JSON.stringify(result);
    // Apps Script cache entries are limited to about 100 KB. Leave headroom.
    if(Utilities.newBlob(text).getBytes().length>85000)return;
    CacheService.getScriptCache().put(apiResponseCacheKey_(action,p),text,EKOSSTA_RESPONSE_CACHE_TTL_SECONDS_);
  }catch(e){}
}
function cachedSheetValueEncode_(value){
  return value instanceof Date ? {__ekosstaDateIso:value.toISOString()} : value;
}
function cachedSheetValueDecode_(value){
  if(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===1&&typeof value.__ekosstaDateIso==='string')return new Date(value.__ekosstaDateIso);
  return value;
}
function readSheetValuesForCache_(sh){
  const name=sh.getName(),lastRow=sh.getLastRow(),lastCol=sh.getLastColumn();
  if(lastRow<1||lastCol<1)return [];
  if(EKOSSTA_DISABLE_DATA_CACHE_||!EKOSSTA_CACHEABLE_SHEETS_.has(name))return sh.getRange(1,1,lastRow,lastCol).getValues();
  if(Object.prototype.hasOwnProperty.call(EKOSSTA_REQUEST_VALUES_CACHE_,name))return EKOSSTA_REQUEST_VALUES_CACHE_[name];
  const generation=getEkosstaCacheGeneration_();
  const base='EKD_'+cacheKeyDigest_([SpreadsheetApp.getActiveSpreadsheet().getId(),name,generation,lastRow,lastCol].join('|')).slice(0,36);
  const cache=CacheService.getScriptCache();
  try{
    const metaText=cache.get(base+'_m');
    if(metaText){
      const meta=JSON.parse(metaText),keys=[];
      for(let i=0;i<meta.parts;i++)keys.push(base+'_p'+i);
      const parts=cache.getAll(keys);
      if(keys.every(k=>Object.prototype.hasOwnProperty.call(parts,k))){
        const values=[];
        keys.forEach(k=>JSON.parse(parts[k]).forEach(row=>values.push(row.map(cachedSheetValueDecode_))));
        if(values.length===lastRow&&values.every(r=>r.length===lastCol)){
          EKOSSTA_REQUEST_VALUES_CACHE_[name]=values;return values;
        }
      }
    }
  }catch(e){}

  const values=sh.getRange(1,1,lastRow,lastCol).getValues();
  try{
    const maxChars=18000, chunks=[];let current=[],currentChars=2;
    for(let i=0;i<values.length;i++){
      const row=values[i].map(cachedSheetValueEncode_), rowJson=JSON.stringify(row);
      // Avoid caching any single unusually large row; it is safer to read it live.
      if(rowJson.length>maxChars)return values;
      const addition=rowJson.length+(current.length?1:0);
      if(current.length&&currentChars+addition>maxChars){chunks.push(current);current=[];currentChars=2;}
      current.push(row);currentChars+=rowJson.length+(current.length>1?1:0);
    }
    if(current.length)chunks.push(current);
    const encoded=chunks.map(chunk=>JSON.stringify(chunk));
    if(encoded.some(t=>Utilities.newBlob(t).getBytes().length>85000))return values;
    encoded.forEach((t,i)=>cache.put(base+'_p'+i,t,EKOSSTA_DATA_CACHE_TTL_SECONDS_));
    cache.put(base+'_m',JSON.stringify({parts:encoded.length,rows:lastRow,cols:lastCol}),EKOSSTA_DATA_CACHE_TTL_SECONDS_);
  }catch(e){}
  EKOSSTA_REQUEST_VALUES_CACHE_[name]=values;
  return values;
}


/* =========================================================
   V2.4 UNIT OVERVIEW
   Paparan lengkap satu unit: ahli + kehadiran minggu 1-15 + AJK.
========================================================= */
function getUnitOverviewSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE)) throw new Error('Akses ditolak.');
  const unitId=String(p.unitId||'').trim();
  const tahun=String(p.tahun||new Date().getFullYear()).trim();
  if(!unitId) throw new Error('UNIT_ID diperlukan.');

  const units=getUnitRowsForOverview_();
  const unit=units.find(u=>String(u.UNIT_ID)===unitId && String(u.TAHUN||tahun)===tahun) || units.find(u=>String(u.UNIT_ID)===unitId);
  if(!unit) throw new Error('Unit tidak ditemui.');
  assertAttendanceUnitAccess_(s,unit);

  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const ps=ss.getSheetByName(SHEETS.PLACEMENT);
  const ms=ss.getSheetByName(SHEETS.MURID);
  const ah=ss.getSheetByName(SHEETS.ATTENDANCE);
  const aj=ss.getSheetByName(SHEETS.AJK);

  const muridRows=sheetObjects_(ms);
  const muridMap={};
  muridRows.forEach(m=>muridMap[String(m.NO_KP)] = m);

  const placements=sheetObjects_(ps).filter(r=>
    String(r.UNIT_ID)===unitId && String(r.TAHUN)===tahun &&
    String(r.STATUS||'AKTIF').toUpperCase()==='AKTIF'
  );

  const attendance=sheetObjects_(ah).filter(r=>
    String(r.UNIT_ID)===unitId && String(r.TAHUN)===tahun &&
    Number(r.MINGGU||0)>=1 && Number(r.MINGGU||0)<=15
  );

  const latest={};
  attendance.forEach(r=>{
    const key=String(r.NO_KP)+'|'+String(r.MINGGU);
    const old=latest[key];
    const dt=attendanceDateValue_(r.TARIKH);
    if(!old || dt>=attendanceDateValue_(old.TARIKH)) latest[key]=r;
  });

  const ahli=placements.map(r=>{
    const m=muridMap[String(r.NO_KP)]||{};
    const minggu={};
    for(let w=1;w<=15;w++){
      const a=latest[String(r.NO_KP)+'|'+w];
      minggu[w]=a?{STATUS:String(a.STATUS||''),TARIKH:a.TARIKH||'',NO_PERJUMPAAN:a.NO_PERJUMPAAN||'',CATATAN:a.CATATAN||''}:null;
    }
    return {NO_KP:r.NO_KP,NAMA:m.NAMA||'-',JANTINA:m.JANTINA||'-',TINGKATAN:m.TINGKATAN||'-',KELAS:m.KELAS||'-',STATUS:r.STATUS||'AKTIF',MINGGU:minggu};
  }).sort((a,b)=>String(a.NAMA).localeCompare(String(b.NAMA),'ms'));

  const minggu=[];
  for(let w=1;w<=15;w++){
    const rec=attendance.filter(r=>Number(r.MINGGU||0)===w);
    const byStudent={};
    rec.forEach(r=>byStudent[String(r.NO_KP)]=r);
    const total=placements.length;
    let hadir=0,tidak=0,bersebab=0,cuti=0;
    Object.values(byStudent).forEach(r=>{
      const st=String(r.STATUS||'').toUpperCase();
      if(st==='HADIR')hadir++;
      else if(st==='TIDAK HADIR')tidak++;
      else if(st==='BERSEBAB')bersebab++;
      else if(st==='CUTI')cuti++;
    });
    const tarikh=rec.length?rec.map(r=>r.TARIKH).sort().slice(-1)[0]:'';
    const noPerjumpaan=rec.length?rec.map(r=>Number(r.NO_PERJUMPAAN||0)).sort((a,b)=>b-a)[0]||'':'';
    minggu.push({MINGGU:w,TARIKH:tarikh,NO_PERJUMPAAN:noPerjumpaan,TOTAL:total,HADIR:hadir,TIDAK_HADIR:tidak,BERSEBAB:bersebab,CUTI:cuti,PERATUS:total?Math.round(hadir/total*100):0,ADA_REKOD:rec.length>0});
  }

  const ajkRows=aj?sheetObjects_(aj).filter(r=>String(r.UNIT_ID)===unitId && String(r.TAHUN)===tahun && String(r.STATUS||'AKTIF').toUpperCase()==='AKTIF'):[];
  const ajk=ajkRows.map(r=>{const m=muridMap[String(r.NO_KP)]||{};return {AJK_ID:r.AJK_ID,NO_KP:r.NO_KP,NAMA:m.NAMA||'-',TINGKATAN:m.TINGKATAN||'-',KELAS:m.KELAS||'-',JANTINA:m.JANTINA||'-',JAWATAN:r.JAWATAN||'-',STATUS:r.STATUS||'AKTIF'};}).sort((a,b)=>unitAjkRoleRank_(a.JAWATAN)-unitAjkRoleRank_(b.JAWATAN)||String(a.NAMA).localeCompare(String(b.NAMA),'ms'));

  return {ok:true,unit:unit,tahun:tahun,ahli:ahli,minggu:minggu,ajk:ajk,stats:{jumlahAhli:ahli.length,jumlahAJK:ajk.length,jumlahMingguDirekodkan:minggu.filter(x=>x.ADA_REKOD).length}};
}

function unitAjkRoleRank_(role){
  const v=String(role||'').trim().toUpperCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ');
  const ranks={'PENGERUSI':1,'TIMBALAN PENGERUSI':2,'NAIB PENGERUSI':2,'SETIAUSAHA':3,'PENOLONG SETIAUSAHA':4,'BENDAHARI':5,'PENOLONG BENDAHARI':6,'AJK':7,'AHLI JAWATANKUASA':7};
  return Object.prototype.hasOwnProperty.call(ranks,v)?ranks[v]:50;
}

function getUnitAjkCandidatesSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  const unitId=String(p.unitId||'').trim();
  const tahun=String(p.tahun||new Date().getFullYear()).trim();
  if(!unitId)throw new Error('UNIT_ID diperlukan.');
  const unitRows=getUnitRowsForOverview_();
  const unit=unitRows.find(u=>String(u.UNIT_ID)===unitId&&String(u.TAHUN||tahun)===tahun)||unitRows.find(u=>String(u.UNIT_ID)===unitId);
  if(!unit)throw new Error('Unit tidak ditemui.');
  assertAttendanceUnitAccess_(s,unit);
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const ps=ss.getSheetByName(SHEETS.PLACEMENT);
  const ms=ss.getSheetByName(SHEETS.MURID);
  const aj=ss.getSheetByName(SHEETS.AJK);
  if(!ps||!ms||!aj)throw new Error('Helaian PENEMPATAN_UNIT, MURID atau AJK_UNIT tidak ditemui. Semak nama helaian dan jalankan setupModelBV2() hanya jika diperlukan.');
  const muridRows=sheetObjects_(ms),muridMap={};
  muridRows.forEach(m=>muridMap[String(m.NO_KP)]=m);
  const ajkRows=sheetObjects_(aj).filter(r=>String(r.UNIT_ID)===unitId&&String(r.TAHUN)===tahun&&String(r.STATUS||'AKTIF').toUpperCase()==='AKTIF');
  const currentKp={};ajkRows.forEach(r=>currentKp[String(r.NO_KP)]=true);
  const seen={};
  const placements=sheetObjects_(ps).filter(r=>String(r.UNIT_ID)===unitId&&String(r.TAHUN)===tahun&&String(r.STATUS||'AKTIF').toUpperCase()==='AKTIF');
  const candidates=placements.map(r=>muridMap[String(r.NO_KP)]).filter(m=>m&&String(m.STATUS||'AKTIF').toUpperCase()==='AKTIF'&&!currentKp[String(m.NO_KP)]&&!seen[String(m.NO_KP)]).map(m=>{seen[String(m.NO_KP)]=true;return {NO_KP:String(m.NO_KP||''),NAMA:String(m.NAMA||'-'),JANTINA:String(m.JANTINA||'-'),TINGKATAN:String(m.TINGKATAN||'-'),KELAS:String(m.KELAS||'-')};}).sort((a,b)=>String(a.KELAS).localeCompare(String(b.KELAS),'ms')||String(a.NAMA).localeCompare(String(b.NAMA),'ms'));
  const ajk=ajkRows.map(r=>{const m=muridMap[String(r.NO_KP)]||{};return {AJK_ID:r.AJK_ID,NO_KP:String(r.NO_KP||''),NAMA:String(m.NAMA||'-'),JANTINA:String(m.JANTINA||'-'),TINGKATAN:String(m.TINGKATAN||'-'),KELAS:String(m.KELAS||'-'),JAWATAN:String(r.JAWATAN||'-'),STATUS:String(r.STATUS||'AKTIF')};}).sort((a,b)=>unitAjkRoleRank_(a.JAWATAN)-unitAjkRoleRank_(b.JAWATAN)||String(a.NAMA).localeCompare(String(b.NAMA),'ms'));
  return {ok:true,unit:unit,tahun:tahun,candidates:candidates,ajk:ajk,user:{username:s.USERNAME,role:s.ROLE}};
}

function saveUnitAjkSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  const unitId=String(p.unitId||'').trim();
  const tahun=String(p.tahun||new Date().getFullYear()).trim();
  const noKp=String(p.noKp||'').trim();
  const jawatan=String(p.jawatan||'').trim().toUpperCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ');
  const allowed=['PENGERUSI','TIMBALAN PENGERUSI','SETIAUSAHA','PENOLONG SETIAUSAHA','BENDAHARI','PENOLONG BENDAHARI','AJK'];
  if(!unitId||!tahun||!noKp||!allowed.includes(jawatan))throw new Error('Pilih unit, tahun, murid dan jawatan AJK yang sah.');

  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const unitSheet=ss.getSheetByName(SHEETS.UNIT);
  const placementSheet=ss.getSheetByName(SHEETS.PLACEMENT);
  const muridSheet=ss.getSheetByName(SHEETS.MURID);
  const ajkSheet=ss.getSheetByName(SHEETS.AJK);
  if(!unitSheet||!placementSheet||!muridSheet||!ajkSheet)throw new Error('Helaian UNIT, PENEMPATAN_UNIT, MURID atau AJK_UNIT tidak ditemui.');

  // Read the unit roster only once and resolve access before entering the write lock.
  const unitValues=unitSheet.getDataRange().getValues();
  if(unitValues.length<2)throw new Error('Tiada unit berdaftar.');
  const uh=unitValues[0].map(String),ui=uh.indexOf('UNIT_ID'),uti=uh.indexOf('TAHUN');
  let unit=null;
  for(let r=1;r<unitValues.length;r++){
    if(String(unitValues[r][ui]||'')!==unitId)continue;
    if(String(unitValues[r][uti]||tahun)===tahun||!unit){unit={};uh.forEach((k,i)=>unit[k]=unitValues[r][i]);if(String(unitValues[r][uti]||tahun)===tahun)break;}
  }
  if(!unit)throw new Error('Unit tidak ditemui.');
  assertAttendanceUnitAccess_(s,unit);

  const lock=LockService.getScriptLock();
  if(!lock.tryLock(8000))throw new Error('Sistem masih memproses perubahan data. Cuba sekali lagi sebentar lagi.');
  try{
    const muridValues=muridSheet.getDataRange().getValues();
    const mh=(muridValues[0]||[]).map(String),mki=mh.indexOf('NO_KP'),msi=mh.indexOf('STATUS');
    let studentFound=false;
    for(let r=1;r<muridValues.length;r++){
      if(String(muridValues[r][mki]||'').trim()===noKp && String(msi<0?'AKTIF':muridValues[r][msi]||'AKTIF').toUpperCase()==='AKTIF'){studentFound=true;break;}
    }
    if(!studentFound)throw new Error('Murid tidak ditemui atau status murid bukan AKTIF.');

    const placementValues=placementSheet.getDataRange().getValues();
    const ph=(placementValues[0]||[]).map(String),pui=ph.indexOf('UNIT_ID'),pti=ph.indexOf('TAHUN'),pki=ph.indexOf('NO_KP'),psi=ph.indexOf('STATUS');
    let isMember=false;
    for(let r=1;r<placementValues.length;r++){
      if(String(placementValues[r][pui]||'')===unitId && String(placementValues[r][pti]||'')===tahun && String(placementValues[r][pki]||'').trim()===noKp && String(placementValues[r][psi]||'AKTIF').toUpperCase()==='AKTIF'){isMember=true;break;}
    }
    if(!isMember)throw new Error('Murid mesti menjadi ahli aktif unit ini sebelum dilantik sebagai AJK.');

    const ajkValues=ajkSheet.getDataRange().getValues();
    const ah=(ajkValues[0]||[]).map(String),aui=ah.indexOf('UNIT_ID'),ati=ah.indexOf('TAHUN'),aki=ah.indexOf('NO_KP'),asi=ah.indexOf('STATUS'),aji=ah.indexOf('JAWATAN');
    const activeAjk=[];
    for(let r=1;r<ajkValues.length;r++){
      const row=ajkValues[r];
      if(String(row[aui]||'')===unitId && String(row[ati]||'')===tahun && String(row[asi]||'AKTIF').toUpperCase()==='AKTIF')activeAjk.push(row);
    }
    if(activeAjk.some(r=>String(r[aki]||'').trim()===noKp))throw new Error('Murid ini sudah dilantik sebagai AJK untuk unit dan tahun tersebut.');
    if(jawatan!=='AJK'&&activeAjk.some(r=>String(r[aji]||'').trim().toUpperCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ')===jawatan))throw new Error('Jawatan '+jawatan+' sudah mempunyai pemegang. Nyahaktifkan atau tukar rekod jawatan sedia ada sebelum melantik orang lain.');

    const now=new Date(),ajkId='AJK'+Utilities.getUuid().replace(/-/g,'').slice(0,10).toUpperCase();
    const newRow=ah.map(k=>({AJK_ID:ajkId,UNIT_ID:unitId,NO_KP:noKp,TAHUN:tahun,JAWATAN:jawatan,STATUS:'AKTIF',CREATED_AT:now,UPDATED_AT:now})[k]!==undefined?({AJK_ID:ajkId,UNIT_ID:unitId,NO_KP:noKp,TAHUN:tahun,JAWATAN:jawatan,STATUS:'AKTIF',CREATED_AT:now,UPDATED_AT:now})[k]:'');
    ajkSheet.getRange(ajkSheet.getLastRow()+1,1,1,ah.length).setValues([newRow]);
    logAction_('addUnitAjk',{ajkId:ajkId,unitId:unitId,noKp:noKp,tahun:tahun,jawatan:jawatan,by:s.USERNAME,role:s.ROLE});
    return {ok:true,message:'Pelantikan '+jawatan+' berjaya disimpan.',ajkId:ajkId};
  }finally{lock.releaseLock();}
}

function getUnitRowsForOverview_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const sh=ss.getSheetByName(SHEETS.UNIT);
  const rows=sheetObjects_(sh);
  return rows.map(r=>Object.assign({},r,{UNIT_ID:String(r.UNIT_ID||'')}));
}

function sheetObjects_(sh){
  if(!sh) return [];
  const name=sh.getName();
  if(!EKOSSTA_DISABLE_DATA_CACHE_&&Object.prototype.hasOwnProperty.call(EKOSSTA_REQUEST_OBJECTS_CACHE_,name))return EKOSSTA_REQUEST_OBJECTS_CACHE_[name];
  if(sh.getLastRow()<2)return [];
  const values=readSheetValuesForCache_(sh);
  const headers=values[0].map(String);
  const objects=values.slice(1).map(row=>{const o={};headers.forEach((h,i)=>o[h]=row[i]);return o;});
  if(!EKOSSTA_DISABLE_DATA_CACHE_&&EKOSSTA_CACHEABLE_SHEETS_.has(name))EKOSSTA_REQUEST_OBJECTS_CACHE_[name]=objects;
  return objects;
}

function attendanceDateValue_(v){
  if(v instanceof Date) return v.getTime();
  const d=new Date(String(v||''));
  return isNaN(d.getTime())?0:d.getTime();
}

function doPost(e){
  return ContentService.createTextOutput(JSON.stringify({
    ok:false,
    error:'Backend menggunakan GET/JSONP untuk ujian cross-origin. Untuk production, gantikan lapisan API dengan POST/CORS atau Google Identity/OAuth.'
  })).setMimeType(ContentService.MimeType.JSON);
}

function setupModelBV2(){
  // Pemeriksaan/persiapan struktur sahaja: tiada akaun demo, murid contoh,
  // pemadaman data, atau pengubahsuaian pada helaian berisi.
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss) throw new Error('Apps Script mesti dibuka daripada spreadsheet e-KOSSTA.');

  const required={
    MURID:['NO_KP','NAMA','JANTINA','TINGKATAN','KELAS','STATUS'],
    USERS:['USER_ID','USERNAME','ROLE','PASSWORD_HASH','STATUS'],
    SESSIONS:['TOKEN_HASH','USER_ID','USERNAME','ROLE','EXPIRES_AT','STATUS'],
    GURU:['NO_GURU','NAMA','EMAIL','NO_TEL','STATUS'],
    UNIT:['UNIT_ID','NAMA_UNIT','KATEGORI','GURU_PENASIHAT','TAHUN','STATUS'],
    PENEMPATAN_UNIT:['PLACEMENT_ID','NO_KP','UNIT_ID','TAHUN','STATUS'],
    KEHADIRAN:['KEHADIRAN_ID','NO_KP','UNIT_ID','TAHUN','TARIKH','STATUS'],
    AJK_UNIT:['AJK_ID','UNIT_ID','NO_KP','TAHUN','JAWATAN','STATUS'],
    AKTIVITI:['AKTIVITI_ID','NAMA_AKTIVITI','TARIKH','TEMPAT','PERINGKAT'],
    PESERTA_AKTIVITI:['PESERTA_ID','AKTIVITI_ID','NO_KP','STATUS'],
    PENCAPAIAN:['PENCAPAIAN_ID','KATEGORI','NAMA_PENCAPAIAN','STATUS'],
    AUDIT_LOG:[],
    DOKUMEN:['DOCUMENT_ID','TITLE','TYPE','CONTENT_HTML','CREATED_BY','CREATED_AT','UPDATED_AT']
  };

  // Header penuh hanya digunakan jika helaian baharu/perlu diinisi sekiranya kosong.
  const schemas={
    MURID:['NO_KP','NAMA','JANTINA','TINGKATAN','KELAS','TAHUN','STATUS','EMAIL','CREATED_AT','UPDATED_AT'],
    USERS:['USER_ID','USERNAME','NAMA','EMAIL','ROLE','PASSWORD_HASH','STATUS','CREATED_AT','LAST_LOGIN'],
    SESSIONS:['TOKEN_HASH','USER_ID','USERNAME','ROLE','CREATED_AT','EXPIRES_AT','STATUS'],
    GURU:['NO_GURU','NAMA','EMAIL','NO_TEL','STATUS','USER_ID','CREATED_AT','UPDATED_AT'],
    UNIT:['UNIT_ID','NAMA_UNIT','KATEGORI','GURU_PENASIHAT','TAHUN','STATUS','CREATED_AT','UPDATED_AT'],
    PENEMPATAN_UNIT:['PLACEMENT_ID','NO_KP','UNIT_ID','TAHUN','STATUS','CREATED_AT','UPDATED_AT'],
    KEHADIRAN:['KEHADIRAN_ID','NO_KP','TAHUN','UNIT_ID','TARIKH','MINGGU','NO_PERJUMPAAN','STATUS','CATATAN','CREATED_AT','UPDATED_AT'],
    AJK_UNIT:['AJK_ID','UNIT_ID','NO_KP','TAHUN','JAWATAN','STATUS','CREATED_AT','UPDATED_AT'],
    AKTIVITI:['AKTIVITI_ID','NAMA_AKTIVITI','TARIKH','HARI','MASA','TEMPAT','PERINGKAT','OBJEKTIF','AKTIVITI','IMPAK','NO_GURU','CREATED_BY','CREATED_AT','UPDATED_AT'],
    PESERTA_AKTIVITI:['PESERTA_ID','AKTIVITI_ID','NO_KP','PERANAN','STATUS','CREATED_AT','UPDATED_AT'],
    PENCAPAIAN:['PENCAPAIAN_ID','KATEGORI','NAMA_PENCAPAIAN','NO_KP','UNIT_ID','AKTIVITI_ID','PERINGKAT','KEDUDUKAN','TARIKH','TAHUN','CATATAN','PAUTAN_BUKTI','STATUS','CREATED_BY','CREATED_AT','UPDATED_AT','KATEGORI_PENYERTAAN','KUMPULAN_REKOD_ID'],
    AUDIT_LOG:['AUDIT_ID','USER_ID','USERNAME','ROLE','ACTION','DETAIL','CREATED_AT'],
    DOKUMEN:['DOCUMENT_ID','TITLE','TYPE','CONTENT_HTML','CREATED_BY','CREATED_AT','UPDATED_AT','DRIVE_FILE_ID','DRIVE_URL','ACTIVITY_ID','ACTIVITY_NAME']
  };

  // Semak struktur sedia ada dahulu. Jika ada header tidak sepadan, berhenti
  // sebelum mencipta/mengubah sebarang helaian.
  const missing=[];
  const missingHeaders=[];
  const emptyExisting=[];
  Object.keys(required).forEach(name=>{
    const sh=ss.getSheetByName(name);
    if(!sh){missing.push(name);return;}
    if(sh.getLastRow()===0 && sh.getLastColumn()===0){emptyExisting.push(name);return;}
    if(required[name].length&&sh.getLastColumn()>0){
      const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(x=>String(x).trim());
      const absent=required[name].filter(h=>headers.indexOf(h)<0);
      if(absent.length)missingHeaders.push(name+': '+absent.join(', '));
    }
  });
  if(missingHeaders.length){
    throw new Error('Pemeriksaan struktur e-KOSSTA belum lulus. Header helaian sedia ada tidak sepadan: '+missingHeaders.join(' | ')+'. Tiada data atau helaian diubah. Betulkan header atau minta semakan sebelum teruskan.');
  }

  // Jika nama TEST_* lama wujud, jangan cipta helaian kosong yang menyembunyikan
  // data lama. Minta migrasi yang berasingan dan bersandaran dahulu.
  const oldNames={
    MURID:'TEST_MURID',USERS:'TEST_USERS',SESSIONS:'TEST_SESSIONS',GURU:'TEST_GURU',UNIT:'TEST_UNIT',
    PENEMPATAN_UNIT:'TEST_PENEMPATAN',KEHADIRAN:'TEST_KEHADIRAN',AJK_UNIT:'TEST_AJK',
    AKTIVITI:'TEST_AKTIVITI',PESERTA_AKTIVITI:'TEST_PESERTA_AKTIVITI',
    PENCAPAIAN:'TEST_PENCAPAIAN',AUDIT_LOG:'TEST_LOG',DOKUMEN:'TEST_DOKUMEN'
  };
  const legacyConflicts=missing.filter(name=>ss.getSheetByName(oldNames[name]));
  if(legacyConflicts.length){
    throw new Error('Setup dihentikan kerana tab lama '+legacyConflicts.map(name=>oldNames[name]+' → '+name).join(', ')+' masih wujud. Jangan cipta tab baharu yang kosong sebelum memeriksa data lama. Buat salinan spreadsheet, semak data TEST_* dan jalankan migrasi berasingan jika selamat. Tiada tab atau data diubah.');
  }

  const created=[];
  const initialized=[];
  // Hanya cipta helaian yang benar-benar tiada; initialize tab yang benar-benar kosong.
  missing.forEach(name=>{
    const sh=ss.insertSheet(name);
    const headers=schemas[name];
    if(headers&&headers.length){
      sh.getRange(1,1,1,headers.length).setValues([headers]);
      sh.setFrozenRows(1);
    }
    created.push(name);
  });
  emptyExisting.forEach(name=>{
    const sh=ss.getSheetByName(name);
    const headers=schemas[name];
    if(sh&&headers&&headers.length){
      sh.getRange(1,1,1,headers.length).setValues([headers]);
      sh.setFrozenRows(1);
      initialized.push(name);
    }
  });

  return {
    ok:true,
    message:'Struktur e-KOSSTA disediakan. Tiada akaun demo atau data contoh dimasukkan. Helaian baharu: '+(created.join(', ')||'tiada')+'. Helaian kosong yang diberi header: '+(initialized.join(', ')||'tiada')+'.',
    createdSheets:created,
    initializedSheets:initialized,
    checkedSheets:Object.keys(required)
  };
}

/**
 * Jalankan SECARA MANUAL dalam editor Apps Script hanya selepas backup.
 * Menukar nama TEST_* yang lama kepada nama production jika nama destinasi
 * belum wujud. Tidak menggabungkan atau menimpa helaian sedia ada.
 */
function migrateTestSheetsToProduction(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss)throw new Error('Buka Apps Script daripada spreadsheet yang hendak dimigrasi.');
  const mapping=[
    ['TEST_MURID','MURID'],['TEST_LOG','AUDIT_LOG'],['TEST_USERS','USERS'],
    ['TEST_SESSIONS','SESSIONS'],['TEST_GURU','GURU'],['TEST_UNIT','UNIT'],
    ['TEST_PENEMPATAN','PENEMPATAN_UNIT'],['TEST_KEHADIRAN','KEHADIRAN'],
    ['TEST_AJK','AJK_UNIT'],['TEST_AKTIVITI','AKTIVITI'],
    ['TEST_PESERTA_AKTIVITI','PESERTA_AKTIVITI'],['TEST_PENCAPAIAN','PENCAPAIAN'],
    ['TEST_DOKUMEN','DOKUMEN']
  ];
  const muridLegacy=ss.getSheetByName('TEST_MURID');
  if(muridLegacy && muridLegacy.getLastRow()>1){
    const vals=muridLegacy.getDataRange().getDisplayValues();
    const headers=(vals[0]||[]).map(x=>String(x).trim());
    const kpIndex=headers.indexOf('NO_KP');
    if(kpIndex>=0 && vals.slice(1).some(r=>/^TEST\d+$/i.test(String(r[kpIndex]||'').trim()))){
      throw new Error('Migrasi dihentikan: TEST_MURID masih mengandungi NO_KP contoh seperti TEST001. Jangan jadikan data demo sebagai MURID produksi. Gunakan salinan spreadsheet, keluarkan data demo atau import data sebenar dahulu. Tiada tab telah dinamakan semula.');
    }
  }
  const usersLegacy=ss.getSheetByName('TEST_USERS');
  if(usersLegacy && usersLegacy.getLastRow()>1){
    const vals=usersLegacy.getDataRange().getDisplayValues();
    const headers=(vals[0]||[]).map(x=>String(x).trim());
    const ui=headers.indexOf('USERNAME'), ni=headers.indexOf('NAMA');
    if(ui>=0 && vals.slice(1).some(r=>['admin','guru'].includes(String(r[ui]||'').trim().toLowerCase()) && ni>=0 && /ujian|test/i.test(String(r[ni]||'')) )){
      throw new Error('Migrasi dihentikan: TEST_USERS masih mengandungi akaun demo Ujian. Jangan jadikan akaun demo sebagai akaun produksi. Bersihkan/import akaun sebenar dahulu; tiada tab telah dinamakan semula.');
    }
  }
  const conflicts=mapping.filter(([oldName,newName])=>ss.getSheetByName(oldName)&&ss.getSheetByName(newName));
  if(conflicts.length){
    throw new Error('Migrasi dihentikan kerana tab lama dan tab destinasi sama-sama wujud: '+conflicts.map(x=>x[0]+' → '+x[1]).join('; ')+'. Buat semakan/backup dan gabungkan data secara manual dahulu. Tiada tab telah dinamakan semula.');
  }
  const renamed=[],notFound=[];
  mapping.forEach(([oldName,newName])=>{
    const oldSh=ss.getSheetByName(oldName);
    if(!oldSh){notFound.push(oldName);return;}
    oldSh.setName(newName);renamed.push(oldName+' → '+newName);
  });
  return {ok:true,message:'Nama tab lama telah ditukar. Semak struktur lajur sebelum deploy.',renamed,notFound};
}

function health_(){
  return {ok:true,app:APP_NAME,backend:'Google Apps Script',version:'V3.12',time:new Date().toISOString()};
}

function login_(p){
  const username=String(p.username||'').trim().toLowerCase();
  const password=String(p.password||'');
  if(!username||!password) throw new Error('Masukkan e-mel/username dan kata laluan.');
  const user=findUser_(username);
  if(!user||user.PASSWORD_HASH!==hashPassword_(password)){
    logAction_('loginGagal',{username});
    throw new Error('E-mel/username atau kata laluan tidak sah.');
  }
  const status=String(user.STATUS||'').trim().toUpperCase();
  if(status==='MENUNGGU_KELULUSAN'){
    logAction_('loginMenungguKelulusan',{username,role:user.ROLE});
    throw new Error('Pendaftaran anda diterima dan sedang menunggu kelulusan ADMIN. Anda boleh log masuk selepas akaun diluluskan.');
  }
  if(status!=='AKTIF'){
    logAction_('loginGagal',{username,status});
    throw new Error('Akaun tidak aktif. Hubungi ADMIN sekolah.');
  }
  const sessionForUnits={USER_ID:user.USER_ID,USERNAME:user.USERNAME,ROLE:String(user.ROLE||'').toUpperCase()};
  let unitIds=[];
  if(isUnitScopedRole_(sessionForUnits.ROLE)){
    try{unitIds=getAccessibleUnitIds_(sessionForUnits);}catch(e){unitIds=[];}
  }
  if(sessionForUnits.ROLE==='PENYELARAS'&&!unitIds.length){
    logAction_('loginPenyelarasBelumDitugaskan',{userId:user.USER_ID,username:user.USERNAME});
    throw new Error('Akaun Penyelaras Unit belum mempunyai penugasan. Hubungi ADMIN untuk menetapkan sekurang-kurangnya satu unit.');
  }
  const rawToken=Utilities.getUuid()+'-'+Utilities.getUuid();
  const tokenHash=hashPassword_(rawToken);
  const now=new Date(), expires=new Date(now.getTime()+SESSION_HOURS*60*60*1000);
  appendObjectByHeaders_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.SESSIONS),{TOKEN_HASH:tokenHash,USER_ID:user.USER_ID,USERNAME:user.USERNAME,ROLE:user.ROLE,CREATED_AT:now,EXPIRES_AT:expires,STATUS:'AKTIF'});
  updateLastLogin_(user.USER_ID);
  logAction_('loginBerjaya',{userId:user.USER_ID,username:user.USERNAME,role:user.ROLE});
  const needsUnitSelection=sessionForUnits.ROLE==='GURU'&&unitIds.length===0;
  return {ok:true,token:rawToken,user:{userId:user.USER_ID,username:user.USERNAME,nama:user.NAMA,email:user.EMAIL||'',role:user.ROLE,unitIds,needsUnitSelection},expiresAt:expires.toISOString()};
}

function logout_(p){
  const token=String(p.token||'');
  if(!token)return {ok:true,message:'Tiada session.'};
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.SESSIONS);
  if(!sh)return {ok:true};
  const values=sh.getDataRange().getValues();
  const h=values[0].map(String), idx={}; h.forEach((x,i)=>idx[x]=i);
  const th=hashPassword_(token);
  for(let r=1;r<values.length;r++){
    if(String(values[r][idx.TOKEN_HASH])===th){ sh.getRange(r+1,idx.STATUS+1).setValue('LOGOUT'); break; }
  }
  return {ok:true,message:'Logout berjaya.'};
}

function requireSession_(token){
  // The own-session endpoint is also used to resume first-login unit setup.
  const s=getSession_(token,true);
  const u=findUserById_(s.USER_ID)||{};
  let unitIds=[];
  if(isUnitScopedRole_(s.ROLE)){
    try{unitIds=getAccessibleUnitIds_(s);}catch(e){unitIds=[];}
  }
  if(String(s.ROLE||'').toUpperCase()==='PENYELARAS'&&!unitIds.length){
    throw new Error('Akaun Penyelaras Unit belum mempunyai penugasan aktif. Hubungi ADMIN untuk menetapkan sekurang-kurangnya satu unit.');
  }
  return {ok:true,user:{userId:s.USER_ID,username:s.USERNAME,nama:u.NAMA||s.USERNAME,email:u.EMAIL||'',role:s.ROLE,unitIds,needsUnitSelection:String(s.ROLE||'').toUpperCase()==='GURU'&&unitIds.length===0},expiresAt:new Date(s.EXPIRES_AT).toISOString()};
}

/* =========================================================
   DASHBOARD ANALYTICS
   Ringkasan menyeluruh untuk semua peranan yang telah log masuk.
   NO_KP digunakan sebagai kunci dalaman sahaja dan tidak dihantar
   dalam respons dashboard.
========================================================= */
function getDashboardAnalyticsSecure_(p){
  const session=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(session.ROLE))throw new Error('Akses ditolak.');
  const year=String(p.tahun||new Date().getFullYear()).trim();
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const allUnits=sheetObjects_(ss.getSheetByName(SHEETS.UNIT));
  const activeUnits=allUnits.filter(u=>String(u.STATUS||'AKTIF').toUpperCase()!=='TIDAK_AKTIF');
  let units=activeUnits.filter(u=>String(u.TAHUN||year)===year);
  if(!units.length){
    const availableYears=activeUnits.map(u=>String(u.TAHUN||'')).filter(y=>/^\d{4}$/.test(y)).sort((a,b)=>Number(b)-Number(a));
    const fallbackYear=availableYears[0]||year;
    units=activeUnits.filter(u=>String(u.TAHUN||fallbackYear)===fallbackYear);
  }
  // PENYELARAS hanya menerima ringkasan untuk unit yang ditugaskan. Paparan GURU sedia ada dikekalkan.
  const scopedUnitIds=session.ROLE==='PENYELARAS'?new Set(getAccessibleUnitIds_(session)):null;
  if(scopedUnitIds)units=units.filter(u=>scopedUnitIds.has(String(u.UNIT_ID||'')));
  const students=sheetObjects_(ss.getSheetByName(SHEETS.MURID));
  const studentsByKp={};students.forEach(m=>{const kp=String(m.NO_KP||'').trim();if(kp)studentsByKp[kp]=m;});
  let activities=sheetObjects_(ss.getSheetByName(SHEETS.ACTIVITY));
  if(scopedUnitIds){const noGuru=getGuruNoForSession_(session);activities=activities.filter(a=>(noGuru&&String(a.NO_GURU||'').trim()===noGuru)||String(a.CREATED_BY||'').trim().toLowerCase()===String(session.USERNAME||'').trim().toLowerCase());}
  const activityById={};activities.forEach(a=>{const id=String(a.AKTIVITI_ID||'').trim();if(id)activityById[id]=a;});
  const participantSets={};
  sheetObjects_(ss.getSheetByName(SHEETS.PARTICIPANTS)).forEach(r=>{
    if(String(r.STATUS||'AKTIF').toUpperCase()==='TIDAK_AKTIF')return;
    const aid=String(r.AKTIVITI_ID||'').trim(),kp=String(r.NO_KP||'').trim();if(!aid||!kp)return;
    if(!participantSets[aid])participantSets[aid]={};participantSets[aid][kp]=true;
  });
  let achievements=sheetObjects_(ss.getSheetByName(SHEETS.ACHIEVEMENT)).filter(r=>String(r.STATUS||'AKTIF').toUpperCase()!=='TIDAK_AKTIF');
  if(scopedUnitIds){const placementRows=sheetObjects_(ss.getSheetByName(SHEETS.PLACEMENT));const memberKps=new Set(placementRows.filter(r=>scopedUnitIds.has(String(r.UNIT_ID||''))&&String(r.STATUS||'AKTIF').toUpperCase()!=='TIDAK_AKTIF').map(r=>String(r.NO_KP||'').trim()).filter(Boolean));const activityIds=new Set(activities.map(a=>String(a.AKTIVITI_ID||'')));achievements=achievements.filter(r=>(r.UNIT_ID&&scopedUnitIds.has(String(r.UNIT_ID)))||(r.NO_KP&&memberKps.has(String(r.NO_KP)))||(r.AKTIVITI_ID&&activityIds.has(String(r.AKTIVITI_ID))));}
  const eventAwardCounts={};
  achievements.forEach(r=>{const aid=String(r.AKTIVITI_ID||'').trim();if(aid)eventAwardCounts[aid]=(eventAwardCounts[aid]||0)+1;});
  const eventByStudent={};
  const positionRank=(value)=>{
    const v=String(value||'').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[._-]/g,' ').replace(/\s+/g,' ');
    if(!v)return 0;
    if(/NAIB JOHAN|KEDUA|TEMPAT KEDUA|SECOND|2ND|PERAK|SILVER/.test(v)||/^2(?:\.0+)?$/.test(v)||/\bKE ?2\b/.test(v))return 2;
    if(/\b(JOHAN|JUARA|PERTAMA|TEMPAT PERTAMA|FIRST|1ST|EMAS|GOLD)\b/.test(v)||/^1(?:\.0+)?$/.test(v)||/\bKE ?1\b/.test(v))return 1;
    if(/KETIGA|TEMPAT KETIGA|THIRD|3RD|GANGSA|BRONZE/.test(v)||/^3(?:\.0+)?$/.test(v)||/\bKE ?3\b/.test(v))return 3;
    if(/KEEMPAT|TEMPAT KEEMPAT|FOURTH|4TH/.test(v)||/^4(?:\.0+)?$/.test(v)||/\bKE ?4\b/.test(v))return 4;
    if(/KELIMA|TEMPAT KELIMA|FIFTH|5TH/.test(v)||/^5(?:\.0+)?$/.test(v)||/\bKE ?5\b/.test(v))return 5;
    return 0;
  };
  const levelRank=(value)=>{
    const v=String(value||'').trim().toUpperCase();
    if(/ANTAR(A)? ?BANGSA|INTERNATIONAL/.test(v))return 5;
    if(/KEBANGSAAN|NASIONAL|NATIONAL/.test(v))return 4;
    if(/NEGERI|STATE/.test(v))return 3;
    if(/DAERAH|DISTRICT|ZON/.test(v))return 2;
    if(/SEKOLAH|SCHOOL/.test(v))return 1;
    return 0;
  };
  const levelLabel=(rank,raw)=>({5:'Antarabangsa',4:'Kebangsaan',3:'Negeri',2:'Daerah',1:'Sekolah'}[rank]||String(raw||'Peringkat tidak dinyatakan'));
  const positionLabel=(rank,raw)=>{const v=String(raw||'').toUpperCase();if(/EMAS|GOLD/.test(v))return 'Emas';if(/PERAK|SILVER/.test(v))return 'Perak';if(/GANGSA|BRONZE/.test(v))return 'Gangsa';return ({1:'Johan',2:'Naib Johan',3:'Tempat Ketiga',4:'Tempat Keempat',5:'Tempat Kelima'}[rank]||String(raw||'Kedudukan tidak dinyatakan'));};
  const eventDate=(value)=>{
    if(value instanceof Date)return Utilities.formatDate(value,Session.getScriptTimeZone(),'yyyy-MM-dd');
    const v=String(value||'').trim();if(/^\d{4}-\d{2}-\d{2}/.test(v))return v.slice(0,10);
    const d=new Date(v);return isNaN(d.getTime())?v.slice(0,10):Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM-dd');
  };
  const eventYear=(value)=>{const d=eventDate(value);return /^\d{4}/.test(d)?d.slice(0,4):'';};
  const compareQuality=(a,b)=>Number(a.levelRank||0)-Number(b.levelRank||0)||Number(b.positionRank||99)-Number(a.positionRank||99);
  achievements.forEach(a=>{
    const kp=String(a.NO_KP||'').trim(),student=studentsByKp[kp];if(!kp||!student||String(student.STATUS||'AKTIF').toUpperCase()==='TIDAK_AKTIF')return;
    const aid=String(a.AKTIVITI_ID||'').trim(),activity=activityById[aid]||{};
    const position=positionRank(a.KEDUDUKAN);if(!position)return;
    const rawLevel=String(a.PERINGKAT||activity.PERINGKAT||'').trim(),level=levelRank(rawLevel);if(!level)return;
    const eventKey=aid||String(a.PENCAPAIAN_ID||((a.NAMA_PENCAPAIAN||'Pencapaian')+'|'+eventDate(a.TARIKH)));
    const eventName=String(activity.NAMA_AKTIVITI||a.TAJUK_PENGLIBATAN||a.NAMA_PENCAPAIAN||'Acara kokurikulum');
    const record={name:eventName,award:String(a.NAMA_PENCAPAIAN||a.TAJUK_PENGLIBATAN||'Pencapaian'),date:eventDate(activity.TARIKH||a.TARIKH),level:levelLabel(level,rawLevel),levelRank:level,position:positionLabel(position,a.KEDUDUKAN),positionRank:position,unit:String(a.NAMA_UNIT||''),year:String(a.TAHUN||eventYear(activity.TARIKH||a.TARIKH)||year)};
    if(!eventByStudent[kp])eventByStudent[kp]={};
    const current=eventByStudent[kp][eventKey];if(!current||compareQuality(record,current)>0)eventByStudent[kp][eventKey]=record;
  });
  const topStudents=[];
  Object.keys(eventByStudent).forEach(kp=>{
    const student=studentsByKp[kp]||{},events=Object.values(eventByStudent[kp]);if(!events.length)return;
    events.sort((a,b)=>b.levelRank-a.levelRank||a.positionRank-b.positionRank||String(b.date).localeCompare(String(a.date)));
    const best=events[0],bestTierCount=events.filter(e=>e.levelRank===best.levelRank&&e.positionRank===best.positionRank).length;
    topStudents.push({name:String(student.NAMA||'Murid'),kelas:String(student.KELAS||''),tingkatan:String(student.TINGKATAN||''),achievementCount:events.length,bestLevel:best.level,bestLevelRank:best.levelRank,bestPosition:best.position,bestPositionRank:best.positionRank,bestTierCount,events});
  });
  topStudents.sort((a,b)=>b.bestLevelRank-a.bestLevelRank||a.bestPositionRank-b.bestPositionRank||b.achievementCount-a.achievementCount||b.bestTierCount-a.bestTierCount||String(a.name).localeCompare(String(b.name),'ms'));
  const topTen=topStudents.slice(0,10).map((s,i)=>({rank:i+1,name:s.name,kelas:s.kelas,tingkatan:s.tingkatan,achievementCount:s.achievementCount,bestLevel:s.bestLevel,bestPosition:s.bestPosition,bestLevelRank:s.bestLevelRank,bestPositionRank:s.bestPositionRank,events:s.events.map(e=>({name:e.name,award:e.award,date:e.date,level:e.level,position:e.position,unit:e.unit,year:e.year}))}));

  const activitySummaries=activities.map(a=>{
    const id=String(a.AKTIVITI_ID||'').trim();if(!id)return null;
    const participants=Object.keys(participantSets[id]||{}).length;
    const awards=Number(eventAwardCounts[id]||0);
    return {name:String(a.NAMA_AKTIVITI||'Aktiviti'),date:eventDate(a.TARIKH),level:String(a.PERINGKAT||'—'),place:String(a.TEMPAT||'—'),participants,awards,year:String(a.TAHUN||eventYear(a.TARIKH)||'')};
  }).filter(Boolean);
  activitySummaries.sort((a,b)=>String(b.date).localeCompare(String(a.date)));

  const attendanceRows=sheetObjects_(ss.getSheetByName(SHEETS.ATTENDANCE));
  const attendanceByUnit=units.map(u=>{
    const id=String(u.UNIT_ID||''),unitYear=String(u.TAHUN||year);
    const rows=attendanceRows.filter(r=>String(r.UNIT_ID||'')===id&&String(r.TAHUN||eventYear(r.TARIKH)||unitYear)===unitYear);
    let present=0,total=0;
    rows.forEach(r=>{const status=String(r.STATUS||'').trim().toUpperCase().replace(/[ _-]+/g,' ');if(!status)return;total++;if(status==='HADIR')present++;});
    return {unitId:id,name:String(u.NAMA_UNIT||'Unit'),category:String(u.KATEGORI||'LAIN-LAIN'),year:unitYear,present,total,percentage:total?Math.round(present/total*100):0};
  });

  const placements=sheetObjects_(ss.getSheetByName(SHEETS.PLACEMENT));
  const membersByUnit=units.map(u=>{
    const id=String(u.UNIT_ID||''),unitYear=String(u.TAHUN||year),seen={};let male=0,female=0,total=0;
    placements.forEach(r=>{
      if(String(r.UNIT_ID||'')!==id||String(r.TAHUN||unitYear)!==unitYear||String(r.STATUS||'AKTIF').toUpperCase()==='TIDAK_AKTIF')return;
      const kp=String(r.NO_KP||'').trim();if(!kp||seen[kp])return;seen[kp]=true;
      const student=studentsByKp[kp]||{};if(String(student.STATUS||'AKTIF').toUpperCase()==='TIDAK_AKTIF')return;
      total++;const gender=String(student.JANTINA||'').trim().toUpperCase();if(gender==='L'||gender==='LELAKI')male++;else if(gender==='P'||gender==='PEREMPUAN')female++;
    });
    return {unitId:id,name:String(u.NAMA_UNIT||'Unit'),category:String(u.KATEGORI||'LAIN-LAIN'),year:unitYear,total,male,female};
  });
  let countUniqueStudents=Object.keys(studentsByKp).filter(kp=>String(studentsByKp[kp].STATUS||'AKTIF').toUpperCase()!=='TIDAK_AKTIF').length;
  if(scopedUnitIds){const visibleKps=new Set(placements.filter(r=>scopedUnitIds.has(String(r.UNIT_ID||''))&&String(r.TAHUN||'')===year&&String(r.STATUS||'AKTIF').toUpperCase()!=='TIDAK_AKTIF').map(r=>String(r.NO_KP||'').trim()).filter(Boolean));countUniqueStudents=[...visibleKps].filter(kp=>studentsByKp[kp]&&String(studentsByKp[kp].STATUS||'AKTIF').toUpperCase()!=='TIDAK_AKTIF').length;}
  return {ok:true,year,topStudents:topTen,activities:activitySummaries.slice(0,12),attendanceByUnit,membersByUnit,summary:{students:countUniqueStudents,units:units.length,activities:activitySummaries.length},user:{role:session.ROLE}};
}

function getMuridSecure_(token,allData){
  const s=getSession_(token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  let data=getMuridRows_();
  if(s.ROLE==='PENYELARAS'||(s.ROLE==='GURU'&&!allData)){
    const allowedUnits=new Set(getAccessibleUnitIds_(s));
    const ps=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PLACEMENT),members=new Set();
    if(ps&&ps.getLastRow()>1){const vals=ps.getDataRange().getValues(),h=vals[0].map(String),ki=h.indexOf('NO_KP'),ui=h.indexOf('UNIT_ID'),si=h.indexOf('STATUS');for(let i=1;i<vals.length;i++){if(si>=0&&String(vals[i][si]||'AKTIF').toUpperCase()!=='AKTIF')continue;if(allowedUnits.has(String(vals[i][ui]||'')))members.add(String(vals[i][ki]||''));}}
    data=data.filter(m=>members.has(String(m.NO_KP||'')));
  }
  return {ok:true,data,user:{username:s.USERNAME,role:s.ROLE}};
}

function addMuridSecure_(p){
  const s=getSession_(p.token);
  if(s.ROLE!=='ADMIN')throw new Error('Akses ditolak. Pengurusan data murid hanya untuk ADMIN.');
  const nama=String(p.nama||'').trim(), noKp=String(p.noKp||'').trim();
  const jantina=String(p.jantina||'').trim().toUpperCase();
  const tingkatan=String(p.tingkatan||'').trim(), kelas=String(p.kelas||'').trim();
  if(!nama||!noKp||!jantina||!tingkatan||!kelas)throw new Error('Lengkapkan semua medan murid.');
  if(!['L','P'].includes(jantina))throw new Error('Jantina mesti L atau P.');
  const ss=SpreadsheetApp.getActiveSpreadsheet(), sh=ss.getSheetByName(SHEETS.MURID);
  if(!sh)throw new Error('MURID belum wujud. semak tab serta header helaian sebenar.');
  const rows=sh.getDataRange().getValues(),h=rows[0].map(String);
  ['NO_KP','NAMA','JANTINA','TINGKATAN','KELAS','STATUS'].forEach(k=>{if(h.indexOf(k)<0)throw new Error('Lajur wajib '+k+' tiada dalam MURID.');});
  const existing=rows.slice(1).some(r=>String(r[h.indexOf('NO_KP')]).toLowerCase()===noKp.toLowerCase());
  if(existing)throw new Error('No. KP ini sudah wujud.');
  const row=new Array(h.length).fill('');
  const put=(k,v)=>{const i=h.indexOf(k);if(i>=0)row[i]=v};
  put('NO_KP',noKp);put('NAMA',nama);put('JANTINA',jantina);put('TINGKATAN',tingkatan);put('KELAS',kelas);put('STATUS','AKTIF');put('CREATED_AT',new Date());
  sh.getRange(sh.getLastRow()+1,1,1,h.length).setValues([row]);
  logAction_('addMurid',{nama,noKp,jantina,tingkatan,kelas,by:s.USERNAME,role:s.ROLE});
  return {ok:true,message:'Murid berjaya ditambah.',id:noKp};
}


function normalizeBulkText_(value){
  return String(value===null||value===undefined?'':value).trim().normalize('NFKC').replace(/\s+/g,' ').toLocaleLowerCase('ms');
}
function normalizeBulkCategory_(value){
  const v=String(value||'').trim().toUpperCase().replace(/\s*\/\s*/g,' / ').replace(/\s+/g,' ');
  if(['UNIT','UNIT BERUNIFORM','BADAN BERUNIFORM','PASUKAN BADAN BERUNIFORM'].includes(v))return 'UNIT BERUNIFORM';
  if(['KELAB','PERSATUAN','KELAB / PERSATUAN','KELAB/PERSATUAN','KELAB & PERSATUAN','KELAB DAN PERSATUAN'].includes(v))return 'KELAB / PERSATUAN';
  if(['SUKAN','SUKAN / PERMAINAN','SUKAN/PERMAINAN','SUKAN DAN PERMAINAN'].includes(v))return 'SUKAN / PERMAINAN';
  if(['RUMAH SUKAN','RUMAH'].includes(v))return 'RUMAH SUKAN';
  return v;
}
function bulkMembershipCategory_(type){
  const v=String(type||'').trim().toUpperCase().replace(/\s+/g,' ');
  if(v==='UNIT')return 'UNIT BERUNIFORM';
  if(v==='KELAB')return 'KELAB / PERSATUAN';
  if(v==='SUKAN')return 'SUKAN / PERMAINAN';
  if(v==='RUMAH SUKAN'||v==='RUMAH')return 'RUMAH SUKAN';
  return '';
}
function bulkUnitId_(){return 'U'+Utilities.getUuid().replace(/-/g,'').slice(0,8).toUpperCase();}
function bulkPlacementId_(){return 'P'+Utilities.getUuid().replace(/-/g,'').slice(0,8).toUpperCase();}

function bulkAddMuridSecure_(p){
  const admin=requireAdmin_(p.token);
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(10000))throw new Error('Import sedang diproses oleh sesi lain. Tunggu sebentar dan cuba semula.');
  try{return bulkAddMuridCore_(p,admin);}finally{lock.releaseLock();}
}

function bulkAddMuridCore_(p,admin){
  let items;try{items=JSON.parse(String(p.rows||'[]'));}catch(e){throw new Error('Data CSV tidak sah.');}
  // Kekalkan kelompok kecil bagi mengelakkan URL JSONP terlalu panjang.
  if(!Array.isArray(items)||!items.length||items.length>8)throw new Error('Import bulk memproses 1 hingga 8 rekod setiap kelompok.');

  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const muridSh=ss.getSheetByName(SHEETS.MURID),unitSh=ss.getSheetByName(SHEETS.UNIT),placementSh=ss.getSheetByName(SHEETS.PLACEMENT);
  if(!muridSh||!unitSh||!placementSh)throw new Error('Helaian MURID, UNIT dan PENEMPATAN_UNIT mesti tersedia.');
  const muridValues=muridSh.getDataRange().getValues(),unitValues=unitSh.getDataRange().getValues(),placementValues=placementSh.getDataRange().getValues();
  if(!muridValues.length||!muridValues[0].length)throw new Error('Header MURID tiada.');
  if(!unitValues.length||!unitValues[0].length)throw new Error('Header UNIT tiada.');
  if(!placementValues.length||!placementValues[0].length)throw new Error('Header PENEMPATAN_UNIT tiada.');
  const muridHeaders=muridValues[0].map(x=>String(x).trim()),unitHeaders=unitValues[0].map(x=>String(x).trim()),placementHeaders=placementValues[0].map(x=>String(x).trim());
  const requireHeaders=(headers,required,sheet)=>required.forEach(k=>{if(headers.indexOf(k)<0)throw new Error('Header '+sheet+' tiada lajur wajib '+k+'. Tiada rekod kelompok ini diimport.');});
  requireHeaders(muridHeaders,['NO_KP','NAMA','JANTINA','TINGKATAN','KELAS','STATUS'],'MURID');
  requireHeaders(unitHeaders,['UNIT_ID','NAMA_UNIT','KATEGORI','TAHUN','STATUS'],'UNIT');
  requireHeaders(placementHeaders,['PLACEMENT_ID','NO_KP','UNIT_ID','TAHUN','STATUS'],'PENEMPATAN_UNIT');

  const currentYear=String(new Date().getFullYear()),idx=(headers,key)=>headers.indexOf(key);
  const mKp=idx(muridHeaders,'NO_KP');
  const existingKp=new Set(muridValues.slice(1).map(r=>String(r[mKp]||'').trim().toLowerCase()).filter(Boolean));
  const seenKp=new Set(),prepared=[];let skipped=0;
  items.forEach((item,i)=>{
    const sourceRow=Number(item.sourceRow)||('kelompok ke-'+(i+1));
    const nama=String(item.nama||'').trim(),kp=String(item.noKp||'').trim(),jantina=String(item.jantina||'').trim().toUpperCase();
    const tingkatan=String(item.tingkatan||'').trim(),kelas=String(item.kelas||'').trim(),missing=[];
    if(!kp)missing.push('NO KP');if(!nama)missing.push('NAMA');if(!jantina)missing.push('JANTINA');if(!tingkatan)missing.push('TINGKATAN');if(!kelas)missing.push('NAMA KELAS');
    if(missing.length)throw new Error('Baris CSV '+sourceRow+': medan wajib kosong — '+missing.join(', ')+'.');
    if(!['L','P'].includes(jantina))throw new Error('Baris CSV '+sourceRow+': JANTINA tidak sah. Gunakan L (Lelaki) atau P (Perempuan).');
    const kpKey=kp.toLowerCase();if(seenKp.has(kpKey))throw new Error('Baris CSV '+sourceRow+': NO KP pendua dalam kelompok: '+kp+'.');seenKp.add(kpKey);
    const memberships=[],input=Array.isArray(item.memberships)?item.memberships:[];
    input.forEach(mem=>{
      const name=String(mem&&mem.name||'').trim();if(!name||name==='-'||name.toUpperCase()==='N/A')return;
      const category=bulkMembershipCategory_(mem&&mem.type);if(!category)throw new Error('Baris CSV '+sourceRow+': jenis unit tidak dikenali untuk “'+name+'”.');
      // Dedup memberships in a single row while preserving first appearance.
      const key=normalizeBulkText_(name)+'|'+category;if(!memberships.some(x=>x.key===key))memberships.push({name,category,sourceRow,key});
    });
    const exists=existingKp.has(kpKey);if(exists)skipped++;else existingKp.add(kpKey);
    prepared.push({sourceRow,nama,kp,jantina,tingkatan,kelas,exists,memberships});
  });

  // Index unit by name + category + year. Existing sheet schema remains unchanged.
  const uId=idx(unitHeaders,'UNIT_ID'),uName=idx(unitHeaders,'NAMA_UNIT'),uCat=idx(unitHeaders,'KATEGORI'),uYear=idx(unitHeaders,'TAHUN'),uStatus=idx(unitHeaders,'STATUS');
  const uUpdated=idx(unitHeaders,'UPDATED_AT'),unitNormKey=(name,category,year)=>normalizeBulkText_(name)+'|'+normalizeBulkCategory_(category)+'|'+String(year||currentYear).trim();
  const unitIndex=new Map();
  for(let r=1;r<unitValues.length;r++){
    const row=unitValues[r],name=String(row[uName]||'').trim();if(!name)continue;
    const category=normalizeBulkCategory_(row[uCat]),yr=String(row[uYear]||'').trim()||currentYear,key=unitNormKey(name,category,yr);
    if(!unitIndex.has(key))unitIndex.set(key,{id:String(row[uId]||'').trim(),name,category,year:yr,status:String(row[uStatus]||'AKTIF').trim().toUpperCase(),rowNumber:r+1});
  }
  const membershipsByKey=new Map();prepared.forEach(st=>st.memberships.forEach(mem=>{const key=unitNormKey(mem.name,mem.category,currentYear);if(!membershipsByKey.has(key))membershipsByKey.set(key,mem);}));
  let unitsCreated=0,unitsReactivated=0;const unitRowsToAdd=[],now=new Date();
  const unitAppendStart=unitSh.getLastRow()+1;
  membershipsByKey.forEach((mem,key)=>{
    let unit=unitIndex.get(key);
    if(!unit){
      const id=bulkUnitId_(),obj={UNIT_ID:id,NAMA_UNIT:mem.name,KATEGORI:mem.category,GURU_PENASIHAT:'',TAHUN:currentYear,STATUS:'AKTIF',CREATED_AT:now,UPDATED_AT:now};
      const row=unitHeaders.map(h=>Object.prototype.hasOwnProperty.call(obj,h)?obj[h]:'');
      const rowNumber=unitAppendStart+unitRowsToAdd.length;unitRowsToAdd.push(row);
      unit={id,name:mem.name,category:mem.category,year:currentYear,status:'AKTIF',rowNumber};unitIndex.set(key,unit);unitsCreated++;
    }else{
      // Fill legacy rows that are missing UNIT_ID/year and reactivate inactive matches.
      if(!unit.id){unit.id=bulkUnitId_();unitSh.getRange(unit.rowNumber,uId+1).setValue(unit.id);}
      if(unit.status!=='AKTIF'){unit.status='AKTIF';unitSh.getRange(unit.rowNumber,uStatus+1).setValue('AKTIF');if(uUpdated>=0)unitSh.getRange(unit.rowNumber,uUpdated+1).setValue(now);unitsReactivated++;}
      if(uYear>=0&&!String(unitValues[unit.rowNumber-1][uYear]||'').trim())unitSh.getRange(unit.rowNumber,uYear+1).setValue(currentYear);
    }
  });
  if(unitRowsToAdd.length)unitSh.getRange(unitAppendStart,1,unitRowsToAdd.length,unitHeaders.length).setValues(unitRowsToAdd);

  // NO_KP is the student identifier. Do not generate M001-style student IDs.
  const rowsToAdd=[];
  prepared.forEach(st=>{
    if(st.exists)return;
    const row=new Array(muridHeaders.length).fill(''),put=(key,value)=>{const col=idx(muridHeaders,key);if(col>=0)row[col]=value;};
    put('NO_KP',st.kp);put('NAMA',st.nama);put('JANTINA',st.jantina);put('TINGKATAN',st.tingkatan);put('KELAS',st.kelas);put('STATUS','AKTIF');put('CREATED_AT',now);
    rowsToAdd.push(row);
  });
  if(rowsToAdd.length)muridSh.getRange(muridSh.getLastRow()+1,1,rowsToAdd.length,muridHeaders.length).setValues(rowsToAdd);

  // Build placement index once, then write all new placements in one call.
  const pKp=idx(placementHeaders,'NO_KP'),pUnit=idx(placementHeaders,'UNIT_ID'),pYear=idx(placementHeaders,'TAHUN'),pStatus=idx(placementHeaders,'STATUS');
  const pUpdated=idx(placementHeaders,'UPDATED_AT'),placementIndex=new Map();
  for(let r=1;r<placementValues.length;r++){
    const row=placementValues[r],kp=String(row[pKp]||'').trim().toLowerCase(),unitId=String(row[pUnit]||'').trim(),yr=String(row[pYear]||'').trim();
    if(!kp||!unitId||!yr)continue;const key=kp+'|'+unitId+'|'+yr;
    if(!placementIndex.has(key))placementIndex.set(key,{rowNumber:r+1,status:String(row[pStatus]||'').trim().toUpperCase()});
  }
  let placementsAdded=0,placementsReactivated=0;const placementRowsToAdd=[],placementUpdates=new Map(),membershipsAddedKeys=new Set();
  const placementAppendStart=placementSh.getLastRow()+1;
  prepared.forEach(st=>st.memberships.forEach(mem=>{
    const unit=unitIndex.get(unitNormKey(mem.name,mem.category,currentYear));
    if(!unit||!unit.id)throw new Error('Unit tidak berjaya dipadankan bagi baris CSV '+st.sourceRow+': '+mem.name+' ('+mem.category+').');
    const key=st.kp.toLowerCase()+'|'+unit.id+'|'+currentYear;if(membershipsAddedKeys.has(key))return;membershipsAddedKeys.add(key);
    const existing=placementIndex.get(key);
    if(existing){
      if(existing.status!=='AKTIF'){
        existing.status='AKTIF';placementUpdates.set(existing.rowNumber,existing);placementsReactivated++;
      }
      return;
    }
    const obj={PLACEMENT_ID:bulkPlacementId_(),NO_KP:st.kp,UNIT_ID:unit.id,TAHUN:currentYear,STATUS:'AKTIF',CREATED_AT:now,UPDATED_AT:now};
    const row=placementHeaders.map(h=>Object.prototype.hasOwnProperty.call(obj,h)?obj[h]:'');
    const rowNumber=placementAppendStart+placementRowsToAdd.length;placementRowsToAdd.push(row);
    placementIndex.set(key,{rowNumber,status:'AKTIF'});placementsAdded++;
  }));
  placementUpdates.forEach((rec,rowNumber)=>{
    if(pStatus>=0)placementSh.getRange(rowNumber,pStatus+1).setValue('AKTIF');
    if(pUpdated>=0)placementSh.getRange(rowNumber,pUpdated+1).setValue(now);
  });
  if(placementRowsToAdd.length)placementSh.getRange(placementAppendStart,1,placementRowsToAdd.length,placementHeaders.length).setValues(placementRowsToAdd);

  logAction_('bulkAddMurid',{requested:items.length,added:rowsToAdd.length,skipped,unitsCreated,unitsReactivated,placementsAdded,placementsReactivated,by:admin.USERNAME,role:admin.ROLE});
  return {ok:true,requested:items.length,added:rowsToAdd.length,skipped,unitsCreated,unitsReactivated,placementsAdded,placementsReactivated,unmatchedUnits:[],message:'Kelompok import selesai. Unit dan penempatan diproses secara automatik.'};
}

function bulkDeleteMuridSecure_(p){
  const admin=requireAdmin_(p.token);let ids;try{ids=JSON.parse(String(p.noKpList||'[]'));}catch(e){throw new Error('Senarai No KP tidak sah.');}
  if(!Array.isArray(ids)||!ids.length||ids.length>10)throw new Error('Pilih 1 hingga 10 rekod setiap kelompok.');
  const wanted=new Set(ids.map(x=>String(x||'').trim().toLowerCase()).filter(Boolean));if(!wanted.size)throw new Error('Tiada No KP sah dipilih.');
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.MURID);if(!sh)throw new Error('MURID belum wujud.');
  const values=sh.getDataRange().getValues(),headers=values[0].map(String),kpIndex=headers.indexOf('NO_KP');if(kpIndex<0)throw new Error('Lajur NO_KP tiada dalam MURID.');
  let deleted=0;for(let r=values.length-1;r>=1;r--){if(wanted.has(String(values[r][kpIndex]||'').trim().toLowerCase())){sh.deleteRow(r+1);deleted++;}}
  logAction_('bulkDeleteMurid',{requested:wanted.size,deleted,by:admin.USERNAME,role:admin.ROLE});
  return {ok:true,deleted,message:'Padam bulk selesai.'};
}


function bulkDeleteAllMuridSecure_(p){
  const admin=requireAdmin_(p.token);
  const confirmation=String(p.confirmation||'').trim();
  if(confirmation!=='PADAM SEMUA DATA MURID')throw new Error('Pengesahan tidak sah. Taip PADAM SEMUA DATA MURID untuk meneruskan.');
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  // Profil murid dan jadual yang hubungan utamanya ialah NO_KP dikosongkan.
  // UNIT/GURU/USERS/AKTIVITI/DOKUMEN serta pencapaian berkumpulan tanpa NO_KP dikekalkan.
  const targets=[
    {name:SHEETS.MURID,label:'MURID'},
    {name:SHEETS.PLACEMENT,label:'PENEMPATAN_UNIT'},
    {name:SHEETS.ATTENDANCE,label:'KEHADIRAN'},
    {name:SHEETS.AJK,label:'AJK_UNIT'},
    {name:SHEETS.PARTICIPANTS,label:'PESERTA_AKTIVITI'}
  ];
  const cleared={};let total=0;
  targets.forEach(t=>{
    const sh=ss.getSheetByName(t.name);if(!sh){cleared[t.label]=0;return;}
    const lastRow=sh.getLastRow(),lastCol=sh.getLastColumn();let count=0;
    if(lastRow>1&&lastCol>0){
      const data=sh.getRange(2,1,lastRow-1,lastCol).getValues();
      count=data.filter(row=>row.some(v=>v!==''&&v!==null&&v!==undefined)).length;
      sh.getRange(2,1,lastRow-1,lastCol).clearContent();
    }
    cleared[t.label]=count;total+=count;
  });
  // PENCAPAIAN: padam baris individu yang mempunyai NO_KP, tetapi kekalkan
  // rekod kumpulan/unit yang NO_KP-nya kosong. Padamkan kelompok baris dari bawah.
  const ach=ss.getSheetByName(SHEETS.ACHIEVEMENT);let individualAchievements=0;
  if(ach&&ach.getLastRow()>1&&ach.getLastColumn()>0){
    const values=ach.getDataRange().getValues(),headers=values[0].map(x=>String(x).trim()),kpIndex=headers.indexOf('NO_KP');
    if(kpIndex>=0){
      const rowNums=[];for(let i=1;i<values.length;i++)if(String(values[i][kpIndex]||'').trim())rowNums.push(i+1);
      individualAchievements=rowNums.length;
      let i=rowNums.length-1;
      while(i>=0){
        let endRow=rowNums[i],startRow=endRow;i--;
        while(i>=0&&rowNums[i]===startRow-1){startRow=rowNums[i];i--;}
        ach.deleteRows(startRow,endRow-startRow+1);
      }
    }
  }
  cleared.PENCAPAIAN_INDIVIDU=individualAchievements;total+=individualAchievements;
  logAction_('bulkDeleteAllMurid',{cleared,total,by:admin.USERNAME,role:admin.ROLE});
  return {ok:true,totalRowsCleared:total,cleared,message:'Pembersihan data murid selesai. Header dikekalkan; UNIT, GURU, USERS, AKTIVITI, DOKUMEN dan rekod PENCAPAIAN tanpa NO_KP dikekalkan.'};
}

function requireAdmin_(token){
  const s=getSession_(token);
  if(s.ROLE!=='ADMIN')throw new Error('Akses ditolak. Fungsi ini hanya untuk ADMIN.');
  return s;
}

function getUsersSecure_(token){
  const s=requireAdmin_(token);
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  if(!sh)throw new Error('USERS belum wujud.');
  const values=sh.getDataRange().getValues();
  if(values.length<2)return {ok:true,data:[],user:{username:s.USERNAME,role:s.ROLE}};
  const h=values[0].map(String);
  const unitRows=sheetObjects_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.UNIT));
  const unitNames={};unitRows.forEach(u=>unitNames[String(u.UNIT_ID||'')]=String(u.NAMA_UNIT||u.UNIT_ID||''));
  const data=values.slice(1).filter(r=>r.some(x=>String(x).trim()!=='')).map(r=>{
    const o={};h.forEach((k,i)=>o[k]=r[i] instanceof Date?r[i].toISOString():r[i]);
    delete o.PASSWORD_HASH;
    const ids=getUserUnitIds_(String(o.USER_ID||''));
    o.UNIT_IDS=ids;
    const accountRole=String(o.ROLE||'').toUpperCase();
    o.UNIT_DIPILIH=accountRole==='PENTADBIR'?'Semua unit (Pentadbir)':ids.map(id=>unitNames[id]||id).join(', ')||(accountRole==='PENYELARAS'?'Belum ditugaskan oleh ADMIN':accountRole==='GURU'?'Belum memilih — pilih selepas kelulusan':'-');
    return o;
  });
  return {ok:true,data,user:{username:s.USERNAME,role:s.ROLE}};
}

function addUserSecure_(p){
  const admin=requireAdmin_(p.token);
  const username=String(p.username||'').trim().toLowerCase();
  const nama=String(p.nama||'').trim();
  const role=String(p.role||'GURU').trim().toUpperCase();
  const password=String(p.password||'');
  if(!/^[a-z0-9._-]{3,30}$/.test(username))throw new Error('Username mesti 3-30 aksara: huruf kecil, nombor, titik, _ atau -.');
  if(!nama)throw new Error('Nama pengguna diperlukan.');
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(role))throw new Error('Role tidak sah.');
  if(password.length<8)throw new Error('Password mesti sekurang-kurangnya 8 aksara.');
  if(findUser_(username))throw new Error('Username sudah wujud.');
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  const id='U'+Utilities.getUuid().slice(0,8).toUpperCase();
  const accountEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)?username:'';
  const account={USER_ID:id,USERNAME:username,NAMA:nama,EMAIL:accountEmail,ROLE:role};
  appendObjectByHeaders_(sh,{USER_ID:id,USERNAME:username,NAMA:nama,EMAIL:accountEmail,ROLE:role,PASSWORD_HASH:hashPassword_(password),STATUS:'AKTIF',CREATED_AT:new Date(),LAST_LOGIN:''});
  let guruProfile=null;
  if(role==='PENYELARAS')guruProfile=ensureGuruProfileForUser_(account,'AKTIF',false);
  logAction_('addUser',{userId:id,username,nama,role,by:admin.USERNAME,noGuru:guruProfile&&guruProfile.noGuru||''});
  return {ok:true,message:'Pengguna berjaya ditambah.'+(guruProfile&&guruProfile.noGuru?' ID Guru: '+guruProfile.noGuru+'.':''),userId:id,noGuru:guruProfile&&guruProfile.noGuru||''};
}

function setUserStatusSecure_(p){
  const admin=requireAdmin_(p.token);
  const userId=String(p.userId||'').trim();
  const status=String(p.status||'').trim().toUpperCase();
  if(!userId||!['AKTIF','TIDAK_AKTIF'].includes(status))throw new Error('Data status tidak sah.');
  if(userId===admin.USER_ID&&status!=='AKTIF')throw new Error('Anda tidak boleh menyahaktifkan akaun sendiri.');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
    ensureUserColumns_(sh,['USER_ID','USERNAME','NAMA','EMAIL','ROLE','PASSWORD_HASH','STATUS','CREATED_AT','LAST_LOGIN','APPROVED_BY','APPROVED_AT','USE_EXPLICIT_UNITS']);
    const values=sh.getDataRange().getValues(),h=values[0].map(String),idx={};h.forEach((x,i)=>idx[x]=i);
    for(let r=1;r<values.length;r++){
      if(String(values[r][idx.USER_ID])===userId){
        const oldStatus=String(values[r][idx.STATUS]||'').trim().toUpperCase();
        sh.getRange(r+1,idx.STATUS+1).setValue(status);
        if(status==='AKTIF'&&oldStatus==='MENUNGGU_KELULUSAN'){
          if(idx.APPROVED_BY!==undefined)sh.getRange(r+1,idx.APPROVED_BY+1).setValue(admin.USERNAME);
          if(idx.APPROVED_AT!==undefined)sh.getRange(r+1,idx.APPROVED_AT+1).setValue(new Date());
        }
        let guruProfile=null;
        const accountRole=String(values[r][idx.ROLE]||'').trim().toUpperCase();
        if(isUnitScopedRole_(accountRole)){
          const account={USER_ID:userId,USERNAME:values[r][idx.USERNAME],NAMA:values[r][idx.NAMA],EMAIL:idx.EMAIL!==undefined?values[r][idx.EMAIL]:values[r][idx.USERNAME],ROLE:accountRole};
          guruProfile=ensureGuruProfileForUser_(account,status==='AKTIF'?'AKTIF':'TIDAK_AKTIF',true);
        }
        if(status!=='AKTIF')logoutUserSessionsById_(userId);
        logAction_(status==='AKTIF'&&oldStatus==='MENUNGGU_KELULUSAN'?'approveRegistration':'setUserStatus',{userId,username:values[r][idx.USERNAME],oldStatus,status,by:admin.USERNAME,noGuru:guruProfile&&guruProfile.noGuru||''});
        let message=status==='AKTIF'&&oldStatus==='MENUNGGU_KELULUSAN'?'Akaun berjaya diluluskan. Pengguna kini boleh log masuk.':'Status pengguna dikemas kini.';
        if(guruProfile&&guruProfile.noGuru)message+=' ID Guru: '+guruProfile.noGuru+'.';
        return {ok:true,message:message,noGuru:guruProfile&&guruProfile.noGuru||''};
      }
    }
    throw new Error('Pengguna tidak ditemui.');
  }finally{lock.releaseLock();}
}

function resetUserPasswordSecure_(p){
  const admin=requireAdmin_(p.token);
  const userId=String(p.userId||'').trim();
  const password=String(p.password||'');
  if(password.length<8)throw new Error('Password baharu mesti sekurang-kurangnya 8 aksara.');
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  const values=sh.getDataRange().getValues(),h=values[0].map(String),ui=h.indexOf('USER_ID'),pi=h.indexOf('PASSWORD_HASH'),un=h.indexOf('USERNAME');
  for(let r=1;r<values.length;r++){
    if(String(values[r][ui])===userId){
      sh.getRange(r+1,pi+1).setValue(hashPassword_(password));
      logoutUserSessionsById_(userId);
      logAction_('resetUserPassword',{userId,username:values[r][un],by:admin.USERNAME});
      return {ok:true,message:'Password berjaya ditetapkan semula. Semua session pengguna telah dilog keluar.'};
    }
  }
  throw new Error('Pengguna tidak ditemui.');
}

function changeUserRoleSecure_(p){
  const admin=requireAdmin_(p.token);
  const userId=String(p.userId||'').trim();
  const role=String(p.role||'').trim().toUpperCase();
  if(!userId||!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(role))throw new Error('Role tidak sah.');
  if(userId===admin.USER_ID)throw new Error('Anda tidak boleh menukar role akaun sendiri.');
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  const values=sh.getDataRange().getValues(),h=values[0].map(String),ui=h.indexOf('USER_ID'),ri=h.indexOf('ROLE'),un=h.indexOf('USERNAME');
  for(let r=1;r<values.length;r++){
    if(String(values[r][ui])===userId){
      const previousRole=String(values[r][ri]||'').trim().toUpperCase();
      sh.getRange(r+1,ri+1).setValue(role);
      if(previousRole==='PENYELARAS'&&role!=='PENYELARAS')deactivateUserUnitAssignments_(userId);
      let guruProfile=null;
      if(isUnitScopedRole_(role)){
        const account={USER_ID:userId,USERNAME:values[r][un],NAMA:values[r][h.indexOf('NAMA')],EMAIL:h.indexOf('EMAIL')>=0?values[r][h.indexOf('EMAIL')]:values[r][un],ROLE:role};
        const currentStatus=String(values[r][h.indexOf('STATUS')]||'AKTIF').trim().toUpperCase();
        guruProfile=ensureGuruProfileForUser_(account,currentStatus==='AKTIF'?'AKTIF':'TIDAK_AKTIF',false);
      }
      logoutUserSessionsById_(userId);
      logAction_('changeUserRole',{userId,username:values[r][un],role,by:admin.USERNAME,noGuru:guruProfile&&guruProfile.noGuru||''});
      return {ok:true,message:'Role pengguna dikemas kini. Session lama telah dilog keluar.'+(guruProfile&&guruProfile.noGuru?' ID Guru: '+guruProfile.noGuru+'.':''),noGuru:guruProfile&&guruProfile.noGuru||''};
    }
  }
  throw new Error('Pengguna tidak ditemui.');
}

function assignCoordinatorUnitsSecure_(p){
  const admin=requireAdmin_(p.token);
  const userId=String(p.userId||'').trim();
  if(!userId)throw new Error('USER_ID akaun penyelaras diperlukan.');
  const account=findUserById_(userId);
  if(!account)throw new Error('Akaun pengguna tidak ditemui.');
  if(String(account.ROLE||'').trim().toUpperCase()!=='PENYELARAS')throw new Error('Penugasan unit hanya boleh dibuat untuk akaun PENYELARAS. Tukar peranan akaun dahulu.');
  let unitIds=[];
  try{unitIds=Array.isArray(p.unitIds)?p.unitIds:JSON.parse(String(p.unitIds||'[]'));}catch(e){throw new Error('Senarai unit tidak sah.');}
  if(!Array.isArray(unitIds))throw new Error('Senarai unit tidak sah.');
  unitIds=[...new Set(unitIds.map(x=>String(x||'').trim()).filter(Boolean))];
  const activeUnits=getRegistrationOptions_().units||[];
  const activeMap=new Map(activeUnits.map(u=>[String(u.unitId),u]));
  const invalid=unitIds.filter(id=>!activeMap.has(id));
  if(invalid.length)throw new Error('Terdapat unit yang tidak aktif atau tidak sah. Muat semula senarai unit.');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const sh=ensureUserUnitsSheet_();
    const values=sh.getDataRange().getValues();
    const headers=(values[0]||[]).map(String),idx={};headers.forEach((h,i)=>idx[h]=i);
    if(idx.USER_ID===undefined||idx.UNIT_ID===undefined||idx.STATUS===undefined)throw new Error('Struktur USER_UNITS tidak lengkap.');
    let deactivated=0;
    for(let r=1;r<values.length;r++){
      if(String(values[r][idx.USER_ID]||'')===userId&&String(values[r][idx.STATUS]||'AKTIF').toUpperCase()!=='TIDAK_AKTIF'){
        sh.getRange(r+1,idx.STATUS+1).setValue('TIDAK_AKTIF');deactivated++;
      }
    }
    const now=new Date();
    const rows=unitIds.map(unitId=>headers.map(h=>({USER_ID:userId,UNIT_ID:unitId,STATUS:'AKTIF',CREATED_AT:now}[h]!==undefined?{USER_ID:userId,UNIT_ID:unitId,STATUS:'AKTIF',CREATED_AT:now}[h]:'')));
    if(rows.length)sh.getRange(sh.getLastRow()+1,1,rows.length,headers.length).setValues(rows);
    logoutUserSessionsById_(userId);
    const names=unitIds.map(id=>activeMap.get(id).nama);
    logAction_('assignCoordinatorUnits',{userId,username:account.USERNAME,unitIds,unitNames:names,previousMappingsDeactivated:deactivated,by:admin.USERNAME});
    return {ok:true,message:unitIds.length?`Penugasan ${unitIds.length} unit berjaya disimpan. Akaun penyelaras perlu log masuk semula.`:'Semua penugasan unit telah ditarik balik. Akaun penyelaras perlu menerima penugasan baharu sebelum log masuk.',unitIds,unitNames:names};
  }finally{lock.releaseLock();}
}

function logoutUserSessionsSecure_(p){
  const admin=requireAdmin_(p.token);
  const userId=String(p.userId||'').trim();
  if(!userId)throw new Error('User ID diperlukan.');
  if(userId===admin.USER_ID)throw new Error('Gunakan butang Log Keluar untuk akaun sendiri.');
  const count=logoutUserSessionsById_(userId);
  logAction_('logoutUserSessions',{userId,count,by:admin.USERNAME});
  return {ok:true,message:`${count} session telah dilog keluar.`};
}

/** Permanently delete a user account and any linked teacher profile. ADMIN only. */
function deleteUserSecure_(p){
  const admin=requireAdmin_(p.token);
  const userId=String(p.userId||'').trim();
  if(!userId)throw new Error('USER_ID diperlukan untuk memadam akaun.');
  return deleteAccountAndTeacherProfile_(admin,{userId:userId,source:'users'});
}

/** Permanently delete a teacher profile; if linked, its login account is deleted too. ADMIN only. */
function deleteGuruSecure_(p){
  const admin=requireAdmin_(p.token);
  const noGuru=String(p.noGuru||'').trim();
  if(!noGuru)throw new Error('NO_GURU diperlukan untuk memadam profil guru.');
  return deleteAccountAndTeacherProfile_(admin,{noGuru:noGuru,source:'guru'});
}

/**
 * Shared hard-delete path for Pengurusan Pengguna and Pengurusan Guru.
 * Removes only account access records (USERS, linked GURU, SESSIONS, USER_UNITS).
 * Historical activities, attendance, achievements and audit records are retained.
 */
function deleteAccountAndTeacherProfile_(admin,options){
  const opts=options||{},source=String(opts.source||'');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const ss=SpreadsheetApp.getActiveSpreadsheet();
    const usersSh=ss.getSheetByName(SHEETS.USERS);
    const guruSh=ss.getSheetByName(SHEETS.GURU);
    if(!usersSh)throw new Error('USERS belum wujud.');
    if(source==='guru'&&!guruSh)throw new Error('GURU belum wujud.');

    let userId=String(opts.userId||'').trim();
    const requestedNoGuru=String(opts.noGuru||'').trim();
    let user=userId?findUserById_(userId):null;
    const guruRows=guruSh?sheetObjects_(guruSh):[];
    const selectedGuru=requestedNoGuru?guruRows.find(r=>String(r.NO_GURU||'').trim().toLowerCase()===requestedNoGuru.toLowerCase()):null;
    if(source==='users'&&!user)throw new Error('Akaun pengguna tidak ditemui atau sudah dipadam.');
    if(source==='guru'&&!selectedGuru)throw new Error('Profil guru tidak ditemui atau sudah dipadam.');
    if(!userId&&selectedGuru)userId=String(selectedGuru.USER_ID||'').trim();
    if(!user&&userId)user=findUserById_(userId);
    if(!user&&source==='users')throw new Error('Akaun pengguna tidak ditemui.');
    if(userId&&userId===String(admin.USER_ID||''))throw new Error('Akaun ADMIN yang sedang digunakan tidak boleh dipadam.');

    const userRole=String(user&&user.ROLE||'').trim().toUpperCase();
    if(userRole==='ADMIN'){
      const allUsers=sheetObjects_(usersSh);
      const adminCount=allUsers.filter(r=>String(r.ROLE||'').trim().toUpperCase()==='ADMIN').length;
      if(adminCount<=1)throw new Error('Akaun ADMIN terakhir tidak boleh dipadam. Tambah ADMIN lain dahulu.');
    }

    // Preserve the sequential G001/G002... counter so deleting the newest profile
    // never causes its ID to be assigned to a later teacher.
    const props=PropertiesService.getScriptProperties();
    let maxSeq=Number(props.getProperty('EKOSSTA_GURU_LAST_SEQUENCE')||0);
    guruRows.forEach(r=>{const m=String(r.NO_GURU||'').trim().toUpperCase().match(/^G(\d+)$/);if(m)maxSeq=Math.max(maxSeq,Number(m[1])||0);});
    if(requestedNoGuru){const m=requestedNoGuru.toUpperCase().match(/^G(\d+)$/);if(m)maxSeq=Math.max(maxSeq,Number(m[1])||0);}
    props.setProperty('EKOSSTA_GURU_LAST_SEQUENCE',String(maxSeq));

    const targetGuruRows=guruRows.filter(r=>{
      const rowUserId=String(r.USER_ID||'').trim();
      const rowNoGuru=String(r.NO_GURU||'').trim();
      if(userId&&rowUserId===userId)return true;
      return !!requestedNoGuru&&rowNoGuru.toLowerCase()===requestedNoGuru.toLowerCase();
    });
    const linkedNoGuru=targetGuruRows.map(r=>String(r.NO_GURU||'').trim()).filter(Boolean);
    const targetUsername=String(user&&user.USERNAME||'');
    const targetName=String(user&&user.NAMA||(selectedGuru&&selectedGuru.NAMA)||'');
    // Clear live UNIT references to deleted teacher IDs to avoid stale advisor links.
    const clearedUnitReferences=clearGuruUnitReferences_(linkedNoGuru);

    // Delete all sessions for the account, including expired/logged-out rows.
    let sessionsDeleted=0;
    if(userId){sessionsDeleted=deleteMatchingSheetRows_(ss.getSheetByName(SHEETS.SESSIONS),row=>String(row.USER_ID||'').trim()===userId);}
    let unitMappingsDeleted=0;
    if(userId){unitMappingsDeleted=deleteMatchingSheetRows_(ss.getSheetByName(SHEETS.USER_UNITS),row=>String(row.USER_ID||'').trim()===userId);}
    const guruDeleted=deleteMatchingSheetRows_(guruSh,row=>{
      const rowUserId=String(row.USER_ID||'').trim();
      const rowNoGuru=String(row.NO_GURU||'').trim();
      if(userId&&rowUserId===userId)return true;
      return !!requestedNoGuru&&rowNoGuru.toLowerCase()===requestedNoGuru.toLowerCase();
    });
    const usersDeleted=userId?deleteMatchingSheetRows_(usersSh,row=>String(row.USER_ID||'').trim()===userId):0;

    if(!usersDeleted&&!guruDeleted)throw new Error('Tiada rekod dipadam. Rekod mungkin telah berubah; muat semula senarai.');
    logAction_('hardDeleteAccountAndGuru',{userId:userId||'',username:targetUsername,name:targetName,source:source,requestedNoGuru:requestedNoGuru,deletedGuruIds:linkedNoGuru,usersDeleted:usersDeleted,guruDeleted:guruDeleted,sessionsDeleted:sessionsDeleted,unitMappingsDeleted:unitMappingsDeleted,by:admin.USERNAME});

    const linkedText=linkedNoGuru.length?' Profil guru: '+linkedNoGuru.join(', ')+'.':'';
    const accountText=usersDeleted?' Akaun log masuk dan sesi berkaitan turut dipadam.':' Tiada akaun log masuk yang dipautkan.';
    return {ok:true,message:(usersDeleted?'Akaun '+(targetUsername||userId)+' dipadam secara kekal.':'Rekod guru dipadam secara kekal.')+linkedText+accountText+' Pautan Guru Penasihat dalam UNIT dikosongkan; sejarah aktiviti, kehadiran dan pencapaian dikekalkan.',userId:userId||'',deletedUsers:usersDeleted,deletedGuru:guruDeleted,deletedSessions:sessionsDeleted,deletedUnitMappings:unitMappingsDeleted};
  }finally{lock.releaseLock();}
}

/** Remove active advisor pointers to a teacher being permanently deleted. */
function clearGuruUnitReferences_(noGuruIds){
  const ids=[...new Set((noGuruIds||[]).map(x=>String(x||'').trim()).filter(Boolean))];
  if(!ids.length)return 0;
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.UNIT);
  if(!sh||sh.getLastRow()<2)return 0;
  const values=sh.getDataRange().getValues(),headers=values[0].map(x=>String(x).trim());
  const advisorIdx=headers.indexOf('GURU_PENASIHAT');
  if(advisorIdx<0)return 0;
  let cleared=0;
  for(let r=1;r<values.length;r++){
    if(ids.includes(String(values[r][advisorIdx]||'').trim())){
      sh.getRange(r+1,advisorIdx+1).clearContent();
      const updatedIdx=headers.indexOf('UPDATED_AT');
      if(updatedIdx>=0)sh.getRange(r+1,updatedIdx+1).setValue(new Date());
      cleared++;
    }
  }
  return cleared;
}

/** Delete matching data rows bottom-up and keep the sheet header intact. */
function deleteMatchingSheetRows_(sh,predicate){
  if(!sh||sh.getLastRow()<2)return 0;
  const values=sh.getDataRange().getValues();
  if(!values.length)return 0;
  const headers=values[0].map(x=>String(x).trim());
  const rowNumbers=[];
  for(let i=1;i<values.length;i++){
    const row={};headers.forEach((h,j)=>row[h]=values[i][j]);
    if(predicate(row,values[i],i+1))rowNumbers.push(i+1);
  }
  if(!rowNumbers.length)return 0;
  let i=rowNumbers.length-1;
  while(i>=0){
    let end=rowNumbers[i],start=end;i--;
    while(i>=0&&rowNumbers[i]===start-1){start=rowNumbers[i];i--;}
    sh.deleteRows(start,end-start+1);
  }
  return rowNumbers.length;
}

function getGuruSecure_(p){
  const s=getSession_(p.token);
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.GURU);
  if(!sh)throw new Error('GURU belum wujud. Semak tab dan header helaian sebenar.');
  // Backfill legacy account registrations: accounts with role GURU receive a linked
  // G001/G002/... profile automatically, without requiring the admin to enter it twice.
  if(s.ROLE==='ADMIN') syncGuruProfilesForExistingAccounts_();
  const values=sh.getDataRange().getValues();
  const h=values[0].map(String);
  const data=values.length<2?[]:values.slice(1).filter(r=>r.some(x=>String(x).trim()!=='' )).map(r=>{const o={};h.forEach((k,i)=>o[k]=r[i] instanceof Date?r[i].toISOString():r[i]);return o;});
  if(s.ROLE==='ADMIN') return {ok:true,data,user:{username:s.USERNAME,role:s.ROLE}};
  const ownNoGuru=getGuruNoForSession_(s);
  const own=data.filter(x=>String(x.USER_ID||'')===String(s.USER_ID) || (ownNoGuru && String(x.NO_GURU||'')===ownNoGuru));
  return {ok:true,data:own,user:{username:s.USERNAME,role:s.ROLE}};
}

/** Add missing GURU columns without changing or reordering existing data. */
function ensureGuruSchema_(sh){
  if(!sh)throw new Error('Helaian GURU belum wujud. Jalankan setupModelBV2() jika helaian ini belum pernah disediakan.');
  const required=['NO_GURU','NAMA','EMAIL','NO_TEL','STATUS','USER_ID','CREATED_AT','UPDATED_AT'];
  if(sh.getLastRow()===0||sh.getLastColumn()===0){
    sh.getRange(1,1,1,required.length).setValues([required]);
    sh.setFrozenRows(1);
    return sh;
  }
  let headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(x=>String(x).trim());
  required.forEach(name=>{
    if(!headers.includes(name)){
      sh.getRange(1,sh.getLastColumn()+1).setValue(name);
      headers.push(name);
    }
  });
  if(!headers.includes('NO_GURU'))throw new Error('Lajur NO_GURU tidak ditemui dalam helaian GURU.');
  return sh;
}

/**
 * Generate the next sequential teacher ID. Both the current sheet contents and
 * a script property are considered so existing/manual IDs and deleted last rows
 * do not cause an ID to be reused. Call while holding ScriptLock.
 */
function nextGuruIdLocked_(sh){
  ensureGuruSchema_(sh);
  const values=sh.getDataRange().getDisplayValues();
  const headers=(values[0]||[]).map(x=>String(x).trim());
  const ni=headers.indexOf('NO_GURU');
  const used=new Set();
  let maxSeq=0;
  for(let r=1;r<values.length;r++){
    const id=String(values[r][ni]||'').trim().toUpperCase();
    if(!id)continue;
    used.add(id);
    const m=id.match(/^G(\d+)$/);
    if(m)maxSeq=Math.max(maxSeq,Number(m[1])||0);
  }
  const props=PropertiesService.getScriptProperties();
  const saved=Number(props.getProperty('EKOSSTA_GURU_LAST_SEQUENCE')||0);
  maxSeq=Math.max(maxSeq,Number.isFinite(saved)?saved:0);
  let seq=maxSeq+1;
  let candidate='G'+String(seq).padStart(3,'0');
  while(used.has(candidate.toUpperCase())){seq++;candidate='G'+String(seq).padStart(3,'0');}
  props.setProperty('EKOSSTA_GURU_LAST_SEQUENCE',String(seq));
  return candidate;
}

/**
 * Create/link one GURU profile for a USERS row. An existing profile with the
 * same USER_ID (or an unlinked profile with the same email) is reused.
 * forceStatus=true is used when an admin explicitly changes account status.
 */
function ensureGuruProfileForUser_(user,desiredStatus,forceStatus){
  user=user||{};
  if(!isUnitScopedRole_(user.ROLE||'GURU'))return null;
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const sh=ensureGuruSchema_(ss.getSheetByName(SHEETS.GURU));
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(x=>String(x).trim());
  const idx={};headers.forEach((h,i)=>idx[h]=i);
  const values=sh.getDataRange().getValues();
  const userId=String(user.USER_ID||'').trim();
  const email=String(user.EMAIL||(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(user.USERNAME||''))?user.USERNAME:'')).trim().toLowerCase();
  const name=String(user.NAMA||user.NAME||'').trim();
  const targetStatus=String(desiredStatus||'MENUNGGU_KELULUSAN').trim().toUpperCase();
  let match=-1;
  // Direct USER_ID link is authoritative.
  if(userId&&idx.USER_ID!==undefined){
    for(let r=1;r<values.length;r++)if(String(values[r][idx.USER_ID]||'').trim()===userId){match=r;break;}
  }
  // Reuse an existing teacher profile only when its email matches and it is not
  // already linked to a different account.
  if(match<0&&email&&idx.EMAIL!==undefined){
    for(let r=1;r<values.length;r++){
      const rowEmail=String(values[r][idx.EMAIL]||'').trim().toLowerCase();
      const rowUser=idx.USER_ID===undefined?'':String(values[r][idx.USER_ID]||'').trim();
      if(rowEmail===email&&(!rowUser||rowUser===userId)){match=r;break;}
    }
  }
  const now=new Date();
  if(match>=1){
    const row=values[match].slice();
    const oldId=String(row[idx.NO_GURU]||'').trim();
    const oldStatus=String(row[idx.STATUS]||'').trim().toUpperCase();
    const noGuru=oldId||nextGuruIdLocked_(sh);
    if(idx.NO_GURU!==undefined)row[idx.NO_GURU]=noGuru;
    if(idx.USER_ID!==undefined&&userId)row[idx.USER_ID]=userId;
    if(idx.NAMA!==undefined&&!String(row[idx.NAMA]||'').trim()&&name)row[idx.NAMA]=name;
    if(idx.EMAIL!==undefined&&!String(row[idx.EMAIL]||'').trim()&&email)row[idx.EMAIL]=email;
    let nextStatus=oldStatus;
    if(forceStatus)nextStatus=targetStatus;
    else if(!oldStatus||oldStatus==='MENUNGGU_KELULUSAN')nextStatus=targetStatus;
    else if(targetStatus==='TIDAK_AKTIF'&&oldStatus==='AKTIF')nextStatus='TIDAK_AKTIF';
    if(idx.STATUS!==undefined)row[idx.STATUS]=nextStatus;
    let changed=false;
    const oldRow=values[match];
    for(let c=0;c<row.length;c++)if(String(row[c]??'')!==String(oldRow[c]??'')){changed=true;break;}
    if(changed){if(idx.UPDATED_AT!==undefined)row[idx.UPDATED_AT]=now;sh.getRange(match+1,1,1,headers.length).setValues([row]);}
    return {noGuru:noGuru,created:false,changed:changed};
  }
  const noGuru=nextGuruIdLocked_(sh);
  appendObjectByHeaders_(sh,{NO_GURU:noGuru,NAMA:name,EMAIL:email,NO_TEL:'',STATUS:targetStatus,USER_ID:userId,CREATED_AT:now,UPDATED_AT:now});
  return {noGuru:noGuru,created:true,changed:true};
}

/** One-time-safe migration run when ADMIN opens Pengurusan Guru. */
function syncGuruProfilesForExistingAccounts_(){
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const ss=SpreadsheetApp.getActiveSpreadsheet();
    const users=ss.getSheetByName(SHEETS.USERS);
    if(!users||users.getLastRow()<2)return {created:0,linked:0};
    ensureGuruSchema_(ss.getSheetByName(SHEETS.GURU));
    const accounts=sheetObjects_(users);
    let created=0,linked=0;
    accounts.forEach(account=>{
      if(!isUnitScopedRole_(account.ROLE))return;
      const accountStatus=String(account.STATUS||'').trim().toUpperCase();
      const profileStatus=accountStatus==='AKTIF'?'AKTIF':accountStatus==='TIDAK_AKTIF'?'TIDAK_AKTIF':'MENUNGGU_KELULUSAN';
      const result=ensureGuruProfileForUser_(account,profileStatus,false);
      if(result&&result.created){created++;logAction_('autoCreateGuruProfile',{userId:account.USER_ID,username:account.USERNAME,noGuru:result.noGuru,status:profileStatus,by:'SYSTEM'});}
      else if(result&&result.changed){linked++;logAction_('autoLinkGuruProfile',{userId:account.USER_ID,username:account.USERNAME,noGuru:result.noGuru,status:profileStatus,by:'SYSTEM'});}
    });
    return {created:created,linked:linked};
  }finally{lock.releaseLock();}
}

function addGuruSecure_(p){
  const admin=requireAdmin_(p.token);
  let noGuru=String(p.noGuru||'').trim();
  const nama=String(p.nama||'').trim();
  const email=String(p.email||'').trim().toLowerCase();
  const noTel=String(p.noTel||'').trim();
  const status=String(p.status||'AKTIF').trim().toUpperCase();
  const userId=String(p.userId||'').trim();
  if(!nama)throw new Error('Nama guru diperlukan. No. Guru boleh dikosongkan untuk dijana secara automatik.');
  if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Format email tidak sah.');
  if(!['AKTIF','TIDAK_AKTIF'].includes(status))throw new Error('Status tidak sah.');
  if(userId && !findUserById_(userId))throw new Error('Akaun pengguna tidak ditemui.');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const sh=ensureGuruSchema_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.GURU));
    const rows=sh.getDataRange().getValues(),h=rows[0].map(String),ni=h.indexOf('NO_GURU'),ei=h.indexOf('EMAIL'),ui=h.indexOf('USER_ID');
    if(userId&&ui>=0){
      const linked=rows.slice(1).find(r=>String(r[ui]||'').trim()===userId);
      if(linked)throw new Error('Akaun ini sudah mempunyai profil guru dengan ID '+String(linked[ni]||'')+'. Gunakan rekod sedia ada, bukan tambah profil kedua.');
    }
    if(email&&ei>=0){
      const sameEmail=rows.slice(1).find(r=>String(r[ei]||'').trim().toLowerCase()===email);
      if(sameEmail)throw new Error('E-mel ini sudah mempunyai profil guru dengan ID '+String(sameEmail[ni]||'')+'. Sila kemas kini pautan pada rekod sedia ada.');
    }
    const autoGenerated=!noGuru;
    if(autoGenerated)noGuru=nextGuruIdLocked_(sh);
    if(rows.slice(1).some(r=>String(r[ni]).toLowerCase()===noGuru.toLowerCase()))throw new Error('No. Guru sudah wujud.');
    const now=new Date();
    appendObjectByHeaders_(sh,{NO_GURU:noGuru,NAMA:nama,EMAIL:email,NO_TEL:noTel,STATUS:status,USER_ID:userId,CREATED_AT:now,UPDATED_AT:now});
    logAction_('addGuru',{noGuru,nama,email,noTel,status,userId,autoGenerated,by:admin.USERNAME});
    return {ok:true,message:'Guru berjaya ditambah. ID Guru: '+noGuru+'.',noGuru,autoGenerated};
  }finally{lock.releaseLock();}
}

function updateGuruSecure_(p){
  const admin=requireAdmin_(p.token);
  const originalNoGuru=String(p.originalNoGuru||'').trim();
  const noGuru=String(p.noGuru||'').trim();
  const nama=String(p.nama||'').trim();
  const email=String(p.email||'').trim().toLowerCase();
  const noTel=String(p.noTel||'').trim();
  const status=String(p.status||'AKTIF').trim().toUpperCase();
  const userId=String(p.userId||'').trim();
  if(!originalNoGuru||!noGuru||!nama)throw new Error('No. Guru dan Nama diperlukan.');
  if(email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email))throw new Error('Format email tidak sah.');
  if(!['AKTIF','TIDAK_AKTIF'].includes(status))throw new Error('Status tidak sah.');
  if(userId && !findUserById_(userId))throw new Error('Akaun pengguna tidak ditemui.');
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.GURU);
  const rows=sh.getDataRange().getValues(),h=rows[0].map(String),ni=h.indexOf('NO_GURU'),ui=h.indexOf('USER_ID');
  for(let r=1;r<rows.length;r++){
    if(String(rows[r][ni]).toLowerCase()===originalNoGuru.toLowerCase()){
      if(noGuru.toLowerCase()!==originalNoGuru.toLowerCase() && rows.slice(1).some((x,i)=>i!==r-1&&String(x[ni]).toLowerCase()===noGuru.toLowerCase()))throw new Error('No. Guru baharu sudah wujud.');
      const obj={};h.forEach((key,i)=>obj[key]=rows[r][i]);Object.assign(obj,{NO_GURU:noGuru,NAMA:nama,EMAIL:email,NO_TEL:noTel,STATUS:status,USER_ID:userId,UPDATED_AT:new Date()});sh.getRange(r+1,1,1,h.length).setValues([h.map(key=>obj[key]!==undefined?obj[key]:'')]);
      logAction_('updateGuru',{originalNoGuru,noGuru,nama,email,noTel,status,userId,by:admin.USERNAME});
      return {ok:true,message:'Rekod guru berjaya dikemas kini.'};
    }
  }
  throw new Error('Guru tidak ditemui.');
}

function setGuruStatusSecure_(p){
  const admin=requireAdmin_(p.token);
  const noGuru=String(p.noGuru||'').trim();
  const status=String(p.status||'').trim().toUpperCase();
  if(!noGuru||!['AKTIF','TIDAK_AKTIF'].includes(status))throw new Error('Data status tidak sah.');
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.GURU);
  const rows=sh.getDataRange().getValues(),h=rows[0].map(String),ni=h.indexOf('NO_GURU'),si=h.indexOf('STATUS'),ui=h.indexOf('UPDATED_AT');
  for(let r=1;r<rows.length;r++){
    if(String(rows[r][ni])===noGuru){
      sh.getRange(r+1,si+1).setValue(status); sh.getRange(r+1,ui+1).setValue(new Date());
      logAction_('setGuruStatus',{noGuru,status,by:admin.USERNAME});
      return {ok:true,message:'Status guru dikemas kini.'};
    }
  }
  throw new Error('Guru tidak ditemui.');
}

function getUnitSecure_(p){
  const s=getSession_(p.token);
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.UNIT);
  if(!sh)throw new Error('UNIT belum wujud. semak tab serta header helaian sebenar.');
  const all=sheetObjects_(sh).filter(o=>Object.keys(o).some(k=>String(o[k]===null||o[k]===undefined?'':o[k]).trim()!=='' )).map(row=>{const o={};Object.keys(row).forEach(k=>o[k]=row[k] instanceof Date?row[k].toISOString():row[k]);return o;});
  let data=all;
  const allData=String(p.allData||'').toLowerCase()==='true';
  if(s.ROLE==='PENYELARAS'||(s.ROLE==='GURU'&&!allData)){const assigned=getAccessibleUnitIds_(s);data=all.filter(x=>assigned.includes(String(x.UNIT_ID||'')));}
  const stats=getUnitStats_(); data=data.map(x=>Object.assign({},x,stats[String(x.UNIT_ID)+'|'+String(x.TAHUN)]||{JUMLAH_AHLI:0,LELAKI:0,PEREMPUAN:0}));
  return {ok:true,data,user:{username:s.USERNAME,role:s.ROLE}};
}
function getUnitStats_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet(), ms=ss.getSheetByName(SHEETS.MURID), ps=ss.getSheetByName(SHEETS.PLACEMENT); const out={}; if(!ms||!ps)return out;
  const students=sheetObjects_(ms),placements=sheetObjects_(ps),gender={};
  students.forEach(m=>{const kp=String(m.NO_KP||'').trim();if(kp)gender[kp]=String(m.JANTINA||'').trim().toUpperCase();});
  placements.forEach(r=>{if(String(r.STATUS||'').toUpperCase()!=='AKTIF')return;const unit=String(r.UNIT_ID||'').trim(),kp=String(r.NO_KP||'').trim(),tahun=String(r.TAHUN||'').trim();if(!unit)return;const key=unit+'|'+tahun;if(!out[key])out[key]={JUMLAH_AHLI:0,LELAKI:0,PEREMPUAN:0};out[key].JUMLAH_AHLI++;if(['L','LELAKI'].includes(gender[kp]))out[key].LELAKI++;if(['P','PEREMPUAN'].includes(gender[kp]))out[key].PEREMPUAN++;});
  return out;
}
function addUnitSecure_(p){
  const admin=requireAdmin_(p.token); const nama=String(p.namaUnit||'').trim(), kategori=String(p.kategori||'').trim().toUpperCase(), guru=String(p.guruPenasihat||'').trim(), tahun=String(p.tahun||new Date().getFullYear()).trim(), status=String(p.status||'AKTIF').trim().toUpperCase();
  if(!nama||!kategori||!tahun)throw new Error('Nama unit, kategori dan tahun diperlukan.'); if(!['UNIT BERUNIFORM','KELAB / PERSATUAN','SUKAN / PERMAINAN','RUMAH SUKAN'].includes(kategori))throw new Error('Kategori unit tidak sah.'); if(!['AKTIF','TIDAK_AKTIF'].includes(status))throw new Error('Status unit tidak sah.');
  if(guru){const gs=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.GURU),gv=gs.getDataRange().getValues(),gh=gv[0].map(String),ni=gh.indexOf('NO_GURU');if(!gv.slice(1).some(r=>String(r[ni])===guru))throw new Error('Guru penasihat tidak ditemui.');}
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.UNIT),rows=sh.getDataRange().getValues(),h=rows[0].map(String),ni=h.indexOf('NAMA_UNIT');if(rows.slice(1).some(r=>String(r[ni]).toLowerCase()===nama.toLowerCase()&&String(r[h.indexOf('TAHUN')])===tahun))throw new Error('Unit dengan nama dan tahun tersebut sudah wujud.');
  const id='U'+Utilities.getUuid().slice(0,8).toUpperCase(),now=new Date();appendObjectByHeaders_(sh,{UNIT_ID:id,NAMA_UNIT:nama,KATEGORI:kategori,GURU_PENASIHAT:guru,TAHUN:tahun,STATUS:status,CREATED_AT:now,UPDATED_AT:now});logAction_('addUnit',{unitId:id,nama,kategori,guru,tahun,status,by:admin.USERNAME});return {ok:true,message:'Unit berjaya ditambah.',unitId:id};
}
function updateUnitSecure_(p){
  const admin=requireAdmin_(p.token), id=String(p.unitId||'').trim(), nama=String(p.namaUnit||'').trim(), kategori=String(p.kategori||'').trim().toUpperCase(), guru=String(p.guruPenasihat||'').trim(), tahun=String(p.tahun||'').trim(), status=String(p.status||'AKTIF').trim().toUpperCase(); if(!id||!nama||!kategori||!tahun)throw new Error('Maklumat unit tidak lengkap.');
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.UNIT),rows=sh.getDataRange().getValues(),h=rows[0].map(String),ii=h.indexOf('UNIT_ID');for(let r=1;r<rows.length;r++)if(String(rows[r][ii])===id){const obj={};h.forEach((key,i)=>obj[key]=rows[r][i]);Object.assign(obj,{UNIT_ID:id,NAMA_UNIT:nama,KATEGORI:kategori,GURU_PENASIHAT:guru,TAHUN:tahun,STATUS:status,UPDATED_AT:new Date()});sh.getRange(r+1,1,1,h.length).setValues([h.map(key=>obj[key]!==undefined?obj[key]:'')]);logAction_('updateUnit',{unitId:id,nama,kategori,guru,tahun,status,by:admin.USERNAME});return {ok:true,message:'Unit berjaya dikemas kini.'};} throw new Error('Unit tidak ditemui.');
}
function setUnitStatusSecure_(p){const admin=requireAdmin_(p.token),id=String(p.unitId||'').trim(),status=String(p.status||'').trim().toUpperCase();if(!id||!['AKTIF','TIDAK_AKTIF'].includes(status))throw new Error('Data status unit tidak sah.');const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.UNIT),v=sh.getDataRange().getValues(),h=v[0].map(String);for(let r=1;r<v.length;r++)if(String(v[r][h.indexOf('UNIT_ID')])===id){sh.getRange(r+1,h.indexOf('STATUS')+1).setValue(status);sh.getRange(r+1,h.indexOf('UPDATED_AT')+1).setValue(new Date());logAction_('setUnitStatus',{unitId:id,status,by:admin.USERNAME});return {ok:true,message:'Status unit dikemas kini.'};}throw new Error('Unit tidak ditemui.');}
function getUnitMembersSecure_(p){
  const s=getSession_(p.token),id=String(p.unitId||'').trim();
  if(!id)throw new Error('Unit diperlukan.');
  const unit=sheetObjects_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.UNIT)).find(u=>String(u.UNIT_ID||'')===id);
  if(!unit)throw new Error('Unit tidak ditemui.');
  assertAttendanceUnitAccess_(s,unit);
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PLACEMENT);
  if(!sh)throw new Error('PENEMPATAN_UNIT belum wujud.');
  const v=sh.getDataRange().getValues(),h=v[0].map(String),rows=v.slice(1).filter(r=>String(r[h.indexOf('UNIT_ID')])===id&&String(r[h.indexOf('STATUS')]).toUpperCase()==='AKTIF');
  const ms=getMuridRows_(),map={};ms.forEach(x=>map[String(x.NO_KP)]=x);
  return {ok:true,data:rows.map(r=>({PLACEMENT_ID:r[h.indexOf('PLACEMENT_ID')],NO_KP:r[h.indexOf('NO_KP')],TAHUN:r[h.indexOf('TAHUN')],STATUS:r[h.indexOf('STATUS')],NAMA:(map[String(r[h.indexOf('NO_KP')])]||{}).NAMA||'-',JANTINA:(map[String(r[h.indexOf('NO_KP')])]||{}).JANTINA||'-'})),user:{username:s.USERNAME,role:s.ROLE}};
}
function addUnitMemberSecure_(p){const admin=requireAdmin_(p.token),kp=String(p.noKp||'').trim(),unit=String(p.unitId||'').trim(),tahun=String(p.tahun||new Date().getFullYear()).trim();if(!kp||!unit)throw new Error('Unit dan No KP diperlukan.');const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.MURID),mv=sh.getDataRange().getValues(),mh=mv[0].map(String),ki=mh.indexOf('NO_KP');if(!mv.slice(1).some(r=>String(r[ki])===kp))throw new Error('Murid tidak ditemui.');const ps=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PLACEMENT),pv=ps.getDataRange().getValues(),ph=pv[0].map(String),nk=ph.indexOf('NO_KP'),ui=ph.indexOf('UNIT_ID'),ti=ph.indexOf('TAHUN'),si=ph.indexOf('STATUS');if(pv.slice(1).some(r=>String(r[nk])===kp&&String(r[ui])===unit&&String(r[ti])===tahun&&String(r[si]).toUpperCase()==='AKTIF'))throw new Error('Murid sudah menjadi ahli unit ini untuk tahun tersebut.');const id='P'+Utilities.getUuid().slice(0,8).toUpperCase(),now=new Date();appendObjectByHeaders_(ps,{PLACEMENT_ID:id,NO_KP:kp,UNIT_ID:unit,TAHUN:tahun,STATUS:'AKTIF',CREATED_AT:now,UPDATED_AT:now});logAction_('addUnitMember',{placementId:id,noKp:kp,unitId:unit,tahun,by:admin.USERNAME});return {ok:true,message:'Ahli berjaya ditambah.',placementId:id};}
function removeUnitMemberSecure_(p){const admin=requireAdmin_(p.token),id=String(p.placementId||'').trim();if(!id)throw new Error('Placement ID diperlukan.');const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PLACEMENT),v=sh.getDataRange().getValues(),h=v[0].map(String);for(let r=1;r<v.length;r++)if(String(v[r][h.indexOf('PLACEMENT_ID')])===id){sh.getRange(r+1,h.indexOf('STATUS')+1).setValue('TIDAK_AKTIF');sh.getRange(r+1,h.indexOf('UPDATED_AT')+1).setValue(new Date());logAction_('removeUnitMember',{placementId:id,by:admin.USERNAME});return {ok:true,message:'Ahli dikeluarkan daripada unit.'};}throw new Error('Keahlian tidak ditemui.');}


/* =========================================================
   V2.4 KEHADIRAN
   PATCH sahaja — tidak mengubah modul V2.1/V2.2/V2.3.
========================================================= */
function getAttendanceFormSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE)) throw new Error('Akses ditolak.');
  const unitId=String(p.unitId||'').trim();
  const tahun=String(p.tahun||new Date().getFullYear()).trim();
  const tarikh=String(p.tarikh||'').trim();
  if(!unitId||!tahun||!tarikh) throw new Error('Unit, tahun dan tarikh diperlukan.');
  const unit=getUnitForAttendance_(unitId,tahun);
  assertAttendanceUnitAccess_(s,unit);
  const members=getActiveUnitMembersForAttendance_(unitId,tahun);
  const existing=getAttendanceRows_().filter(r=>String(r.UNIT_ID)===unitId&&String(r.TAHUN)===tahun&&sameAttendanceDate_(r.TARIKH,tarikh));
  const existingMap={};
  existing.forEach(r=>existingMap[String(r.NO_KP)]=r);
  const meeting=existing.length?Number(existing[0].NO_PERJUMPAAN||0):nextAttendanceMeeting_(unitId,tahun);
  const week=existing.length?String(existing[0].MINGGU||''):'';
  return {ok:true,unit:unit,tahun:tahun,tarikh:tarikh,minggu:week,noPerjumpaan:meeting,members:members.map(m=>({NO_KP:m.NO_KP,NAMA:m.NAMA,KELAS:m.KELAS,JANTINA:m.JANTINA,STATUS:existingMap[String(m.NO_KP)]?String(existingMap[String(m.NO_KP)].STATUS||'HADIR'):'HADIR',CATATAN:existingMap[String(m.NO_KP)]?String(existingMap[String(m.NO_KP)].CATATAN||''):''})),user:{username:s.USERNAME,role:s.ROLE}};
}

function saveAttendanceSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE)) throw new Error('Akses ditolak.');
  const unitId=String(p.unitId||'').trim();
  const tahun=String(p.tahun||'').trim();
  const tarikh=String(p.tarikh||'').trim();
  const minggu=Number(p.minggu||0);
  const noPerjumpaan=Number(p.noPerjumpaan||0);
  let members=[];
  try{members=typeof p.members==='string'?JSON.parse(p.members||'[]'):p.members||[]}catch(e){throw new Error('Data senarai kehadiran tidak sah.');}
  if(!unitId||!tahun||!tarikh||!minggu||!Array.isArray(members)||!members.length) throw new Error('Lengkapkan unit, tahun, tarikh, minggu dan senarai murid.');
  if(minggu<1||minggu>52) throw new Error('Minggu persekolahan mesti antara 1 hingga 52.');
  const unit=getUnitForAttendance_(unitId,tahun); assertAttendanceUnitAccess_(s,unit);
  const activeMembers=getActiveUnitMembersForAttendance_(unitId,tahun); const allowed={};activeMembers.forEach(m=>allowed[String(m.NO_KP)]=true);
  members.forEach(m=>{if(!allowed[String(m.NO_KP)])throw new Error('Murid '+String(m.NO_KP)+' bukan ahli aktif unit ini untuk tahun tersebut.'); if(!['HADIR','TIDAK HADIR','BERSEBAB','CUTI'].includes(String(m.STATUS||'')))throw new Error('Status kehadiran tidak sah.');});
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ATTENDANCE); if(!sh)throw new Error('KEHADIRAN belum wujud. semak tab serta header helaian sebenar.');
  const existing=getAttendanceRows_(); const dateObj=new Date(tarikh+'T00:00:00'); const meeting=noPerjumpaan||nextAttendanceMeeting_(unitId,tahun);
  const now=new Date(); let saved=0,updated=0;
  members.forEach(m=>{
    const old=existing.find(r=>String(r.NO_KP)===String(m.NO_KP)&&String(r.TAHUN)===tahun&&String(r.UNIT_ID)===unitId&&sameAttendanceDate_(r.TARIKH,tarikh));
    const obj={KEHADIRAN_ID:old?old.KEHADIRAN_ID:'ATT'+Utilities.getUuid().slice(0,8).toUpperCase(),NO_KP:String(m.NO_KP),TAHUN:tahun,UNIT_ID:unitId,TARIKH:dateObj,MINGGU:minggu,NO_PERJUMPAAN:meeting,STATUS:String(m.STATUS||'HADIR'),CATATAN:String(m.CATATAN||''),CREATED_AT:old?old.CREATED_AT:now,UPDATED_AT:now};
    if(old){updateAttendanceRow_(old.KEHADIRAN_ID,obj);updated++;}else{appendAttendanceRow_(obj);saved++;}
  });
  logAction_('saveAttendance',{unitId,tahun,tarikh,minggu,noPerjumpaan:meeting,jumlah:members.length,saved,updated,by:s.USERNAME});
  return {ok:true,message:'Kehadiran berjaya disimpan.',saved,updated,noPerjumpaan:meeting};
}

function getAttendanceRecordsSecure_(p){
  const s=getSession_(p.token); if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  const tahun=String(p.tahun||new Date().getFullYear()).trim(); const unitId=String(p.unitId||'').trim(); const minggu=String(p.minggu||'').trim();
  const allData=s.ROLE==='PENYELARAS'?false:String(p.allData||'').toLowerCase()==='true';
  let rows=getAttendanceRows_().filter(r=>String(r.TAHUN)===tahun);
  if(unitId){const unit=getUnitForAttendance_(unitId,tahun);assertAttendanceUnitAccess_(s,unit);rows=rows.filter(r=>String(r.UNIT_ID)===unitId);}else if(isUnitScopedRole_(s.ROLE)&&!allData){const allowed=getAccessibleAttendanceUnits_(s,tahun);const set={};allowed.forEach(u=>set[String(u.UNIT_ID)]=true);rows=rows.filter(r=>set[String(r.UNIT_ID)]);}
  if(minggu)rows=rows.filter(r=>String(r.MINGGU)===minggu);
  let units;
  if(allData){const shUnits=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.UNIT);units=shUnits?sheetObjects_(shUnits).filter(u=>String(u.TAHUN||'')===tahun):[];}
  else units=getAccessibleAttendanceUnits_(s,tahun);
  const um={};units.forEach(u=>um[String(u.UNIT_ID)]=u.NAMA_UNIT);
  const murid=getMuridRows_();const mm={};murid.forEach(m=>mm[String(m.NO_KP)]=m);
  const grouped={};rows.forEach(r=>{const key=String(r.UNIT_ID)+'|'+String(r.TARIKH);if(!grouped[key])grouped[key]={UNIT_ID:r.UNIT_ID,NAMA_UNIT:um[String(r.UNIT_ID)]||r.UNIT_ID,TARIKH:r.TARIKH instanceof Date?r.TARIKH.toISOString():r.TARIKH,MINGGU:r.MINGGU,NO_PERJUMPAAN:r.NO_PERJUMPAAN,HADIR:0,TIDAK_HADIR:0,BERSEBAB:0,CUTI:0,JUM:0};const g=grouped[key];const st=String(r.STATUS||'');if(g[st.replace(' ','_')]!==undefined)g[st.replace(' ','_')]++;g.JUM++;});
  Object.values(grouped).forEach(g=>{g.PERATUS=g.JUM?Math.round((g.HADIR/g.JUM)*10000)/100:0;});
  return {ok:true,data:Object.values(grouped).sort((a,b)=>new Date(b.TARIKH)-new Date(a.TARIKH)),user:{username:s.USERNAME,role:s.ROLE}};
}

function getAttendanceRows_(){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ATTENDANCE);if(!sh||sh.getLastRow()<2)return [];
  return sheetObjects_(sh).filter(r=>Object.keys(r).some(k=>String(r[k]===null||r[k]===undefined?'':r[k]).trim()!==''));
}
function getUnitForAttendance_(unitId,tahun){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.UNIT);if(!sh)throw new Error('UNIT belum wujud.');
  const unit=sheetObjects_(sh).find(r=>String(r.UNIT_ID)===String(unitId)&&String(r.TAHUN)===String(tahun));
  if(unit)return unit;throw new Error('Unit tidak ditemui untuk tahun tersebut.');
}
function isUnitScopedRole_(role){return ['GURU','PENYELARAS'].includes(String(role||'').trim().toUpperCase());}

function assertAttendanceUnitAccess_(session,unit){
  if(session.ROLE==='ADMIN'||session.ROLE==='PENTADBIR')return true;
  if(!isUnitScopedRole_(session.ROLE))throw new Error('Akses ditolak.');
  const unitId=String(unit&&unit.UNIT_ID||'');
  const assigned=String(session.ROLE||'').toUpperCase()==='PENYELARAS'?getAccessibleUnitIds_(session):getUserUnitIds_(session.USER_ID);
  if(assigned.length){
    if(!assigned.includes(unitId))throw new Error('Akses ditolak. Unit ini tidak ditugaskan kepada akaun anda.');
    return true;
  }
  if(String(session.ROLE||'').toUpperCase()==='PENYELARAS')throw new Error('Akses ditolak. Akaun penyelaras belum mempunyai penugasan unit aktif.');
  // Akaun Guru lama masih disokong menggunakan pautan Guru Penasihat sedia ada.
  const noGuru=getGuruNoForSession_(session);
  if(!noGuru||String(unit&&unit.GURU_PENASIHAT||'')!==noGuru)throw new Error('Akses ditolak. Sila daftarkan unit yang diuruskan atau pautkan rekod GURU lama.');
  return true;
}

function getUserUnitIds_(userId){
  const ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss.getSheetByName(SHEETS.USER_UNITS);
  if(!sh||sh.getLastRow()<2)return [];
  const vals=sh.getDataRange().getValues(),h=vals[0].map(String),ui=h.indexOf('USER_ID'),uni=h.indexOf('UNIT_ID'),si=h.indexOf('STATUS');
  if(ui<0||uni<0)return [];
  const ids=[];for(let i=1;i<vals.length;i++){
    if(String(vals[i][ui]||'')!==String(userId))continue;
    if(si>=0&&!['AKTIF',''].includes(String(vals[i][si]||'AKTIF').toUpperCase()))continue;
    const id=String(vals[i][uni]||'').trim();if(id&&!ids.includes(id))ids.push(id);
  }
  return ids;
}

function getCoordinatorMemberKps_(session){
  if(String(session&&session.ROLE||'').toUpperCase()!=='PENYELARAS')return null;
  const allowed=new Set(getAccessibleUnitIds_(session));
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PLACEMENT);
  if(!sh||sh.getLastRow()<2)return new Set();
  const members=new Set();
  sheetObjects_(sh).forEach(r=>{
    const unitId=String(r.UNIT_ID||'').trim(),kp=String(r.NO_KP||'').trim();
    if(kp&&allowed.has(unitId)&&String(r.STATUS||'AKTIF').toUpperCase()==='AKTIF')members.add(kp);
  });
  return members;
}

function getAccessibleUnitIds_(session){
  if(session.ROLE==='ADMIN'||session.ROLE==='PENTADBIR'){
    const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.UNIT);if(!sh||sh.getLastRow()<2)return [];
    const h=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(String),ui=h.indexOf('UNIT_ID'),v=sh.getDataRange().getDisplayValues();
    return [...new Set(v.slice(1).map(r=>String(r[ui]||'').trim()).filter(Boolean))];
  }
  const mapped=getUserUnitIds_(session.USER_ID);
  // PENYELARAS hanya boleh menggunakan pemetaan aktif kepada unit yang masih aktif.
  // Tiada fallback kepada GURU_PENASIHAT untuk role ini.
  if(String(session.ROLE||'').toUpperCase()==='PENYELARAS'){
    const unitSheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.UNIT);
    if(!unitSheet)return [];
    const activeIds=new Set(sheetObjects_(unitSheet).filter(u=>String(u.STATUS||'AKTIF').toUpperCase()==='AKTIF').map(u=>String(u.UNIT_ID||'').trim()).filter(Boolean));
    return mapped.filter(id=>activeIds.has(id));
  }
  if(mapped.length)return mapped;
  // New public registrations must use the explicit units saved after approval. Never
  // auto-grant old Guru Penasihat units to these accounts just because their email matches.
  const account=findUserById_(session.USER_ID)||{};
  if(String(account.USE_EXPLICIT_UNITS||'').trim().toUpperCase()==='TRUE')return [];
  // Compatibility fallback for existing accounts registered before unit assignment was introduced.
  const noGuru=getGuruNoForSession_(session);if(!noGuru)return [];
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.UNIT);if(!sh||sh.getLastRow()<2)return [];
  const rows=sheetObjects_(sh);return [...new Set(rows.filter(r=>String(r.GURU_PENASIHAT||'')===noGuru).map(r=>String(r.UNIT_ID||'').trim()).filter(Boolean))];
}

function deactivateUserUnitAssignments_(userId){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USER_UNITS);
  if(!sh||sh.getLastRow()<2)return 0;
  const values=sh.getDataRange().getValues(),headers=(values[0]||[]).map(String),ui=headers.indexOf('USER_ID'),si=headers.indexOf('STATUS');
  if(ui<0||si<0)return 0;
  let changed=0;
  for(let r=1;r<values.length;r++){
    if(String(values[r][ui]||'')===String(userId)&&String(values[r][si]||'').toUpperCase()!=='TIDAK_AKTIF'){
      sh.getRange(r+1,si+1).setValue('TIDAK_AKTIF');changed++;
    }
  }
  return changed;
}

function ensureUserUnitsSheet_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();let sh=ss.getSheetByName(SHEETS.USER_UNITS);
  const headers=['USER_ID','UNIT_ID','STATUS','CREATED_AT'];
  if(!sh){sh=ss.insertSheet(SHEETS.USER_UNITS);sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);return sh;}
  if(sh.getLastRow()===0||sh.getLastColumn()===0){sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);return sh;}
  const current=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(x=>String(x).trim());
  const missing=headers.filter(h=>!current.includes(h));
  if(missing.length)throw new Error('Header USER_UNITS tidak sepadan: '+missing.join(', ')+'. Tiada data diubah.');
  return sh;
}

function ensureUserColumns_(sh,required){
  if(!sh)throw new Error('USERS belum wujud. Jalankan setupModelBV2() dahulu.');
  if(sh.getLastRow()===0||sh.getLastColumn()===0){sh.getRange(1,1,1,required.length).setValues([required]);sh.setFrozenRows(1);return;}
  let headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(x=>String(x).trim());
  required.forEach(name=>{if(!headers.includes(name)){sh.getRange(1,headers.length+1).setValue(name);headers.push(name);}});
}

function getRegistrationOptions_(){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.UNIT);
  if(!sh||sh.getLastRow()<2)return {ok:true,units:[]};
  const rows=sheetObjects_(sh).filter(r=>String(r.STATUS||'AKTIF').trim().toUpperCase()==='AKTIF'&&String(r.UNIT_ID||'').trim());
  rows.sort((a,b)=>String(a.KATEGORI||'').localeCompare(String(b.KATEGORI||''),'ms')||String(a.NAMA_UNIT||'').localeCompare(String(b.NAMA_UNIT||''),'ms'));
  return {ok:true,units:rows.map(r=>({unitId:String(r.UNIT_ID),nama:String(r.NAMA_UNIT||''),kategori:String(r.KATEGORI||''),tahun:String(r.TAHUN||'' )}))};
}

function registerUser_(p){
  const email=String(p.email||'').trim().toLowerCase();
  const nama=String(p.nama||'').trim().replace(/\s+/g,' ');
  const password=String(p.password||'');
  const role=String(p.role||'').trim().toUpperCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Masukkan alamat e-mel yang sah.');
  if(nama.length<3)throw new Error('Masukkan nama penuh sekurang-kurangnya 3 aksara.');
  if(password.length<8)throw new Error('Kata laluan mestilah sekurang-kurangnya 8 aksara.');
  if(!['GURU','PENTADBIR'].includes(role))throw new Error('Peranan pendaftaran tidak sah. Akaun ADMIN disediakan secara berasingan.');

  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const ss=SpreadsheetApp.getActiveSpreadsheet(),users=ss.getSheetByName(SHEETS.USERS);
    if(!users)throw new Error('USERS belum wujud. Jalankan setupModelBV2() dahulu.');
    ensureUserColumns_(users,['USER_ID','USERNAME','NAMA','EMAIL','ROLE','PASSWORD_HASH','STATUS','CREATED_AT','LAST_LOGIN','APPROVED_BY','APPROVED_AT','USE_EXPLICIT_UNITS']);
    if(role==='GURU')ensureGuruSchema_(ss.getSheetByName(SHEETS.GURU));
    const vals=users.getDataRange().getDisplayValues(),h=vals[0].map(String),ui=h.indexOf('USERNAME'),ei=h.indexOf('EMAIL');
    for(let i=1;i<vals.length;i++){
      const u=ui>=0?String(vals[i][ui]||'').trim().toLowerCase():'';
      const e=ei>=0?String(vals[i][ei]||'').trim().toLowerCase():'';
      if(u===email||e===email)throw new Error('E-mel ini sudah mempunyai akaun. Sila log masuk.');
    }
    const id='U'+Utilities.getUuid().slice(0,8).toUpperCase(),now=new Date();
    appendObjectByHeaders_(users,{USER_ID:id,USERNAME:email,NAMA:nama,EMAIL:email,ROLE:role,PASSWORD_HASH:hashPassword_(password),STATUS:'MENUNGGU_KELULUSAN',CREATED_AT:now,LAST_LOGIN:'',APPROVED_BY:'',APPROVED_AT:'',USE_EXPLICIT_UNITS:role==='GURU'?'TRUE':'FALSE'});
    // Teacher accounts get a linked sequential G001/G002/... profile during registration.
    // The profile remains pending until ADMIN approves the account; unit selection remains post-approval.
    const guruProfile=role==='GURU'?ensureGuruProfileForUser_({USER_ID:id,USERNAME:email,NAMA:nama,EMAIL:email,ROLE:role},'MENUNGGU_KELULUSAN',false):null;
    logAction_('registerUser',{userId:id,username:email,nama,role,unitIds:[],noGuru:guruProfile&&guruProfile.noGuru||'',status:'MENUNGGU_KELULUSAN'});
    let message='Pendaftaran berjaya dihantar. Akaun anda sedang menunggu kelulusan ADMIN.';
    if(guruProfile&&guruProfile.noGuru)message+=' ID Guru anda: '+guruProfile.noGuru+'.';
    if(role==='GURU')message+=' Selepas diluluskan, pilih dan simpan unit sebelum masuk ke paparan penuh.';
    else message+=' Selepas diluluskan, anda boleh masuk ke paparan kokurikulum.';
    return {ok:true,pendingApproval:true,message:message,user:{userId:id,username:email,nama:nama,email:email,role:role,noGuru:guruProfile&&guruProfile.noGuru||'',unitIds:[],status:'MENUNGGU_KELULUSAN'}};
  }finally{lock.releaseLock();}
}

function saveMyUnits_(p){
  // This is the sole authenticated endpoint that accepts an unassigned Guru session.
  const s=getSession_(p.token,true);
  if(String(s.ROLE||'').toUpperCase()!=='GURU')throw new Error('Pemilihan unit ini hanya untuk Guru Penasihat.');
  let unitIds=[];
  try{unitIds=Array.isArray(p.unitIds)?p.unitIds:JSON.parse(String(p.unitIds||'[]'));}catch(e){throw new Error('Senarai unit tidak sah.');}
  if(!Array.isArray(unitIds))throw new Error('Senarai unit tidak sah.');
  unitIds=[...new Set(unitIds.map(x=>String(x||'').trim()).filter(Boolean))];
  if(!unitIds.length)throw new Error('Pilih sekurang-kurangnya satu unit sebelum menyimpan.');
  const active=getRegistrationOptions_().units;
  const valid=new Set(active.map(u=>String(u.unitId)));
  const invalid=unitIds.filter(id=>!valid.has(id));
  if(invalid.length)throw new Error('Ada unit yang tidak aktif atau tidak sah. Muat semula pilihan unit.');

  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const currentIds=getAccessibleUnitIds_(s);
    if(currentIds.length)throw new Error('Unit akaun ini sudah ditetapkan. Hubungi ADMIN jika perlu mengubah penugasan unit.');
    const sh=ensureUserUnitsSheet_();
    const values=sh.getDataRange().getValues(),headers=(values[0]||[]).map(String),idx={};headers.forEach((h,i)=>idx[h]=i);
    if(idx.USER_ID===undefined||idx.UNIT_ID===undefined||idx.STATUS===undefined)throw new Error('Struktur USER_UNITS tidak lengkap.');
    const now=new Date();
    // Deactivate any stale mappings for this account, without touching other users' rows.
    for(let r=1;r<values.length;r++){
      if(String(values[r][idx.USER_ID]||'')===String(s.USER_ID))sh.getRange(r+1,idx.STATUS+1).setValue('TIDAK_AKTIF');
    }
    const rows=unitIds.map(unitId=>headers.map(h=>({USER_ID:s.USER_ID,UNIT_ID:unitId,STATUS:'AKTIF',CREATED_AT:now}[h]!==undefined?{USER_ID:s.USER_ID,UNIT_ID:unitId,STATUS:'AKTIF',CREATED_AT:now}[h]:'')));
    if(rows.length)sh.getRange(sh.getLastRow()+1,1,rows.length,headers.length).setValues(rows);
    logAction_('saveMyUnits',{userId:s.USER_ID,username:s.USERNAME,role:s.ROLE,unitIds});
    return {ok:true,message:'Pilihan unit berjaya disimpan. Paparan e-KOSSTA anda kini ditetapkan mengikut unit yang dipilih.',unitIds};
  }finally{lock.releaseLock();}
}

function getAccessibleAttendanceUnits_(session,tahun){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.UNIT);if(!sh)return [];
  const all=sheetObjects_(sh).filter(u=>String(u.TAHUN)===String(tahun)&&String(u.STATUS||'').toUpperCase()==='AKTIF');
  const allowed=[];all.forEach(unit=>{try{assertAttendanceUnitAccess_(session,unit);allowed.push(unit);}catch(e){if(session.ROLE==='ADMIN')allowed.push(unit);}});return allowed;
}
function getActiveUnitMembersForAttendance_(unitId,tahun){
  const ps=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PLACEMENT);if(!ps)return [];
  const active=sheetObjects_(ps).filter(r=>String(r.UNIT_ID)===unitId&&String(r.TAHUN)===String(tahun)&&String(r.STATUS).toUpperCase()==='AKTIF').map(r=>String(r.NO_KP));
  const map={};getMuridRows_().forEach(m=>map[String(m.NO_KP)]=m);return [...new Set(active)].map(kp=>map[kp]).filter(Boolean).map(m=>({NO_KP:m.NO_KP,NAMA:m.NAMA,KELAS:m.KELAS,JANTINA:m.JANTINA}));
}
function nextAttendanceMeeting_(unitId,tahun){const rows=getAttendanceRows_().filter(r=>String(r.UNIT_ID)===unitId&&String(r.TAHUN)===tahun);let max=0;rows.forEach(r=>{const n=Number(r.NO_PERJUMPAAN||0);if(n>max)max=n;});return max+1;}
function sameAttendanceDate_(value,dateStr){if(!value||!dateStr)return false;const d=value instanceof Date?value:new Date(value);if(isNaN(d.getTime()))return String(value).slice(0,10)===String(dateStr).slice(0,10);return Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM-dd')===String(dateStr).slice(0,10);}
function appendAttendanceRow_(obj){const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ATTENDANCE);const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);sh.getRange(sh.getLastRow()+1,1,1,h.length).setValues([h.map(k=>obj[k]!==undefined?obj[k]:'')]);}
function updateAttendanceRow_(id,obj){const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ATTENDANCE);const v=sh.getDataRange().getValues(),h=v[0].map(String),ii=h.indexOf('KEHADIRAN_ID');for(let r=1;r<v.length;r++)if(String(v[r][ii])===String(id)){sh.getRange(r+1,1,1,h.length).setValues([h.map(k=>obj[k]!==undefined?obj[k]:'')]);return true;}throw new Error('Rekod kehadiran tidak ditemui untuk kemas kini.');}



/* =========================================================
   V2.5 AKTIVITI & ACARA
   - Semua peranan dibenarkan membaca senarai aktiviti/acara
   - Perubahan masih dikawal berdasarkan pemilikan aktiviti
   - Tiada STATUS kerana schema AKTIVITI tidak mempunyai medan STATUS.
========================================================= */
function getAktivitiSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE)) throw new Error('Akses ditolak.');
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ACTIVITY);
  if(!sh) throw new Error('AKTIVITI belum wujud. semak tab serta header helaian sebenar.');
  // Semua guru boleh melihat senarai aktiviti/acara merentas unit. Kebenaran
  // mengubah rekod kekal berasingan dan dikembalikan sebagai CAN_MANAGE.
  let rows=sheetObjects_(sh).filter(r=>String(r.AKTIVITI_ID||'').trim()!=='');
  rows.sort((a,b)=>activityDateValue_(b.TARIKH)-activityDateValue_(a.TARIKH));
  const guruNo=isUnitScopedRole_(s.ROLE)?getGuruNoForSession_(s):'';
  if(s.ROLE==='PENYELARAS')rows=rows.filter(r=>canManageAktiviti_(s,r,guruNo));
  return {ok:true,data:rows.map(r=>Object.assign(activityPublicRow_(r),{CAN_MANAGE:canManageAktiviti_(s,r,guruNo)})),user:{username:s.USERNAME,role:s.ROLE}};
}

function saveAktivitiSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE)) throw new Error('Akses ditolak.');
  const id=String(p.aktivitiId||'').trim();
  const nama=String(p.namaAktiviti||'').trim();
  const tarikh=String(p.tarikh||'').trim();
  const masa=String(p.masa||'').trim();
  const tempat=String(p.tempat||'').trim();
  const peringkat=String(p.peringkat||'').trim();
  const objektif=String(p.objektif||'').trim();
  const aktiviti=String(p.aktiviti||'').trim();
  const impak=String(p.impak||'').trim();
  let noGuru=String(p.noGuru||'').trim();
  if(!nama||!tarikh||!tempat||!peringkat) throw new Error('Lengkapkan maklumat asas aktiviti.');
  if(isUnitScopedRole_(s.ROLE)){
    // Akaun baharu tidak diwajibkan mempunyai rekod GURU lama; CREATED_BY akan menjadi pautan pemilikan.
    noGuru=getGuruNoForSession_(s)||'';
  }else if(s.ROLE==='ADMIN'&&!noGuru){
    throw new Error('Pilih Guru.');
  }
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ACTIVITY);
  if(!sh) throw new Error('AKTIVITI belum wujud. semak tab serta header helaian sebenar.');
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
  const now=new Date();
  const obj={
    AKTIVITI_ID:id,
    NAMA_AKTIVITI:nama,
    TARIKH:tarikh,
    HARI:activityDay_(tarikh),
    MASA:masa,
    TEMPAT:tempat,
    PERINGKAT:peringkat,
    OBJEKTIF:objektif,
    AKTIVITI:aktiviti,
    IMPAK:impak,
    NO_GURU:noGuru,
    CREATED_BY:s.USERNAME,
    CREATED_AT:now,
    UPDATED_AT:now
  };
  if(id){
    const values=sh.getDataRange().getValues(),ii=headers.indexOf('AKTIVITI_ID');
    let rowIndex=-1,old=null;
    for(let r=1;r<values.length;r++) if(String(values[r][ii])===id){rowIndex=r;old={};headers.forEach((h,i)=>old[h]=values[r][i]);break;}
    if(rowIndex<0) throw new Error('Aktiviti tidak ditemui.');
    if(isUnitScopedRole_(s.ROLE) && (noGuru?String(old.NO_GURU||'')!==noGuru:String(old.CREATED_BY||'').toLowerCase()!==String(s.USERNAME||'').toLowerCase())) throw new Error('Guru hanya boleh mengubah aktiviti sendiri.');
    obj.CREATED_BY=old.CREATED_BY||s.USERNAME;
    obj.CREATED_AT=old.CREATED_AT||now;
    sh.getRange(rowIndex+1,1,1,headers.length).setValues([headers.map(h=>obj[h]!==undefined?obj[h]:'')]);
    logAction_('updateAktiviti',{aktivitiId:id,nama,by:s.USERNAME,role:s.ROLE});
    return {ok:true,message:'Aktiviti berjaya dikemas kini.',aktivitiId:id};
  }
  obj.AKTIVITI_ID='A'+Utilities.getUuid().slice(0,8).toUpperCase();
  sh.getRange(sh.getLastRow()+1,1,1,headers.length).setValues([headers.map(h=>obj[h]!==undefined?obj[h]:'')]);
  logAction_('addAktiviti',{aktivitiId:obj.AKTIVITI_ID,nama,tarikh,noGuru,by:s.USERNAME,role:s.ROLE});
  return {ok:true,message:'Aktiviti berjaya ditambah.',aktivitiId:obj.AKTIVITI_ID};
}

function deleteAktivitiSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  const aktivitiId=String(p.aktivitiId||'').trim();
  if(!aktivitiId)throw new Error('Pilih aktiviti yang hendak dipadam.');
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const activitySheet=ss.getSheetByName(SHEETS.ACTIVITY);
  if(!activitySheet)throw new Error('Helaian AKTIVITI tidak ditemui.');
  const values=activitySheet.getDataRange().getValues();
  if(values.length<2)throw new Error('Aktiviti tidak ditemui.');
  const headers=values[0].map(String),idIndex=headers.indexOf('AKTIVITI_ID'),teacherIndex=headers.indexOf('NO_GURU'),nameIndex=headers.indexOf('NAMA_AKTIVITI');
  let rowNumber=0,activityName='';
  for(let r=1;r<values.length;r++)if(String(values[r][idIndex]||'')===aktivitiId){rowNumber=r+1;activityName=String(values[r][nameIndex]||aktivitiId);if(isUnitScopedRole_(s.ROLE)){const noGuru=getGuruNoForSession_(s);if(noGuru?String(values[r][teacherIndex]||'')!==noGuru:String(values[r][headers.indexOf('CREATED_BY')]||'').toLowerCase()!==String(s.USERNAME||'').toLowerCase())throw new Error('Guru hanya boleh memadam aktiviti sendiri.');}break;}
  if(!rowNumber)throw new Error('Aktiviti tidak ditemui.');
  const participantCount=deleteActivityLinkedRows_(ss.getSheetByName(SHEETS.PARTICIPANTS),'AKTIVITI_ID',aktivitiId);
  const achievementCount=deleteActivityLinkedRows_(ss.getSheetByName(SHEETS.ACHIEVEMENT),'AKTIVITI_ID',aktivitiId);
  activitySheet.deleteRow(rowNumber);
  logAction_('deleteAktiviti',{aktivitiId:aktivitiId,namaAktiviti:activityName,pesertaDipadam:participantCount,pencapaianDipadam:achievementCount,by:s.USERNAME,role:s.ROLE});
  return {ok:true,message:'Aktiviti "'+activityName+'" dipadam. '+participantCount+' rekod peserta dan '+achievementCount+' rekod pencapaian berkaitan turut dipadam. Dokumen/laporan yang disimpan dikekalkan.',aktivitiId:aktivitiId,pesertaDipadam:participantCount,pencapaianDipadam:achievementCount};
}
function deleteActivityLinkedRows_(sh,keyHeader,keyValue){
  if(!sh||sh.getLastRow()<2)return 0;
  const values=sh.getDataRange().getValues(),headers=(values[0]||[]).map(String),keyIndex=headers.indexOf(keyHeader);
  if(keyIndex<0)return 0;
  const rows=[];for(let r=1;r<values.length;r++)if(String(values[r][keyIndex]||'')===String(keyValue))rows.push(r+1);
  rows.sort((a,b)=>b-a);
  let deleted=0;
  // Collapse adjacent matching rows into one deleteRows call, from bottom to top.
  for(let i=0;i<rows.length;){
    let start=rows[i],count=1,j=i+1;
    while(j<rows.length && rows[j]===start-count){count++;j++;}
    sh.deleteRows(start-count+1,count);deleted+=count;i=j;
  }
  return deleted;
}

function canManageAktiviti_(s,row,knownGuruNo){
  if(!s||!row)return false;
  if(!isUnitScopedRole_(s.ROLE))return ['ADMIN','PENTADBIR'].includes(s.ROLE);
  const noGuru=knownGuruNo===undefined?getGuruNoForSession_(s):knownGuruNo;
  return Boolean((noGuru&&String(row.NO_GURU||'').trim()===noGuru)||String(row.CREATED_BY||'').trim().toLowerCase()===String(s.USERNAME||'').trim().toLowerCase());
}
function findAktivitiForRead_(s,aktivitiId){
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(String(s&&s.ROLE||'')))throw new Error('Akses ditolak.');
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ACTIVITY);
  if(!sh) throw new Error('AKTIVITI belum wujud.');
  const row=sheetObjects_(sh).find(r=>String(r.AKTIVITI_ID||'')===String(aktivitiId));
  if(!row)throw new Error('Aktiviti tidak ditemui.');
  return row;
}
function assertAktivitiAccess_(s,aktivitiId){
  const row=findAktivitiForRead_(s,aktivitiId);
  if(!canManageAktiviti_(s,row)) throw new Error('Guru hanya boleh mengubah rekod aktiviti yang diurus sendiri.');
  return row;
}

function assertUniqueAktivitiIdForPeserta_(aktivitiId){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ACTIVITY);
  if(!sh)throw new Error('Helaian AKTIVITI tidak ditemui.');
  const rows=sheetObjects_(sh).filter(r=>String(r.AKTIVITI_ID||'').trim()===String(aktivitiId||'').trim());
  if(rows.length!==1){
    throw new Error(rows.length===0
      ? 'Aktiviti tidak ditemui. Muat semula senarai aktiviti.'
      : 'ID aktiviti ini berganda dalam helaian AKTIVITI. Senarai peserta tidak boleh dipisahkan dengan selamat. Sila pastikan setiap aktiviti mempunyai AKTIVITI_ID unik.');
  }
  return rows[0];
}

function getAktivitiPesertaSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE)) throw new Error('Akses ditolak.');
  const aktivitiId=String(p.aktivitiId||'').trim();
  if(!aktivitiId) throw new Error('AKTIVITI_ID diperlukan.');
  // Refuse ambiguous IDs instead of mixing attendees from two activities.
  const uniqueActivity=assertUniqueAktivitiIdForPeserta_(aktivitiId);
  const aktiviti=findAktivitiForRead_(s,aktivitiId);
  const canManage=canManageAktiviti_(s,aktiviti);
  if(s.ROLE==='PENYELARAS'&&!canManage)throw new Error('Akses ditolak. Aktiviti ini bukan di bawah urusan akaun penyelaras anda.');
  const ms=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.MURID);
  const ps=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PARTICIPANTS);
  if(!ms) throw new Error('MURID belum wujud.');
  if(!ps) throw new Error('PESERTA_AKTIVITI belum wujud. Semak tab dan header helaian.');
  const murid=sheetObjects_(ms).filter(r=>String(r.NO_KP||'').trim()!=='').map(r=>({
    NO_KP:String(r.NO_KP||'').trim(),NAMA:String(r.NAMA||''),KELAS:String(r.KELAS||''),TINGKATAN:String(r.TINGKATAN||''),JANTINA:String(r.JANTINA||''),TAHUN:String(r.TAHUN||''),STATUS:String(r.STATUS||'AKTIF')
  })).filter(r=>String(r.STATUS||'AKTIF').trim().toUpperCase()==='AKTIF');
  if(s.ROLE==='PENYELARAS'){
    const allowedMembers=getCoordinatorMemberKps_(s)||new Set();
    for(let i=murid.length-1;i>=0;i--)if(!allowedMembers.has(String(murid[i].NO_KP||'')))murid.splice(i,1);
  }
  const allParticipantRows=sheetObjects_(ps);
  const selected={};
  allParticipantRows.forEach(r=>{
    if(String(r.AKTIVITI_ID||'').trim()!==aktivitiId)return;
    if(String(r.STATUS||'AKTIF').trim().toUpperCase()!=='AKTIF')return;
    const kp=String(r.NO_KP||'').trim();if(!kp)return;
    selected[kp]=String(r.PERANAN||'PESERTA').trim()||'PESERTA';
  });
  const classes=[...new Set(murid.map(r=>r.KELAS).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ms'));
  return {ok:true,aktivitiId:aktivitiId,aktiviti:activityPublicRow_(aktiviti),canManage,classes,data:murid.map(r=>({...r,selected:Object.prototype.hasOwnProperty.call(selected,r.NO_KP),peranan:selected[r.NO_KP]||'PESERTA'}))};
}

function saveAktivitiPesertaSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE)) throw new Error('Akses ditolak.');
  const aktivitiId=String(p.aktivitiId||'').trim();
  if(!aktivitiId) throw new Error('AKTIVITI_ID diperlukan.');
  assertUniqueAktivitiIdForPeserta_(aktivitiId);
  assertAktivitiAccess_(s,aktivitiId);
  let selected=[];
  try{selected=Array.isArray(p.peserta)?p.peserta:(p.peserta?JSON.parse(p.peserta):[]);}catch(e){throw new Error('Data peserta tidak sah.');}
  if(!Array.isArray(selected))throw new Error('Senarai peserta mestilah berbentuk senarai.');
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PARTICIPANTS);
  if(!sh)throw new Error('PESERTA_AKTIVITI belum wujud. Semak tab dan header helaian.');
  const lastCol=sh.getLastColumn();
  if(lastCol<1)throw new Error('PESERTA_AKTIVITI tiada header.');
  const headers=sh.getRange(1,1,1,lastCol).getDisplayValues()[0].map(x=>String(x||'').trim());
  const ai=headers.indexOf('AKTIVITI_ID'),ni=headers.indexOf('NO_KP'),si=headers.indexOf('STATUS'),ri=headers.indexOf('PERANAN');
  if(ai<0||ni<0||si<0||ri<0)throw new Error('Header PESERTA_AKTIVITI mesti mempunyai AKTIVITI_ID, NO_KP, STATUS dan PERANAN.');
  const normalizedSelected={};
  selected.forEach(x=>{
    if(!x||typeof x!=='object')return;
    const kp=String(x.NO_KP||'').trim();
    if(kp)normalizedSelected[kp]=String(x.PERANAN||'PESERTA').trim()||'PESERTA';
  });
  const coordinatorMemberKps=s.ROLE==='PENYELARAS'?(getCoordinatorMemberKps_(s)||new Set()):null;
  if(coordinatorMemberKps){
    const outside=Object.keys(normalizedSelected).filter(kp=>!coordinatorMemberKps.has(kp));
    if(outside.length)throw new Error('Penyelaras hanya boleh mendaftarkan murid yang menjadi ahli aktif unit yang ditugaskan kepadanya.');
  }
  const lock=LockService.getScriptLock();
  lock.waitLock(20000);
  try{
    const values=sh.getDataRange().getValues();
    const now=new Date();
    const existingForActivity=new Set();
    let updated=0;
    // Update only rows belonging to this exact AKTIVITI_ID. Never alter rows
    // for any other event, even when the same NO_KP is a participant elsewhere.
    for(let r=1;r<values.length;r++){
      if(String(values[r][ai]||'').trim()!==aktivitiId)continue;
      const kp=String(values[r][ni]||'').trim();
      if(coordinatorMemberKps&&!coordinatorMemberKps.has(kp))continue;
      existingForActivity.add(kp);
      values[r][si]=Object.prototype.hasOwnProperty.call(normalizedSelected,kp)?'AKTIF':'TIDAK AKTIF';
      if(Object.prototype.hasOwnProperty.call(normalizedSelected,kp))values[r][ri]=normalizedSelected[kp];
      if(headers.includes('UPDATED_AT'))values[r][headers.indexOf('UPDATED_AT')]=now;
      updated++;
    }
    // Write the matrix once. Rows for unrelated activities remain byte-for-byte
    // unchanged in the in-memory matrix and therefore keep their own selection.
    if(values.length>1)sh.getRange(1,1,values.length,headers.length).setValues(values.map(row=>headers.map((h,i)=>row[i]===undefined?'':row[i])));
    const newRows=[];
    Object.keys(normalizedSelected).forEach(kp=>{
      if(existingForActivity.has(kp))return;
      const obj={PESERTA_ID:'P'+Utilities.getUuid().slice(0,8).toUpperCase(),AKTIVITI_ID:aktivitiId,NO_KP:kp,PERANAN:normalizedSelected[kp],STATUS:'AKTIF',CREATED_AT:now,UPDATED_AT:now};
      newRows.push(headers.map(h=>Object.prototype.hasOwnProperty.call(obj,h)?obj[h]:''));
    });
    if(newRows.length)sh.getRange(sh.getLastRow()+1,1,newRows.length,headers.length).setValues(newRows);
    logAction_('saveAktivitiPeserta',{aktivitiId,peserta:Object.keys(normalizedSelected).length,by:s.USERNAME,role:s.ROLE});
    return {ok:true,message:'Peserta bagi aktiviti ini berjaya disimpan.',aktivitiId:aktivitiId,jumlah:Object.keys(normalizedSelected).length,rekodDikemasKini:updated,rekodBaharu:newRows.length};
  }finally{lock.releaseLock();}
}

function getGuruNoForSession_(session){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const gs=ss.getSheetByName(SHEETS.GURU);
  if(!gs)throw new Error('Helaian GURU tidak ditemui.');
  const guruRows=sheetObjects_(gs);
  const linked=guruRows.find(g=>String(g.USER_ID||'')===String(session.USER_ID));
  if(linked)return String(linked.NO_GURU||'').trim();
  const user=findUserById_(session.USER_ID)||{};
  const userEmail=String(user.EMAIL||user.EMAIL_ADDRESS||'').trim().toLowerCase();
  if(userEmail){
    const byEmail=guruRows.filter(g=>String(g.EMAIL||'').trim().toLowerCase()===userEmail);
    if(byEmail.length===1)return String(byEmail[0].NO_GURU||'').trim();
  }
  // Fail closed. If production GURU has no USER_ID and USERS has no matching EMAIL,
  // administrator must link the account rather than granting broad teacher access.
  return '';
}
function activityDay_(dateStr){
  const d=new Date(String(dateStr)+'T00:00:00');
  if(isNaN(d.getTime())) throw new Error('Tarikh aktiviti tidak sah.');
  return ['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'][d.getDay()];
}
function activityDateValue_(v){
  const d=v instanceof Date?v:new Date(v);
  return isNaN(d.getTime())?0:d.getTime();
}
function activityPublicRow_(r){
  const o={};
  ['AKTIVITI_ID','NAMA_AKTIVITI','TARIKH','HARI','MASA','TEMPAT','PERINGKAT','OBJEKTIF','AKTIVITI','IMPAK','NO_GURU','CREATED_BY','CREATED_AT','UPDATED_AT'].forEach(k=>o[k]=r[k] instanceof Date?r[k].toISOString():(r[k]??''));
  return o;
}

function findUserById_(userId){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS); if(!sh)return null;
  const values=sh.getDataRange().getValues(); if(values.length<2)return null;
  const h=values[0].map(String),ui=h.indexOf('USER_ID');
  for(let r=1;r<values.length;r++)if(String(values[r][ui])===String(userId)){const o={};h.forEach((k,i)=>o[k]=values[r][i]);return o;}
  return null;
}

function logoutUserSessionsById_(userId){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.SESSIONS);
  if(!sh)return 0;
  const values=sh.getDataRange().getValues();if(values.length<2)return 0;
  const h=values[0].map(String),ui=h.indexOf('USER_ID'),si=h.indexOf('STATUS');let count=0;
  for(let r=1;r<values.length;r++){
    if(String(values[r][ui])===userId&&String(values[r][si])==='AKTIF'){sh.getRange(r+1,si+1).setValue('LOGOUT');count++;}
  }
  return count;
}
function getSession_(token,allowUnassignedGuru){
  token=String(token||'');
  if(!token)throw new Error('Session diperlukan.');
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.SESSIONS);
  if(!sh)throw new Error('SESSIONS belum wujud. semak tab serta header helaian sebenar.');
  const lastRow=sh.getLastRow(),lastCol=sh.getLastColumn();
  if(lastRow<2||lastCol<1)throw new Error('Session tidak sah.');
  const h=sh.getRange(1,1,1,lastCol).getValues()[0].map(String),idx={};h.forEach((x,i)=>idx[x]=i);
  const th=hashPassword_(token),now=new Date();let rowValues=null,rowNumber=0;
  if(lastRow>300&&idx.TOKEN_HASH>=0){
    // TextFinder only searches the hash column; raw tokens are never stored.
    const found=sh.getRange(2,idx.TOKEN_HASH+1,lastRow-1,1).createTextFinder(th).matchEntireCell(true).findNext();
    if(found){rowNumber=found.getRow();rowValues=sh.getRange(rowNumber,1,1,lastCol).getValues()[0];}
  }else{
    const values=sh.getRange(1,1,lastRow,lastCol).getValues();
    for(let r=1;r<values.length;r++){if(String(values[r][idx.TOKEN_HASH])===th){rowNumber=r+1;rowValues=values[r];break;}}
  }
  if(rowValues&&String(rowValues[idx.STATUS])==='AKTIF'){
    const exp=new Date(rowValues[idx.EXPIRES_AT]);
    if(isNaN(exp.getTime())||exp<=now){if(idx.STATUS>=0)sh.getRange(rowNumber,idx.STATUS+1).setValue('EXPIRED');throw new Error('Session tidak sah atau telah tamat.');}
    const session={TOKEN_HASH:rowValues[idx.TOKEN_HASH],USER_ID:rowValues[idx.USER_ID],USERNAME:rowValues[idx.USERNAME],ROLE:String(rowValues[idx.ROLE]||'').toUpperCase(),EXPIRES_AT:exp};
    if(!allowUnassignedGuru&&isUnitScopedRole_(session.ROLE)){
      let accessible=[];try{accessible=getAccessibleUnitIds_(session);}catch(e){accessible=[];}
      if(!accessible.length){
        if(session.ROLE==='PENYELARAS')throw new Error('Akaun Penyelaras Unit belum mempunyai penugasan. Hubungi ADMIN untuk menetapkan unit.');
        throw new Error('Akaun Guru Penasihat belum mempunyai unit. Pilih dan simpan sekurang-kurangnya satu unit sebelum menggunakan sistem.');
      }
    }
    return session;
  }
  throw new Error('Session tidak sah atau telah tamat.');
}

function findUser_(username){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  if(!sh)throw new Error('USERS belum wujud. semak tab serta header helaian sebenar.');
  const values=sh.getDataRange().getValues(); if(values.length<2)return null;
  const h=values[0].map(String), idx={};h.forEach((x,i)=>idx[x]=i);
  for(let r=1;r<values.length;r++){
    if(String(values[r][idx.USERNAME]).toLowerCase()===username){
      const o={};h.forEach((k,i)=>o[k]=values[r][i]);return o;
    }
  }
  return null;
}
function updateLastLogin_(userId){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS); if(!sh)return;
  const v=sh.getDataRange().getValues(),h=v[0].map(String),ui=h.indexOf('USER_ID'),li=h.indexOf('LAST_LOGIN');
  if(ui<0||li<0)return;
  for(let r=1;r<v.length;r++)if(String(v[r][ui])===userId){sh.getRange(r+1,li+1).setValue(new Date());return;}
}
function hashPassword_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value),Utilities.Charset.UTF_8).map(b=>(b+256)%256).map(b=>b.toString(16).padStart(2,'0')).join('');}
function getMuridRows_(){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.MURID);if(!sh)throw new Error('MURID belum wujud.');
  return sheetObjects_(sh).filter(o=>Object.keys(o).some(k=>String(o[k]===null||o[k]===undefined?'':o[k]).trim()!=='' )).map(row=>{const o={};Object.keys(row).forEach(k=>o[k]=row[k] instanceof Date?row[k].toISOString():row[k]);return o;});
}
function logAction_(action,detail){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.LOG);if(!sh||sh.getLastColumn()<1)return;
  const id=Utilities.getUuid(),now=new Date(),payload=JSON.stringify(detail||{});
  appendObjectByHeaders_(sh,{AUDIT_ID:id,AUDIT_LOG_ID:id,LOG_ID:id,IMPORT_LOG_ID:id,USER_ID:(detail&&detail.userId)||'',USERNAME:(detail&&detail.username)|| (detail&&detail.by)||'',ACTION:action,EVENT:action,DETAIL:payload,DETAIL_JSON:payload,DESCRIPTION:payload,CREATED_AT:now,TIMESTAMP:now,ROLE:(detail&&detail.role)||''},true);
}
function appendObjectByHeaders_(sh,obj,allowEmpty){
  if(!sh)throw new Error('Helaian sasaran tidak ditemui.');
  const lastCol=sh.getLastColumn();
  if(lastCol<1)throw new Error('Helaian '+sh.getName()+' tiada baris header.');
  const headers=sh.getRange(1,1,1,lastCol).getDisplayValues()[0].map(x=>String(x).trim());
  const row=headers.map(k=>Object.prototype.hasOwnProperty.call(obj,k)?obj[k]:'');
  if(!allowEmpty && row.every(v=>v===''||v===null||v===undefined))throw new Error('Header pada '+sh.getName()+' tidak sepadan dengan data yang hendak disimpan.');
  sh.getRange(sh.getLastRow()+1,1,1,lastCol).setValues([row]);
}

function ensureColumn_(sh,name){if(!sh)return;const h=sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0].map(String);if(h.indexOf(name)<0)sh.getRange(1,sh.getLastColumn()+1).setValue(name);}
function ensureSheet_(ss,name,headers){let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(sh.getLastRow()===0){sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);}}
function jsonOrJsonp_(obj,callback){const json=JSON.stringify(obj);if(callback){if(!/^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback))throw new Error('Callback tidak sah.');return ContentService.createTextOutput(callback+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);}return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);}


/* =========================================================
   V2.6 RICH TEXT DOCUMENTS
   Menyimpan kandungan HTML dalam DOKUMEN dan salinan HTML
   di Google Drive. Export PDF menggunakan dialog cetak pelayar.
========================================================= */
function isSharedDocumentTemplate_(type,title){
  const t=String(type||''),n=String(title||'');
  return (t==='SURAT_KEBENARAN'&&/templat surat kebenaran ibu bapa/i.test(n)) ||
    (t==='LAPORAN'&&/(?:one\s*page\s*report|templat laporan aktiviti)/i.test(n)) ||
    (t==='SURAT_RASMI'&&/templat surat rasmi/i.test(n));
}
function getDocumentsSecure_(token){
  const s=getSession_(token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.DOCUMENTS);
  if(!sh)throw new Error('DOKUMEN belum wujud. Semak nama tab dan header.');
  const rows=sheetObjects_(sh).filter(r=>String(r.DOCUMENT_ID||''));
  const visible=rows.filter(r=>s.ROLE==='ADMIN'||s.ROLE==='PENTADBIR'||String(r.CREATED_BY||'')===String(s.USERNAME)||isSharedDocumentTemplate_(r.TYPE,r.TITLE));
  visible.sort((a,b)=>new Date(b.UPDATED_AT||0)-new Date(a.UPDATED_AT||0));
  return {ok:true,data:visible.map(r=>({
    DOCUMENT_ID:String(r.DOCUMENT_ID||''),TITLE:String(r.TITLE||''),TYPE:String(r.TYPE||'LAIN'),
    ACTIVITY_ID:String(r.ACTIVITY_ID||''),ACTIVITY_NAME:String(r.ACTIVITY_NAME||''),
    UPDATED_AT:r.UPDATED_AT instanceof Date?r.UPDATED_AT.toISOString():String(r.UPDATED_AT||'')
  }))};
}
function getDocumentSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  const id=String(p.documentId||'').trim();if(!id)throw new Error('ID dokumen diperlukan.');
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.DOCUMENTS);
  if(!sh)throw new Error('DOKUMEN belum wujud.');
  const r=sheetObjects_(sh).find(x=>String(x.DOCUMENT_ID||'')===id);
  if(!r)throw new Error('Dokumen tidak ditemui.');
  const isSharedTemplate=isSharedDocumentTemplate_(r.TYPE,r.TITLE);
  if(s.ROLE!=='ADMIN'&&s.ROLE!=='PENTADBIR'&&String(r.CREATED_BY||'')!==String(s.USERNAME)&&!isSharedTemplate)throw new Error('Anda tidak dibenarkan membuka dokumen ini.');
  return {ok:true,document:{
    DOCUMENT_ID:String(r.DOCUMENT_ID||''),TITLE:String(r.TITLE||''),TYPE:String(r.TYPE||'LAIN'),
    CONTENT_HTML:String(r.CONTENT_HTML||''),ACTIVITY_ID:String(r.ACTIVITY_ID||''),ACTIVITY_NAME:String(r.ACTIVITY_NAME||''),PHOTO_IDS:String(r.PHOTO_IDS||''),
    UPDATED_AT:r.UPDATED_AT instanceof Date?r.UPDATED_AT.toISOString():String(r.UPDATED_AT||'')
  }};
}
function saveDocumentSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  const title=String(p.title||'').trim();
  const type=String(p.type||'LAIN').trim();
  const content=String(p.content||'').trim();
  const id=String(p.documentId||'').trim();
  let activityId=String(p.activityId||'').trim();
  let activityName=String(p.activityName||'').trim();
  if(!title)throw new Error('Tajuk dokumen diperlukan.');
  if(!content||content.length>180000)throw new Error('Kandungan kosong atau terlalu panjang (maksimum 180,000 aksara).');
  if(!['LAPORAN','SURAT_RASMI','SURAT_KEBENARAN','LAIN'].includes(type))throw new Error('Jenis dokumen tidak sah.');
  const sharedTemplate=isSharedDocumentTemplate_(type,title);
  if(sharedTemplate&&s.ROLE!=='ADMIN')throw new Error('Hanya ADMIN boleh menyimpan perubahan pada templat bersama.');
  if(type==='LAPORAN'&&activityId){
    const a=assertAktivitiAccess_(s,activityId);
    activityName=String(a.NAMA_AKTIVITI||activityName||'');
  }else if(sharedTemplate){
    activityId='';activityName='';
  }else if(type==='LAPORAN'&&!activityId){
    // Reports without a linked activity are valid general reports, such as meetings or unit notes.
    activityName='';
  }
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.DOCUMENTS);
  if(!sh)throw new Error('DOKUMEN belum wujud. Semak nama tab dan header.');
  ensureColumn_(sh,'ACTIVITY_ID');
  ensureColumn_(sh,'ACTIVITY_NAME');
  ensureColumn_(sh,'PHOTO_IDS');
  const photoIds=[...new Set(String(p.photoIds||'').split(',').map(x=>x.trim()).filter(x=>/^IMG-[A-Za-z0-9-]+$/.test(x)))].slice(0,4);
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    // Avoid reading every historical CONTENT_HTML cell: read only the header and the row being edited.
    const lastCol=sh.getLastColumn();
    if(lastCol<1)throw new Error('Helaian DOKUMEN belum mempunyai header.');
    const h=sh.getRange(1,1,1,lastCol).getValues()[0].map(String);
    const ix={};h.forEach((k,i)=>ix[k]=i);
    if(ix.DOCUMENT_ID===undefined||ix.TITLE===undefined||ix.TYPE===undefined||ix.CONTENT_HTML===undefined||ix.CREATED_BY===undefined){
      throw new Error('Header DOKUMEN tidak lengkap. Perlu ada DOCUMENT_ID, TITLE, TYPE, CONTENT_HTML dan CREATED_BY.');
    }
    let rowNo=0,existing=null;
    if(id){
      const lastRow=sh.getLastRow();
      if(lastRow>1){
        const found=sh.getRange(2,ix.DOCUMENT_ID+1,lastRow-1,1).createTextFinder(id).matchEntireCell(true).findNext();
        if(found){rowNo=found.getRow();existing=sh.getRange(rowNo,1,1,h.length).getValues()[0];}
      }
      if(!existing)throw new Error('Dokumen untuk dikemas kini tidak ditemui.');
      const oldObj={};h.forEach((k,i)=>oldObj[k]=existing[i]);
      if(s.ROLE!=='ADMIN'&&s.ROLE!=='PENTADBIR'&&String(oldObj.CREATED_BY||'')!==String(s.USERNAME)&&!isSharedDocumentTemplate_(oldObj.TYPE,oldObj.TITLE)){
        throw new Error('Anda tidak dibenarkan mengubah dokumen ini.');
      }
      if(isSharedDocumentTemplate_(oldObj.TYPE,oldObj.TITLE)&&s.ROLE!=='ADMIN')throw new Error('Hanya ADMIN boleh mengubah templat bersama.');
    }
    const now=new Date();
    const docId=id||('DOC-'+Utilities.getUuid().slice(0,12).toUpperCase());
    // Validate all selected photo chunks before writing the main document, avoiding partial/duplicate saves.
    const photoPlan=photoIds.length?prepareReportPhotoAttachment_(photoIds,docId,s):null;
    const obj={
      DOCUMENT_ID:docId,TITLE:title,TYPE:type,CONTENT_HTML:sanitizeDocumentHtml_(content),
      CREATED_BY:existing?existing[ix.CREATED_BY]:s.USERNAME,
      CREATED_AT:existing&&ix.CREATED_AT!==undefined?existing[ix.CREATED_AT]:now,UPDATED_AT:now,
      DRIVE_FILE_ID:existing&&ix.DRIVE_FILE_ID!==undefined?String(existing[ix.DRIVE_FILE_ID]||''):'',
      DRIVE_URL:existing&&ix.DRIVE_URL!==undefined?String(existing[ix.DRIVE_URL]||''):'',
      ACTIVITY_ID:activityId,ACTIVITY_NAME:activityName,PHOTO_IDS:photoIds.join(',')
    };
    const row=h.map(k=>obj[k]!==undefined?obj[k]:'');
    if(rowNo)sh.getRange(rowNo,1,1,h.length).setValues([row]);
    else sh.getRange(sh.getLastRow()+1,1,1,h.length).setValues([row]);
    if(photoPlan)attachReportPhotosToDocument_(photoPlan,docId);
    logAction_('saveDocument',{documentId:docId,title,type,activityId,photoCount:photoIds.length,by:s.USERNAME,role:s.ROLE});
    return {ok:true,message:sharedTemplate?'Templat bersama berjaya disimpan dan akan digunakan untuk draf seterusnya.':'Dokumen berjaya disimpan dalam Google Sheets.',documentId:docId,activityId:activityId,activityName:activityName,photoCount:photoIds.length};
  }finally{lock.releaseLock();}
}
function getReportsOverviewSecure_(p){
  const token=typeof p==='string'?p:p.token;
  const requestedAllData=typeof p==='object'&&String(p.allData||'').toLowerCase()==='true';
  const s=getSession_(token);
  const allData=s.ROLE==='PENYELARAS'?false:requestedAllData;
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  const activityResult=getAktivitiSecure_({token:token});
  const activities=activityResult.data||[];
  const allowed={};activities.forEach(a=>allowed[String(a.AKTIVITI_ID)]=true);
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const ps=ss.getSheetByName(SHEETS.PARTICIPANTS);const participantCount={};
  if(ps&&ps.getLastRow()>1){
    const pv=ps.getDataRange().getValues(),ph=pv[0].map(String),ai=ph.indexOf('AKTIVITI_ID'),si=ph.indexOf('STATUS');
    for(let i=1;i<pv.length;i++){const aid=String(pv[i][ai]||'');if(!allowed[aid])continue;const status=si>=0?String(pv[i][si]||'AKTIF').toUpperCase():'AKTIF';if(status==='AKTIF'||status==='DIPILIH')participantCount[aid]=(participantCount[aid]||0)+1;}
  }
  const ds=ss.getSheetByName(SHEETS.DOCUMENTS);let docs=[];
  if(ds&&ds.getLastRow()>1){docs=sheetObjects_(ds).filter(r=>String(r.DOCUMENT_ID||'')&&String(r.TYPE||'')==='LAPORAN'&&!isSharedDocumentTemplate_(r.TYPE,r.TITLE)&&(allData||s.ROLE==='ADMIN'||s.ROLE==='PENTADBIR'||String(r.CREATED_BY||'')===String(s.USERNAME)))}
  docs.sort((a,b)=>new Date(b.UPDATED_AT||0)-new Date(a.UPDATED_AT||0));
  const latestByActivity={};docs.forEach(r=>{const aid=String(r.ACTIVITY_ID||'');if(aid&&allowed[aid]&&!latestByActivity[aid])latestByActivity[aid]=r;});
  const formatted=activities.map(a=>{const d=latestByActivity[String(a.AKTIVITI_ID)]||null;return Object.assign({},a,{JUMLAH_PESERTA:participantCount[String(a.AKTIVITI_ID)]||0,REPORT_DOCUMENT_ID:d?String(d.DOCUMENT_ID):'',REPORT_TITLE:d?String(d.TITLE||''):'',REPORT_UPDATED_AT:d?String(d.UPDATED_AT||''):''});});
  const reportList=docs.filter(r=>!String(r.ACTIVITY_ID||'')||allowed[String(r.ACTIVITY_ID)]).map(r=>({DOCUMENT_ID:String(r.DOCUMENT_ID||''),TITLE:String(r.TITLE||''),TYPE:String(r.TYPE||''),ACTIVITY_ID:String(r.ACTIVITY_ID||''),ACTIVITY_NAME:String(r.ACTIVITY_NAME||''),UPDATED_AT:r.UPDATED_AT instanceof Date?r.UPDATED_AT.toISOString():String(r.UPDATED_AT||'')}));
  return {ok:true,activities:formatted,reports:reportList};
}
function getReportImagesSheet_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();let sh=ss.getSheetByName(SHEETS.REPORT_IMAGES);
  if(!sh){sh=ss.insertSheet(SHEETS.REPORT_IMAGES);sh.getRange(1,1,1,9).setValues([['PHOTO_ID','DOCUMENT_ID','FILE_NAME','MIME_TYPE','CHUNK_INDEX','CHUNK_TOTAL','DATA_CHUNK','CREATED_BY','CREATED_AT']]);sh.setFrozenRows(1);}
  else if(sh.getLastRow()===0){sh.getRange(1,1,1,9).setValues([['PHOTO_ID','DOCUMENT_ID','FILE_NAME','MIME_TYPE','CHUNK_INDEX','CHUNK_TOTAL','DATA_CHUNK','CREATED_BY','CREATED_AT']]);sh.setFrozenRows(1);}
  return sh;
}
function saveReportImageChunkSecure_(p){
  const s=getSession_(p.token);if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  const photoId=String(p.photoId||'').trim(),fileName=String(p.fileName||'foto.jpg').slice(0,160),mime=String(p.mimeType||'image/jpeg');
  const chunkIndex=Number(p.chunkIndex),chunkTotal=Number(p.chunkTotal),data=String(p.dataChunk||'');
  if(!/^IMG-[A-Za-z0-9-]{5,80}$/.test(photoId))throw new Error('ID foto tidak sah.');
  if(!['image/jpeg','image/png','image/webp'].includes(mime))throw new Error('Format foto tidak disokong.');
  if(!Number.isInteger(chunkIndex)||!Number.isInteger(chunkTotal)||chunkTotal<1||chunkTotal>45||chunkIndex<1||chunkIndex>chunkTotal)throw new Error('Pembahagian data foto tidak sah.');
  if(!data||data.length>3200||!/^[A-Za-z0-9+/=]+$/.test(data))throw new Error('Potongan data foto tidak sah.');
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const sh=getReportImagesSheet_();let rowNo=0;const last=sh.getLastRow();
    // Search the ID in one small column, then read its matching rows in a single range.
    if(last>1){
      const matches=sh.getRange(2,1,last-1,1).createTextFinder(photoId).matchEntireCell(true).findAll();
      if(matches.length){
        const positions=matches.map(cell=>cell.getRow()),first=Math.min(...positions),end=Math.max(...positions);
        const rows=sh.getRange(first,1,end-first+1,9).getValues();
        rows.forEach((row,offset)=>{
          if(String(row[0]||'')!==photoId)return;
          if(String(row[7]||'')!==String(s.USERNAME)&&s.ROLE!=='ADMIN')throw new Error('ID foto telah digunakan oleh akaun lain.');
          if(Number(row[5])!==chunkTotal||String(row[3]||'')!==mime)throw new Error('Maklumat ketulan foto tidak konsisten.');
          if(Number(row[4])===chunkIndex)rowNo=first+offset;
        });
      }
    }
    const row=[photoId,'',fileName,mime,chunkIndex,chunkTotal,data,s.USERNAME,new Date()];
    if(rowNo)sh.getRange(rowNo,1,1,row.length).setValues([row]);else sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);
    return {ok:true,photoId:photoId,chunkIndex:chunkIndex,chunkTotal:chunkTotal};
  }finally{lock.releaseLock();}
}
function prepareReportPhotoAttachment_(photoIds,documentId,session){
  const wanted=new Set(photoIds.map(String));const sh=getReportImagesSheet_();const last=sh.getLastRow();
  const matchRows=[];const col=last>1?sh.getRange(2,1,last-1,1):null;
  if(col)wanted.forEach(pid=>col.createTextFinder(pid).matchEntireCell(true).findAll().forEach(cell=>matchRows.push(cell.getRow())));
  const targetRows=[...new Set(matchRows)].sort((a,b)=>a-b);
  const ranges=[];
  targetRows.forEach(rowNo=>{
    const lastRange=ranges[ranges.length-1];
    if(lastRange&&rowNo-lastRange.lastRow<=5)lastRange.lastRow=rowNo;
    else ranges.push({firstRow:rowNo,lastRow:rowNo});
  });
  ranges.forEach(range=>{range.values=sh.getRange(range.firstRow,1,range.lastRow-range.firstRow+1,9).getValues();});
  const groups={};
  ranges.forEach(range=>range.values.forEach((row,offset)=>{
    const pid=String(row[0]||'');if(!wanted.has(pid))return;
    if(String(row[7]||'')!==String(session.USERNAME)&&session.ROLE!=='ADMIN'&&session.ROLE!=='PENTADBIR')throw new Error('Foto bukan milik akaun anda.');
    const total=Number(row[5]),index=Number(row[4]),mime=String(row[3]||'');
    if(!Number.isInteger(total)||total<1||total>45||!Number.isInteger(index)||index<1||index>total||!String(row[6]||''))throw new Error('Ketulan foto mempunyai maklumat yang tidak sah.');
    if(!groups[pid])groups[pid]={total,mime,chunks:{},rows:[]};
    const g=groups[pid];if(g.total!==total||g.mime!==mime)throw new Error('Maklumat ketulan foto tidak konsisten untuk '+pid+'.');
    if(g.chunks[index])throw new Error('Ketulan foto berulang untuk '+pid+' ('+index+').');
    g.chunks[index]=true;g.rows.push(range.firstRow+offset);
  }));
  const missing=[];
  wanted.forEach(pid=>{
    const g=groups[pid];if(!g){missing.push(pid);return;}
    for(let n=1;n<=g.total;n++)if(!g.chunks[n]){missing.push(pid+' (ketulan '+n+'/'+g.total+')');break;}
  });
  if(missing.length)throw new Error('Foto belum selesai dimuat naik: '+missing.join(', ')+'. Tunggu label foto menjadi “sedia” dan cuba simpan semula.');
  return {sheet:sh,wanted,ranges};
}
function attachReportPhotosToDocument_(plan,documentId){
  if(!plan||!plan.sheet||!plan.ranges||!plan.ranges.length)return;
  // Update only groups of selected photo chunks; keep IDs belonging to other documents unchanged.
  plan.ranges.forEach(range=>{
    const values=range.values.map(row=>[plan.wanted.has(String(row[0]||''))?documentId:String(row[1]||'')]);
    plan.sheet.getRange(range.firstRow,2,values.length,1).setValues(values);
  });
}
function getReportImagesSecure_(p){
  const s=getSession_(p.token);if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  const documentId=String(p.documentId||'').trim();if(!documentId)throw new Error('ID dokumen diperlukan.');
  const ds=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.DOCUMENTS);if(!ds)throw new Error('DOKUMEN belum wujud.');
  const doc=sheetObjects_(ds).find(r=>String(r.DOCUMENT_ID||'')===documentId);if(!doc)throw new Error('Dokumen tidak ditemui.');
  if(s.ROLE!=='ADMIN'&&s.ROLE!=='PENTADBIR'&&String(doc.CREATED_BY||'')!==String(s.USERNAME)&&!isSharedDocumentTemplate_(doc.TYPE,doc.TITLE))throw new Error('Anda tidak dibenarkan mengakses foto dokumen ini.');
  let ids=String(doc.PHOTO_IDS||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(!ids.length){const html=String(doc.CONTENT_HTML||''),re=/data-report-photo-id=["'](IMG-[A-Za-z0-9-]+)["']/g;let m;while((m=re.exec(html))!==null)if(!ids.includes(m[1]))ids.push(m[1]);}
  if(!ids.length)return {ok:true,images:[]};
  const sh=getReportImagesSheet_(),rows=sh.getDataRange().getValues(),groups={};
  for(let i=1;i<rows.length;i++){
    const r=rows[i],pid=String(r[0]||'');if(!ids.includes(pid)||String(r[1]||'')!==documentId)continue;
    if(String(r[7]||'')!==String(doc.CREATED_BY||'')&&s.ROLE!=='ADMIN'&&s.ROLE!=='PENTADBIR')throw new Error('Kebenaran foto tidak sepadan dengan pemilik dokumen.');
    if(!groups[pid])groups[pid]={PHOTO_ID:pid,FILE_NAME:String(r[2]||'foto.jpg'),MIME_TYPE:String(r[3]||'image/jpeg'),TOTAL:Number(r[5]||0),CHUNKS:{}};
    groups[pid].CHUNKS[Number(r[4])]=String(r[6]||'');
  }
  const images=[];
  ids.forEach(id=>{const g=groups[id];if(!g||!g.TOTAL)return;let b64='';for(let n=1;n<=g.TOTAL;n++){if(!g.CHUNKS[n])return;b64+=g.CHUNKS[n];}images.push({PHOTO_ID:id,FILE_NAME:g.FILE_NAME,MIME_TYPE:g.MIME_TYPE,DATA_URL:'data:'+g.MIME_TYPE+';base64,'+b64});});
  return {ok:true,images:images};
}

function sanitizeDocumentHtml_(html){
  let s=String(html||'');
  s=s.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<iframe[\s\S]*?<\/iframe>/gi,'').replace(/<object[\s\S]*?<\/object>/gi,'').replace(/<embed[^>]*>/gi,'');
  s=s.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'').replace(/javascript\s*:/gi,'');
  return s;
}
function escapeHtmlServer_(v){
  return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


/* =========================================================
   V2.6 PENCAPAIAN KOKURIKULUM
   Penyimpanan menggunakan PENCAPAIAN sahaja (prototype).
========================================================= */
function getPencapaianSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ACHIEVEMENT);
  if(!sh)throw new Error('PENCAPAIAN belum wujud. semak tab serta header helaian sebenar.');
  // Semua guru boleh melihat rekod pencapaian merentas unit. Kawalan terhadap
  // perubahan/pengarkiban rekod masih dibuat pada endpoint penulisan masing-masing.
  let rows=sheetObjects_(sh).filter(r=>String(r.PENCAPAIAN_ID||'').trim()!==''&&String(r.STATUS||'AKTIF').toUpperCase()==='AKTIF');
  if(s.ROLE==='PENYELARAS'){const allowed=new Set(getAccessibleUnitIds_(s));const placements=sheetObjects_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PLACEMENT));const memberKps=new Set(placements.filter(r=>allowed.has(String(r.UNIT_ID||''))&&String(r.STATUS||'AKTIF').toUpperCase()!=='TIDAK_AKTIF').map(r=>String(r.NO_KP||'').trim()).filter(Boolean));rows=rows.filter(r=>(r.UNIT_ID&&allowed.has(String(r.UNIT_ID)))||(r.NO_KP&&memberKps.has(String(r.NO_KP))));}
  const muridMap={};getMuridRows_().forEach(r=>muridMap[String(r.NO_KP||'')]=r);
  const unitSh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.UNIT);
  const unitMap={};if(unitSh)sheetObjects_(unitSh).forEach(r=>unitMap[String(r.UNIT_ID||'')]=r);
  const actSh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ACTIVITY);
  const activityMap={};if(actSh)sheetObjects_(actSh).forEach(r=>activityMap[String(r.AKTIVITI_ID||'')]=r);
  rows.sort((a,b)=>new Date(b.TARIKH||0)-new Date(a.TARIKH||0));
  return {ok:true,data:rows.map(r=>{
    const m=muridMap[String(r.NO_KP||'')]||{},u=unitMap[String(r.UNIT_ID||'')]||{},a=activityMap[String(r.AKTIVITI_ID||'')]||{};
    return Object.assign({},r,{
      NAMA_MURID:String(m.NAMA||''),KELAS_MURID:String(m.KELAS||''),
      NAMA_UNIT:String(u.NAMA_UNIT||''),NAMA_AKTIVITI:String(a.NAMA_AKTIVITI||'')
    });
  }),user:{username:s.USERNAME,role:s.ROLE}};
}
function savePencapaianSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  const id=String(p.pencapaianId||'').trim();
  const kategori=String(p.kategori||'').trim().toUpperCase();
  const nama=String(p.namaPencapaian||'').trim();
  const noKp=String(p.noKp||'').trim();
  const unitId=String(p.unitId||'').trim();
  const aktivitiId=String(p.aktivitiId||'').trim();
  const peringkat=String(p.peringkat||'').trim().toUpperCase();
  const kedudukan=String(p.kedudukan||'').trim().toUpperCase();
  const tarikh=String(p.tarikh||'').trim();
  const tahun=String(p.tahun||'').trim();
  const catatan=String(p.catatan||'').trim().slice(0,1500);
  const pautan=String(p.pautanBukti||'').trim();
  if(!['INDIVIDU','BERPASUKAN','UNIT'].includes(kategori))throw new Error('Kategori pencapaian tidak sah.');
  if(!nama||!peringkat||!kedudukan||!tarikh||!tahun)throw new Error('Lengkapkan maklumat wajib pencapaian.');
  if(!['SEKOLAH','ZON','DAERAH','NEGERI','KEBANGSAAN','ANTARABANGSA'].includes(peringkat))throw new Error('Peringkat tidak sah.');
  if(!['JOHAN','NAIB JOHAN','KETIGA','KEEMPAT','KELIMA','EMAS','PERAK','GANGSA','PENYERTAAN','ANUGERAH KHAS','LAIN-LAIN'].includes(kedudukan))throw new Error('Kedudukan atau anugerah tidak sah.');
  const d=new Date(tarikh+'T00:00:00');if(isNaN(d.getTime()))throw new Error('Tarikh pencapaian tidak sah.');
  if(!/^\d{4}$/.test(tahun)||Number(tahun)<2000||Number(tahun)>2100)throw new Error('Tahun tidak sah.');
  if(String(d.getFullYear())!==tahun)throw new Error('Tahun mesti sepadan dengan tarikh pencapaian.');
  if(pautan&&!/^https?:\/\//i.test(pautan))throw new Error('Pautan bukti mesti bermula dengan http:// atau https://');
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const sh=ss.getSheetByName(SHEETS.ACHIEVEMENT);
  if(!sh)throw new Error('PENCAPAIAN belum wujud. semak tab serta header helaian sebenar.');
  if(kategori==='INDIVIDU'){
    if(!noKp)throw new Error('Pilih murid untuk pencapaian individu.');
    const m=getMuridRows_().find(x=>String(x.NO_KP||'')===noKp&&String(x.STATUS||'AKTIF').toUpperCase()==='AKTIF');
    if(!m)throw new Error('Murid tidak ditemui atau tidak aktif.');
  }else{
    if(!unitId)throw new Error('Pilih unit atau pasukan.');
  }
  let unit=null;
  if(unitId){
    const unitSheet=ss.getSheetByName(SHEETS.UNIT);
    unit=unitSheet?sheetObjects_(unitSheet).find(x=>String(x.UNIT_ID||'')===unitId):null;
    if(!unit)throw new Error('Unit tidak ditemui.');
    if(isUnitScopedRole_(s.ROLE))assertAttendanceUnitAccess_(s,unit);
  }
  if(aktivitiId)assertAktivitiAccess_(s,aktivitiId);
  if(isUnitScopedRole_(s.ROLE)&&!unitId&&!aktivitiId)throw new Error('Guru perlu memautkan rekod kepada unit sendiri atau aktiviti yang diuruskan.');
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const values=sh.getDataRange().getValues(),headers=values[0].map(String),ix={};headers.forEach((x,i)=>ix[x]=i);
    let rowNumber=0,existing=null;
    if(id){
      for(let r=1;r<values.length;r++)if(String(values[r][ix.PENCAPAIAN_ID])===id){rowNumber=r+1;existing={};headers.forEach((x,i)=>existing[x]=values[r][i]);break;}
      if(!existing)throw new Error('Rekod pencapaian untuk dikemas kini tidak ditemui.');
      if(s.ROLE!=='ADMIN'&&s.ROLE!=='PENTADBIR'&&String(existing.CREATED_BY||'')!==String(s.USERNAME))throw new Error('Anda tidak dibenarkan mengubah rekod pencapaian ini.');
    }
    const now=new Date(),recordId=id||('PC'+Utilities.getUuid().slice(0,9).toUpperCase());
    const obj={PENCAPAIAN_ID:recordId,KATEGORI:kategori,NAMA_PENCAPAIAN:nama,NO_KP:kategori==='INDIVIDU'?noKp:'',UNIT_ID:unitId,AKTIVITI_ID:aktivitiId,PERINGKAT:peringkat,KEDUDUKAN:kedudukan,TARIKH:tarikh,TAHUN:tahun,CATATAN:catatan,PAUTAN_BUKTI:pautan,STATUS:'AKTIF',CREATED_BY:existing?existing.CREATED_BY:s.USERNAME,CREATED_AT:existing?existing.CREATED_AT:now,UPDATED_AT:now};
    const row=headers.map(h=>obj[h]!==undefined?obj[h]:'');
    if(rowNumber)sh.getRange(rowNumber,1,1,headers.length).setValues([row]);
    else sh.getRange(sh.getLastRow()+1,1,1,headers.length).setValues([row]);
    logAction_(id?'updatePencapaian':'addPencapaian',{pencapaianId:recordId,kategori,nama,peringkat,kedudukan,by:s.USERNAME,role:s.ROLE});
    return {ok:true,message:id?'Pencapaian berjaya dikemas kini.':'Pencapaian berjaya direkodkan.',pencapaianId:recordId};
  }finally{lock.releaseLock();}
}
/* =========================================================
   V3.8 PENCAPAIAN BERASASKAN AKTIVITI
   - Senarai Pencapaian mengambil semua rekod AKTIVITI
   - Satu simpanan borang menghasilkan satu rekod bagi setiap murid dipilih
   - Keahlian peserta diambil daripada PESERTA_AKTIVITI
   - Kategori penyertaan dipautkan kepada unit murid dalam PENEMPATAN_UNIT
========================================================= */
function getPencapaianAktivitiListSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  const activities=(getAktivitiSecure_({token:p.token}).data||[]);
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const participantsSheet=ss.getSheetByName(SHEETS.PARTICIPANTS);
  const achievementsSheet=ss.getSheetByName(SHEETS.ACHIEVEMENT);
  if(!participantsSheet)throw new Error('PESERTA_AKTIVITI belum wujud.');
  if(!achievementsSheet)throw new Error('PENCAPAIAN belum wujud.');
  const participantSets={};
  sheetObjects_(participantsSheet).forEach(r=>{
    if(String(r.STATUS||'AKTIF').toUpperCase()!=='AKTIF')return;
    const id=String(r.AKTIVITI_ID||''),kp=String(r.NO_KP||'');
    if(!id||!kp)return;
    if(!participantSets[id])participantSets[id]={};
    participantSets[id][kp]=true;
  });
  const pc={};Object.keys(participantSets).forEach(id=>pc[id]=Object.keys(participantSets[id]).length);
  const rc={};
  sheetObjects_(achievementsSheet).forEach(r=>{
    if(String(r.STATUS||'AKTIF').toUpperCase()!=='AKTIF')return;
    const id=String(r.AKTIVITI_ID||'');if(id)rc[id]=(rc[id]||0)+1;
  });
  const data=activities.map(a=>({
    AKTIVITI_ID:String(a.AKTIVITI_ID||''),
    NAMA_AKTIVITI:String(a.NAMA_AKTIVITI||''),
    TARIKH:a.TARIKH instanceof Date?a.TARIKH.toISOString():String(a.TARIKH||''),
    TEMPAT:String(a.TEMPAT||''),
    PERINGKAT:String(a.PERINGKAT||''),
    NO_GURU:String(a.NO_GURU||''),
    PESERTA:Number(pc[String(a.AKTIVITI_ID||'')]||0),
    REKOD:Number(rc[String(a.AKTIVITI_ID||'')]||0),
    STATUS_REKOD:Number(rc[String(a.AKTIVITI_ID||'')]||0)>0?'TELAH DIREKOD':'BELUM DIREKOD',
    CAN_MANAGE:a.CAN_MANAGE!==false
  }));
  data.sort((a,b)=>pencapaianDateSort_(b.TARIKH)-pencapaianDateSort_(a.TARIKH));
  return {ok:true,data,user:{username:s.USERNAME,role:s.ROLE}};
}
function getPencapaianAktivitiRecordsSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  const activityId=String(p.aktivitiId||'').trim();
  if(!activityId)throw new Error('AKTIVITI_ID diperlukan.');
  const activity=findAktivitiForRead_(s,activityId);
  const canManage=canManageAktiviti_(s,activity);
  if(s.ROLE==='PENYELARAS'&&!canManage)throw new Error('Akses ditolak. Aktiviti ini bukan di bawah urusan akaun penyelaras anda.');
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const shP=ss.getSheetByName(SHEETS.PARTICIPANTS);
  const shM=ss.getSheetByName(SHEETS.MURID);
  const shA=ss.getSheetByName(SHEETS.ACHIEVEMENT);
  if(!shP||!shM||!shA)throw new Error('Helaian PESERTA_AKTIVITI, MURID atau PENCAPAIAN belum wujud.');
  const students={};sheetObjects_(shM).forEach(m=>{students[String(m.NO_KP||'')]=m;});
  const participants=[];
  const seen={};
  const coordinatorMemberKps=s.ROLE==='PENYELARAS'?(getCoordinatorMemberKps_(s)||new Set()):null;
  sheetObjects_(shP).forEach(r=>{
    if(String(r.AKTIVITI_ID||'')!==activityId||String(r.STATUS||'AKTIF').toUpperCase()!=='AKTIF')return;
    const kp=String(r.NO_KP||'').trim();if(!kp||seen[kp])return;seen[kp]=true;
    if(coordinatorMemberKps&&!coordinatorMemberKps.has(kp))return;
    const m=students[kp];if(!m||String(m.STATUS||'AKTIF').toUpperCase()!=='AKTIF')return;
    participants.push({NO_KP:kp,NAMA:String(m.NAMA||''),JANTINA:String(m.JANTINA||''),TINGKATAN:String(m.TINGKATAN||''),KELAS:String(m.KELAS||''),STATUS:String(m.STATUS||'AKTIF'),PERANAN:String(r.PERANAN||'PESERTA')});
  });
  participants.sort((a,b)=>(String(a.KELAS||'').localeCompare(String(b.KELAS||''),'ms'))||(String(a.NAMA||'').localeCompare(String(b.NAMA||''),'ms')));
  const coordinatorUnitIds=s.ROLE==='PENYELARAS'?new Set(getAccessibleUnitIds_(s)):null;
  const records=sheetObjects_(shA).filter(r=>String(r.AKTIVITI_ID||'')===activityId&&String(r.STATUS||'AKTIF').toUpperCase()==='AKTIF'&&(!coordinatorUnitIds||coordinatorUnitIds.has(String(r.UNIT_ID||'')))).map(r=>{
    const m=students[String(r.NO_KP||'')]||{};
    const o=Object.assign({},r,{NAMA_MURID:String(m.NAMA||''),KELAS_MURID:String(m.KELAS||''),TINGKATAN_MURID:String(m.TINGKATAN||'')});
    if(o.TARIKH instanceof Date)o.TARIKH=Utilities.formatDate(o.TARIKH,Session.getScriptTimeZone(),'yyyy-MM-dd');
    else o.TARIKH=String(o.TARIKH||'').slice(0,10);
    return o;
  });
  records.sort((a,b)=>pencapaianDateSort_(b.TARIKH)-pencapaianDateSort_(a.TARIKH));
  return {ok:true,aktiviti:activityPublicRow_(activity),canManage,participants,records};
}
function ensurePencapaianBatchHeaders_(sh){
  if(!sh||sh.getLastColumn()<1)throw new Error('Helaian PENCAPAIAN tiada header. Semak struktur helaian dahulu.');
  let headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(x=>String(x).trim());
  const required=['PENCAPAIAN_ID','KATEGORI','NAMA_PENCAPAIAN','NO_KP','UNIT_ID','AKTIVITI_ID','PERINGKAT','KEDUDUKAN','TARIKH','TAHUN','CATATAN','PAUTAN_BUKTI','STATUS','CREATED_BY','CREATED_AT','UPDATED_AT'];
  const missing=required.filter(h=>!headers.includes(h));
  if(missing.length)throw new Error('Header PENCAPAIAN belum lengkap: '+missing.join(', ')+'. Tambah/semak header dahulu; tiada rekod disimpan.');
  ['KATEGORI_PENYERTAAN','KUMPULAN_REKOD_ID','TAJUK_PENGLIBATAN'].forEach(name=>{
    if(headers.includes(name))return;
    const col=sh.getLastColumn()+1;
    sh.getRange(1,col).setValue(name);
    headers.push(name);
  });
  return headers;
}
function pencapaianDateSort_(v){const d=v instanceof Date?v:new Date(String(v||''));return isNaN(d.getTime())?0:d.getTime();}
function pencapaianYmd_(v){
  if(v instanceof Date)return Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd');
  const s=String(v||'').trim();if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);
  const d=new Date(s);return isNaN(d.getTime())?s.slice(0,10):Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM-dd');
}
function normalizePencapaianCategory_(v){return String(v||'').trim().toUpperCase().replace(/\s+/g,' ');}
function pencapaianLegacySame_(row,key){
  if(!key)return false;
  return String(row.AKTIVITI_ID||'')===String(key.AKTIVITI_ID||'') &&
    String(row.NAMA_PENCAPAIAN||'').trim().toLowerCase()===String(key.NAMA_PENCAPAIAN||'').trim().toLowerCase() &&
    pencapaianYmd_(row.TARIKH)===pencapaianYmd_(key.TARIKH) &&
    String(row.TAHUN||'')===String(key.TAHUN||'') &&
    String(row.PERINGKAT||'').toUpperCase()===String(key.PERINGKAT||'').toUpperCase() &&
    String(row.KEDUDUKAN||'').toUpperCase()===String(key.KEDUDUKAN||'').toUpperCase() &&
    normalizePencapaianCategory_(row.KATEGORI_PENYERTAAN||'')===normalizePencapaianCategory_(key.KATEGORI_PENYERTAAN||'') &&
    (!Object.prototype.hasOwnProperty.call(key,'TAJUK_PENGLIBATAN') || String(row.TAJUK_PENGLIBATAN||'')===String(key.TAJUK_PENGLIBATAN||''));
}
function findUnitsForAchievementCategory_(noKp,year,category,placements,units){
  const target=normalizePencapaianCategory_(category), found=new Map();
  for(let i=0;i<placements.length;i++){
    const placement=placements[i];
    if(String(placement.NO_KP||'').trim()!==String(noKp||'').trim() ||
       String(placement.TAHUN||'')!==String(year) ||
       String(placement.STATUS||'AKTIF').toUpperCase()!=='AKTIF') continue;
    const unit=units.find(x=>String(x.UNIT_ID||'')===String(placement.UNIT_ID||''));
    if(!unit || String(unit.STATUS||'AKTIF').toUpperCase()!=='AKTIF') continue;
    if(normalizePencapaianCategory_(unit.KATEGORI)!==target) continue;
    if(String(unit.TAHUN||year)!==String(year)) continue;
    const unitId=String(unit.UNIT_ID||'').trim();
    if(unitId)found.set(unitId,{UNIT_ID:unitId,NAMA_UNIT:String(unit.NAMA_UNIT||'Unit tanpa nama'),KATEGORI:String(unit.KATEGORI||'')});
  }
  return Array.from(found.values());
}

function getPencapaianUnitPreviewSecure_(p){
  const session=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(session.ROLE))throw new Error('Akses ditolak.');
  const activityId=String(p.aktivitiId||'').trim();
  const category=normalizePencapaianCategory_(p.kategoriPenyertaan);
  const year=String(p.tahun||'').trim();
  if(!activityId)throw new Error('AKTIVITI_ID diperlukan.');
  const allowedCategories=['UNIT BERUNIFORM','KELAB / PERSATUAN','SUKAN / PERMAINAN','RUMAH SUKAN'];
  if(!allowedCategories.includes(category))throw new Error('Pilih kategori penyertaan yang sah.');
  if(!/^\d{4}$/.test(year))throw new Error('Tahun tidak sah.');
  const activity=findAktivitiForRead_(session,activityId);
  if(session.ROLE==='PENYELARAS'&&!canManageAktiviti_(session,activity))throw new Error('Akses ditolak. Aktiviti ini bukan di bawah urusan akaun penyelaras anda.');
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const participantSheet=ss.getSheetByName(SHEETS.PARTICIPANTS);
  const studentSheet=ss.getSheetByName(SHEETS.MURID);
  const placementSheet=ss.getSheetByName(SHEETS.PLACEMENT);
  const unitSheet=ss.getSheetByName(SHEETS.UNIT);
  if(!participantSheet||!studentSheet||!placementSheet||!unitSheet)throw new Error('Helaian MURID, UNIT, PENEMPATAN_UNIT dan PESERTA_AKTIVITI perlu tersedia.');

  const students={};sheetObjects_(studentSheet).forEach(m=>{students[String(m.NO_KP||'').trim()]=m;});
  const placements=sheetObjects_(placementSheet),units=sheetObjects_(unitSheet);
  const coordinatorUnitIds=session.ROLE==='PENYELARAS'?new Set(getAccessibleUnitIds_(session)):null;
  const seen={},data=[];
  sheetObjects_(participantSheet).forEach(r=>{
    if(String(r.AKTIVITI_ID||'')!==activityId||String(r.STATUS||'AKTIF').toUpperCase()!=='AKTIF')return;
    const kp=String(r.NO_KP||'').trim();if(!kp||seen[kp])return;seen[kp]=true;
    const student=students[kp];
    if(!student||String(student.STATUS||'AKTIF').toUpperCase()!=='AKTIF')return;
    let matches=findUnitsForAchievementCategory_(kp,year,category,placements,units);
    if(coordinatorUnitIds){matches=matches.filter(x=>coordinatorUnitIds.has(String(x.UNIT_ID)));if(!matches.length)return;}
    let mappingStatus='OK',unitId='',unitName='',message='';
    if(matches.length===0){mappingStatus='TIADA_UNIT';message='Tiada penempatan aktif dalam kategori dan tahun dipilih.';}
    else if(matches.length>1){mappingStatus='BERGANDA';message='Murid mempunyai lebih daripada satu unit aktif dalam kategori dan tahun ini. Semak PENEMPATAN_UNIT.';unitName=matches.map(x=>x.NAMA_UNIT).join(', ');}
    else{unitId=matches[0].UNIT_ID;unitName=matches[0].NAMA_UNIT;}
    data.push({NO_KP:kp,NAMA:String(student.NAMA||''),KELAS:String(student.KELAS||''),UNIT_ID:unitId,NAMA_UNIT:unitName,KATEGORI_UNIT:String(matches[0]?.KATEGORI||category),STATUS_PEMETAAN:mappingStatus,MESSAGE:message});
  });
  data.sort((a,b)=>String(a.KELAS||'').localeCompare(String(b.KELAS||''),'ms')||String(a.NAMA||'').localeCompare(String(b.NAMA||''),'ms'));
  return {ok:true,aktivitiId:activityId,namaAktiviti:String(activity.NAMA_AKTIVITI||''),kategoriPenyertaan:category,tahun:year,data};
}
function savePencapaianAktivitiBatchSecure_(p){
  const s=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  const activityId=String(p.aktivitiId||'').trim();
  const eventName=String(p.acaraPencapaian||'').trim().slice(0,180);
  const tajukPenglibatan=String(p.tajukPenglibatan||'').trim();
  const category=normalizePencapaianCategory_(p.kategoriPenyertaan);
  const level=String(p.peringkat||'').trim().toUpperCase();
  const position=String(p.kedudukan||'').trim().toUpperCase();
  const date=String(p.tarikh||'').trim();
  const year=String(p.tahun||'').trim();
  const notes=String(p.catatan||'').trim().slice(0,1500);
  const evidence=String(p.pautanBukti||'').trim();
  const groupIdRequested=String(p.kumpulanId||'').trim();
  let selected=[];try{selected=typeof p.muridDipilih==='string'?JSON.parse(p.muridDipilih||'[]'):(p.muridDipilih||[]);}catch(e){throw new Error('Senarai murid tidak sah.');}
  if(!Array.isArray(selected))throw new Error('Senarai murid tidak sah.');
  selected=[...new Set(selected.map(x=>String(x||'').trim()).filter(Boolean))];
  if(!activityId)throw new Error('Pilih aktiviti terlebih dahulu.');
  if(!eventName)throw new Error('Masukkan Acara / Pencapaian, contoh: 100 Meter Lelaki.');
  if(!['1','2','3'].includes(tajukPenglibatan))throw new Error('Pilih Tajuk Penglibatan 1, 2 atau 3.');
  if(!['UNIT BERUNIFORM','KELAB / PERSATUAN','SUKAN / PERMAINAN','RUMAH SUKAN'].includes(category))throw new Error('Pilih Kategori Penyertaan yang sah.');
  if(!['SEKOLAH','ZON','DAERAH','NEGERI','KEBANGSAAN','ANTARABANGSA'].includes(level))throw new Error('Peringkat tidak sah.');
  if(!['JOHAN','NAIB JOHAN','KETIGA','KEEMPAT','KELIMA','PENYERTAAN','EMAS','PERAK','GANGSA','ANUGERAH KHAS','LAIN-LAIN'].includes(position))throw new Error('Kedudukan tidak sah.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Tarikh tidak sah.');
  const dateObj=new Date(date+'T00:00:00');if(isNaN(dateObj.getTime()))throw new Error('Tarikh tidak sah.');
  if(!/^\d{4}$/.test(year)||String(date).slice(0,4)!==year)throw new Error('Tahun mesti sama dengan tahun tarikh pencapaian.');
  if(!selected.length)throw new Error('Pilih sekurang-kurangnya seorang murid yang terlibat.');
  if(evidence&&!/^https?:\/\//i.test(evidence))throw new Error('Pautan bukti mesti bermula dengan http:// atau https://');

  const activity=assertAktivitiAccess_(s,activityId);
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const participantsSh=ss.getSheetByName(SHEETS.PARTICIPANTS);
  const studentsSh=ss.getSheetByName(SHEETS.MURID);
  const placementsSh=ss.getSheetByName(SHEETS.PLACEMENT);
  const unitsSh=ss.getSheetByName(SHEETS.UNIT);
  const achievementSh=ss.getSheetByName(SHEETS.ACHIEVEMENT);
  if(!participantsSh||!studentsSh||!placementsSh||!unitsSh||!achievementSh)throw new Error('Helaian MURID, UNIT, PENEMPATAN_UNIT, PESERTA_AKTIVITI atau PENCAPAIAN belum lengkap.');
  const registered={};sheetObjects_(participantsSh).forEach(r=>{if(String(r.AKTIVITI_ID||'')===activityId&&String(r.STATUS||'AKTIF').toUpperCase()==='AKTIF')registered[String(r.NO_KP||'')]=true;});
  selected.forEach(kp=>{if(!registered[kp])throw new Error('Murid '+kp+' bukan peserta aktif yang telah didaftarkan dalam aktiviti ini.');});
  const students=sheetObjects_(studentsSh),studentMap={};students.forEach(m=>studentMap[String(m.NO_KP||'')]=m);
  const placements=sheetObjects_(placementsSh),units=sheetObjects_(unitsSh);
  const coordinatorUnitIds=s.ROLE==='PENYELARAS'?new Set(getAccessibleUnitIds_(s)):null;
  const unresolved=[];const unitForStudent={};
  selected.forEach(kp=>{
    const m=studentMap[kp];
    if(!m||String(m.STATUS||'AKTIF').toUpperCase()!=='AKTIF'){unresolved.push((m&&m.NAMA)||kp+' (murid tidak aktif)');return;}
    let matches=findUnitsForAchievementCategory_(kp,year,category,placements,units);
    if(coordinatorUnitIds)matches=matches.filter(x=>coordinatorUnitIds.has(String(x.UNIT_ID)));
    if(matches.length===0){unresolved.push(String(m.NAMA||kp)+' (tiada penempatan aktif dalam kategori '+category+')');}
    else if(matches.length>1){unresolved.push(String(m.NAMA||kp)+' (lebih daripada satu unit: '+matches.map(x=>x.NAMA_UNIT).join(', ')+')');}
    else unitForStudent[kp]=matches[0].UNIT_ID;
  });
  if(unresolved.length)throw new Error('Rekod tidak disimpan. Pemetaan unit perlu disemak bagi tahun '+year+': '+unresolved.join('; ')+'. Pastikan setiap murid mempunyai tepat satu penempatan aktif bagi kategori dipilih dalam PENEMPATAN_UNIT.');

  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const headers=ensurePencapaianBatchHeaders_(achievementSh);
    const values=achievementSh.getDataRange().getValues();
    const rowObjs=[];
    for(let i=1;i<values.length;i++){
      const o={};headers.forEach((h,j)=>o[h]=values[i][j]);o.__ROW=i+1;rowObjs.push(o);
    }
    let legacyKey=null;
    if(String(p.legacyMatchKey||'').trim()){try{legacyKey=JSON.parse(String(p.legacyMatchKey));}catch(e){throw new Error('Kunci rekod lama tidak sah.');}}
    let groupId=groupIdRequested;
    let groupRows=[];
    if(groupId){
      groupRows=rowObjs.filter(r=>String(r.KUMPULAN_REKOD_ID||'')===groupId);
    }else if(legacyKey){
      groupRows=rowObjs.filter(r=>pencapaianLegacySame_(r,legacyKey));
      if(groupRows.length){
        const oldGroupIds=[...new Set(groupRows.map(r=>String(r.KUMPULAN_REKOD_ID||'')).filter(Boolean))];
        if(oldGroupIds.length>1)throw new Error('Rekod lama bertindih dengan beberapa kumpulan. Sila hubungi pentadbir untuk semakan.');
        groupId=oldGroupIds[0]||'';
      }
    }
    if(groupRows.some(r=>String(r.AKTIVITI_ID||'')!==activityId))throw new Error('Kumpulan rekod tidak sepadan dengan aktiviti.');
    if(!groupId)groupId='PG'+Utilities.getUuid().replace(/-/g,'').slice(0,12).toUpperCase();
    const activeByKp={};
    groupRows.forEach(r=>{const kp=String(r.NO_KP||'');if(kp)activeByKp[kp]=r;});
    const now=new Date();let inserted=0,updated=0,archived=0;
    // Nyahaktifkan murid yang sebelum ini berada dalam kumpulan tetapi kini tidak dipilih.
    groupRows.forEach(old=>{
      const kp=String(old.NO_KP||'');
      if(!selected.includes(kp)&&String(old.STATUS||'').toUpperCase()==='AKTIF'){
        const obj=Object.assign({},old,{STATUS:'TIDAK_AKTIF',UPDATED_AT:now,KUMPULAN_REKOD_ID:groupId});
        achievementSh.getRange(old.__ROW,1,1,headers.length).setValues([headers.map(h=>obj[h]!==undefined?obj[h]:'')]);archived++;
      }
    });
    selected.forEach(kp=>{
      const old=activeByKp[kp]||null;
      const obj={
        PENCAPAIAN_ID:old?old.PENCAPAIAN_ID:('PC'+Utilities.getUuid().replace(/-/g,'').slice(0,10).toUpperCase()),
        KATEGORI:'INDIVIDU',NAMA_PENCAPAIAN:eventName,NO_KP:kp,UNIT_ID:unitForStudent[kp],AKTIVITI_ID:activityId,
        PERINGKAT:level,KEDUDUKAN:position,TARIKH:dateObj,TAHUN:year,CATATAN:notes,PAUTAN_BUKTI:evidence,
        STATUS:'AKTIF',CREATED_BY:old?(old.CREATED_BY||s.USERNAME):s.USERNAME,
        CREATED_AT:old?(old.CREATED_AT||now):now,UPDATED_AT:now,
        KATEGORI_PENYERTAAN:category,KUMPULAN_REKOD_ID:groupId,TAJUK_PENGLIBATAN:tajukPenglibatan
      };
      const row=headers.map(h=>obj[h]!==undefined?obj[h]:(old&&old[h]!==undefined?old[h]:''));
      if(old){achievementSh.getRange(old.__ROW,1,1,headers.length).setValues([row]);updated++;}
      else{achievementSh.getRange(achievementSh.getLastRow()+1,1,1,headers.length).setValues([row]);inserted++;}
    });
    logAction_('savePencapaianAktivitiBatch',{aktivitiId:activityId,namaAktiviti:String(activity.NAMA_AKTIVITI||''),acaraPencapaian:eventName,tajukPenglibatan,kategoriPenyertaan:category,peringkat:level,kedudukan:position,jumlahMurid:selected.length,inserted,updated,archived,groupId,by:s.USERNAME,role:s.ROLE});
    return {ok:true,message:'Rekod pencapaian berjaya disimpan untuk '+selected.length+' murid.',kumpulanId:groupId,jumlahMurid:selected.length,inserted,updated,archived};
  }finally{lock.releaseLock();}
}

function setPencapaianStatusSecure_(p){
  const s=getSession_(p.token);if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(s.ROLE))throw new Error('Akses ditolak.');
  const id=String(p.pencapaianId||'').trim(),status=String(p.status||'').trim().toUpperCase();
  if(!id||!['AKTIF','TIDAK_AKTIF'].includes(status))throw new Error('Data status pencapaian tidak sah.');
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ACHIEVEMENT);if(!sh)throw new Error('PENCAPAIAN belum wujud.');
  const values=sh.getDataRange().getValues(),h=values[0].map(String),ii=h.indexOf('PENCAPAIAN_ID');
  for(let r=1;r<values.length;r++)if(String(values[r][ii])===id){const row={};h.forEach((k,i)=>row[k]=values[r][i]);if(s.ROLE!=='ADMIN'&&s.ROLE!=='PENTADBIR'&&String(row.CREATED_BY||'')!==String(s.USERNAME))throw new Error('Anda tidak dibenarkan mengubah rekod ini.');sh.getRange(r+1,h.indexOf('STATUS')+1).setValue(status);if(h.includes('UPDATED_AT'))sh.getRange(r+1,h.indexOf('UPDATED_AT')+1).setValue(new Date());logAction_('setPencapaianStatus',{pencapaianId:id,status,by:s.USERNAME,role:s.ROLE});return {ok:true,message:status==='AKTIF'?'Rekod pencapaian diaktifkan.':'Rekod pencapaian diarkibkan.'};}
  throw new Error('Rekod pencapaian tidak ditemui.');
}


/* =========================================================
   V3.13 ANALISIS PAJSK KELAS
   Membaca penempatan unit, kehadiran, aktiviti, peserta,
   AJK dan pencapaian untuk menghasilkan ringkasan penyertaan
   kelas. Skor/gred rasmi tidak dikira tanpa konfigurasi rubrik.
========================================================= */
function pajskReportYear_(value){
  if(value instanceof Date && !isNaN(value.getTime())) return Utilities.formatDate(value,Session.getScriptTimeZone(),'yyyy');
  const s=String(value==null?'':value).trim();
  const m=s.match(/^(\d{4})/); if(m) return m[1];
  const d=new Date(s); return isNaN(d.getTime())?'':Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy');
}
function pajskReportDate_(value){
  if(!value) return '';
  if(value instanceof Date && !isNaN(value.getTime())) return Utilities.formatDate(value,Session.getScriptTimeZone(),'yyyy-MM-dd');
  const s=String(value).trim(); const m=s.match(/^(\d{4}-\d{2}-\d{2})/); if(m) return m[1];
  const d=new Date(s); return isNaN(d.getTime())?s.slice(0,10):Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM-dd');
}
function pajskReportCategory_(value){
  const v=String(value||'').trim().toUpperCase().replace(/\s*\/\s*/g,' / ').replace(/\s+/g,' ');
  if(v.includes('BERUNIFORM')) return 'UNIT BERUNIFORM';
  if(v==='KELAB'||v.includes('PERSATUAN')) return 'KELAB / PERSATUAN';
  // Rumah Sukan mesti diperiksa sebelum SUKAN / PERMAINAN kerana
  // teks "RUMAH SUKAN" turut mengandungi perkataan "SUKAN".
  if(v==='RUMAH SUKAN'||v==='RUMAH') return 'RUMAH SUKAN';
  if(v==='SUKAN'||v.includes('SUKAN / PERMAINAN')||v.includes('PERMAINAN')) return 'SUKAN / PERMAINAN';
  return v;
}
function pajskReportIsActive_(row){
  const st=String(row&&row.STATUS!=null?row.STATUS:'AKTIF').trim().toUpperCase();
  return !st || st==='AKTIF';
}
function pajskReportSecureError_(shName){
  return new Error('Helaian '+shName+' belum wujud atau header data tidak tersedia. Semak struktur Google Sheets tanpa menjalankan setup yang memadam data.');
}
function getPajskClassReportSecure_(p){
  const session=getSession_(p.token);
  if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(session.ROLE)) throw new Error('Akses ditolak. Modul ini hanya untuk ADMIN dan GURU.');
  const year=String(p.tahun||new Date().getFullYear()).trim();
  if(!/^\d{4}$/.test(year) || Number(year)<2000 || Number(year)>2100) throw new Error('Tahun PAJSK tidak sah.');
  // Analisis PAJSK ialah paparan keseluruhan murid aktif untuk ADMIN dan GURU.
  // Pemilihan kelas dibuat di frontend hanya apabila pengguna menekan Cetak Kelas.
  // Pemetaan KELAS_GURU tidak diperlukan untuk modul ini.
  const requestedClassForPrint=String(p.kelas||'').trim(); // diterima bagi keserasian API; tidak mengehadkan data paparan
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const sheetNames=[SHEETS.MURID,SHEETS.UNIT,SHEETS.PLACEMENT,SHEETS.ACTIVITY,SHEETS.PARTICIPANTS,SHEETS.ACHIEVEMENT,SHEETS.ATTENDANCE,SHEETS.AJK];
  const missing=sheetNames.filter(n=>!ss.getSheetByName(n));
  if(missing.length) throw new Error('Helaian yang diperlukan tidak lengkap: '+missing.join(', ')+'.');
  // Semua menu Analisis mesti memaparkan data keseluruhan, tanpa bergantung pada
  // pilihan unit Guru. Pemilihan unit hanya mengehadkan ruang kerja Unit.
  const assignedUnitIds=session.ROLE==='PENYELARAS'?new Set(getAccessibleUnitIds_(session)):null;
  let studentsAll=sheetObjects_(ss.getSheetByName(SHEETS.MURID)).filter(m=>pajskReportIsActive_(m)&&String(m.NO_KP||'').trim()&&String(m.NAMA||'').trim());
  const years=new Set([String(new Date().getFullYear()),year]);
  const unitsAll=sheetObjects_(ss.getSheetByName(SHEETS.UNIT)).filter(u=>!assignedUnitIds||assignedUnitIds.has(String(u.UNIT_ID||'')));
  const placementsAll=sheetObjects_(ss.getSheetByName(SHEETS.PLACEMENT)).filter(r=>!assignedUnitIds||assignedUnitIds.has(String(r.UNIT_ID||'')));
  const activitiesAll=sheetObjects_(ss.getSheetByName(SHEETS.ACTIVITY));
  const achievementAll=sheetObjects_(ss.getSheetByName(SHEETS.ACHIEVEMENT)).filter(r=>{if(!assignedUnitIds)return true;const unitId=String(r.UNIT_ID||'').trim();return unitId?assignedUnitIds.has(unitId):String(r.CREATED_BY||'').trim().toLowerCase()===String(session.USERNAME||'').trim().toLowerCase();});
  const attendanceAll=sheetObjects_(ss.getSheetByName(SHEETS.ATTENDANCE)).filter(r=>!assignedUnitIds||assignedUnitIds.has(String(r.UNIT_ID||'')));
  const ajkAll=sheetObjects_(ss.getSheetByName(SHEETS.AJK)).filter(r=>!assignedUnitIds||assignedUnitIds.has(String(r.UNIT_ID||'')));
  unitsAll.forEach(r=>{const y=pajskReportYear_(r.TAHUN);if(y)years.add(y);});
  placementsAll.forEach(r=>{const y=pajskReportYear_(r.TAHUN);if(y)years.add(y);});
  activitiesAll.forEach(r=>{const y=pajskReportYear_(r.TAHUN)||pajskReportYear_(r.TARIKH);if(y)years.add(y);});
  achievementAll.forEach(r=>{const y=pajskReportYear_(r.TAHUN)||pajskReportYear_(r.TARIKH);if(y)years.add(y);});
  const units=unitsAll.filter(u=>pajskReportYear_(u.TAHUN)===year&&pajskReportIsActive_(u));
  const unitMap={};unitsAll.forEach(u=>{const id=String(u.UNIT_ID||'').trim();if(id)unitMap[id]=u;});
  const unitByYear={};units.forEach(u=>{const id=String(u.UNIT_ID||'').trim();if(id)unitByYear[id]=u;});
  const placements=placementsAll.filter(r=>pajskReportYear_(r.TAHUN)===year&&pajskReportIsActive_(r));
  if(assignedUnitIds){const inScopeKps=new Set(placements.map(r=>String(r.NO_KP||'').trim()).filter(Boolean));studentsAll=studentsAll.filter(m=>inScopeKps.has(String(m.NO_KP||'').trim()));}
  const classes=[...new Set(studentsAll.map(m=>String(m.KELAS||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ms',{numeric:true,sensitivity:'base'}));
  const placementByKp={};
  placements.forEach(r=>{
    const kp=String(r.NO_KP||'').trim(),id=String(r.UNIT_ID||'').trim(),unit=unitByYear[id];
    if(!kp||!unit)return;
    if(!placementByKp[kp])placementByKp[kp]=[];
    if(!placementByKp[kp].some(x=>String(x.UNIT_ID)===id)) placementByKp[kp].push({UNIT_ID:id,NAMA_UNIT:String(unit.NAMA_UNIT||''),KATEGORI:pajskReportCategory_(unit.KATEGORI),GURU_PENASIHAT:String(unit.GURU_PENASIHAT||'')});
  });
  const activities=activitiesAll.filter(a=>{
    const y=pajskReportYear_(a.TAHUN)||pajskReportYear_(a.TARIKH);
    return String(a.AKTIVITI_ID||'').trim() && y===year;
  });
  const activityMap={};activities.forEach(a=>activityMap[String(a.AKTIVITI_ID||'')]=a);
  const participantRows=sheetObjects_(ss.getSheetByName(SHEETS.PARTICIPANTS)).filter(r=>pajskReportIsActive_(r));
  const participantByKp={};
  participantRows.forEach(r=>{
    const kp=String(r.NO_KP||'').trim(),id=String(r.AKTIVITI_ID||'').trim(),a=activityMap[id];
    if(!kp||!id||!a)return;
    if(!participantByKp[kp])participantByKp[kp]=[];
    if(!participantByKp[kp].some(x=>x.AKTIVITI_ID===id)) participantByKp[kp].push({AKTIVITI_ID:id,PERANAN:String(r.PERANAN||'PESERTA')});
  });
  const achievements=achievementAll.filter(r=>pajskReportIsActive_(r)&&pajskReportYear_(r.TAHUN||r.TARIKH)===year&&String(r.NO_KP||'').trim());
  const achievementByKp={};
  achievements.forEach(r=>{
    const kp=String(r.NO_KP||'').trim();if(!achievementByKp[kp])achievementByKp[kp]=[];
    achievementByKp[kp].push({PENCAPAIAN_ID:String(r.PENCAPAIAN_ID||''),AKTIVITI_ID:String(r.AKTIVITI_ID||''),NAMA_PENCAPAIAN:String(r.NAMA_PENCAPAIAN||''),KATEGORI:pajskReportCategory_(r.KATEGORI_PENYERTAAN||''),KATEGORI_PENYERTAAN:String(r.KATEGORI_PENYERTAAN||''),TAJUK_PENGLIBATAN:String(r.TAJUK_PENGLIBATAN||''),UNIT_ID:String(r.UNIT_ID||''),PERINGKAT:String(r.PERINGKAT||''),KEDUDUKAN:String(r.KEDUDUKAN||''),TARIKH:pajskReportDate_(r.TARIKH),TAHUN:pajskReportYear_(r.TAHUN||r.TARIKH)});
  });
  const attendanceByKpUnit={};
  attendanceAll.forEach(r=>{
    if(pajskReportYear_(r.TAHUN||r.TARIKH)!==year)return;
    const kp=String(r.NO_KP||'').trim(),unitId=String(r.UNIT_ID||'').trim();if(!kp||!unitId)return;
    const key=kp+'|'+unitId;if(!attendanceByKpUnit[key])attendanceByKpUnit[key]={hadir:0,total:0};
    const x=attendanceByKpUnit[key];x.total++;
    const status=String(r.STATUS||'').trim().toUpperCase();
    if(status==='HADIR')x.hadir++;
  });
  const ajkByKpUnit={};
  ajkAll.forEach(r=>{
    if(pajskReportYear_(r.TAHUN)!==year||!pajskReportIsActive_(r))return;
    const kp=String(r.NO_KP||'').trim(),unitId=String(r.UNIT_ID||'').trim();if(!kp||!unitId)return;
    const key=kp+'|'+unitId;if(!ajkByKpUnit[key])ajkByKpUnit[key]=[];
    ajkByKpUnit[key].push(String(r.JAWATAN||'AJK'));
  });
  const students=studentsAll.slice().sort((a,b)=>String(a.KELAS||'').localeCompare(String(b.KELAS||''),'ms',{numeric:true,sensitivity:'base'})||String(a.NAMA||'').localeCompare(String(b.NAMA||''),'ms',{sensitivity:'base'}));
  const categoryKeys=['KELAB / PERSATUAN','UNIT BERUNIFORM','SUKAN / PERMAINAN'];
  const data=students.map(m=>{
    const kp=String(m.NO_KP||'').trim();
    const studentPlacements=placementByKp[kp]||[];
    const categories={};
    categoryKeys.forEach(cat=>{
      categories[cat]=studentPlacements.filter(u=>u.KATEGORI===cat).map(u=>{
        const att=attendanceByKpUnit[kp+'|'+u.UNIT_ID]||{hadir:0,total:0};
        return {UNIT_ID:u.UNIT_ID,NAMA_UNIT:u.NAMA_UNIT,GURU_PENASIHAT:u.GURU_PENASIHAT,JAWATAN:(ajkByKpUnit[kp+'|'+u.UNIT_ID]||[]).join(', '),HADIR:Number(att.hadir||0),JUMLAH_KEHADIRAN:Number(att.total||0),PERATUS_KEHADIRAN:att.total?Math.round(att.hadir/att.total*100):null};
      });
    });
    const achs=achievementByKp[kp]||[];
    const partRows=participantByKp[kp]||[];
    const evMap={};
    partRows.forEach(pr=>{
      const a=activityMap[pr.AKTIVITI_ID];if(!a)return;
      const linkedAch=achs.filter(x=>x.AKTIVITI_ID===pr.AKTIVITI_ID);
      let category='ACARA / PENYERTAAN',unitName='';
      const achWithCategory=linkedAch.find(x=>categoryKeys.includes(x.KATEGORI));
      if(achWithCategory){category=achWithCategory.KATEGORI;unitName=(unitByYear[achWithCategory.UNIT_ID]||{}).NAMA_UNIT||'';}
      else{
        const matchUnits=studentPlacements.filter(u=>u.GURU_PENASIHAT&&u.GURU_PENASIHAT===String(a.NO_GURU||''));
        const uniqueCats=[...new Set(matchUnits.map(u=>u.KATEGORI).filter(c=>categoryKeys.includes(c)))];
        if(uniqueCats.length===1){category=uniqueCats[0];unitName=matchUnits.find(u=>u.KATEGORI===category).NAMA_UNIT;}
      }
      evMap[pr.AKTIVITI_ID]={AKTIVITI_ID:pr.AKTIVITI_ID,NAMA_AKTIVITI:String(a.NAMA_AKTIVITI||'Aktiviti tanpa nama'),TARIKH:pajskReportDate_(a.TARIKH),TEMPAT:String(a.TEMPAT||''),PERINGKAT:String(a.PERINGKAT||''),NO_GURU:String(a.NO_GURU||''),PERANAN:pr.PERANAN||'PESERTA',KATEGORI:category,NAMA_UNIT:String(unitName||''),PENCAPAIAN:linkedAch.map(x=>({PENCAPAIAN_ID:x.PENCAPAIAN_ID,NAMA_PENCAPAIAN:x.NAMA_PENCAPAIAN,PERINGKAT:x.PERINGKAT,KEDUDUKAN:x.KEDUDUKAN,TARIKH:x.TARIKH,KATEGORI:x.KATEGORI,KATEGORI_PENYERTAAN:x.KATEGORI_PENYERTAAN,TAJUK_PENGLIBATAN:x.TAJUK_PENGLIBATAN,UNIT_ID:x.UNIT_ID}))};
    });
    achs.forEach(x=>{
      const id=String(x.AKTIVITI_ID||'');if(id&&evMap[id])return;
      const a=activityMap[id]||{};const unit=unitByYear[x.UNIT_ID]||{};
      const category=categoryKeys.includes(x.KATEGORI)?x.KATEGORI:pajskReportCategory_(unit.KATEGORI)||'ACARA / PENYERTAAN';
      const key=id||('ACH:'+x.PENCAPAIAN_ID);
      evMap[key]={AKTIVITI_ID:id,NAMA_AKTIVITI:String(a.NAMA_AKTIVITI||x.NAMA_PENCAPAIAN||'Pencapaian direkod'),TARIKH:x.TARIKH||pajskReportDate_(a.TARIKH),TEMPAT:String(a.TEMPAT||''),PERINGKAT:String(x.PERINGKAT||a.PERINGKAT||''),NO_GURU:String(a.NO_GURU||''),PERANAN:'PENCAPAIAN',KATEGORI:category,NAMA_UNIT:String(unit.NAMA_UNIT||''),PENCAPAIAN:[{PENCAPAIAN_ID:x.PENCAPAIAN_ID,NAMA_PENCAPAIAN:x.NAMA_PENCAPAIAN,PERINGKAT:x.PERINGKAT,KEDUDUKAN:x.KEDUDUKAN,TARIKH:x.TARIKH,KATEGORI:x.KATEGORI,KATEGORI_PENYERTAAN:x.KATEGORI_PENYERTAAN,TAJUK_PENGLIBATAN:x.TAJUK_PENGLIBATAN,UNIT_ID:x.UNIT_ID}]};
    });
    const events=Object.values(evMap).sort((a,b)=>String(b.TARIKH||'').localeCompare(String(a.TARIKH||''))||String(a.NAMA_AKTIVITI||'').localeCompare(String(b.NAMA_AKTIVITI||''),'ms'));
    const uniqueAchCount=achs.length;
    const completeCategoryCount=categoryKeys.filter(c=>(categories[c]||[]).length>0).length;
    return {
      NO_KP:kp,NAMA:String(m.NAMA||''),JANTINA:String(m.JANTINA||''),TINGKATAN:String(m.TINGKATAN||''),KELAS:String(m.KELAS||''),
      CATEGORIES:categories,EVENTS:events,ACTIVITY_COUNT:events.length,ACHIEVEMENT_COUNT:uniqueAchCount,
      CATEGORY_COUNT:completeCategoryCount,JUMLAH_REKOD:events.length,
      HAS_EVENT:events.length>0,NEEDS_REVIEW:completeCategoryCount<3||events.length===0
    };
  });
  logAction_('getPajskClassReport',{year,kelas:'SEMUA KELAS',printFilterRequested:requestedClassForPrint||'',studentCount:data.length,by:session.USERNAME,role:session.ROLE});
  return {ok:true,year,kelas:'',classes,years:[...years].sort((a,b)=>Number(b)-Number(a)),data,user:{username:session.USERNAME,role:session.ROLE},scoreNote:'Skor dan gred PAJSK rasmi tidak dikira dalam endpoint ini kerana rubrik pemarkahan tidak wujud dalam struktur data semasa.'};
}


/* =========================================================
   SYSTEM BRANDING SETTINGS — ADMIN ONLY WRITES
   Settings and logo chunks live in separate sheets. The main logo is
   stored in small chunks to avoid oversized Apps Script GET URLs.
========================================================= */
function getSystemSettingsSheet_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();let sh=ss.getSheetByName(SHEETS.SYSTEM_SETTINGS);
  if(!sh){sh=ss.insertSheet(SHEETS.SYSTEM_SETTINGS);sh.getRange(1,1,1,3).setValues([['SETTING_KEY','SETTING_VALUE','UPDATED_AT']]);sh.setFrozenRows(1);}
  else if(sh.getLastRow()===0){sh.getRange(1,1,1,3).setValues([['SETTING_KEY','SETTING_VALUE','UPDATED_AT']]);sh.setFrozenRows(1);}
  return sh;
}
function getSystemLogoChunksSheet_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();let sh=ss.getSheetByName(SHEETS.SYSTEM_LOGO_CHUNKS);
  if(!sh){sh=ss.insertSheet(SHEETS.SYSTEM_LOGO_CHUNKS);sh.getRange(1,1,1,7).setValues([['UPLOAD_ID','CHUNK_INDEX','CHUNK_TOTAL','MIME_TYPE','DATA_CHUNK','CREATED_BY','CREATED_AT']]);sh.setFrozenRows(1);}
  else if(sh.getLastRow()===0){sh.getRange(1,1,1,7).setValues([['UPLOAD_ID','CHUNK_INDEX','CHUNK_TOTAL','MIME_TYPE','DATA_CHUNK','CREATED_BY','CREATED_AT']]);sh.setFrozenRows(1);}
  return sh;
}
function getSystemSettingMap_(sh){
  const out={};if(!sh||sh.getLastRow()<2)return out;
  const data=sh.getRange(1,1,sh.getLastRow(),Math.max(3,sh.getLastColumn())).getValues();
  for(let i=1;i<data.length;i++){const k=String(data[i][0]||'').trim();if(k)out[k]=String(data[i][1]??'');}
  return out;
}
function upsertSystemSetting_(sh,key,value){
  const last=sh.getLastRow();
  if(last>=2){const data=sh.getRange(2,1,last-1,1).getDisplayValues();for(let i=0;i<data.length;i++)if(String(data[i][0])===key){sh.getRange(i+2,2,1,2).setValues([[String(value??''),new Date()]]);return;}}
  sh.getRange(sh.getLastRow()+1,1,1,3).setValues([[key,String(value??''),new Date()]]);
}
function cleanSystemLogoRows_(sh,keepUploadId){
  if(!sh||sh.getLastRow()<2)return;const data=sh.getRange(2,1,sh.getLastRow()-1,7).getValues();
  for(let i=data.length-1;i>=0;i--)if(!keepUploadId||String(data[i][0]||'')!==String(keepUploadId))sh.deleteRow(i+2);
}
function getAppSettingsSecure_(token){
  const session=getSession_(token);if(!['ADMIN','GURU','PENYELARAS','PENTADBIR'].includes(String(session.ROLE||'')))throw new Error('Akses ditolak.');
  const ss=SpreadsheetApp.getActiveSpreadsheet(),settingsSh=ss.getSheetByName(SHEETS.SYSTEM_SETTINGS),map=getSystemSettingMap_(settingsSh);
  const appName=String(map.APP_NAME||'e-KOSSTA').trim()||'e-KOSSTA';
  const uploadId=String(map.SCHOOL_LOGO_UPLOAD_ID||'').trim(),mime=String(map.SCHOOL_LOGO_MIME||'image/png').trim();let schoolLogoDataUrl='';
  if(uploadId){
    const sh=ss.getSheetByName(SHEETS.SYSTEM_LOGO_CHUNKS);
    if(sh&&sh.getLastRow()>1){
      const rows=sh.getRange(2,1,sh.getLastRow()-1,7).getValues().filter(r=>String(r[0]||'')===uploadId);
      if(rows.length){const total=Number(rows[0][2]);if(Number.isInteger(total)&&total>=1&&total<=20&&rows.length===total){rows.sort((a,b)=>Number(a[1])-Number(b[1]));const valid=rows.every((r,i)=>Number(r[1])===i+1&&Number(r[2])===total&&String(r[3])===mime);const b64=rows.map(r=>String(r[4]||'')).join('');if(valid&&b64.length<=44000&&/^[A-Za-z0-9+/=]+$/.test(b64))schoolLogoDataUrl='data:'+mime+';base64,'+b64;}}
    }
  }
  return {ok:true,settings:{appName:appName,schoolLogoDataUrl:schoolLogoDataUrl,schoolLogoMime:mime,hasSchoolLogo:!!schoolLogoDataUrl}};
}
function saveSystemLogoChunkSecure_(p){
  const session=requireAdmin_(p.token),uploadId=String(p.uploadId||'').trim(),index=Number(p.chunkIndex),total=Number(p.chunkTotal),mime=String(p.mimeType||'image/jpeg'),data=String(p.dataChunk||'');
  if(!/^LOGO-[A-Za-z0-9-]{5,80}$/.test(uploadId))throw new Error('ID muat naik logo tidak sah.');
  if(!['image/jpeg','image/png','image/webp'].includes(mime))throw new Error('Format logo tidak disokong.');
  if(!Number.isInteger(index)||!Number.isInteger(total)||total<1||total>20||index<1||index>total)throw new Error('Nombor bahagian logo tidak sah.');
  if(!data||data.length>3000||!/^[A-Za-z0-9+/=]+$/.test(data))throw new Error('Data bahagian logo tidak sah.');
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const sh=getSystemLogoChunksSheet_(),values=sh.getDataRange().getValues();let rowNo=0;
    for(let i=1;i<values.length;i++)if(String(values[i][0]||'')===uploadId){if(Number(values[i][2])!==total||String(values[i][3])!==mime)throw new Error('Bahagian logo tidak konsisten.');if(Number(values[i][1])===index)rowNo=i+1;}
    const row=[uploadId,index,total,mime,data,String(session.USERNAME||''),new Date()];
    if(rowNo)sh.getRange(rowNo,1,1,row.length).setValues([row]);else sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);
    return {ok:true,uploadId:uploadId,chunkIndex:index,chunkTotal:total};
  }finally{lock.releaseLock();}
}
function saveAppSettingsSecure_(p){
  const session=requireAdmin_(p.token),appName=String(p.appName||'').replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim(),logoAction=String(p.logoAction||'KEEP').toUpperCase(),uploadId=String(p.uploadId||'').trim();
  if(appName.length<2||appName.length>60)throw new Error('Nama aplikasi mestilah antara 2 hingga 60 aksara.');
  if(!['KEEP','CLEAR','REPLACE'].includes(logoAction))throw new Error('Tindakan logo tidak sah.');
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const ss=SpreadsheetApp.getActiveSpreadsheet(),settings=getSystemSettingsSheet_(),chunks=ss.getSheetByName(SHEETS.SYSTEM_LOGO_CHUNKS);
    let finalUploadId='',finalMime='';
    const current=getSystemSettingMap_(settings);
    if(logoAction==='KEEP'){finalUploadId=String(current.SCHOOL_LOGO_UPLOAD_ID||'');finalMime=String(current.SCHOOL_LOGO_MIME||'image/png');}
    if(logoAction==='REPLACE'){
      if(!/^LOGO-[A-Za-z0-9-]{5,80}$/.test(uploadId))throw new Error('ID muat naik logo tidak sah.');
      if(!chunks||chunks.getLastRow()<2)throw new Error('Logo belum selesai dimuat naik.');
      const rows=chunks.getRange(2,1,chunks.getLastRow()-1,7).getValues().filter(r=>String(r[0]||'')===uploadId);
      if(!rows.length)throw new Error('Data logo tidak ditemui. Muat naik semula logo.');
      const total=Number(rows[0][2]),mime=String(rows[0][3]||'');
      if(!Number.isInteger(total)||total<1||total>20||rows.length!==total)throw new Error('Muat naik logo belum lengkap.');
      rows.sort((a,b)=>Number(a[1])-Number(b[1]));if(!rows.every((r,i)=>Number(r[1])===i+1&&Number(r[2])===total&&String(r[3])===mime))throw new Error('Bahagian logo tidak lengkap atau tidak konsisten.');
      const joined=rows.map(r=>String(r[4]||'')).join('');if(!joined||joined.length>44000||!/^[A-Za-z0-9+/=]+$/.test(joined))throw new Error('Saiz data logo tidak sah.');
      finalUploadId=uploadId;finalMime=mime;
    }
    upsertSystemSetting_(settings,'APP_NAME',appName);
    upsertSystemSetting_(settings,'SCHOOL_LOGO_UPLOAD_ID',finalUploadId);
    upsertSystemSetting_(settings,'SCHOOL_LOGO_MIME',finalUploadId?finalMime:'');
    if(logoAction==='CLEAR')cleanSystemLogoRows_(chunks,'');else cleanSystemLogoRows_(chunks,finalUploadId);
    logAction_('saveAppSettings',{appName:appName,logoAction:logoAction,by:session.USERNAME,role:session.ROLE});
    return {ok:true,message:'Tetapan sistem berjaya disimpan.',appName:appName,hasSchoolLogo:!!finalUploadId};
  }finally{lock.releaseLock();}
}
