<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\ArsipPresensi;
use App\Models\JenjangKelas;
use App\Models\Kelas;
use App\Models\Siswa;
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

        $active = TahunAjaran::where('is_active', true)->first();

        if (! $active) {
            $active = TahunAjaran::latest('id')->first() ?? TahunAjaran::create([
                'tahun_awal' => date('Y'),
                'tahun_akhir' => (string) (date('Y') + 1),
            ]);
        }

        // Arsip rekap harian validasi guru terakhir per siswa per tanggal
        $raw = Absensi::with(['siswa.kelas'])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->groupBy(fn ($a) => $a->siswa_id.'|'.$a->tanggal)
            ->map(fn ($g) => $g->sortByDesc('updated_at')->first())
            ->values();

        foreach ($raw as $a) {
            ArsipPresensi::firstOrCreate(
                ['tahun_ajaran_id' => $active->id, 'siswa_id' => $a->siswa_id, 'tanggal' => $a->tanggal],
                ['kelas_id' => $a->siswa?->kelas_id, 'guru_id' => $a->guru_id, 'mapel_id' => $a->mapel_id, 'jam_ke' => $a->jam_ke, 'status' => $a->status, 'keterangan' => $a->keterangan, 'bukti' => $a->bukti, 'is_alumni' => false]
            );
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
                $ids = $kelas->siswas()->pluck('id');
                Siswa::whereIn('id', $ids)->update(['is_alumni' => true]);
                ArsipPresensi::whereIn('siswa_id', $ids)->where('tahun_ajaran_id', $active->id)->update(['is_alumni' => true]);
                $graduatedCount += $ids->count();

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
            $message .= " {$graduatedCount} siswa lulus (Alumni).";
        }

        return redirect()->back()->with('success', $message);
    }
}
