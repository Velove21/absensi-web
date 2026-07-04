<?php

namespace App\Http\Controllers\Export;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\MataPelajaran;
use App\Models\Absensi;
use App\Models\Siswa;
use App\Models\Kelas;
use Illuminate\Http\Request;

class AttendanceExportController extends Controller
{
    public function export(Request $request)
    {
        $guruId = $request->query('guru_id');
        $mapelId = $request->query('mapel_id');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if ($request->user()->role === 'guru') {
            $guru = $request->user()->guru;
            if (! $guru) {
                return back()->with('error', 'Profil guru tidak ditemukan.');
            }
            $guruId = $guru->id;
        }

        if (! $guruId || ! $mapelId) {
            return back()->with('error', 'Parameter guru dan mata pelajaran diperlukan.');
        }

        $guru = Guru::findOrFail($guruId);
        $mapel = MataPelajaran::with('kategoriPembelajaran')->findOrFail($mapelId);

        $kelasIds = $guru->kelas()->pluck('kelas.id');

        $html = $this->generateExcel($guru, $mapel, $kelasIds, $startDate, $endDate);

        $filename = 'rekap-absensi-' . $guru->nama . '-' . $mapel->nama_mapel . '.xls';

        return response($html)
            ->header('Content-Type', 'application/vnd.ms-excel')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    private function generateExcel(Guru $guru, MataPelajaran $mapel, $kelasIds, $startDate, $endDate): string
    {
        $html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        $html .= '<head><meta charset="UTF-8">';
        $html .= '<style>
            table { border-collapse: collapse; width: 100%; font-family: Calibri, sans-serif; font-size: 11px; }
            th, td { border: 1px solid #999; padding: 4px 6px; text-align: left; vertical-align: top; }
            th { background-color: #4472C4; color: white; font-weight: bold; text-align: center; }
            .header-info { font-size: 14px; margin-bottom: 16px; }
            .header-info td { border: none; padding: 2px 6px; }
            .section-title { background-color: #D6E4F0; font-weight: bold; font-size: 12px; text-align: left; }
            .summary-row td { font-weight: bold; background-color: #E2EFDA; }
            .text-center { text-align: center; }
        </style>';
        $html .= '</head><body>';

        $html .= '<table class="header-info">';
        $html .= '<tr><td><strong>Nama Guru</strong></td><td>: ' . e($guru->nama) . '</td></tr>';
        $html .= '<tr><td><strong>NIP</strong></td><td>: ' . e($guru->nip ?? '-') . '</td></tr>';
        $html .= '<tr><td><strong>Mata Pelajaran</strong></td><td>: ' . e($mapel->nama_mapel) . ' (' . e($mapel->kategori) . ')' . '</td></tr>';
        if ($startDate && $endDate) {
            $html .= '<tr><td><strong>Periode</strong></td><td>: ' . e($startDate) . ' s/d ' . e($endDate) . '</td></tr>';
        } elseif ($startDate) {
            $html .= '<tr><td><strong>Periode</strong></td><td>: Mulai ' . e($startDate) . '</td></tr>';
        } elseif ($endDate) {
            $html .= '<tr><td><strong>Periode</strong></td><td>: Sampai ' . e($endDate) . '</td></tr>';
        } else {
            $html .= '<tr><td><strong>Periode</strong></td><td>: Semua data</td></tr>';
        }
        $html .= '</table>';
        $html .= '<br/>';

        $kelasList = Kelas::with(['jurusan', 'jenjangKelas'])->whereIn('id', $kelasIds)->get();

        foreach ($kelasList as $kelas) {
            $siswas = Siswa::where('kelas_id', $kelas->id)->orderBy('nama')->get();
            $siswaIds = $siswas->pluck('id');

            $absensisQuery = Absensi::with(['siswa'])
                ->whereIn('siswa_id', $siswaIds)
                ->where('mapel_id', $mapel->id);

            if ($startDate) {
                $absensisQuery->where('tanggal', '>=', $startDate);
            }
            if ($endDate) {
                $absensisQuery->where('tanggal', '<=', $endDate);
            }

            $absensis = $absensisQuery->orderBy('tanggal', 'desc')->orderBy('jam_ke')->get();

            $html .= '<h3>' . e($kelas->full_nama_kelas ?: $kelas->nama_kelas) . '</h3>';

            $html .= '<table>';
            $html .= '<thead><tr>';
            $html .= '<th style="width:40px">No</th>';
            $html .= '<th style="width:80px">NIS</th>';
            $html .= '<th>Nama Siswa</th>';
            $html .= '<th style="width:100px">Tanggal</th>';
            $html .= '<th style="width:60px">Jam Ke</th>';
            $html .= '<th style="width:100px">Waktu</th>';
            $html .= '<th style="width:90px">Status</th>';
            $html .= '<th>Keterangan</th>';
            $html .= '</tr></thead><tbody>';

            if ($absensis->isEmpty()) {
                $html .= '<tr><td colspan="8" style="text-align:center; color:#888;">Belum ada data absensi untuk kelas ini.</td></tr>';
            } else {
                $no = 1;
                foreach ($absensis as $absensi) {
                    $waktu = '';
                    if ($absensi->waktu_mulai && $absensi->waktu_selesai) {
                        $waktu = substr($absensi->waktu_mulai, 0, 5) . ' - ' . substr($absensi->waktu_selesai, 0, 5);
                    } elseif ($absensi->waktu_mulai) {
                        $waktu = substr($absensi->waktu_mulai, 0, 5);
                    }

                    $html .= '<tr>';
                    $html .= '<td class="text-center">' . $no++ . '</td>';
                    $html .= '<td>' . e($absensi->siswa->nis ?? '-') . '</td>';
                    $html .= '<td>' . e($absensi->siswa->nama ?? '-') . '</td>';
                    $html .= '<td class="text-center">' . e($absensi->tanggal) . '</td>';
                    $html .= '<td class="text-center">' . e($absensi->jam_ke) . '</td>';
                    $html .= '<td class="text-center">' . e($waktu) . '</td>';
                    $html .= '<td class="text-center">' . e(ucfirst($absensi->status)) . '</td>';
                    $html .= '<td>' . e($absensi->keterangan ?? '-') . '</td>';
                    $html .= '</tr>';
                }

                // Summary row
                $totalHadir = $absensis->where('status', 'hadir')->count();
                $totalSakit = $absensis->where('status', 'sakit')->count();
                $totalIzin = $absensis->where('status', 'izin')->count();
                $totalAlpha = $absensis->where('status', 'alpha')->count();
                $totalDispensasi = $absensis->where('status', 'dispensasi')->count();

                $html .= '<tr class="summary-row">';
                $html .= '<td colspan="7" style="text-align:right;"><strong>Total</strong></td>';
                $html .= '<td><strong>' . $absensis->count() . ' entri</strong></td>';
                $html .= '</tr>';
                $html .= '<tr class="summary-row">';
                $html .= '<td colspan="7" style="text-align:right;">Hadir / Sakit / Izin / Alpha / Dispensasi</td>';
                $html .= '<td>' . $totalHadir . ' / ' . $totalSakit . ' / ' . $totalIzin . ' / ' . $totalAlpha . ' / ' . $totalDispensasi . '</td>';
                $html .= '</tr>';
            }

            $html .= '</tbody></table>';
            $html .= '<br/>';
        }

        $html .= '</body></html>';

        return $html;
    }
}
