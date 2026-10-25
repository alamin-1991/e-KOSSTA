(function(){
  'use strict';
  const root=document.documentElement;
  const toastRegion=document.getElementById('toastRegion');
  function setTheme(theme){root.setAttribute('data-theme',theme);try{localStorage.setItem('ekossta-ui-materials-theme',theme)}catch(_){ }const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=theme==='dark'?'#151313':'#FCFAEE';}
  try{const saved=localStorage.getItem('ekossta-ui-materials-theme');if(saved==='dark'||saved==='light')setTheme(saved)}catch(_){ }
  document.getElementById('themeToggle')?.addEventListener('click',()=>setTheme(root.getAttribute('data-theme')==='dark'?'light':'dark'));
  document.getElementById('themeLight')?.addEventListener('click',()=>setTheme('light'));
  document.getElementById('themeDark')?.addEventListener('click',()=>setTheme('dark'));
  function toast(message){if(!toastRegion)return;const item=document.createElement('div');item.className='ekm-toast';item.innerHTML='<svg aria-hidden="true"><use href="#i-check"/></svg><span></span>';item.querySelector('span').textContent=message;toastRegion.appendChild(item);window.setTimeout(()=>{item.style.opacity='0';item.style.transform='translateY(5px)';window.setTimeout(()=>item.remove(),180)},2600)}
  document.querySelectorAll('.ekm-swatch[data-copy]').forEach(el=>el.addEventListener('click',async()=>{const hex=el.getAttribute('data-copy');try{await navigator.clipboard.writeText(hex);toast('Kod warna '+hex+' disalin.')}catch(_){toast('Kod warna: '+hex)}}));
  document.getElementById('showToast')?.addEventListener('click',()=>toast('Ini ialah contoh notifikasi e-KOSSTA.'));
  document.querySelectorAll('.ekm-tabs [data-tab]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.ekm-tabs [data-tab]').forEach(other=>other.classList.toggle('is-active',other===btn));const content=document.getElementById('tabContent');if(content){const name=btn.textContent.trim();content.innerHTML='';const b=document.createElement('b');b.textContent=name;const p=document.createElement('p');p.textContent='Contoh kandungan bagi tab '+name.toLowerCase()+'. Tab ini hanya demonstrasi komponen.';content.append(b,p)}}));
  document.querySelectorAll('.ekm-segmented button').forEach(btn=>btn.addEventListener('click',()=>{btn.parentElement.querySelectorAll('button').forEach(other=>other.classList.toggle('is-active',other===btn))}));
  document.querySelectorAll('.ekm-pagination button').forEach(btn=>btn.addEventListener('click',()=>{const group=btn.parentElement;const buttons=[...group.querySelectorAll('button')].filter(x=>/^\d+$/.test(x.textContent.trim()));if(!buttons.length)return;let target=btn.textContent.trim();if(target==='‹'||target==='›'){const current=buttons.findIndex(x=>x.classList.contains('is-active'));const next=Math.max(0,Math.min(buttons.length-1,current+(target==='›'?1:-1)));target=buttons[next]?.textContent.trim()}buttons.forEach(x=>x.classList.toggle('is-active',x.textContent.trim()===target));toast('Halaman contoh: '+target)}));
  document.querySelectorAll('.ekm-alert-close').forEach(btn=>btn.addEventListener('click',()=>btn.closest('.ekm-alert')?.remove()));
  document.querySelectorAll('[data-loading]').forEach(btn=>btn.addEventListener('click',()=>{const old=btn.textContent;btn.disabled=true;btn.textContent='Memproses…';setTimeout(()=>{btn.disabled=false;btn.textContent=old},1200)}));
})();
