<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JenjangKelas;
use App\Models\Kelas;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TahunAjaranController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/tahunajaran/index', [
            'tahunAjarans' => TahunAjaran::orderByRaw('CAST(tahun_awal AS UNSIGNED) ASC')->orderByRaw('CAST(tahun_akhir AS UNSIGNED) ASC')->paginate(10),
            'isNaikKelasAvailable' => Kelas::whereHas('jenjangKelas', fn ($q) => $q->whereNotNull('urutan'))->exists()
                && JenjangKelas::whereNotNull('urutan')->count() > 1,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tahun_awal' => 'required|string|size:4',
            'tahun_akhir' => 'required|string|size:4|after:tahun_awal',
        ]);

        TahunAjaran::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, string $id)
    {
        $tahunAjaran = TahunAjaran::findOrFail($id);

        $validated = $request->validate([
            'tahun_awal' => 'required|string|size:4',
            'tahun_akhir' => 'required|string|size:4|after:tahun_awal',
        ]);

        $tahunAjaran->update($validated);

        return redirect()->back();
    }

    public function destroy(string $id)
    {
        $tahunAjaran = TahunAjaran::findOrFail($id);

        if ($tahunAjaran->is_active) {
            return redirect()->back()->withErrors(['active' => 'Tidak dapat menghapus tahun ajaran yang sedang aktif.']);
        }

        $tahunAjaran->delete();

        return redirect()->back();
    }

    public function activate(string $id)
    {
        $tahunAjaran = TahunAjaran::findOrFail($id);

        TahunAjaran::where('is_active', true)->update(['is_active' => false]);

        $tahunAjaran->update(['is_active' => true]);

        return redirect()->back();
    }

    public function naikKelas()
    {
        $jenjangs = JenjangKelas::whereNotNull('urutan')->orderBy('urutan')->get();

        if ($jenjangs->count() < 2) {
            return redirect()->back()->withErrors(['naik_kelas' => 'Jenjang kelas harus memiliki urutan yang valid.']);
        }

        $nextJenjangMap = [];
        for ($i = 0; $i < $jenjangs->count() - 1; $i++) {
            $nextJenjangMap[$jenjangs[$i]->id] = $jenjangs[$i + 1]->id;
        }

        $kelasList = Kelas::with('siswas')->get();

        $movedCount = 0;
        $graduatedCount = 0;

        foreach ($kelasList as $kelas) {
            $nextJenjangId = $nextJenjangMap[$kelas->jenjang_kelas_id] ?? null;

            if ($nextJenjangId === null) {
                $graduatedCount += $kelas->siswas()->count();

                continue;
            }

            $nextKelas = Kelas::where('jurusan_id', $kelas->jurusan_id)
                ->where('jenjang_kelas_id', $nextJenjangId)
                ->where('nama_kelas', $kelas->nama_kelas)
                ->first();

            if (! $nextKelas) {
                continue;
            }

            $movedCount += $kelas->siswas()->update(['kelas_id' => $nextKelas->id]);
        }

        $message = "Naik kelas berhasil: {$movedCount} siswa dipindahkan.";
        if ($graduatedCount > 0) {
            $message .= " {$graduatedCount} siswa lulus (jenjang tertinggi).";
        }

        return redirect()->back()->with('success', $message);
    }
}
