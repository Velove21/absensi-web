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
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
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

        // Arsip rekap — samakan persis merging guru/DataAbsensi: berhalangan seharian prioritas, preserve bukti/keterangan
        $rawAll = Absensi::with(['siswa.kelas', 'siswa.foto'])
            ->orderBy('updated_at', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $groupedRaw = $rawAll->groupBy(fn ($a) => $a->siswa_id.'|'.(is_string($a->tanggal) ? $a->tanggal : $a->tanggal?->format('Y-m-d') ?? $a->tanggal));

        $merged = $groupedRaw->map(function ($group) {
            $sorted = $group->sort(function ($a, $b) {
                $ta = $a->updated_at ? $a->updated_at->getTimestamp() : 0;
                $tb = $b->updated_at ? $b->updated_at->getTimestamp() : 0;
                if ($ta === $tb) {
                    return $b->id <=> $a->id;
                }

                return $tb <=> $ta;
            })->values();

            $berhalangan = $sorted->first(fn ($it) => in_array($it->status, ['sakit', 'izin', 'dispensasi', 'alpha'], true));
            $primary = $berhalangan ?? $sorted->first();
            if (! $primary) {
                return null;
            }
            if (empty($primary->bukti)) {
                $latestBukti = $sorted->first(fn ($it) => ! empty($it->bukti));
                if ($latestBukti) {
                    $primary->setAttribute('bukti', $latestBukti->bukti);
                }
            }
            if ($primary->status === 'alpha' && empty(trim((string) $primary->keterangan))) {
                $withKet = $sorted->first(fn ($it) => $it->status === 'alpha' && ! empty(trim((string) $it->keterangan)));
                if ($withKet) {
                    $primary->setAttribute('keterangan', $withKet->keterangan);
                }
            }

            return $primary;
        })->filter()->values();

        $raw = $merged;

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

        // SNAPSHOT siswa aktif per kelas SEBELUM ada yang dipindah.
        // Tanpa ini, $kelas->siswas() membaca ulang DB setiap giliran kelas sehingga
        // siswa yang baru dipindah ikut diproses lagi (X -> XI -> XII -> alumni dalam sekali klik).
        // Alumni (is_alumni) juga dikecualikan agar tidak diproses ulang.
        $siswaPerKelas = Siswa::where('is_alumni', false)
            ->select('id', 'kelas_id')
            ->get()
            ->groupBy('kelas_id');

        $kelasList = Kelas::with(['jenjangKelas', 'jurusan'])->get();
        $jenjangNameById = $jenjangs->pluck('nama_jenjang', 'id');

        $movedCount = 0;
        $graduatedCount = 0;
        $movedPerJenjang = [];
        $graduatedKelasNames = [];

        DB::transaction(function () use ($active, $nextJenjangMap, $jenjangNameById, $siswaPerKelas, $kelasList, &$movedCount, &$graduatedCount, &$movedPerJenjang, &$graduatedKelasNames) {
            foreach ($kelasList as $kelas) {
                /** @var Collection<int, int> $ids */
                $ids = $siswaPerKelas->get($kelas->id, collect())->pluck('id')->values();

                if ($ids->isEmpty()) {
                    continue;
                }

                $nextJenjangId = $nextJenjangMap[$kelas->jenjang_kelas_id] ?? null;

                $nextKelas = null;

                if ($nextJenjangId !== null) {
                    $nextKelas = Kelas::where('jurusan_id', $kelas->jurusan_id)
                        ->where('jenjang_kelas_id', $nextJenjangId)
                        ->where('nama_kelas', $kelas->nama_kelas)
                        ->first();
                }

                if ($nextKelas === null) {
                    // Jenjang tertinggi (atau pasangan kelas tidak ada): tandai lulus.
                    // Flag is_alumni saja, JANGAN hapus siswa/user (mencegah data hilang).
                    ArsipPresensi::whereIn('siswa_id', $ids)->where('tahun_ajaran_id', $active->id)->update(['is_alumni' => true]);
                    Siswa::whereIn('id', $ids)->update(['is_alumni' => true]);
                    $graduatedCount += $ids->count();
                    $graduatedKelasNames[] = $this->kelasLabel($kelas, $jenjangNameById);

                    continue;
                }

                // Naik tepat 1 jenjang.
                Siswa::whereIn('id', $ids)->update(['kelas_id' => $nextKelas->id]);
                $movedCount += $ids->count();

                $from = $jenjangNameById->get($kelas->jenjang_kelas_id, '?');
                $to = $jenjangNameById->get($nextJenjangId, '?');
                $key = "{$from}→{$to}";
                $movedPerJenjang[$key] = ($movedPerJenjang[$key] ?? 0) + $ids->count();
            }
        });

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
        if (! empty($movedPerJenjang)) {
            $rincian = collect($movedPerJenjang)->map(fn ($jumlah, $arus) => "{$arus}: {$jumlah}")->join(', ');
            $message .= " ({$rincian}).";
        }
        if ($graduatedCount > 0) {
            $message .= ' '.$graduatedCount.' siswa lulus (Alumni) dari '.implode(', ', array_unique($graduatedKelasNames)).'.';
        }
        $message .= " Arsip tersimpan di {$oldYearLabel} (non-aktif). Aktif: {$nextTahun->tahun_awal}/{$nextTahun->tahun_akhir}.";

        return redirect()->back()->with('success', $message);
    }

    /**
     * Label kelas untuk pesan ringkasan, mis. "XII PPLG A".
     */
    private function kelasLabel(Kelas $kelas, $jenjangNameById): string
    {
        return trim($jenjangNameById->get($kelas->jenjang_kelas_id, '').' '.($kelas->jurusan?->singkatan ?? '').' '.$kelas->nama_kelas);
    }
}
