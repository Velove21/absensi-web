<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\TeacherAbsensi;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GuruAbsensiController extends Controller
{
    public function index()
    {
        $guru = request()->user()->guru;

        $today = Carbon::today()->toDateString();

        $todayAbsensi = TeacherAbsensi::where('guru_id', $guru->id)
            ->where('tanggal', $today)
            ->first();

        return Inertia::render('guru/absensi-guru/index', [
            'todayAbsensi' => $todayAbsensi ? [
                'id' => $todayAbsensi->id,
                'status' => $todayAbsensi->status,
                'keterangan' => $todayAbsensi->keterangan,
            ] : null,
            'tanggal' => $today,
        ]);
    }

    public function store(Request $request)
    {
        $guru = $request->user()->guru;

        $validated = $request->validate([
            'status' => 'required|in:hadir,izin,sakit',
            'keterangan' => 'required_if:status,izin,sakit|nullable|string|max:500',
        ]);

        $today = Carbon::today()->toDateString();

        $absensi = TeacherAbsensi::updateOrCreate(
            [
                'guru_id' => $guru->id,
                'tanggal' => $today,
            ],
            [
                'status' => $validated['status'],
                'keterangan' => $validated['keterangan'] ?? null,
            ]
        );

        return back()->with('success', 'Kehadiran berhasil dicatat.');
    }
}
