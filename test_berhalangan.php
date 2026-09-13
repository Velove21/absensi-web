<?php

use App\Models\Absensi;

$kelas_id = 61;
$tanggal = '2026-09-08';
$berhalangan = true;
$query = Absensi::with(['siswa'])->whereHas('siswa', fn ($q) => $q->where('kelas_id', $kelas_id))->where('tanggal', $tanggal);
if ($berhalangan) {
    $query->whereIn('status', ['sakit', 'izin', 'alpha', 'dispensasi']);
}
$raw = $query->orderBy('updated_at', 'desc')->get();
echo 'raw '.$raw->count()."\n";
$latest = $raw->unique('siswa_id')->values();
echo 'latest '.$latest->count()."\n";
foreach ($latest->take(5) as $a) {
    echo $a->status.' '.$a->siswa->nis."\n";
}
