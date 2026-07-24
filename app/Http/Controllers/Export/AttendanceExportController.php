<?php

namespace App\Http\Controllers\Export;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Schedule;
use App\Models\Siswa;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AttendanceExportController extends Controller
{
    public function export(Request $request)
    {
        $guruId = $request->query('guru_id');
        $mapelIds = $request->query('mapel_ids', []);
        $kelasIds = $request->query('kelas_ids', []);
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if ($request->user()->role === 'guru') {
            $guru = $request->user()->guru;
            if (! $guru) {
                return back()->with('error', 'Profil guru tidak ditemukan.');
            }
            $guruId = $guru->id;
        }

        if (! $guruId || empty($mapelIds)) {
            return back()->with('error', 'Parameter guru dan mata pelajaran diperlukan.');
        }

        $guru = Guru::findOrFail($guruId);
        $mapels = MataPelajaran::with('kategoriPembelajaran')->whereIn('id', $mapelIds)->get();

        $html = $this->generateExcel($guru, $mapels, $kelasIds, $startDate, $endDate);

        $mapelNames = $mapels->pluck('nama_mapel')->implode('-');
        $filename = 'rekap-absensi-'.$guru->nama.'-'.$mapelNames.'.xls';

        return response($html)
            ->header('Content-Type', 'application/vnd.ms-excel')
            ->header('Content-Disposition', 'attachment; filename="'.$filename.'"')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    private function getScheduleInfo(string $jamKe, $allSchedules): array
    {
        if (is_numeric($jamKe)) {
            $schedule = $allSchedules->firstWhere('urutan', (int) $jamKe);
            if ($schedule) {
                return [
                    'label' => $schedule->nama,
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

    private function generateExcel(Guru $guru, $mapels, $kelasIds, $startDate, $endDate): string
    {
        $allSchedules = Schedule::orderBy('urutan')->get();

        $html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        $html .= '<head><meta charset="UTF-8">';
        $html .= '<style>
            body { font-family: Calibri, sans-serif; font-size: 11px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #999; padding: 5px 8px; text-align: left; vertical-align: middle; }
            th { background-color: #4472C4; color: white; font-weight: bold; text-align: center; }
            .header-info { font-size: 13px; margin-bottom: 12px; width: auto; }
            .header-info td { border: none; padding: 2px 8px; }
            .title-row td { background-color: #D6E4F0; font-weight: bold; font-size: 12px; text-align: left; border: 1px solid #999; }
            .summary-row td { font-weight: bold; background-color: #E2EFDA; }
            .text-center { text-align: center; }
        </style>';
        $html .= '</head><body>';

        $html .= '<table class="header-info">';
        $html .= '<tr><td><strong>Nama Guru</strong></td><td>: '.e($guru->nama).'</td></tr>';
        $html .= '<tr><td><strong>NIP</strong></td><td>: '.e($guru->nip ?? '-').'</td></tr>';
        $html .= '<tr><td><strong>Mata Pelajaran</strong></td><td>: '.e($mapels->pluck('nama_mapel')->implode(', ')).'</td></tr>';
        if ($startDate && $endDate) {
            $html .= '<tr><td><strong>Periode</strong></td><td>: '.e($startDate).' s/d '.e($endDate).'</td></tr>';
        } elseif ($startDate) {
            $html .= '<tr><td><strong>Periode</strong></td><td>: Mulai '.e($startDate).'</td></tr>';
        } elseif ($endDate) {
            $html .= '<tr><td><strong>Periode</strong></td><td>: Sampai '.e($endDate).'</td></tr>';
        } else {
            $html .= '<tr><td><strong>Periode</strong></td><td>: Semua data</td></tr>';
        }
        $html .= '</table>';

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
            ->whereIn('mapel_id', $mapels->pluck('id'));

        if ($startDate) {
            $absensisQuery->where('tanggal', '>=', $startDate);
        }
        if ($endDate) {
            $absensisQuery->where('tanggal', '<=', $endDate);
        }

        $absensis = $absensisQuery->orderBy('tanggal', 'asc')->orderBy('jam_ke')->get();

        $grouped = $absensis->groupBy('tanggal');

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

                    $html .= '<table>';
                    $html .= '<tr class="title-row"><td colspan="7">'.e($fullKelasName).' - '.e($formattedDate).' ('.e($mapel->nama_mapel).')'.'</td></tr>';
                    $html .= '<thead><tr>';
                    $html .= '<th style="width:35px">No</th>';
                    $html .= '<th style="width:85px">NIS</th>';
                    $html .= '<th style="min-width:180px">Nama Siswa</th>';
                    $html .= '<th style="width:100px">Jam Ke</th>';
                    $html .= '<th style="width:120px">Waktu</th>';
                    $html .= '<th style="width:85px">Status</th>';
                    $html .= '<th style="min-width:150px">Keterangan</th>';
                    $html .= '</tr></thead><tbody>';

                    if ($mapelAbsensis->isEmpty()) {
                        $html .= '<tr><td colspan="7" style="text-align:center; color:#888;">Belum ada data absensi.</td></tr>';
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

                            $html .= '<tr>';
                            $html .= '<td class="text-center">'.$no++.'</td>';
                            $html .= '<td>'.e($absensi->siswa->nis ?? '-').'</td>';
                            $html .= '<td>'.e($absensi->siswa->nama ?? '-').'</td>';
                            $html .= '<td class="text-center">'.e($jamLabel).'</td>';
                            $html .= '<td class="text-center">'.e($waktu).'</td>';
                            $html .= '<td class="text-center">'.e(ucfirst($absensi->status)).'</td>';
                            $html .= '<td>'.e($absensi->keterangan ?? '-').'</td>';
                            $html .= '</tr>';
                        }

                        $totalHadir = $mapelAbsensis->where('status', 'hadir')->count();
                        $totalSakit = $mapelAbsensis->where('status', 'sakit')->count();
                        $totalIzin = $mapelAbsensis->where('status', 'izin')->count();
                        $totalAlpha = $mapelAbsensis->where('status', 'alpha')->count();
                        $totalDispensasi = $mapelAbsensis->where('status', 'dispensasi')->count();

                        $html .= '<tr class="summary-row">';
                        $html .= '<td colspan="6" style="text-align:right;"><strong>Total</strong></td>';
                        $html .= '<td><strong>'.$mapelAbsensis->count().' entri</strong></td>';
                        $html .= '</tr>';
                        $html .= '<tr class="summary-row">';
                        $html .= '<td colspan="6" style="text-align:right;">Hadir / Sakit / Izin / Alpha / Dispensasi</td>';
                        $html .= '<td>'.$totalHadir.' / '.$totalSakit.' / '.$totalIzin.' / '.$totalAlpha.' / '.$totalDispensasi.'</td>';
                        $html .= '</tr>';
                    }

                    $html .= '</tbody></table>';
                }
            }
        }

        $html .= '</body></html>';

        return $html;
    }
}
