<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DurasiPembelajaran;
use App\Models\Guru;
use App\Models\JenjangKelas;
use App\Models\Jurusan;
use App\Models\KategoriPembelajaran;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImportController extends Controller
{
    private const ENTITIES = [
        'tahun-ajaran',
        'jurusan',
        'jenjang-kelas',
        'jenjang',
        'durasi-pembelajaran',
        'kelas',
        'kategori-pembelajaran',
        'kategori-pelajaran',
        'mata-pelajaran',
        'guru',
        'siswa',
        'admin',
    ];

    private const TEMPLATES = [
        'tahun-ajaran' => [
            'headers' => ['tahun_awal', 'tahun_akhir'],
            'examples' => [
                ['2024', '2025'],
            ],
            'description' => 'Tahun Ajaran: tahun_awal 4 digit, tahun_akhir 4 digit & > tahun_awal',
        ],
        'jurusan' => [
            'headers' => ['nama_jurusan', 'singkatan'],
            'examples' => [
                ['Rekayasa Perangkat Lunak', 'RPL'],
            ],
            'description' => 'Jurusan: singkatan opsional max 20 karakter',
        ],
        'jenjang-kelas' => [
            'headers' => ['nama_jenjang'],
            'examples' => [
                ['X'],
            ],
            'description' => 'Jenjang: contoh X',
        ],
        'jenjang' => [
            'headers' => ['nama_jenjang'],
            'examples' => [
                ['X'],
            ],
            'description' => 'Jenjang: contoh X',
        ],
        'durasi-pembelajaran' => [
            'headers' => ['hari', 'jam_ke', 'waktu_mulai', 'waktu_selesai'],
            'examples' => [
                ['Senin', '1', '07:00', '07:45'],
            ],
            'description' => 'Durasi: hari Senin-Minggu, jam_ke >=0, waktu format HH:MM, selesai > mulai',
        ],
        'kelas' => [
            'headers' => ['nama_kelas', 'jurusan_singkatan', 'jenjang_nama'],
            'examples' => [
                ['A', 'PPLG', 'X'],
            ],
            'description' => 'Kelas: jurusan_singkatan & jenjang_nama opsional, kosongkan jika tidak ada.',
        ],
        'kategori-pembelajaran' => [
            'headers' => ['nama_kategori', 'kode'],
            'examples' => [
                ['Mata Pelajaran Umum', 'MPU'],
            ],
            'description' => 'Kategori: kode unik max 20, contoh MPU',
        ],
        'kategori-pelajaran' => [
            'headers' => ['nama_kategori', 'kode'],
            'examples' => [
                ['Mata Pelajaran Umum', 'MPU'],
            ],
            'description' => 'Kategori: kode unik max 20, contoh MPU',
        ],
        'mata-pelajaran' => [
            'headers' => ['nama_mapel', 'kategori_kode'],
            'examples' => [
                ['Matematika', 'MPU'],
            ],
            'description' => 'Mata Pelajaran: kategori_kode harus sudah ada di Kategori Pelajaran',
        ],
        'guru' => [
            'headers' => ['nip', 'nama', 'jenis_kelamin', 'kelas', 'mata_pelajaran'],
            'examples' => [
                ['198001012010011001', 'Budi Santoso S.Pd', 'L', 'XI PPLG A;XII PPLG A', 'Matematika;Bahasa Indonesia'],
            ],
            'description' => 'Guru: NIP 18 digit unik, jenis_kelamin L/P (L=laki-laki, P=perempuan), kelas = full_nama_kelas dipisah ;',
        ],
        'siswa' => [
            'headers' => ['nis', 'nama', 'jenis_kelamin', 'kelas'],
            'examples' => [
                ['24.012501', 'Andi Wijaya', 'L', 'XI PPLG A'],
            ],
            'description' => 'Siswa: NIS format XX.XXXXXX unik, jenis_kelamin L/P, kelas = full_nama_kelas harus sudah ada',
        ],
        'admin' => [
            'headers' => ['name', 'email', 'password'],
            'examples' => [
                ['Admin Kurikulum', 'admin@sekolah.com', 'password123'],
            ],
            'description' => 'Admin: email unik, password opsional min 8 (default password jika kosong)',
        ],
    ];

    public function template(string $entity): StreamedResponse
    {
        if (! in_array($entity, self::ENTITIES, true)) {
            abort(404);
        }

        $template = self::TEMPLATES[$entity];
        $filename = "template_{$entity}.csv";

        return response()->streamDownload(function () use ($template) {
            $out = fopen('php://output', 'w');
            // BOM for Excel
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $template['headers']);
            foreach ($template['examples'] as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function import(Request $request, string $entity)
    {
        if (! in_array($entity, self::ENTITIES, true)) {
            abort(404);
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
        ], [
            'file.required' => 'File CSV wajib diunggah.',
            'file.mimes' => 'File harus format CSV.',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();

        $rows = [];
        $header = null;
        $errors = [];
        $success = 0;

        if (($handle = fopen($path, 'r')) !== false) {
            // Detect and strip BOM, detect delimiter (koma, tab, semicolon)
            $firstLine = fgets($handle);
            if ($firstLine !== false) {
                $firstLine = preg_replace('/^\xEF\xBB\xBF/', '', $firstLine);
                $delimiter = ',';
                if (strpos($firstLine, "\t") !== false) {
                    $delimiter = "\t";
                } elseif (substr_count($firstLine, ';') > substr_count($firstLine, ',')) {
                    $delimiter = ';';
                }
                $header = array_map('trim', str_getcsv($firstLine, $delimiter));
                // normalize header to lowercase, hilangkan spasi
                $header = array_map(fn ($h) => strtolower(str_replace(' ', '_', trim($h))), $header);
            }

            $expected = self::TEMPLATES[$entity]['headers'];
            $expectedLower = array_map('strtolower', $expected);

            if ($header !== $expectedLower) {
                fclose($handle);

                return back()->with('error', 'Header CSV tidak sesuai. Harus: '.implode(', ', $expected).'. Gunakan Download Template. Baris header terbaca: '.implode(', ', $header ?? []));
            }

            $rowNum = 1;
            // Gunakan delimiter yang terdeteksi untuk baris selanjutnya
            while (($data = fgetcsv($handle, 0, $delimiter ?? ',')) !== false) {
                $rowNum++;
                if (count($data) === 1 && trim($data[0]) === '') {
                    continue;
                }
                if (count($data) !== count($expected)) {
                    $errors[] = "Baris $rowNum: jumlah kolom tidak sesuai (harus ".count($expected).')';

                    continue;
                }
                $row = array_combine($expectedLower, array_map('trim', $data));
                $rows[] = ['row' => $row, 'num' => $rowNum];
            }
            fclose($handle);
        }

        if (empty($rows)) {
            return back()->with('error', 'File CSV kosong atau hanya header. Pastikan file berisi minimal satu baris data.');
        }

        // Validasi all-or-nothing: jika ada satu baris bermasalah, batalkan seluruh impor agar tidak setengah jadi
        DB::beginTransaction();
        try {
            foreach ($rows as $item) {
                $row = $item['row'];
                $num = $item['num'];
                try {
                    $result = match ($entity) {
                        'tahun-ajaran' => $this->importTahunAjaran($row),
                        'jurusan' => $this->importJurusan($row),
                        'jenjang-kelas', 'jenjang' => $this->importJenjangKelas($row),
                        'durasi-pembelajaran' => $this->importDurasi($row),
                        'kelas' => $this->importKelas($row),
                        'kategori-pembelajaran' => $this->importKategori($row),
                        'kategori-pelajaran' => $this->importKategori($row),
                        'mata-pelajaran' => $this->importMapel($row),
                        'guru' => $this->importGuru($row),
                        'siswa' => $this->importSiswa($row),
                        'admin' => $this->importAdmin($row),
                        default => throw new \Exception('Entity tidak dikenal'),
                    };
                    if ($result) {
                        $success++;
                    }
                } catch (ValidationException $e) {
                    $errors[] = "Baris $num: ".implode(', ', collect($e->errors())->flatten()->toArray());
                } catch (\Exception $e) {
                    $errors[] = "Baris $num: ".$e->getMessage();
                }
            }

            if (! empty($errors)) {
                DB::rollBack();
                $ringkas = 'Import dibatalkan: tidak ada data yang ditambahkan karena '.count($errors).' baris bermasalah. Perbaiki file CSV Anda terlebih dahulu sesuai petunjuk di bawah.';
                $detail = array_slice($errors, 0, 50);

                // Tampilkan ringkasan + detail per baris yang gagal (Bahasa Indonesia, rapi)
                return back()->with('error', $ringkas)->with('import_errors', $detail);
            }

            DB::commit();

            return back()->with('success', "Import berhasil: $success data berhasil ditambahkan.");
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Terjadi kesalahan sistem saat impor: '.$e->getMessage())->with('import_errors', ['Baris tidak diketahui: '.$e->getMessage()]);
        }
    }

    private function importTahunAjaran(array $row): bool
    {
        $validator = Validator::make($row, [
            'tahun_awal' => 'required|string|size:4',
            'tahun_akhir' => 'required|string|size:4',
        ], [
            'tahun_awal.required' => 'Tahun awal wajib diisi (contoh: 2024)',
            'tahun_awal.size' => 'Tahun awal harus 4 digit angka',
            'tahun_akhir.required' => 'Tahun akhir wajib diisi (contoh: 2025)',
            'tahun_akhir.size' => 'Tahun akhir harus 4 digit angka',
        ]);
        $validator->after(function ($v) use ($row) {
            if (isset($row['tahun_awal'], $row['tahun_akhir']) && $row['tahun_akhir'] <= $row['tahun_awal']) {
                $v->errors()->add('tahun_akhir', 'Tahun akhir harus lebih besar dari tahun awal');
            }
        });
        $validator->validate();

        TahunAjaran::firstOrCreate(
            ['tahun_awal' => $row['tahun_awal'], 'tahun_akhir' => $row['tahun_akhir']],
            ['tahun_awal' => $row['tahun_awal'], 'tahun_akhir' => $row['tahun_akhir']]
        );

        return true;
    }

    private function importJurusan(array $row): bool
    {
        Validator::make($row, [
            'nama_jurusan' => 'required|string|max:255',
            'singkatan' => 'nullable|string|max:20',
        ], [
            'nama_jurusan.required' => 'Nama jurusan wajib diisi',
            'nama_jurusan.max' => 'Nama jurusan maksimal 255 karakter',
            'singkatan.max' => 'Singkatan maksimal 20 karakter',
        ])->validate();

        Jurusan::firstOrCreate(
            ['nama_jurusan' => $row['nama_jurusan']],
            ['singkatan' => $row['singkatan'] ?: null]
        );
        // Jika sudah ada tapi singkatan berbeda, update
        $j = Jurusan::where('nama_jurusan', $row['nama_jurusan'])->first();
        if ($j && $j->singkatan !== ($row['singkatan'] ?: null) && ! empty($row['singkatan'])) {
            $j->update(['singkatan' => $row['singkatan']]);
        }

        return true;
    }

    private function importJenjangKelas(array $row): bool
    {
        Validator::make($row, [
            'nama_jenjang' => 'required|string|max:20',
        ], [
            'nama_jenjang.required' => 'Nama jenjang wajib diisi (contoh: X, XI, XII)',
            'nama_jenjang.max' => 'Nama jenjang maksimal 20 karakter',
        ])->validate();

        JenjangKelas::firstOrCreate(['nama_jenjang' => $row['nama_jenjang']]);

        return true;
    }

    private function importDurasi(array $row): bool
    {
        // Normalisasi waktu agar fleksibel: terima H:i, H:i:s, h:i A, H:i:s PM, dll.
        $row['waktu_mulai'] = $this->normalizeTime($row['waktu_mulai'] ?? '');
        $row['waktu_selesai'] = $this->normalizeTime($row['waktu_selesai'] ?? '');
        // Normalisasi hari: trim, kapital huruf pertama
        $row['hari'] = ucfirst(strtolower(trim($row['hari'] ?? '')));
        // Pastikan hari dengan kapital benar (Senin, bukan SENIN)
        $mapHari = ['senin' => 'Senin', 'selasa' => 'Selasa', 'rabu' => 'Rabu', 'kamis' => 'Kamis', 'jumat' => 'Jumat', 'sabtu' => 'Sabtu', 'minggu' => 'Minggu'];
        $lowerHari = strtolower($row['hari']);
        if (isset($mapHari[$lowerHari])) {
            $row['hari'] = $mapHari[$lowerHari];
        }

        Validator::make($row, [
            'hari' => 'required|string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'jam_ke' => 'required|integer|min:0',
            'waktu_mulai' => 'required|date_format:H:i',
            'waktu_selesai' => 'required|date_format:H:i|after:waktu_mulai',
        ], [
            'hari.required' => 'Hari wajib diisi',
            'hari.in' => 'Hari harus salah satu: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu',
            'jam_ke.required' => 'Jam ke wajib diisi',
            'jam_ke.integer' => 'Jam ke harus angka',
            'jam_ke.min' => 'Jam ke minimal 0',
            'waktu_mulai.required' => 'Waktu mulai wajib diisi (format HH:MM, contoh 07:00)',
            'waktu_mulai.date_format' => 'Waktu mulai harus format HH:MM',
            'waktu_selesai.required' => 'Waktu selesai wajib diisi',
            'waktu_selesai.date_format' => 'Waktu selesai harus format HH:MM',
            'waktu_selesai.after' => 'Waktu selesai harus setelah waktu mulai',
        ])->validate();

        DurasiPembelajaran::updateOrCreate(
            ['hari' => $row['hari'], 'jam_ke' => (int) $row['jam_ke']],
            ['waktu_mulai' => $row['waktu_mulai'], 'waktu_selesai' => $row['waktu_selesai']]
        );

        return true;
    }

    private function normalizeTime(string $value): string
    {
        $value = trim($value);
        if ($value === '') {
            return $value;
        }
        // Jika ada detik dan AM/PM seperti 17:45:00 PM, ambil HH:MM saja, abaikan AM/PM jika jam sudah 24-jam
        if (preg_match('/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i', $value, $m)) {
            $h = (int) $m[1];
            $min = $m[2];
            $ampm = $m[3] ?? '';
            // Jika jam >12, anggap sudah 24-jam, abaikan AM/PM
            if ($h > 12) {
                return sprintf('%02d:%s', $h, $min);
            }
            // Untuk 1-12, konversi AM/PM
            if (stripos($ampm, 'PM') !== false && $h < 12) {
                $h += 12;
            }
            if (stripos($ampm, 'AM') !== false && $h == 12) {
                $h = 0;
            }

            return sprintf('%02d:%s', $h, $min);
        }
        $formats = ['H:i', 'H:i:s', 'h:i A', 'h:i:s A', 'g:i A', 'g:i:s A'];
        foreach ($formats as $fmt) {
            try {
                $dt = Carbon::createFromFormat($fmt, $value);
                if ($dt !== false) {
                    return $dt->format('H:i');
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        return $value;
    }

    private function normalizeJenisKelamin(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $v = trim($value);
        if ($v === '') {
            return null;
        }
        $low = strtolower($v);
        // normalize common variants: handle 'l', 'p', 'laki-laki', 'perempuan' (+ tanpa hyphen)
        $low = str_replace(['_', ' '], '-', $low);
        if ($low === 'l' || $low === 'laki-laki' || $low === 'laki') {
            return 'laki-laki';
        }
        if ($low === 'p' || $low === 'perempuan') {
            return 'perempuan';
        }

        // keep original for validation to fail with clear message
        return $v;
    }

    private function importKelas(array $row): bool
    {
        Validator::make($row, [
            'nama_kelas' => 'nullable|string|max:255',
            'jurusan_singkatan' => 'required|string|max:20',
            'jenjang_nama' => 'nullable|string|max:20',
        ], [
            'jurusan_singkatan.required' => 'Jurusan wajib diisi (singkatan jurusan)',
            'nama_kelas.max' => 'Nama kelas maksimal 255 karakter',
        ])->validate();

        $jurusan = Jurusan::where('singkatan', $row['jurusan_singkatan'])->first();
        if (! $jurusan) {
            throw new \Exception("Jurusan singkatan '{$row['jurusan_singkatan']}' tidak ditemukan");
        }
        $jurusanId = $jurusan->id;

        // Normalisasi nama_kelas kosong menjadi null
        $namaKelas = trim($row['nama_kelas'] ?? '');
        if ($namaKelas === '') {
            $namaKelas = null;
        }

        $jenjangId = null;
        if (! empty($row['jenjang_nama'])) {
            $jenjang = JenjangKelas::where('nama_jenjang', $row['jenjang_nama'])->first();
            if (! $jenjang) {
                throw new \Exception("Jenjang '{$row['jenjang_nama']}' tidak ditemukan");
            }
            $jenjangId = $jenjang->id;
        }

        Kelas::firstOrCreate(
            [
                'nama_kelas' => $namaKelas,
                'jurusan_id' => $jurusanId,
                'jenjang_kelas_id' => $jenjangId,
            ]
        );

        return true;
    }

    private function importKategori(array $row): bool
    {
        Validator::make($row, [
            'nama_kategori' => 'required|string|max:255',
            'kode' => 'required|string|max:20',
        ], [
            'nama_kategori.required' => 'Nama kategori wajib diisi',
            'nama_kategori.max' => 'Nama kategori maksimal 255 karakter',
            'kode.required' => 'Kode wajib diisi (contoh: MPU, KK)',
            'kode.max' => 'Kode maksimal 20 karakter',
        ])->validate();

        KategoriPembelajaran::updateOrCreate(
            ['kode' => $row['kode']],
            ['nama_kategori' => $row['nama_kategori']]
        );

        return true;
    }

    private function importMapel(array $row): bool
    {
        Validator::make($row, [
            'nama_mapel' => 'required|string|max:255',
            'kategori_kode' => 'required|string|max:20',
        ], [
            'nama_mapel.required' => 'Nama mata pelajaran wajib diisi',
            'nama_mapel.max' => 'Nama mata pelajaran maksimal 255 karakter',
            'kategori_kode.required' => 'Kode kategori wajib diisi',
            'kategori_kode.max' => 'Kode kategori maksimal 20 karakter',
        ])->validate();

        $kategori = KategoriPembelajaran::where('kode', $row['kategori_kode'])->first();
        if (! $kategori) {
            throw new \Exception("Kategori kode '{$row['kategori_kode']}' tidak ditemukan");
        }

        MataPelajaran::firstOrCreate(
            ['nama_mapel' => $row['nama_mapel'], 'kategori_pembelajaran_id' => $kategori->id]
        );

        return true;
    }

    private function importGuru(array $row): bool
    {
        $row['jenis_kelamin'] = $this->normalizeJenisKelamin($row['jenis_kelamin'] ?? null);

        Validator::make($row, [
            'nip' => 'required|digits:18',
            'nama' => 'required|string|max:255',
            'jenis_kelamin' => 'nullable|in:laki-laki,perempuan',
            'kelas' => 'nullable|string',
            'mata_pelajaran' => 'nullable|string',
        ], [
            'nip.required' => 'NIP wajib diisi',
            'nip.digits' => 'NIP harus 18 digit angka',
            'nama.required' => 'Nama wajib diisi',
            'jenis_kelamin.in' => 'Jenis kelamin harus L atau P (L=laki-laki, P=perempuan)',
        ])->validate();

        // Cek NIP unik, jika sudah ada skip update
        $existing = Guru::where('nip', $row['nip'])->first();
        if ($existing) {
            // Update nama & jenis kelamin jika berbeda
            $existing->update([
                'nama' => $row['nama'],
                'jenis_kelamin' => $row['jenis_kelamin'] ?: $existing->jenis_kelamin,
            ]);
            $guru = $existing;
        } else {
            $user = User::create([
                'name' => $row['nama'],
                'username' => $row['nip'],
                'password' => Hash::make('password'),
                'password_default' => true,
                'role' => 'guru',
            ]);
            $guru = Guru::create([
                'user_id' => $user->id,
                'nip' => $row['nip'],
                'nama' => $row['nama'],
                'jenis_kelamin' => $row['jenis_kelamin'] ?: null,
            ]);
        }

        // Kelas: full_nama_kelas separated by ;
        if (isset($row['kelas']) && $row['kelas'] !== '') {
            $kelasNames = array_filter(array_map('trim', explode(';', $row['kelas'])));
            $kelasIds = [];
            foreach ($kelasNames as $full) {
                // Cari kelas by full_nama_kelas (X PPLG A) — we need to resolve via parsing or direct match on computed attribute
                // Simplest: cari where full_nama_kelas via DB query with joins
                $kelas = Kelas::with(['jurusan', 'jenjangKelas'])->get()->first(fn ($k) => $k->full_nama_kelas === $full);
                if (! $kelas) {
                    // Fallback cari by nama_kelas saja
                    $kelas = Kelas::where('nama_kelas', $full)->first();
                }
                if (! $kelas) {
                    throw new \Exception("Kelas '$full' tidak ditemukan");
                }
                $kelasIds[] = $kelas->id;
            }
            if (! empty($kelasIds)) {
                $guru->kelas()->syncWithoutDetaching($kelasIds);
            }
        }

        if (isset($row['mata_pelajaran']) && $row['mata_pelajaran'] !== '') {
            $mapelNames = array_filter(array_map('trim', explode(';', $row['mata_pelajaran'])));
            $mapelIds = [];
            foreach ($mapelNames as $nama) {
                $mataPelajaran = MataPelajaran::where('nama_mapel', $nama)->first();
                if (! $mataPelajaran) {
                    throw new \Exception("Mata pelajaran '$nama' tidak ditemukan");
                }
                $mapelIds[] = $mataPelajaran->id;
            }
            if (! empty($mapelIds)) {
                $guru->mataPelajarans()->syncWithoutDetaching($mapelIds);
            }
        }

        return true;
    }

    private function importSiswa(array $row): bool
    {
        $row['jenis_kelamin'] = $this->normalizeJenisKelamin($row['jenis_kelamin'] ?? null);

        Validator::make($row, [
            'nis' => ['required', 'string', 'max:20', 'regex:/^[0-9]{2}\.[0-9]{6}$/'],
            'nama' => 'required|string|max:255',
            'jenis_kelamin' => 'nullable|in:laki-laki,perempuan',
            'kelas' => 'required|string|max:255',
        ], [
            'nis.required' => 'NIS wajib diisi',
            'nis.regex' => 'NIS harus format XX.XXXXXX (contoh 24.012501)',
            'nama.required' => 'Nama wajib diisi',
            'jenis_kelamin.in' => 'Jenis kelamin harus L atau P (L=laki-laki, P=perempuan)',
            'kelas.required' => 'Kelas wajib diisi (isi dengan full_nama_kelas, contoh: XI PPLG A)',
        ])->validate();

        if (Siswa::where('nis', $row['nis'])->exists()) {
            throw new \Exception("NIS {$row['nis']} sudah ada");
        }

        $kelas = Kelas::with(['jurusan', 'jenjangKelas'])->get()->first(fn ($k) => $k->full_nama_kelas === trim($row['kelas']));
        if (! $kelas) {
            $kelas = Kelas::where('nama_kelas', trim($row['kelas']))->first();
        }
        if (! $kelas) {
            throw new \Exception("Kelas '{$row['kelas']}' tidak ditemukan");
        }

        $user = User::create([
            'name' => $row['nama'],
            'username' => $row['nis'],
            'password' => Hash::make('password'),
            'password_default' => true,
            'role' => 'siswa',
        ]);

        Siswa::create([
            'user_id' => $user->id,
            'kelas_id' => $kelas->id,
            'nis' => $row['nis'],
            'nama' => $row['nama'],
            'jenis_kelamin' => $row['jenis_kelamin'] ?: null,
        ]);

        return true;
    }

    private function importAdmin(array $row): bool
    {
        Validator::make($row, [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'nullable|string|min:8',
        ], [
            'name.required' => 'Nama admin wajib diisi',
            'name.max' => 'Nama maksimal 255 karakter',
            'email.required' => 'Email wajib diisi',
            'email.email' => 'Format email tidak valid',
            'email.max' => 'Email maksimal 255 karakter',
            'email.unique' => 'Email sudah terdaftar',
            'password.min' => 'Password minimal 8 karakter',
        ])->validate();

        $password = $row['password'] ?: 'password';
        $username = strstr($row['email'], '@', true) ?: $row['email'];

        // Pastikan username unik, jika sudah ada tambahkan suffix
        $baseUsername = $username;
        $counter = 1;
        while (User::where('username', $username)->exists()) {
            $username = $baseUsername.$counter++;
        }

        User::create([
            'name' => $row['name'],
            'email' => $row['email'],
            'username' => $username,
            'password' => Hash::make($password),
            'role' => 'admin',
            'password_default' => empty($row['password']),
        ]);

        return true;
    }
}
