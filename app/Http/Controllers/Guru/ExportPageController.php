<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExportPageController extends Controller
{
    public function index(Request $request)
    {
        $guru = $request->user()->guru;

        if (! $guru) {
            return back()->with('error', 'Profil guru tidak ditemukan.');
        }

        $active = TahunAjaran::where('is_active', true)->first();
        $activeYear = null;
        if ($active) {
            try {
                $s = \Carbon\Carbon::create((int) $active->tahun_awal, 7, 1)->format('Y-m-d');
                $e = \Carbon\Carbon::create((int) $active->tahun_akhir, 6, 30)->format('Y-m-d');
                $activeYear = ['tahun_awal' => $active->tahun_awal, 'tahun_akhir' => $active->tahun_akhir, 'start' => $s, 'end' => $e];
            } catch (\Throwable $ex) {
            }
        }

        // Personal: hanya kelas & mapel yang diampu guru bersangkutan (privat), bukan universal
        return Inertia::render('guru/absensi/export', [
            'kelasList' => $guru->kelas()->with(['jurusan', 'jenjangKelas'])->orderBy('id')->get(),
            'mataPelajarans' => $guru->mataPelajarans()->with('kategoriPembelajaran')->orderBy('nama_mapel')->get(),
            'activeYear' => $activeYear,
        ]);
    }
}
