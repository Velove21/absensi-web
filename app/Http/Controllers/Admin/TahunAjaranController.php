<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\AbsensiPhoto;
use App\Models\ArsipPresensi;
use App\Models\JenjangKelas;
use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TahunAjaranController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/tahunajaran/index', [
            'tahunAjarans' => TahunAjaran::withCount('arsipPresensis')
                ->orderByRaw('CAST(tahun_awal AS UNSIGNED) ASC')
                ->orderByRaw('CAST(tahun_akhir AS UNSIGNED) ASC')
                ->paginate(10),
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
            $fotoUrl = $a->siswa?->foto_url;
            ArsipPresensi::firstOrCreate(
                ['tahun_ajaran_id' => $active->id, 'siswa_id' => $a->siswa_id, 'tanggal' => $a->tanggal],
                ['kelas_id' => $a->siswa?->kelas_id, 'guru_id' => $a->guru_id, 'mapel_id' => $a->mapel_id, 'jam_ke' => $a->jam_ke, 'status' => $a->status, 'keterangan' => $a->keterangan, 'bukti' => $a->bukti, 'is_alumni' => false, 'siswa_nis' => $a->siswa?->nis, 'siswa_nama' => $a->siswa?->nama, 'siswa_foto_url' => $fotoUrl]
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
                if ($ids->isNotEmpty()) {
                    // Tandai alumni di arsip + flag is_alumni saja, JANGAN hapus siswa/user (mencegah data hilang)
                    ArsipPresensi::whereIn('siswa_id', $ids)->where('tahun_ajaran_id', $active->id)->update(['is_alumni' => true]);
                    Siswa::whereIn('id', $ids)->update(['is_alumni' => true]);
                }
                $graduatedCount += $ids->count();

                continue;
            }

            $nextKelas = Kelas::where('jurusan_id', $kelas->jurusan_id)
                ->where('jenjang_kelas_id', $nextJenjangId)
                ->where('nama_kelas', $kelas->nama_kelas)
                ->first();

            if (! $nextKelas) {
                $ids = $kelas->siswas()->pluck('id');
                if ($ids->isNotEmpty()) {
                    ArsipPresensi::whereIn('siswa_id', $ids)->where('tahun_ajaran_id', $active->id)->update(['is_alumni' => true]);
                    Siswa::whereIn('id', $ids)->update(['is_alumni' => true]);
                }
                $graduatedCount += $ids->count();

                continue;
            }

            $movedCount += $kelas->siswas()->update(['kelas_id' => $nextKelas->id]);
        }

        // Bersihkan absensi aktif agar isolasi pertahun: tahun B tidak lihat data tahun A (pengecualian arsip)
        $absensiIds = $raw->pluck('id')->filter()->values();
        if ($absensiIds->isNotEmpty()) {
            Absensi::whereIn('id', $absensiIds)->delete();
            // juga hapus photos jika ada
            try {
                AbsensiPhoto::whereIn('absensi_id', $absensiIds)->delete();
            } catch (\Throwable $e) {
            }
        }

        // Otomatis nonaktifkan tahun lama, aktifkan tahun berikutnya
        $oldYearLabel = $active->tahun_awal.'/'.$active->tahun_akhir;
        $active->update(['is_active' => false]);

        $nextAwal = (string) ((int) $active->tahun_awal + 1);
        $nextAkhir = (string) ((int) $active->tahun_akhir + 1);

        $nextTahun = TahunAjaran::where('tahun_awal', $nextAwal)->where('tahun_akhir', $nextAkhir)->first();

        if (! $nextTahun) {
            $nextTahun = TahunAjaran::create(['tahun_awal' => $nextAwal, 'tahun_akhir' => $nextAkhir, 'is_active' => true]);
        } else {
            $nextTahun->update(['is_active' => true]);
        }

        $message = "Naik kelas berhasil: {$movedCount} siswa dipindahkan.";
        if ($graduatedCount > 0) {
            $message .= " {$graduatedCount} siswa lulus (Alumni).";
        }
        $message .= " Arsip tersimpan di {$oldYearLabel} (non-aktif). Aktif: {$nextTahun->tahun_awal}/{$nextTahun->tahun_akhir}.";

        return redirect()->back()->with('success', $message);
    }
}
