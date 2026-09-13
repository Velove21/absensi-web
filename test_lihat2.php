<?php

use App\Models\Absensi;

$kelas_id = 61;
$tanggal = '2026-09-08';
$berhalangan = false;

$query = Absensi::with(['siswa.kelas.jurusan', 'siswa.kelas.jenjangKelas', 'siswa.foto', 'guru', 'mapel.kategoriPembelajaran'])
    ->whereHas('siswa', function ($q) use ($kelas_id) {
        $q->where('kelas_id', $kelas_id);
    })
    ->where('tanggal', $tanggal)
    ->orderBy('updated_at', 'desc')
    ->orderBy('id', 'desc');

if ($berhalangan) {
    $query->whereIn('status', ['sakit', 'izin', 'alpha', 'dispensasi']);
}
$raw = $query->get();
echo 'raw count '.$raw->count()."\n";
$latest = $raw->unique('siswa_id')->values();
echo 'latest count '.$latest->count()."\n";
foreach ($latest->take(3) as $a) {
    echo $a->id.' siswa '.$a->siswa_id.' status '.$a->status.' guru '.$a->guru_id.' mapel '.$a->mapel_id.' updated '.$a->updated_at."\n";
}
$sorted = $latest->sortBy(function ($a) {
    $nis = trim((string) ($a->siswa?->nis ?? ''));
    if ($nis !== '') {
        return $nis;
    }

    return sprintf('%08d', $a->siswa_id);
}, SORT_NATURAL)->values();
echo "sorted first 3:\n";
foreach ($sorted->take(3) as $a) {
    echo $a->siswa->nis.' '.$a->siswa->nama.' '.$a->status."\n";
}
