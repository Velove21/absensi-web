# Panduan Login — Absensi SMKN 2 Surakarta

## Daftar Isi

1. [Admin](#1-admin)
2. [Guru](#2-guru)
3. [Siswa](#3-siswa)
4. [Flowchart](#4-flowchart)

---

## 1. Admin

| Item | Detail |
|------|--------|
| **Halaman login** | `/` (welcome) atau `/auth/login` |
| **Field login** | Email (`type="email"`) |
| **Contoh** | `admin@admin.com` |
| **Password default** | `password` |
| **Validasi backend** | `email:rfc,dns` |
| **Cara login** | Backend mencari user via `users.email` |
| **Setelah login** | Redirect ke `admin.dashboard` (jika `password_default = false`) |
| **Password default?** | Dicegat `CheckPasswordStatus` → `/password/change` |

### Cara pakai

1. Buka halaman `/` atau `/auth/login`
2. Pilih tab **Admin**
3. Masukkan email (contoh: `admin@admin.com`)
4. Masukkan password: `password`
5. Klik **Masuk**

---

## 2. Guru

| Item | Detail |
|------|--------|
| **Halaman login** | `/` (welcome) atau `/auth/login` |
| **Field login** | NIP (`pattern="^\d{18}$"`) |
| **Contoh** | `197012052003121002` |
| **Password default** | `password` |
| **Validasi backend** | `regex:/^\d{18}$/` |
| **Cara login** | Backend mencari user via relasi `gurus.nip` |
| **Setelah login** | Redirect ke `guru.absensi.index` (jika `password_default = false`) |
| **Password default?** | Dicegat `CheckPasswordStatus` → `/password/change` |

### Cara pakai

1. Buka halaman `/` atau `/auth/login`
2. Pilih tab **Guru**
3. Masukkan NIP 18 digit (contoh: `197012052003121002`)
4. Masukkan password: `password`
5. Klik **Masuk**

---

## 3. Siswa

| Item | Detail |
|------|--------|
| **Halaman login** | `/` (welcome) atau `/auth/login` |
| **Field login** | NIS (`pattern="^\d{2}\.\d{4}$"`) |
| **Contoh** | `24.012472` |
| **Password default** | `password` |
| **Validasi backend** | `regex:/^\d{2}\.\d{4}$/` |
| **Cara login** | Backend mencari user via relasi `siswas.nis` |
| **Setelah login** | Redirect ke `siswa.dashboard` (jika `password_default = false`) |
| **Password default?** | Dicegat `CheckPasswordStatus` → `/password/change` |
| **Lupa sandi?** | Hubungi admin (tidak ada reset password mandiri) |

### Cara pakai

1. Buka halaman `/` atau `/auth/login`
2. Pilih tab **Siswa**
3. Masukkan NIS format `xx.xxxx` (contoh: `24.012472`)
4. Masukkan password: `password`
5. Klik **Masuk**

---

## 4. Flowchart

```
User buka halaman login
    │
    ▼
Pilih role (Admin / Guru / Siswa)
    │
    ▼
Isi field login sesuai role:
  Admin → email
  Guru  → NIP (18 digit)
  Siswa → NIS (xx.xxxx)
    │
    ▼
POST /login
    │
    ├── Validasi LoginRequest — format sesuai role?
    │   └── Tidak → kembali + error
    │
    ├── Rate Limiter — 5x/menit?
    │   └── Terlalu banyak → throttle error
    │
    ├── authenticateUsing — cari user:
    │   Admin → User::where('email', ...)
    │   Guru  → User::whereHas('guru', nip)
    │   Siswa → User::whereHas('siswa', nis)
    │   └── Tidak ditemukan / password salah → kembali + error
    │
    ├── CheckPasswordStatus — password_default == true?
    │   └── Ya → redirect /password/change
    │
    └── LoginResponse — redirect sesuai role
        Admin → /admin/dashboard
        Guru  → /guru/absensi
        Siswa → /siswa/dashboard
```
