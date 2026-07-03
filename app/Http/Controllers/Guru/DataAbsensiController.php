<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Kelas;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DataAbsensiController extends Controller
{
    public function index(Request $request)
    {
        $guru = $request->user()->guru;

        $kelas = Kelas::with(['jurusan', 'jenjangKelas'])->get();

        $selectedKelasId = $request->query('kelas_id');
        $selectedMapelId = $request->query('mapel_id');
        $tanggal = $request->query('tanggal', now()->toDateString());

        $mataPelajarans = [];
        $absensis = [];

        if ($selectedKelasId) {
            $selectedKelas = Kelas::findOrFail($selectedKelasId);

            // Fetch subjects explicitly assigned to the guru in the admin section
            $mataPelajarans = $guru ? $guru->mataPelajarans()->with('kategoriPembelajaran')->get() : collect([]);

            if ($selectedMapelId) {
                // Fetch attendance data
                $absensisQuery = Absensi::with(['siswa', 'guru', 'mapel'])
                    ->whereHas('siswa', function ($q) use ($selectedKelasId) {
                        $q->where('kelas_id', $selectedKelasId);
                    })
                    ->where('mapel_id', $selectedMapelId);

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
            ],
            'absensis' => $absensis,
        ]);
    }
}
