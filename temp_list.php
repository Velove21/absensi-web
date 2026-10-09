<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Kelas;
use App\Models\JenjangKelas;
use App\Models\Jurusan;

echo "=== KELAS TERSEDIA ===\n";
$all = Kelas::with(['jurusan','jenjangKelas'])->orderBy('id')->get();
if ($all->isEmpty()) {
    echo "(kosong)\n";
}
foreach ($all as $k) {
    echo "ID={$k->id} | jenjang=".($k->jenjangKelas->nama_jenjang ?? '-')." | jurusan=".($k->jurusan->singkatan ?? '-')." (".($k->jurusan->nama_jurusan ?? '-').") | nama_kelas=".($k->nama_kelas ?? '-')." | full='{$k->full_nama_kelas}' | jenjang_id=".($k->jenjang_kelas_id ?? 'null')." jurusan_id=".($k->jurusan_id ?? 'null')."\n";
}
echo "\n=== JENJANG ===\n";
foreach (JenjangKelas::orderBy('urutan')->get() as $j) {
    echo "ID={$j->id} | {$j->nama_jenjang} | urutan=".($j->urutan ?? 'null')."\n";
}
if (JenjangKelas::count()===0) echo "(kosong)\n";
echo "\n=== JURUSAN ===\n";
foreach (Jurusan::all() as $j) {
    echo "ID={$j->id} | {$j->nama_jurusan} | {$j->singkatan}\n";
}
if (Jurusan::count()===0) echo "(kosong)\n";
