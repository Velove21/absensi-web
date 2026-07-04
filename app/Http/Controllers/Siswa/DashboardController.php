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

        $history = $siswa->absensis()
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_ke', 'asc')
            ->get();

        return Inertia::render('siswa/dashboard', [
            'siswa' => $siswa->load('kelas.jurusan', 'kelas.jenjangKelas'),
            'stats' => $stats,
            'history' => $history,
            'passwordDefault' => $request->user()->password_default,
        ]);
    }
}
