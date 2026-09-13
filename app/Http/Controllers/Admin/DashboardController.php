<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Guru;
use App\Models\Jurusan;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Siswa;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $tanggal = $request->query('tanggal', Carbon::today()->format('Y-m-d'));

        // Attendance stats for the selected date - hitung berdasarkan data terbaru per siswa dengan merge surat seharian (berhalangan mengalahkan Hadir)
        $rawForDate = Absensi::where('tanggal', $tanggal)
            ->orderBy('updated_at', 'desc')
            ->orderBy('id', 'desc')
            ->get();
        $latestForDate = $rawForDate->groupBy('siswa_id')->map(function ($group) {
            $sorted = $group->sort(function ($a, $b) {
                $ta = $a->updated_at ? $a->updated_at->getTimestamp() : 0;
                $tb = $b->updated_at ? $b->updated_at->getTimestamp() : 0;
                if ($ta === $tb) {
                    return $b->id <=> $a->id;
                }

                return $tb <=> $ta;
            })->values();
            $berhalangan = $sorted->first(function ($it) {
                return in_array($it->status, ['sakit', 'izin', 'dispensasi', 'alpha'], true);
            });

            return $berhalangan ?? $sorted->first();
        })->filter()->values();
        $grouped = $latestForDate->groupBy('status')->map->count()->toArray();
        $attendanceStats = [
            'hadir' => $grouped['hadir'] ?? 0,
            'sakit' => $grouped['sakit'] ?? 0,
            'izin' => $grouped['izin'] ?? 0,
            'alpha' => $grouped['alpha'] ?? 0,
            'dispensasi' => $grouped['dispensasi'] ?? 0,
        ];

        // Kelas sudah diabsen: distinct kelas_id yang memiliki absensi di tanggal tersebut
        $kelasSudahAbsen = DB::table('absensis')
            ->join('siswas', 'absensis.siswa_id', '=', 'siswas.id')
            ->where('absensis.tanggal', $tanggal)
            ->distinct()
            ->count(DB::raw('siswas.kelas_id'));

        // Students per Jurusan
        $studentsPerJurusan = DB::table('siswas')
            ->join('kelas', 'siswas.kelas_id', '=', 'kelas.id')
            ->join('jurusans', 'kelas.jurusan_id', '=', 'jurusans.id')
            ->select('jurusans.singkatan', DB::raw('count(siswas.id) as count'))
            ->groupBy('jurusans.id', 'jurusans.singkatan')
            ->get();

        // Detailed Attendance Data (for stat detail dialog)
        $detailStatus = $request->query('status');

        $detailedAttendance = [];
        if ($detailStatus) {
            $query = Absensi::with(['siswa.kelas.jurusan', 'mapel', 'guru'])
                ->where('tanggal', $tanggal)
                ->where('status', $detailStatus);

            $detailedAttendance = $query->orderBy('jam_ke')->get()->map(function ($absensi) {
                return [
                    'id' => $absensi->id,
                    'jam_ke' => $absensi->jam_ke,
                    'status' => $absensi->status,
                    'keterangan' => $absensi->keterangan,
                    'bukti' => $absensi->bukti,
                    'siswa' => [
                        'nis' => $absensi->siswa->nis,
                        'nama' => $absensi->siswa->nama,
                    ],
                    'kelas' => $absensi->siswa->kelas ?
                        trim($absensi->siswa->kelas->tingkat.' '.
                        ($absensi->siswa->kelas->jurusan ? $absensi->siswa->kelas->jurusan->singkatan : '').' '.
                        $absensi->siswa->kelas->nama_kelas) : '-',
                    'mapel' => $absensi->mapel ? $absensi->mapel->nama_mapel : '-',
                    'guru' => $absensi->guru ? $absensi->guru->nama : '-',
                ];
            });
        }

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total_admin' => User::where('role', 'admin')->count(),
                'total_siswa' => Siswa::count(),
                'total_guru' => Guru::count(),
                'total_kelas' => Kelas::count(),
                'total_jurusan' => Jurusan::count(),
                'total_mata_pelajaran' => MataPelajaran::count(),
            ],
            'attendanceToday' => array_merge($attendanceStats, ['kelas' => $kelasSudahAbsen]),
            'studentsPerJurusan' => $studentsPerJurusan,
            'filters' => [
                'tanggal' => $tanggal,
            ],
            'detailedAttendance' => $detailedAttendance,
            'gurus' => Guru::with(['mataPelajarans.kategoriPembelajaran', 'kelas.jurusan', 'kelas.jenjangKelas'])->orderBy('nama')->get()->map(function ($guru) {
                return [
                    'id' => $guru->id,
                    'nama' => $guru->nama,
                    'nip' => $guru->nip,
                    'mapels' => $guru->mataPelajarans->map(function ($mapel) {
                        return [
                            'id' => $mapel->id,
                            'nama_mapel' => $mapel->nama_mapel,
                            'kategori' => $mapel->kategori,
                        ];
                    }),
                    'kelasList' => $guru->kelas->map(function ($kelas) {
                        return [
                            'id' => $kelas->id,
                            'nama_kelas' => $kelas->nama_kelas,
                            'full_nama_kelas' => $kelas->full_nama_kelas,
                            'tingkat' => $kelas->jenjangKelas?->nama_jenjang,
                            'jurusan' => $kelas->jurusan ? [
                                'singkatan' => $kelas->jurusan->singkatan,
                            ] : null,
                        ];
                    }),
                ];
            }),
        ]);
    }
}
