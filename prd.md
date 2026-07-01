# Product Requirements Document (PRD)

## **Sistem Absensi Digital SMKN 2 SURAKARTA**

---

## 1. Identitas Visual & Branding

Website ini dirancang dengan tema **"Professional-Aesthetic"**. Menggabungkan kesan formal institusi pendidikan dengan sentuhan modern, bersih, dan _eye-catching_.

### **Palet Warna**

| Kategori          | Warna                      | Implementasi                                               |
| :---------------- | :------------------------- | :--------------------------------------------------------- |
| **Dominan**       | `Clean White`              | Latar belakang, navigasi, dan area konten utama.           |
| **Aksen Utama**   | `Sky Blue`                 | Efek hover pada link dan elemen interaktif kecil.          |
| **Teks**          | `Dark Navy`                | Tipografi utama agar kontras dan mudah dibaca.             |
| **Aksen Estetik** | **Gradasi Purple to Pink** | Khusus untuk tombol (Button) utama agar terlihat menonjol. |

### **Tipografi**

- **Font:** Sans Serif Modern (e.g., _Inter_, _Geist_, atau _Plus Jakarta Sans_).
- **Kesan:** _Simple tapi kompleks_—bersih di permukaan namun memiliki struktur yang kuat.

---

## 2. Arsitektur Landing Page

Halaman utama berfungsi sebagai gerbang masuk (Gateway) dengan desain _Hero Section_ yang elegan.

- **Greeting Utama:**
    > **"Selamat Datang, Silahkan Akses Absensi SMKN 2 SURAKARTA"**
    > _(Ditampilkan di tengah atas dengan tipografi yang bold dan selaras dengan tema biru)._
- **Role Selector:**
  Tersedia 3 kartu pilihan peran dengan efek **Glassmorphism** (transparan halus):
    1.  **Admin:** Icon Kunci/Shield + Tombol Gradasi Ungu.
    2.  **Guru:** Icon Buku/Absen + Tombol Gradasi Ungu.
    3.  **Siswa:** Icon Topi Toga/User + Tombol Gradasi Ungu.
- **Latar Belakang:** Menggunakan gradasi biru tua ke biru muda untuk memberikan kedalaman visual (depth).

---

## 3. Spesifikasi Fungsional

### **3.1. Modul Admin (Pusat Kendali)**

Admin memegang otoritas penuh terhadap data master.

- **Manajemen Data (CRUD):** Tambah, Lihat, Edit, dan Hapus data Guru, Siswa, Kelas, dan Jurusan.
- **Smart Form Logic:** Saat Admin selesai melakukan _submit_ data baru, formulir akan **otomatis dibersihkan (clear)** sehingga Admin tidak perlu menghapus inputan sebelumnya secara manual.
- **Fitur Koreksi:** Tabel data dilengkapi tombol edit untuk mempermudah perbaikan kesalahan input.

### **3.2. Modul Guru (Input Absensi)**

Fokus pada kecepatan dan kemudahan akses di dalam kelas.

- **Filter Kelas:** Dropdown pilihan kelas. Sistem akan secara otomatis melakukan _query_ untuk menampilkan siswa yang terdaftar di kelas tersebut saja.
- **Input Status:** Pilihan status kehadiran menggunakan tombol yang mudah diklik (Hadir, Izin, Sakit, Alfa, Dispensasi).
- **Auto-Timestamp:** Sistem mencatat waktu dan tanggal absensi secara otomatis saat data disimpan.

### **3.3. Modul Siswa (Monitoring)**

- **Login NIS:** Menggunakan NIS sebagai kredensial dengan validasi format.
- **Dashboard Riwayat:** Tabel transparan yang menampilkan rekam jejak kehadiran pribadi secara rapi.

---

## 4. Aturan Data & Validasi Teknis

| Komponen            | Aturan / Logika                                                                                                    |
| :------------------ | :----------------------------------------------------------------------------------------------------------------- |
| **Format NIS**      | **XX.XXXXXX** (Contoh: 24.012502). Menggunakan RegEx: `^[0-9]{2}\.[0-9]{6}$`.                                      |
| **Input Masking**   | Titik (`.`) akan muncul secara otomatis saat user mengetik angka ke-3 pada kolom NIS.                              |
| **Relasi Database** | Tabel Siswa memiliki _Foreign Key_ ke Tabel Kelas. Data absensi terhubung secara relasional untuk integritas data. |
| **Security**        | Autentikasi Admin dan Guru menggunakan enkripsi password yang aman.                                                |

---

## 5. Kebutuhan Non-Fungsional (UX/UI)

- **Responsivitas:** Website harus _mobile-friendly_, terutama untuk halaman Guru agar lancar digunakan via smartphone.
- **Fokus Input:** Fitur _autofocus_ pada kolom pertama saat membuka form input data.
- **Feedback:** Munculnya _Toast Notification_ berwarna biru muda setiap kali aksi (simpan/hapus/edit) berhasil dilakukan.
- **Estetika Kreator:** Desain sederhana namun detail, mencerminkan sentuhan kreatif remaja perempuan yang teliti dan modern.

---

## 6. Rencana Implementasi

1.  **Phase 1:** Perancangan UI/UX (Figma) dengan fokus pada gradasi ungu-pink.
2.  **Phase 2:** Pembangunan struktur Database relasional.
3.  **Phase 4:** Pengembangan Backend (Auth & CRUD) menggunakan teknologi efisien (seperti Laravel atau Next.js).
4.  **Phase 5:** Integrasi Frontend dengan logika _auto-clear form_ dan _filter_ kelas.
5.  **Phase 6:** Testing fungsionalitas dan responsivitas perangkat.
