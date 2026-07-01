<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $siswa = $request->user()->siswa;

        if (! $siswa) {
            return redirect()->route('home')->with('error', 'Profil Siswa tidak ditemukan.');
        }

        $stats = [
            'hadir' => $siswa->absensis()->where('status', 'hadir')->count(),
            'sakit' => $siswa->absensis()->where('status', 'sakit')->count(),
            'izin' => $siswa->absensis()->where('status', 'izin')->count(),
            'alpha' => $siswa->absensis()->where('status', 'alpha')->count(),
            'dispensasi' => $siswa->absensis()->where('status', 'dispensasi')->count(),
        ];

        $allHistory = $siswa->absensis()
            ->with('mapel')
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_ke', 'asc')
            ->get();

        $groupedHistory = [
            'Senin' => [],
            'Selasa' => [],
            'Rabu' => [],
            'Kamis' => [],
            'Jumat' => [],
        ];

        $daysMap = [
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
        ];

        foreach ($allHistory as $record) {
            $dayOfWeek = date('N', strtotime($record->tanggal)); // 1 to 7
            if (isset($daysMap[$dayOfWeek])) {
                $groupedHistory[$daysMap[$dayOfWeek]][] = $record;
            }
        }

        return Inertia::render('siswa/dashboard', [
            'siswa' => $siswa->load('kelas.jurusan'),
            'stats' => $stats,
            'groupedHistory' => $groupedHistory,
            'passwordDefault' => $request->user()->password_default,
        ]);
    }
}
