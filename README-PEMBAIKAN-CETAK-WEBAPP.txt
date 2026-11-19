e-KOSSTA — PEMBAIKAN SEMUA CETAKAN (WEBAPP)
================================================

Perubahan dalam pakej webapp:
- Pratonton PAJSK kelas dan individu kini mempunyai butang kembali dan butang cetak manual.
- Surat kebenaran mempunyai butang kembali.
- Cetakan senarai ahli, kehadiran, kehadiran ahli dan AJK unit mempunyai butang kembali.
- Cetakan laporan baharu dan laporan tersimpan mempunyai butang kembali.
- Cetakan automatik apabila pratonton laporan/PAJSK dibuka dibuang. Pengguna melihat pratonton dahulu dan menekan "Cetak / Simpan PDF" apabila bersedia.
- Gaya toolbar dicergaskan untuk paparan telefon.
- Versi cache Service Worker dinaikkan supaya app.js baharu tidak tersangkut pada cache lama.

PEMASANGAN
1. Buat salinan sandaran repository webapp yang sedang digunakan.
2. Dalam repository GitHub Pages, gantikan app.js dan service-worker.js dengan fail daripada pakej ini.
3. Jangan gantikan fail lain yang tidak berubah dalam projek anda.
4. Commit dan push ke GitHub Pages.
5. Buka e-KOSSTA dan buat hard refresh. Jika cache masih lama, tutup PWA/pelayar dan buka semula; jika perlu unregister Service Worker dan clear site data.

UJIAN WEBAPP
- Analisis PAJSK: cetakan kelas dan individu.
- Surat kebenaran aktiviti.
- Unit: senarai ahli, rekod kehadiran mingguan, kehadiran setiap ahli dan AJK.
- Editor laporan: pratonton/cetakan laporan baharu.
- Laporan tersimpan: cetakan daripada senarai laporan.

Nota: Pakej ini tidak mengubah Code.gs, Google Sheets atau data sekolah.
