<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DataAbsensiController extends Controller
{
    public function index(Request $request)
    {
        $kelas = Kelas::with(['jurusan', 'jenjangKelas'])->get();

        $selectedKelasId = $request->query('kelas_id');
        $selectedMapelId = $request->query('mapel_id');
        $tanggal = $request->query('tanggal', now()->toDateString());
        $berhalanganHadir = $request->query('berhalangan_hadir') === 'true';

        $mataPelajarans = [];
        $absensis = [];

        if ($selectedKelasId) {
            $mataPelajarans = MataPelajaran::with('kategoriPembelajaran')->get();

            if ($selectedMapelId || $berhalanganHadir) {
                $absensisQuery = Absensi::with(['siswa', 'guru', 'mapel'])
                    ->whereHas('siswa', function ($q) use ($selectedKelasId) {
                        $q->where('kelas_id', $selectedKelasId);
                    });

                if ($selectedMapelId) {
                    $absensisQuery->where('mapel_id', $selectedMapelId);
                }

                if ($berhalanganHadir) {
                    $absensisQuery->whereIn('status', ['sakit', 'izin', 'alpha', 'dispensasi']);
                }

                if ($tanggal) {
                    $absensisQuery->where('tanggal', $tanggal);
                }

                $absensis = $absensisQuery->orderBy('jam_ke', 'asc')->get();
            }
        }

        return Inertia::render('guru/absensi/data', [
            'kelasList' => $kelas,
            'mataPelajarans' => $mataPelajarans,
            'filters' => [
                'kelas_id' => $selectedKelasId,
                'mapel_id' => $selectedMapelId,
                'tanggal' => $tanggal,
                'berhalangan_hadir' => $berhalanganHadir,
            ],
            'absensis' => $absensis,
        ]);
    }
}
