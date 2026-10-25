e-KOSSTA Terminal UI — UI-only patch

Kandungan: salinan fail frontend asal (nama distandardkan) + terminal-theme.css.

Perubahan:
- Menambah terminal-theme.css selepas styles.css dan material-ui.css.
- Mengemas kini pautan fon kepada Space Grotesk dan JetBrains Mono.
- Menyesuaikan warna untuk html.dark yang memang digunakan oleh app.js.
- Tidak mengubah app.js, ID elemen, fungsi, event handler, aliran login atau backend GAS.
- Sidebar: struktur dan menu tidak diubah; hanya gaya visual diselaraskan dengan tema.

Pemasangan: buat backup dahulu. Uji folder ini sebagai salinan berasingan; jangan overwrite fail production sebelum menguji login, navigasi, borang, data, laporan dan surat dalam Light/Dark.

Nota: ini ialah patch UI berasaskan fail frontend yang diberikan. Ia tidak mengandungi Code.gs dan tidak membuktikan integrasi backend.
