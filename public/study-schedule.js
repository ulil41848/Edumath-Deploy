(function () {
  const byId = id => document.getElementById(id);
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';
  const semester = byId('study-semester');
  const material = byId('study-material');
  const start = byId('study-starts-at');
  const email = byId('study-reminder-email');
  const duration = byId('study-duration');
  const reminder = byId('study-reminder-minutes');
  const status = byId('study-schedule-status');
  const list = byId('study-schedule-list');
  if (!semester || !material || !start || !list) return;
  const materials = {
    1: ['Penjumlahan','Pengurangan','Soal Cerita Penjumlahan dan Pengurangan'],
    2: ['Perkalian','Pembagian','Soal Cerita Perkalian dan Pembagian']
  };
  const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
  defaultDate.setMinutes(Math.ceil(defaultDate.getMinutes()/5)*5,0,0);
  start.value = new Date(defaultDate.getTime()-defaultDate.getTimezoneOffset()*60000).toISOString().slice(0,16);
  function updateMaterials() {
    const current = material.value;
    material.innerHTML = materials[semester.value].map(m => `<option>${m}</option>`).join('');
    if (materials[semester.value].includes(current)) material.value = current;
  }
  semester.addEventListener('change', updateMaterials); updateMaterials();
  function say(message, bad=false) { status.textContent=message; status.style.color=bad?'#bd3c48':'#61748e'; }
  async function loadSchedules() {
    try {
      const r=await fetch('/study-schedules',{headers:{'Accept':'application/json','X-Requested-With':'XMLHttpRequest'}});
      if (r.status===401 || r.redirected) { list.innerHTML='<p class="jd-desc">Silakan masuk ke akun EduMath untuk menyimpan dan melihat jadwal.</p>'; return; }
      const data=await r.json(); if(!r.ok) throw new Error(data.message||'Jadwal belum dapat dimuat.');
      if(!data.schedules.length){list.innerHTML='<p class="jd-desc">Belum ada jadwal belajar tersimpan.</p>';return;}
      list.innerHTML=data.schedules.map(s=>`<div class="study-schedule-item"><div><strong>${escapeHtml(s.material_title)} · Semester ${s.semester}</strong><small>${new Date(s.starts_at).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})} · ${s.duration_minutes} menit</small><small>Pengingat: ${escapeHtml(s.reminder_email)} · ${s.reminder_minutes} menit sebelumnya</small></div><button type="button" class="study-schedule-delete" data-delete="${s.id}">Hapus</button></div>`).join('');
    } catch(e) { list.innerHTML='<p class="jd-desc">Jadwal membutuhkan koneksi ke server. Pastikan sudah masuk dan migrasi database dijalankan.</p>'; }
  }
  function escapeHtml(v) { return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  byId('study-schedule-save')?.addEventListener('click',async()=>{
    if(!start.value||!email.value.trim()){say('Isi tanggal, jam mulai, dan email pengingat terlebih dahulu.',true);return;}
    const date=new Date(start.value); if(Number.isNaN(date.getTime())||date<=new Date()){say('Pilih tanggal dan waktu di masa mendatang.',true);return;}
    say('Menyimpan jadwal…');
    try {
      const r=await fetch('/study-schedules',{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json','X-CSRF-TOKEN':csrf(),'X-Requested-With':'XMLHttpRequest'},body:JSON.stringify({material_title:material.value,semester:Number(semester.value),starts_at:start.value.replace('T',' ')+':00',duration_minutes:Number(duration.value),reminder_email:email.value.trim(),reminder_minutes:Number(reminder.value)})});
      const data=await r.json(); if(!r.ok) { const errors=data.errors?Object.values(data.errors).flat().join(' '):data.message; throw new Error(errors||'Gagal menyimpan jadwal.'); }
      say('Jadwal berhasil disimpan. Pastikan scheduler dan konfigurasi email Laravel aktif agar pengingat terkirim.'); await loadSchedules();
    } catch(e) { say(e.message||'Tidak dapat menyimpan jadwal. Pastikan sudah masuk ke EduMath.',true); }
  });
  list.addEventListener('click',async e=>{const b=e.target.closest('[data-delete]');if(!b)return;if(!confirm('Hapus jadwal belajar ini?'))return;try{const r=await fetch('/study-schedules/'+b.dataset.delete,{method:'DELETE',headers:{'Accept':'application/json','X-CSRF-TOKEN':csrf(),'X-Requested-With':'XMLHttpRequest'}});const d=await r.json();if(!r.ok)throw new Error(d.message||'Gagal menghapus jadwal.');await loadSchedules();say('Jadwal dihapus.');}catch(err){say(err.message,true);}});
  document.addEventListener('click',e=>{if(e.target.closest('.rd-category')){setTimeout(loadSchedules,100);}});
  loadSchedules();
})();
