<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ArsipPresensi;
use App\Models\JenjangKelas;
use App\Models\Jurusan;
use App\Models\Kelas;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ArsipController extends Controller
{
    public function tingkat(Request $request, TahunAjaran $tahunAjaran)
    {
        $jenjangs = JenjangKelas::orderBy('urutan')->get();
        $jurusans = Jurusan::orderBy('singkatan')->get();

        return Inertia::render('admin/arsip/tingkat', ['tahunAjaran' => $tahunAjaran, 'jenjangs' => $jenjangs, 'jurusans' => $jurusans]);
    }

    public function kelas(Request $request, TahunAjaran $tahunAjaran, string $jenjangId, string $jurusanId)
    {
        $kelasList = Kelas::with(['jurusan', 'jenjangKelas'])->where('jenjang_kelas_id', $jenjangId)->where('jurusan_id', $jurusanId)->orderBy('nama_kelas')->get();

        return Inertia::render('admin/arsip/kelas', ['tahunAjaran' => $tahunAjaran, 'kelasList' => $kelasList, 'jenjang' => JenjangKelas::findOrFail($jenjangId), 'jurusan' => Jurusan::findOrFail($jurusanId)]);
    }

    public function detail(Request $request, TahunAjaran $tahunAjaran, Kelas $kelas)
    {
        $arsip = ArsipPresensi::with(['siswa.foto', 'kelas.jurusan', 'kelas.jenjangKelas'])->where('tahun_ajaran_id', $tahunAjaran->id)->where('kelas_id', $kelas->id)->orderBy('tanggal')->get();
        // Group per siswa per tanggal terbaru like lihat presensi
        $grouped = $arsip->groupBy(fn ($a) => $a->siswa_id.'|'.$a->tanggal)->map(fn ($g) => $g->sortByDesc('updated_at')->first())->values();
        $stats = ['hadir' => 0, 'sakit' => 0, 'izin' => 0, 'alpha' => 0, 'dispensasi' => 0];
        foreach ($grouped as $r) {
            if (isset($stats[$r->status])) {
                $stats[$r->status]++;
            }
        }

        return Inertia::render('admin/arsip/detail', ['tahunAjaran' => $tahunAjaran, 'kelas' => $kelas->load(['jurusan', 'jenjangKelas']), 'records' => $grouped->map(fn ($a) => ['id' => $a->id, 'nis' => $a->siswa?->nis, 'nama' => $a->siswa?->nama, 'foto_url' => $a->siswa?->foto_url, 'kelas' => $a->kelas?->full_nama_kelas, 'is_alumni' => $a->is_alumni, 'status' => $a->status, 'tanggal' => $a->tanggal->format('Y-m-d')])->values(), 'stats' => $stats]);
    }

    public function export(Request $request, TahunAjaran $tahunAjaran, Kelas $kelas)
    {
        $arsip = ArsipPresensi::with(['siswa', 'kelas'])->where('tahun_ajaran_id', $tahunAjaran->id)->where('kelas_id', $kelas->id)->orderBy('siswa_id')->get();
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray(['No', 'Foto', 'NIS', 'Nama', 'Kelas', 'Status'], null, 'A1');
        $row = 2;
        foreach ($arsip as $i => $a) {
            $sheet->fromArray([$i + 1, '', $a->siswa?->nis, $a->siswa?->nama, $a->kelas?->full_nama_kelas, $a->status], null, "A{$row}");
            $row++;
        }
        $filename = 'arsip-rekap-presensi-'.Str::slug($kelas->full_nama_kelas).'-'.$tahunAjaran->tahun_awal.$tahunAjaran->tahun_akhir.'.xlsx';
        $tmp = tempnam(sys_get_temp_dir(), 'arsip');
        $writer = new Xlsx($spreadsheet);
        $writer->save($tmp);

        return response()->download($tmp, $filename)->deleteFileAfterSend(true);
    }
}
