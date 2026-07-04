<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Guru;
use App\Models\Jurusan;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Siswa;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        // Date filter for attendance
        $tanggal = $request->query('tanggal', Carbon::today()->format('Y-m-d'));
        
        $attendanceToday = Absensi::where('tanggal', $tanggal)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        $attendanceStats = [
            'hadir' => 0,
            'sakit' => 0,
            'izin' => 0,
            'alpha' => 0,
            'dispensasi' => 0,
        ];
        foreach ($attendanceToday as $stat) {
            $attendanceStats[$stat->status] = $stat->count;
        }

        // Students per Jurusan
        $studentsPerJurusan = DB::table('siswas')
            ->join('kelas', 'siswas.kelas_id', '=', 'kelas.id')
            ->join('jurusans', 'kelas.jurusan_id', '=', 'jurusans.id')
            ->select('jurusans.singkatan', DB::raw('count(siswas.id) as count'))
            ->groupBy('jurusans.id', 'jurusans.singkatan')
            ->get();

        // Detailed Attendance Data (if filter is applied)
        $detailStatus = $request->query('status');
        $detailKelasId = $request->query('kelas_id');
        
        $detailedAttendance = [];
        if ($detailStatus || $detailKelasId) {
            $query = Absensi::with(['siswa.kelas.jurusan', 'mataPelajaran', 'guru'])
                ->where('tanggal', $tanggal);
                
            if ($detailStatus) {
                $query->where('status', $detailStatus);
            }
            if ($detailKelasId) {
                $query->whereHas('siswa', function($q) use ($detailKelasId) {
                    $q->where('kelas_id', $detailKelasId);
                });
            }
            
            $detailedAttendance = $query->orderBy('jam_ke')->get()->map(function($absensi) {
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
                        trim($absensi->siswa->kelas->tingkat . ' ' . 
                        ($absensi->siswa->kelas->jurusan ? $absensi->siswa->kelas->jurusan->singkatan : '') . ' ' . 
                        $absensi->siswa->kelas->nama_kelas) : '-',
                    'mapel' => $absensi->mataPelajaran->nama_mapel,
                    'guru' => $absensi->guru ? $absensi->guru->nama : '-',
                ];
            });
        }

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total_jurusan' => Jurusan::count(),
                'total_kelas' => Kelas::count(),
                'total_guru' => Guru::count(),
                'total_siswa' => Siswa::count(),
            ],
            'attendanceToday' => $attendanceStats,
            'studentsPerJurusan' => $studentsPerJurusan,
            'filters' => [
                'tanggal' => $tanggal,
                'status' => $detailStatus,
                'kelas_id' => $detailKelasId,
            ],
            'detailedAttendance' => $detailedAttendance,
            'kelasList' => Kelas::with('jurusan')->get(),
            'gurus' => Guru::orderBy('nama')->get(['id', 'nama', 'nip']),
            'mataPelajarans' => MataPelajaran::with('kategoriPembelajaran')->get(),
        ]);
    }
}
