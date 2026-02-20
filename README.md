# YourVoice - Platform Pelaporan Anonim

YourVoice adalah platform pelaporan anonim yang dirancang untuk memungkinkan siswa menyuarakan aspirasi dan melaporkan masalah tanpa perlu khawatir tentang privasi mereka.

## Fitur Utama

### Untuk Pelapor (Siswa)
- **100% Anonim** - Identitas pelapor tidak pernah disimpan atau dilacak
- **Pantau Status** - Lacak perkembangan laporan menggunakan kode akses unik 12 karakter
- **Unggah Bukti** - Lampirkan bukti pendukung (gambar/video) untuk laporan
- **Respons Cepat** - Tim akan menindaklanjuti dalam waktu 3x24 jam kerja
- **Two Categories**: Bullying dan Ide/ Aspirasi

### Untuk Admin
- **Dashboard Admin** - Kelola dan pantau semua laporan
- **Update Status** - Ubah status laporan (pending → in_progress → resolved → closed)
- **Timeline Management** - Catat setiap tindakan dan perkembangan
- **Evidence Management** - Lihat dan kelola bukti laporan
- **Statistik** - Lihat ringkasan data laporan

## Teknologi yang Digunakan

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4 + CSS Modules
- **Animasi**: Framer Motion
- **Components**: Radix UI Primitives + shadcn/ui
- **Icons**: Lucide React

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT)
- **Storage**: Supabase Storage (untuk bukti laporan)
- **API**: Next.js API Routes

## Struktur Proyek

```
pelaporan-online/
├── SUPABASE_SETUP.sql       # Database schema & setup
├── frontend-client/         # Public frontend (pelaporan)
│   ├── app/
│   │   ├── page.tsx         # Landing page
│   │   ├── lapar/           # Halaman buat laporan
│   │   ├── cek-status/      # Halaman cek status
│   │   └── prosedur/        # Halaman prosedur
│   ├── components/          # Komponen React
│   ├── lib/                 # Utilities & API client
│   └── modules/             # CSS Modules
└── frontend-admin/          # Admin dashboard
    ├── app/
    │   ├── login/           # Halaman login admin
    │   ├── dashboard/       # Dashboard utama
    │   └── reports/         # Kelola laporan
    ├── components/          # Komponen React
    └── lib/                 # Utilities & Supabase client
```

## Persyaratan

- Node.js 18+
- pnpm (recommended) atau npm
- Akun Supabase

## Instalasi

### 1. Setup Supabase

1. Buat project baru di [Supabase](https://supabase.com)
2. Buka SQL Editor
3. Copy isi file `SUPABASE_SETUP.sql` dan paste ke SQL Editor
4. Eksekusi semua query

### 2. Setup Environment Variables

Buat file `.env.local` di masing-masing folder:

**frontend-client/.env.local:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**frontend-admin/.env.local:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Install Dependencies

```bash
# Install frontend-client
cd frontend-client
pnpm install

# Install frontend-admin
cd frontend-admin
pnpm install
```

### 4. Jalankan Development Server

```bash
# Frontend Client (port 3000)
cd frontend-client
pnpm dev

# Frontend Admin (port 3001)
cd frontend-admin
pnpm dev -- -p 3001
```

## Cara Penggunaan

### Untuk Pelapor

1. Buka halaman utama YourVoice
2. Klik "Buat Laporan Anonim"
3. Pilih kategori (Bullying / Ide)
4. Isi judul dan deskripsi laporan
5. (Opsional) Unggah bukti pendukung
6. Submit laporan dan simpan kode akses 12 karakter
7. Gunakan kode akses untuk cek status di kemudian hari

### Untuk Admin

1. Buka `/login` di frontend-admin
2. Login dengan kredensial admin
3. Di dashboard, lihat semua laporan masuk
4. Klik laporan untuk melihat detail
5. Update status dan tambahkan progres
6. Catat setiap tindakan di timeline

## Database Schema

### Tabel Utama

| Tabel | Deskripsi |
|-------|-----------|
| `admin_users` | Data admin/petugas |
| `admin_sessions` | Session login admin |
| `reports` | Data laporan masuk |
| `report_timeline` | Riwayat perubahan/status |
| `report_evidence` | Bukti lampiran laporan |
| `rate_limits` | Pencegahan spam |
| `system_logs` | Log aktivitas sistem |

### Enums

- `user_role`: admin, osis, student
- `report_status`: pending, in_progress, resolved, closed
- `report_category`: bullying, idea

## API Routes

### Frontend Client
- `POST /api/reports` - Buat laporan baru
- `GET /api/reports/[access_key]` - Ambil data laporan
- `POST /api/evidence/upload` - Upload bukti
- `GET /api/evidence/[report_id]` - Ambil bukti

### Frontend Admin
- `POST /api/admin/login` - Login admin
- `GET /api/admin/reports` - Ambil semua laporan
- `PUT /api/admin/reports/[id]` - Update laporan
- `POST /api/admin/timeline` - Tambah timeline

## Keamanan

- **Row Level Security (RLS)** - Setiap user hanya bisa akses data mereka
- **Rate Limiting** - Mencegah spam dan abuse
- **IP Hashing** - Data IP di-hash untuk anonimitas
- **Service Role** - Hanya digunakan di server-side

## Lisensi

MIT License

## Author

Dikembangkan oleh ZZYN
