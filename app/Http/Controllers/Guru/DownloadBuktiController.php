<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DownloadBuktiController extends Controller
{
    public function download(Absensi $absensi)
    {
        $filePath = Storage::disk('public')->path($absensi->bukti);

        if (! file_exists($filePath)) {
            abort(404, 'File bukti tidak ditemukan.');
        }

        $siswa = $absensi->siswa;
        $tanggal = \Carbon\Carbon::parse($absensi->tanggal)->format('d-m-Y');
        $nama = Str::slug($siswa->nama);
        $ext = pathinfo($absensi->bukti, PATHINFO_EXTENSION);
        $filename = $tanggal . '-' . $nama . '.' . $ext;

        return response()->download($filePath, $filename);
    }
}
