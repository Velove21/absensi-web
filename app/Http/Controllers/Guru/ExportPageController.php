<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
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

        // Personal: hanya kelas & mapel yang diampu guru bersangkutan (privat), bukan universal
        return Inertia::render('guru/absensi/export', [
            'kelasList' => $guru->kelas()->with(['jurusan', 'jenjangKelas'])->orderBy('id')->get(),
            'mataPelajarans' => $guru->mataPelajarans()->with('kategoriPembelajaran')->orderBy('nama_mapel')->get(),
        ]);
    }
}
