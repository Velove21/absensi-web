<?php

namespace App\Http\Controllers\Export;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\DurasiPembelajaran;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AttendanceExportController extends Controller
{
    private function validateActiveRange(?string $startDate, ?string $endDate): ?string
    {
        if ($startDate && ! TahunAjaran::isDateInActiveYear($startDate)) {
            return 'Tanggal tidak valid untuk tahun ajaran aktif.';
        }
        if ($endDate && ! TahunAjaran::isDateInActiveYear($endDate)) {
            return 'Tanggal tidak valid untuk tahun ajaran aktif.';
        }

        return null;
    }

    public function export(Request $request)
    {
        $valRange = $this->validateActiveRange($request->query('start_date'), $request->query('end_date'));
        if ($valRange) {
            return back()->with('error', $valRange);
        }
        $guruId = $request->query('guru_id');
        $mapelIds = $request->query('mapel_ids', []);
        $kelasIds = $request->query('kelas_ids', []);
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $simple = $request->query('simple') === '1';

        $lihatAbsensi = $request->query('lihat_absensi') === '1';

        if ($request->user()->role === 'guru') {
            $guru = $request->user()->guru;
            if (! $guru) {
                return back()->with('error', 'Profil guru tidak ditemukan.');
            }
            $guruId = $guru->id;

            if ($lihatAbsensi && $simple) {
                if (empty($kelasIds)) {
                    return back()->with('error', 'Pilih Kelas di filter atas terlebih dahulu.');
                }
                $html = $this->generateLihatAbsensiExcel($kelasIds, $startDate, $endDate);
                $kelasNama = Kelas::whereIn('id', $kelasIds)->first()?->full_nama_kelas ?? 'kelas';
                $safeKelas = Str::slug($kelasNama, '-');
                $safeKelas = Str::limit($safeKelas, 20, '');
                $filename = 'rekap-presensi-'.$safeKelas.'-'.($startDate ?: 'semua').'.xls';

                return $this->safeExcelResponse($html, $filename);
            }

            if ($simple) {
                if (empty($kelasIds)) {
                    return back()->with('error', 'Pilih minimal satu Kelas untuk ekspor.');
                }
                // SAMAKAN PERSIS dengan admin/eksport presensi — judul identitas, isi tabel, isi data grup per tanggal/kelas/mapel sama persis
                // Hanya sumber data yang beda: pakai data guru yang sedang login (bukan guru sebelumnya)
                $allowedMapelIds = $guru->mataPelajarans()->pluck('mata_pelajarans.id')->toArray();
                $filteredMapelIds = ! empty($mapelIds) ? array_values(array_intersect((array) $mapelIds, $allowedMapelIds)) : $allowedMapelIds;
                if (empty($filteredMapelIds) && ! empty($mapelIds)) {
                    $filteredMapelIds = array_map('strval', $mapelIds);
                }
                $mapels = MataPelajaran::with('kategoriPembelajaran')->whereIn('id', $filteredMapelIds)->get();
                if ($mapels->isEmpty() && ! empty($mapelIds)) {
                    $mapels = MataPelajaran::with('kategoriPembelajaran')->whereIn('id', $mapelIds)->get();
                }
                if ($mapels->isEmpty()) {
                    $mapels = MataPelajaran::with('kategoriPembelajaran')->limit(1)->get();
                    if ($mapels->isEmpty()) {
                        return back()->with('error', 'Mata pelajaran tidak ditemukan.');
                    }
                }
                $html = $this->generateExcel($guru, $mapels, $kelasIds, $startDate, $endDate);
                $kelasNama = Kelas::whereIn('id', $kelasIds)->first()?->full_nama_kelas ?? 'kelas';
                $safeKelas = Str::slug($kelasNama, '-');
                $safeKelas = Str::limit($safeKelas, 20, '');
                $filename = 'rekap-presensi-'.$safeKelas.'-'.($startDate ?: 'semua').'.xls';

                return $this->safeExcelResponse($html, $filename);
            }
        }

        if (! $guruId || empty($mapelIds)) {
            return back()->with('error', 'Parameter guru dan mata pelajaran diperlukan.');
        }

        $guru = Guru::findOrFail($guruId);
        $mapels = MataPelajaran::with('kategoriPembelajaran')->whereIn('id', $mapelIds)->get();

        $html = $this->generateExcel($guru, $mapels, $kelasIds, $startDate, $endDate);

        // Admin: hanya nama guru, tanpa mapel (sesuai request)
        $safeGuru = Str::slug($guru->nama, '-');
        $safeGuru = Str::limit($safeGuru, 25, '');
        $safeGuru = $safeGuru !== '' ? $safeGuru : 'guru';
        $filename = 'rekap-presensi-'.$safeGuru.'.xls';

        return $this->safeExcelResponse($html, $filename);
    }

    private function safeExcelResponse(string $html, string $filename)
    {
        // Sanitasi filename: hanya izinkan a-z0-9-_, max 80 char, ganti spasi/karakter aneh
        $filename = preg_replace('/[^a-zA-Z0-9\-\_\.]/', '-', $filename);
        $filename = preg_replace('/-+/', '-', $filename);
        $filename = trim($filename, '-');
        if (strlen($filename) > 80) {
            $ext = pathinfo($filename, PATHINFO_EXTENSION);
            $name = pathinfo($filename, PATHINFO_FILENAME);
            $filename = substr($name, 0, 80 - strlen($ext) - 1).'.'.$ext;
        }

        return response($html)
            ->header('Content-Type', 'application/vnd.ms-excel; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="'.$filename.'"')
            ->header('Content-Transfer-Encoding', 'binary')
            ->header('Content-Description', 'File Transfer')
            ->header('X-Content-Type-Options', 'nosniff')
            ->header('X-Download-Options', 'open')
            ->header('Content-Length', (string) strlen($html))
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0')
            ->header('Cache-Control', 'must-revalidate, post-check=0, pre-check=0');
    }

    private function getScheduleInfo(string $jamKe, $allSchedules): array
    {
        if (is_numeric($jamKe)) {
            $schedule = $allSchedules->firstWhere('jam_ke', (int) $jamKe);
            if ($schedule) {
                return [
                    'label' => $schedule->nama ?? $jamKe,
                    'waktu' => substr($schedule->waktu_mulai, 0, 5).' - '.substr($schedule->waktu_selesai, 0, 5),
                ];
            }
        }

        $schedule = $allSchedules->firstWhere('nama', $jamKe);
        if ($schedule) {
            return [
                'label' => $schedule->nama,
                'waktu' => substr($schedule->waktu_mulai, 0, 5).' - '.substr($schedule->waktu_selesai, 0, 5),
            ];
        }

        return ['label' => $jamKe, 'waktu' => ''];
    }

    private function generateLihatAbsensiExcel($kelasIds, $startDate, $endDate): string
    {
        $kelasIds = (array) $kelasIds;
        $kelasList = Kelas::with(['jurusan', 'jenjangKelas'])->whereIn('id', $kelasIds)->orderBy('id')->get();

        $query = Absensi::with(['siswa.kelas.jurusan', 'siswa.kelas.jenjangKelas'])
            ->whereHas('siswa', function ($q) use ($kelasIds) {
                $q->whereIn('kelas_id', $kelasIds);
            });

        if ($startDate) {
            $query->where('tanggal', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('tanggal', '<=', $endDate);
        }

        $raw = $query->orderBy('tanggal', 'asc')->orderBy('updated_at', 'desc')->get();

        $html = "\xEF\xBB\xBF";
        $html .= '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        $html .= '<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta charset="UTF-8">';
        $html .= '<style>
            body{font-family:Calibri, Arial, sans-serif;font-size:12px;color:#000;line-height:1.45}
            table{border-collapse:collapse;width:100%;table-layout:auto}
            th,td{border:1px solid #000;padding:10px 12px;text-align:left;vertical-align:middle;color:#000;background:#fff;word-wrap:break-word;font-size:12px}
            th{font-weight:bold;text-align:center;background:#F2F4FF;color:#000}
            th.mapel-head{ text-align:left; }
            .header-meta td{border:none;padding:4px 10px;font-size:12px}
            .header-meta{margin-bottom:48px}
            .title-row td{font-weight:bold;font-size:12px;text-align:left;border:1px solid #000;background:#E8EEFF;color:#002399;padding:10px 12px}
        </style>';
        $html .= '</head><body>';

        if ($kelasList->isNotEmpty()) {
            $html .= '<table class="header-meta">';
            foreach ($kelasList as $kls) {
                $html .= '<tr><td style="font-weight:bold;width:90px;white-space:nowrap">Kelas</td><td style="white-space:nowrap">: '.e($kls->full_nama_kelas).'</td></tr>';
            }
            if ($startDate || $endDate) {
                $periode = ($startDate ?: '...').' s/d '.($endDate ?: '...');
                $html .= '<tr><td style="font-weight:bold;white-space:nowrap">Periode</td><td style="white-space:nowrap">: '.e($periode).'</td></tr>';
            }
            $html .= '</table>';
            // Jarak identitas → tabel pertama — ngikutin admin/eksport presensi (32+21)
            $html .= '<table style="border:none;width:100%"><tr><td style="border:none;height:32px;background:transparent">&nbsp;</td></tr></table>';
            $html .= '<div style="height:21px;line-height:21px;border:none;background:transparent;mso-height-source:userset">&nbsp;</div>';
        }

        if ($raw->isEmpty()) {
            $html .= '<table border="1" cellspacing="0" cellpadding="10" style="border-collapse:collapse;width:100%;border:1px solid #000;">';
            $html .= '<thead><tr>';
            $html .= '<th style="width:38px">No</th>';
            $html .= '<th style="width:58px">NIS</th>';
            $html .= '<th style="min-width:260px">Nama</th>';
            $html .= '<th style="width:125px">Kelas</th>';
            $html .= '<th style="width:95px">Tanggal</th>';
            $html .= '<th style="width:105px">Status</th>';
            $html .= '</tr></thead><tbody>';
            $html .= '<tr><td colspan="6" style="text-align:center;padding:24px;">Tidak ada data untuk filter ini.</td></tr>';
            $totalSiswa = Siswa::whereIn('kelas_id', $kelasIds)->count();
            $html .= '<tr><td colspan="6" style="font-weight:bold; text-align:left; border:1px solid #000; padding:10px 12px;background:#F8FAFF">Total: '.$totalSiswa.' siswa</td></tr>';
            $html .= '</tbody></table></body></html>';

            return $html;
        }

        // Urut hierarki Kelas dulu (meski 1 kelas) lalu Tanggal, lalu NIS — sama seperti admin
        // Merge per siswa+tanggal dengan prioritas berhalangan seharian (jangan timpa surat dengan Hadir jam berikutnya)
        $kelasOrder = $kelasList->pluck('id')->toArray();
        $kelasPos = array_flip($kelasOrder);
        $groupedRaw = $raw->groupBy(function ($item) {
            return $item->siswa_id.'_'.$item->tanggal;
        });
        $merged = $groupedRaw->map(function ($group) {
            $sortedGroup = $group->sort(function ($a, $b) {
                $ta = $a->updated_at ? $a->updated_at->getTimestamp() : 0;
                $tb = $b->updated_at ? $b->updated_at->getTimestamp() : 0;
                if ($ta === $tb) {
                    return $b->id <=> $a->id;
                }

                return $tb <=> $ta;
            })->values();
            $berhalangan = $sortedGroup->first(function ($it) {
                return in_array($it->status, ['sakit', 'izin', 'dispensasi', 'alpha'], true);
            });
            $primary = $berhalangan ?? $sortedGroup->first();
            if (! $primary) {
                return null;
            }
            if (empty($primary->bukti)) {
                $latestBukti = $sortedGroup->first(function ($it) {
                    return ! empty($it->bukti);
                });
                if ($latestBukti) {
                    $primary->setAttribute('bukti', $latestBukti->bukti);
                }
            }
            if ($primary->status === 'alpha' && empty(trim((string) $primary->keterangan))) {
                $withKet = $sortedGroup->first(function ($it) {
                    return $it->status === 'alpha' && ! empty(trim((string) $it->keterangan));
                });
                if ($withKet) {
                    $primary->setAttribute('keterangan', $withKet->keterangan);
                }
            }

            return $primary;
        })->filter()->values();
        $sorted = $merged->sortBy(function ($a) use ($kelasPos) {
            $pos = $kelasPos[$a->siswa?->kelas_id ?? 0] ?? 9999;
            $nis = $a->siswa?->nis;
            $nisKey = $nis && is_numeric($nis) ? str_pad((string) $nis, 10, '0', STR_PAD_LEFT) : ($a->siswa?->nama ?? '');

            return sprintf('%04d_%s_%s', $pos, $a->tanggal, $nisKey);
        })->values();

        // Group per tanggal untuk diekspor masing-masing tabel dari a sampai d (meski user lagi lihat tanggal b)
        $grouped = $sorted->groupBy('tanggal');
        // Cek global apakah ada alpha+keterangan — kalau ada, tampilkan kolom Keterangan hanya di tabel A (pertama)
        $hasKeteranganGlobal = $sorted->contains(function ($a) {
            return $a->status === 'alpha' && $a->keterangan !== null && trim((string) $a->keterangan) !== '' && trim((string) $a->keterangan) !== '-';
        });
        $isFirstTable = true;

        foreach ($grouped as $tanggal => $dateGroup) {
            $formattedPeriode = Carbon::parse($tanggal)->format('d-m-Y');
            // Ambil nama kelas untuk title (karena lihat absensi hanya 1 kelas, pakai yang pertama)
            $kelasNamaTitle = $kelasList->first()?->full_nama_kelas ?? $dateGroup->first()?->siswa?->kelas?->full_nama_kelas ?? '-';
            $showKeteranganThisTable = $hasKeteranganGlobal && $isFirstTable;
            $colCount = $showKeteranganThisTable ? 7 : 6;

            $html .= '<table border="1" cellspacing="0" cellpadding="10" style="border-collapse:collapse;width:100%;border:1px solid #000;">';
            $html .= '<tr class="title-row"><td colspan="'.$colCount.'" style="font-size:12px">'.e($kelasNamaTitle).' &nbsp;&bull;&nbsp; '.e($formattedPeriode).'</td></tr>';
            $html .= '<thead><tr>';
            $html .= '<th style="width:38px">No</th>';
            $html .= '<th style="width:58px">NIS</th>';
            $html .= '<th style="min-width:260px">Nama</th>';
            $html .= '<th style="width:125px">Kelas</th>';
            $html .= '<th style="width:95px">Tanggal</th>';
            $html .= '<th style="width:105px">Status</th>';
            if ($showKeteranganThisTable) {
                $html .= '<th style="min-width:180px">Keterangan</th>';
            }
            $html .= '</tr></thead><tbody>';

            $no = 1;
            foreach ($dateGroup as $abs) {
                $nis = $abs->siswa?->nis ?? '-';
                $nama = $abs->siswa?->nama ?? '-';
                $kelasNama = $abs->siswa?->kelas?->full_nama_kelas ?? $kelasNamaTitle;
                $tgl = $abs->tanggal ? Carbon::parse($abs->tanggal)->format('d-m-Y') : '-';
                $status = ucfirst($abs->status ?? '-');
                $html .= '<tr>';
                $html .= '<td style="text-align:center;">'.$no++.'</td>';
                $html .= '<td style="mso-number-format:\@;text-align:center;">'.e($nis).'</td>';
                $html .= '<td style="white-space:normal;word-wrap:break-word;min-width:260px">'.e($nama).'</td>';
                $html .= '<td style="text-align:center;white-space:nowrap;">'.e($kelasNama).'</td>';
                $html .= '<td style="text-align:center;mso-number-format:\@;white-space:nowrap">'.e($tgl).'</td>';
                $html .= '<td style="text-align:center;white-space:nowrap">'.e($status).'</td>';
                if ($showKeteranganThisTable) {
                    $ket = ($abs->status === 'alpha' && $abs->keterangan) ? $abs->keterangan : '-';
                    $html .= '<td style="white-space:normal;word-wrap:break-word">'.e($ket).'</td>';
                }
                $html .= '</tr>';
            }

            $totalSiswa = $dateGroup->pluck('siswa.id')->unique()->count();
            if ($totalSiswa === 0) {
                $totalSiswa = $dateGroup->count();
            }
            $html .= '<tr><td colspan="'.$colCount.'" style="font-weight:bold; text-align:left; border:1px solid #000; padding:10px 12px;background:#F8FAFF">Total: '.$totalSiswa.' siswa</td></tr>';
            $html .= '</tbody></table>';

            // Jarak antar tabel ngikutin admin/eksport presensi (35+27)
            $html .= '<table style="border:none;width:100%"><tr><td style="border:none;height:35px;background:transparent">&nbsp;</td></tr></table>';
            $html .= '<div style="height:27px;line-height:27px;border:none;background:transparent;mso-height-source:userset">&nbsp;</div>';

            $isFirstTable = false;
        }

        $html .= '</body></html>';

        return $html;
    }

    private function generateSimpleExcel(Guru $guru, $kelasIds, $mapelIds, $startDate, $endDate): string
    {
        $allowedKelasIds = $guru->kelas()->pluck('kelas.id')->toArray();
        $allowedMapelIds = $guru->mataPelajarans()->pluck('mata_pelajarans.id')->toArray();

        $filteredKelasIds = array_values(array_intersect((array) $kelasIds, $allowedKelasIds));
        if (empty($filteredKelasIds)) {
            $filteredKelasIds = $allowedKelasIds ? array_intersect((array) $kelasIds, $allowedKelasIds) : [];
        }
        if (empty($kelasIds) && ! empty($allowedKelasIds)) {
            $filteredKelasIds = $allowedKelasIds;
        }

        $filteredMapelIds = ! empty($mapelIds) ? array_values(array_intersect((array) $mapelIds, $allowedMapelIds)) : $allowedMapelIds;

        if (empty($filteredKelasIds)) {
            $html = "\xEF\xBB\xBF";
            $html .= '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
            $html .= '<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta charset="UTF-8">';
            $html .= '<style>body{font-family:Calibri, Arial, sans-serif;font-size:12px;color:#000}table{border-collapse:collapse;width:100%}th,td{border:1px solid #000;padding:10px 12px;text-align:left;font-size:12px}th{font-weight:bold;text-align:center;background:#F2F4FF}th.mapel-head{text-align:left}.header-meta td{border:none;padding:4px 10px}</style>';
            $html .= '</head><body>';
            $html .= '<table class="header-meta"><tr><td style="font-weight:bold;white-space:nowrap;width:90px">Nama Guru</td><td style="white-space:nowrap">: '.e($guru->nama).'</td></tr></table>';
            $html .= '<div style="height:24px"></div>';
            $html .= '<table><thead><tr><th style="width:38px">No</th><th style="width:58px">NIS</th><th style="min-width:260px">Nama</th><th style="width:125px">Kelas</th><th style="width:95px">Tanggal</th><th class="mapel-head" style="min-width:160px;text-align:left">Mapel</th><th style="width:110px">Jam Pembelajaran</th><th style="width:105px">Status Kehadiran</th></tr></thead><tbody>';
            $html .= '<tr><td colspan="8" style="text-align:center;padding:24px;">Tidak ada data untuk filter ini. Pastikan kelas yang dipilih termasuk yang Anda ampu.</td></tr>';
            $html .= '<tr><td colspan="8" style="font-weight:bold;">Total: 0 siswa</td></tr>';
            $html .= '</tbody></table></body></html>';

            return $html;
        }

        $kelasList = Kelas::with(['jurusan', 'jenjangKelas'])->whereIn('id', $filteredKelasIds)->orderBy('id')->get();
        $kelasOrder = $kelasList->pluck('id')->toArray();
        $kelasPos = array_flip($kelasOrder);

        $query = Absensi::with(['siswa.kelas.jurusan', 'siswa.kelas.jenjangKelas', 'mapel'])
            ->whereHas('siswa', function ($q) use ($filteredKelasIds) {
                $q->whereIn('kelas_id', $filteredKelasIds);
            })
            ->where('guru_id', $guru->id);

        $useMapelFilter = ! empty($filteredMapelIds);
        if ($useMapelFilter && ! empty($filteredMapelIds)) {
            $query->whereIn('mapel_id', $filteredMapelIds);
        }
        if ($startDate) {
            $query->where('tanggal', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('tanggal', '<=', $endDate);
        }

        $absensis = $query->get()->sortBy(function ($a) use ($kelasPos) {
            $kelasId = $a->siswa?->kelas_id ?? 9999;
            $pos = $kelasPos[$kelasId] ?? 9999;

            return sprintf('%04d_%s_%05s_%s', $pos, $a->tanggal, str_pad((string) $a->jam_ke, 5, '0', STR_PAD_LEFT), $a->siswa?->nama ?? '');
        })->values();

        $html = "\xEF\xBB\xBF";
        $html .= '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        $html .= '<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta charset="UTF-8">';
        $html .= '<style>
            body { font-family: Calibri, Arial, sans-serif; font-size: 12px; color: #000; line-height:1.45 }
            table{border-collapse:collapse;width:100%;table-layout:auto}
            th,td{border:1px solid #000;padding:10px 12px;text-align:left;vertical-align:middle;color:#000;background:#fff;word-wrap:break-word;font-size:12px}
            th{font-weight:bold;text-align:center;background:#F2F4FF}
            th.mapel-head{ text-align:left; }
            .text-center{ text-align:center; }
            .header-meta td{border:none;padding:4px 10px;font-size:12px}
            .header-meta{margin-bottom:48px}
        </style>';
        $html .= '</head><body>';

        $html .= '<table class="header-meta">';
        $html .= '<tr><td style="font-weight:bold;white-space:nowrap;width:90px">Nama Guru</td><td style="white-space:nowrap">: '.e($guru->nama).'</td></tr>';
        $html .= '<tr><td style="font-weight:bold;white-space:nowrap">NIP</td><td style="white-space:nowrap">: '.e($guru->nip ?? '-').'</td></tr>';
        if ($startDate || $endDate) {
            $periode = ($startDate ?: '...').' s/d '.($endDate ?: '...');
            $html .= '<tr><td style="font-weight:bold;white-space:nowrap">Periode</td><td style="white-space:nowrap">: '.e($periode).'</td></tr>';
        }
        $html .= '</table>';
        $html .= '<table style="border:none;width:100%"><tr><td style="border:none;height:32px;background:transparent">&nbsp;</td></tr></table>';
        $html .= '<div style="height:21px;line-height:21px;border:none;background:transparent;mso-height-source:userset">&nbsp;</div>';

        $html .= '<table border="1" cellspacing="0" cellpadding="10" style="border-collapse:collapse;width:100%;border:1px solid #000;">';
        $html .= '<thead><tr>';
        $html .= '<th style="width:38px">No</th>';
        $html .= '<th style="width:58px">NIS</th>';
        $html .= '<th style="min-width:260px">Nama</th>';
        $html .= '<th style="width:125px">Kelas</th>';
        $html .= '<th style="width:95px">Tanggal</th>';
        $html .= '<th class="mapel-head" style="min-width:160px;text-align:left">Mapel</th>';
        $html .= '<th style="width:110px">Jam Pembelajaran</th>';
        $html .= '<th style="width:105px">Status Kehadiran</th>';
        $html .= '</tr></thead><tbody>';

        if ($absensis->isEmpty()) {
            $html .= '<tr><td colspan="8" style="text-align:center; padding:24px; color:#000;">Tidak ada data untuk filter ini.</td></tr>';
        } else {
            $no = 1;
            foreach ($absensis as $absensi) {
                $siswa = $absensi->siswa;
                $nis = $siswa?->nis ?? '-';
                $nama = $siswa?->nama ?? '-';
                $kelasNama = $siswa?->kelas?->full_nama_kelas ?? '-';
                $tgl = $absensi->tanggal ? Carbon::parse($absensi->tanggal)->format('d-m-Y') : '-';
                $mapelNama = $absensi->mapel?->nama_mapel ?? '-';
                $jam = $absensi->jam_ke ?? '-';
                if ($absensi->waktu_mulai && $absensi->waktu_selesai) {
                    $jam .= ' ('.substr($absensi->waktu_mulai, 0, 5).'-'.substr($absensi->waktu_selesai, 0, 5).')';
                } elseif ($absensi->waktu_mulai) {
                    $jam .= ' ('.substr($absensi->waktu_mulai, 0, 5).')';
                }
                $status = ucfirst($absensi->status ?? '-');

                $html .= '<tr>';
                $html .= '<td class="text-center">'.$no++.'</td>';
                $html .= '<td style="mso-number-format:\@;text-align:center;">'.e($nis).'</td>';
                $html .= '<td style="white-space:normal;word-wrap:break-word;min-width:260px">'.e($nama).'</td>';
                $html .= '<td style="text-align:center;white-space:nowrap;">'.e($kelasNama).'</td>';
                $html .= '<td class="text-center" style="mso-number-format:\@;white-space:nowrap">'.e($tgl).'</td>';
                $html .= '<td style="white-space:normal;word-wrap:break-word;text-align:left;min-width:160px">'.e($mapelNama).'</td>';
                $html .= '<td class="text-center" style="white-space:nowrap;">'.e($jam).'</td>';
                $html .= '<td class="text-center" style="white-space:nowrap">'.e($status).'</td>';
                $html .= '</tr>';
            }
        }

        $totalSiswa = 0;
        if (! $absensis->isEmpty()) {
            $totalSiswa = $absensis->pluck('siswa.id')->unique()->count();
            if ($totalSiswa === 0) {
                $totalSiswa = $absensis->count();
            }
        } else {
            $totalSiswa = Siswa::whereIn('kelas_id', $filteredKelasIds)->count();
        }
        $html .= '<tr><td colspan="8" style="font-weight:bold; text-align:left; border: 1px solid #000; padding:10px 12px;background:#F8FAFF">Total: '.$totalSiswa.' siswa</td></tr>';

        $html .= '</tbody></table>';
        $html .= '</body></html>';

        return $html;
    }

    private function generateExcel(Guru $guru, $mapels, $kelasIds, $startDate, $endDate): string
    {
        $allSchedules = DurasiPembelajaran::orderBy('jam_ke')->get();

        $html = "\xEF\xBB\xBF";
        $html .= '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        $html .= '<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta charset="UTF-8">';
        $html .= '<style>
            body{font-family:Calibri, Arial, sans-serif;font-size:12px;color:#000;line-height:1.45}
            table{border-collapse:collapse;width:100%;table-layout:auto;margin-bottom:32px}
            th,td{border:1px solid #000;padding:10px 12px;text-align:left;vertical-align:middle;color:#000;background:#fff;word-wrap:break-word;font-size:12px}
            th{font-weight:bold;text-align:center;background:#F2F4FF;color:#000}
            th.mapel-head{ text-align:left; }
            .header-info{font-size:12px;margin-bottom:48px;width:auto;border:none}
            .header-info td{border:none;padding:4px 10px;font-size:12px}
            .title-row td{font-weight:bold;font-size:12px;text-align:left;border:1px solid #000;background:#E8EEFF;color:#002399;padding:10px 12px;letter-spacing:0.1px}
            .summary-row td{font-weight:bold;background:#F8FAFF;color:#000}
            .text-center{ text-align:center; }
        </style>';
        $html .= '</head><body>';

        $mapelListSingleLine = e($mapels->pluck('nama_mapel')->implode(', '));
        $html .= '<table class="header-info">';
        $html .= '<tr><td style="font-weight:bold;white-space:nowrap;width:140px">Nama Guru</td><td style="white-space:nowrap">: '.e($guru->nama).'</td></tr>';
        $html .= '<tr><td style="font-weight:bold;white-space:nowrap">NIP</td><td style="white-space:nowrap">: '.e($guru->nip ?? '-').'</td></tr>';
        $html .= '<tr><td style="font-weight:bold;white-space:nowrap">Mata Pelajaran</td><td style="white-space:nowrap">: '.$mapelListSingleLine.'</td></tr>';
        if ($startDate && $endDate) {
            $html .= '<tr><td style="font-weight:bold;white-space:nowrap">Periode</td><td style="white-space:nowrap">: '.e($startDate).' s/d '.e($endDate).'</td></tr>';
        } elseif ($startDate) {
            $html .= '<tr><td style="font-weight:bold;white-space:nowrap">Periode</td><td style="white-space:nowrap">: Mulai '.e($startDate).'</td></tr>';
        } elseif ($endDate) {
            $html .= '<tr><td style="font-weight:bold;white-space:nowrap">Periode</td><td style="white-space:nowrap">: Sampai '.e($endDate).'</td></tr>';
        } else {
            $html .= '<tr><td style="font-weight:bold;white-space:nowrap">Periode</td><td style="white-space:nowrap">: Semua data</td></tr>';
        }
        $html .= '</table>';
        $html .= '<table style="border:none;width:100%"><tr><td style="border:none;height:32px;background:transparent">&nbsp;</td></tr></table>';
        $html .= '<div style="height:21px;line-height:21px;border:none;background:transparent;mso-height-source:userset">&nbsp;</div>';

        $guruKelasIds = $guru->kelas()->pluck('kelas.id');
        if (! empty($kelasIds)) {
            $guruKelasIds = array_intersect($guruKelasIds->toArray(), $kelasIds);
        }

        $kelasList = Kelas::with(['jurusan', 'jenjangKelas'])->whereIn('id', $guruKelasIds)->get();
        $siswaIdsByKelas = [];
        foreach ($kelasList as $kelas) {
            $siswaIdsByKelas[$kelas->id] = Siswa::where('kelas_id', $kelas->id)->orderBy('nama')->get()->keyBy('id');
        }

        $allSiswaIds = collect($siswaIdsByKelas)->flatten(1)->pluck('id');

        $absensisQuery = Absensi::with(['siswa.kelas.jurusan', 'siswa.kelas.jenjangKelas'])
            ->whereIn('siswa_id', $allSiswaIds)
            ->whereIn('mapel_id', $mapels->pluck('id'))
            ->where('guru_id', $guru->id);

        if ($startDate) {
            $absensisQuery->where('tanggal', '>=', $startDate);
        }
        if ($endDate) {
            $absensisQuery->where('tanggal', '<=', $endDate);
        }

        $absensis = $absensisQuery->orderBy('tanggal', 'asc')->orderBy('jam_ke')->get()->sortBy('siswa.nama')->values();
        $grouped = $absensis->groupBy('tanggal');

        if ($grouped->isEmpty()) {
            $html .= '<table><thead><tr>';
            $html .= '<th style="width:38px">No</th>';
            $html .= '<th style="width:58px">NIS</th>';
            $html .= '<th style="min-width:260px">Nama Siswa</th>';
            $html .= '<th style="width:125px">Kelas</th>';
            $html .= '<th style="width:95px">Tanggal</th>';
            $html .= '<th class="mapel-head" style="min-width:160px;text-align:left">Mapel</th>';
            $html .= '<th style="width:70px">Jam Ke</th>';
            $html .= '<th style="width:115px">Waktu</th>';
            $html .= '<th style="width:85px">Status</th>';
            $html .= '</tr></thead>';
            $html .= '<tbody><tr><td colspan="9" style="text-align:center; padding:24px; color:#555;">Tidak ada data presensi untuk filter ini.<br/>Pastikan guru telah mengabsen beberapa kelas/hari dan filter tanggal/kelas/mapel sesuai.</td></tr></tbody></table>';
            $html .= '</body></html>';

            return $html;
        }

        foreach ($grouped as $tanggal => $dateAbsensis) {
            $byKelas = $dateAbsensis->groupBy(function ($item) {
                return $item->siswa->kelas_id;
            });

            foreach ($byKelas as $kelasId => $kelasAbsensis) {
                $kelas = $kelasList->firstWhere('id', $kelasId);
                if (! $kelas) {
                    continue;
                }

                $fullKelasName = $kelas->full_nama_kelas ?: $kelas->nama_kelas;
                $byMapel = $kelasAbsensis->groupBy('mapel_id');

                foreach ($byMapel as $mapelId => $mapelAbsensis) {
                    $mapel = $mapels->firstWhere('id', $mapelId);
                    if (! $mapel) {
                        continue;
                    }

                    $formattedDate = Carbon::parse($tanggal)->format('d-m-Y');

                    $hasKeteranganForTable = $mapelAbsensis->contains(function ($a) {
                        return $a->keterangan !== null && trim((string) $a->keterangan) !== '' && trim((string) $a->keterangan) !== '-';
                    });
                    $colCount = $hasKeteranganForTable ? 10 : 9;

                    $html .= '<table>';
                    $html .= '<tr class="title-row"><td colspan="'.$colCount.'" style="font-size:12px">'.e($fullKelasName).' &nbsp;&bull;&nbsp; '.e($formattedDate).' &nbsp;&bull;&nbsp; '.e($mapel->nama_mapel).'</td></tr>';
                    $html .= '<thead><tr>';
                    $html .= '<th style="width:38px">No</th>';
                    $html .= '<th style="width:58px">NIS</th>';
                    $html .= '<th style="min-width:260px">Nama Siswa</th>';
                    $html .= '<th style="width:125px">Kelas</th>';
                    $html .= '<th style="width:95px">Tanggal</th>';
                    $html .= '<th class="mapel-head" style="min-width:160px;text-align:left">Mapel</th>';
                    $html .= '<th style="width:70px">Jam Ke</th>';
                    $html .= '<th style="width:115px">Waktu</th>';
                    $html .= '<th style="width:85px">Status</th>';
                    if ($hasKeteranganForTable) {
                        $html .= '<th style="min-width:180px">Keterangan</th>';
                    }
                    $html .= '</tr></thead><tbody>';

                    if ($mapelAbsensis->isEmpty()) {
                        $html .= '<tr><td colspan="'.$colCount.'" style="text-align:center; color:#888; padding:16px;">Belum ada data presensi.</td></tr>';
                    } else {
                        $no = 1;
                        foreach ($mapelAbsensis as $absensi) {
                            $scheduleInfo = $this->getScheduleInfo($absensi->jam_ke, $allSchedules);
                            $jamLabel = $scheduleInfo['label'];
                            $waktu = $scheduleInfo['waktu'];

                            if (! $waktu && $absensi->waktu_mulai && $absensi->waktu_selesai) {
                                $waktu = substr($absensi->waktu_mulai, 0, 5).' - '.substr($absensi->waktu_selesai, 0, 5);
                            } elseif (! $waktu && $absensi->waktu_mulai) {
                                $waktu = substr($absensi->waktu_mulai, 0, 5);
                            }

                            $kelasNamaCell = $absensi->siswa->kelas?->full_nama_kelas ?? $fullKelasName;
                            $html .= '<tr>';
                            $html .= '<td class="text-center">'.$no++.'</td>';
                            $html .= '<td style="mso-number-format:\@;text-align:center;">'.e($absensi->siswa->nis ?? '-').'</td>';
                            $html .= '<td style="white-space:normal;word-wrap:break-word;min-width:260px">'.e($absensi->siswa->nama ?? '-').'</td>';
                            $html .= '<td style="text-align:center;white-space:nowrap;">'.e($kelasNamaCell).'</td>';
                            $html .= '<td style="text-align:center;mso-number-format:\@;white-space:nowrap">'.e($formattedDate).'</td>';
                            $html .= '<td style="white-space:normal;word-wrap:break-word;text-align:left;min-width:160px">'.e($mapel->nama_mapel).'</td>';
                            $html .= '<td class="text-center" style="mso-number-format:\@;white-space:nowrap" x:str>'.e($jamLabel).'</td>';
                            $html .= '<td class="text-center" style="mso-number-format:\@;white-space:nowrap">'.e($waktu).'</td>';
                            $html .= '<td class="text-center" style="white-space:nowrap">'.e(ucfirst($absensi->status)).'</td>';
                            if ($hasKeteranganForTable) {
                                $html .= '<td style="white-space:normal;word-wrap:break-word">'.e($absensi->keterangan ?? '-').'</td>';
                            }
                            $html .= '</tr>';
                        }

                        $totalHadir = $mapelAbsensis->where('status', 'hadir')->count();
                        $totalSakit = $mapelAbsensis->where('status', 'sakit')->count();
                        $totalIzin = $mapelAbsensis->where('status', 'izin')->count();
                        $totalAlpha = $mapelAbsensis->where('status', 'alpha')->count();
                        $totalDispensasi = $mapelAbsensis->where('status', 'dispensasi')->count();

                        $html .= '<tr class="summary-row">';
                        $html .= '<td colspan="'.($colCount - 1).'" style="text-align:right;"><strong>Total</strong></td>';
                        $html .= '<td style="text-align:center"><strong>'.$mapelAbsensis->count().' siswa</strong></td>';
                        $html .= '</tr>';
                        $html .= '<tr class="summary-row">';
                        $html .= '<td colspan="'.($colCount - 1).'" style="text-align:right;">Hadir / Sakit / Izin / Alpha / Dispensasi</td>';
                        $html .= '<td style="text-align:center;white-space:nowrap">'.$totalHadir.' / '.$totalSakit.' / '.$totalIzin.' / '.$totalAlpha.' / '.$totalDispensasi.'</td>';
                        $html .= '</tr>';
                    }

                    $html .= '</tbody></table>';
                    // Jarak antar tabel dikurangi 1/3 (sebelumnya 92px → sekarang ~62px)
                    $html .= '<table style="border:none;width:100%"><tr><td style="border:none;height:35px;background:transparent">&nbsp;</td></tr></table>';
                    $html .= '<div style="height:27px;line-height:27px;border:none;background:transparent;mso-height-source:userset">&nbsp;</div>';
                }
            }
        }

        $html .= '</body></html>';

        return $html;
    }
}
