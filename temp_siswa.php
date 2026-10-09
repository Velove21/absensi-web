<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Siswa;
use App\Models\Kelas;
use App\Models\TahunAjaran;
use App\Models\ArsipPresensi;

echo "=== SISWA is_alumni breakdown ===\n";
echo "total=".Siswa::count()." alumni=".Siswa::where('is_alumni',true)->count()." aktif=".Siswa::where('is_alumni',false)->count()."\n\n";

// per kelas aktif
echo "=== per KELAS (aktif+alumni) ===\n";
foreach (Kelas::with(['jurusan','jenjangKelas'])->orderBy('id')->get() as $k) {
    $total = Siswa::where('kelas_id',$k->id)->count();
    $alum = Siswa::where('kelas_id',$k->id)->where('is_alumni',true)->count();
    $aktif = Siswa::where('kelas_id',$k->id)->where('is_alumni',false)->count();
    if ($total>0 || in_array($k->id, [25,26,38,61,49,47])) {
        echo "Kelas ID={$k->id} {$k->full_nama_kelas} | total=$total alumni=$alum aktif=$aktif\n";
    }
}

echo "\n=== detail siswa alumni (limit 50) ===\n";
foreach (Siswa::with(['kelas.jenjangKelas','kelas.jurusan'])->where('is_alumni',true)->limit(50)->get() as $s) {
    $kl = $s->kelas ? $s->kelas->full_nama_kelas."(ID={$s->kelas_id})" : "null kelas_id={$s->kelas_id}";
    echo "Siswa ID={$s->id} NIS={$s->nis} nama={$s->nama} | kelas=$kl | is_alumni=1\n";
}

echo "\n=== TahunAjaran ===\n";
foreach (TahunAjaran::orderBy('id')->get() as $t) {
    $cnt = ArsipPresensi::where('tahun_ajaran_id',$t->id)->count();
    $cntA = ArsipPresensi::where('tahun_ajaran_id',$t->id)->where('is_alumni',true)->count();
    echo "TA ID={$t->id} {$t->tahun_awal}/{$t->tahun_akhir} active=".($t->is_active?1:0)." arsip=$cnt alumni_arsip=$cntA\n";
}

echo "\n=== ArsipPresensi is_alumni=true sample ===\n";
foreach (ArsipPresensi::where('is_alumni',true)->limit(10)->get() as $a) {
    echo "Arsip ID={$a->id} ta={$a->tahun_ajaran_id} siswa_id={$a->siswa_id} tgl={$a->tanggal} kelas_id={$a->kelas_id} is_alumni=1 | siswa_nama={$a->siswa_nama}\n";
}

echo "\n=== cek kelas XI TM A (38), XI PPLG A (26), XI DPIB B (25) detail ===\n";
foreach ([38,26,25,47,49,61] as $kid) {
    $k = Kelas::with(['jenjangKelas','jurusan'])->find($kid);
    $label = $k ? $k->full_nama_kelas : "Kelas $kid not found";
    echo "--- $label (ID=$kid) ---\n";
    $list = Siswa::where('kelas_id',$kid)->get();
    echo "  count=".count($list)."\n";
    foreach ($list as $s) {
        echo "    Siswa {$s->id} {$s->nis} {$s->nama} is_alumni=".($s->is_alumni?1:0)."\n";
    }
}

echo "\n=== cek juga siswa yang kelasnya XII tapi is_alumni===1 (harusnya setelah naik kelas, mereka stay di XII tapi flag alumni) ===\n";
$cnt = Siswa::whereHas('kelas.jenjangKelas', fn($q)=>$q->where('nama_jenjang','XII'))->where('is_alumni',true)->count();
echo "XII is_alumni count=$cnt\n";
foreach (Siswa::whereHas('kelas.jenjangKelas', fn($q)=>$q->where('nama_jenjang','XII'))->where('is_alumni',true)->limit(10)->get() as $s) {
    echo "  {$s->id} {$s->nama} kelas_id={$s->kelas_id} ".($s->kelas->full_nama_kelas ?? '')."\n";
}
