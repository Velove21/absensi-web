<?php

use App\Models\JenjangKelas;
use App\Models\Jurusan;
use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $admin = User::factory()->create(['role' => 'admin', 'password_default' => false]);
    $this->actingAs($admin);

    $x = JenjangKelas::create(['nama_jenjang' => 'X', 'urutan' => 1]);
    $xi = JenjangKelas::create(['nama_jenjang' => 'XI', 'urutan' => 2]);
    $xii = JenjangKelas::create(['nama_jenjang' => 'XII', 'urutan' => 3]);

    $jurusan = Jurusan::create(['nama_jurusan' => 'Pengembangan Perangkat Lunak dan Gim', 'singkatan' => 'PPLG']);

    $this->kelasX = Kelas::create(['jurusan_id' => $jurusan->id, 'jenjang_kelas_id' => $x->id, 'nama_kelas' => 'A']);
    $this->kelasXI = Kelas::create(['jurusan_id' => $jurusan->id, 'jenjang_kelas_id' => $xi->id, 'nama_kelas' => 'A']);
    $this->kelasXII = Kelas::create(['jurusan_id' => $jurusan->id, 'jenjang_kelas_id' => $xii->id, 'nama_kelas' => 'A']);
});

function buatSiswaNaikKelas(int $kelasId, string $nis, bool $isAlumni = false): Siswa
{
    return Siswa::create([
        'user_id' => User::factory()->create(['role' => 'siswa', 'username' => $nis])->id,
        'kelas_id' => $kelasId,
        'nis' => $nis,
        'nama' => 'Siswa '.$nis,
        'is_alumni' => $isAlumni,
    ]);
}

test('naik kelas memindahkan tiap jenjang tepat satu tingkat tanpa efek cascade', function () {
    $x1 = buatSiswaNaikKelas($this->kelasX->id, '25.090001');
    $x2 = buatSiswaNaikKelas($this->kelasX->id, '25.090002');
    $xi1 = buatSiswaNaikKelas($this->kelasXI->id, '24.090001');
    $xii1 = buatSiswaNaikKelas($this->kelasXII->id, '23.090001');
    $alumniLama = buatSiswaNaikKelas($this->kelasXII->id, '22.090001', true);

    $response = $this->post(route('admin.tahun-ajaran.naik-kelas'));

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // X -> XI (tetap aktif, bukan alumni)
    expect($x1->fresh()->kelas_id)->toBe($this->kelasXI->id)
        ->and((bool) $x1->fresh()->is_alumni)->toBeFalse()
        ->and($x2->fresh()->kelas_id)->toBe($this->kelasXI->id)
        ->and((bool) $x2->fresh()->is_alumni)->toBeFalse();

    // XI -> XII (tetap aktif, TIDAK tersapu jadi alumni)
    expect($xi1->fresh()->kelas_id)->toBe($this->kelasXII->id)
        ->and((bool) $xi1->fresh()->is_alumni)->toBeFalse();

    // XII -> lulus (satu-satunya yang jadi alumni baru)
    expect((bool) $xii1->fresh()->is_alumni)->toBeTrue()
        ->and($xii1->fresh()->kelas_id)->toBe($this->kelasXII->id);

    // Alumni lama tidak diutak-atik
    expect((bool) $alumniLama->fresh()->is_alumni)->toBeTrue()
        ->and($alumniLama->fresh()->kelas_id)->toBe($this->kelasXII->id);

    // Komposisi akhir: X kosong, XI berisi 2 pindahan X, XII berisi 1 aktif + 2 alumni
    expect(Siswa::where('kelas_id', $this->kelasX->id)->count())->toBe(0)
        ->and(Siswa::where('kelas_id', $this->kelasXI->id)->where('is_alumni', false)->count())->toBe(2)
        ->and(Siswa::where('kelas_id', $this->kelasXII->id)->where('is_alumni', false)->count())->toBe(1)
        ->and(Siswa::where('kelas_id', $this->kelasXII->id)->where('is_alumni', true)->count())->toBe(2);
});

test('naik kelas melaporkan rincian pindahan per jenjang dan kelulusan', function () {
    buatSiswaNaikKelas($this->kelasX->id, '25.090001');
    buatSiswaNaikKelas($this->kelasXII->id, '23.090001');

    $response = $this->post(route('admin.tahun-ajaran.naik-kelas'));

    $response->assertRedirect();
    $response->assertSessionHas('success', fn ($pesan) => str_contains($pesan, '1 siswa dipindahkan')
        && str_contains($pesan, 'X→XI: 1')
        && str_contains($pesan, '1 siswa lulus (Alumni)'));
});

test('naik kelas menggulirkan tahun ajaran aktif ke tahun berikutnya', function () {
    buatSiswaNaikKelas($this->kelasX->id, '25.090001');

    $this->post(route('admin.tahun-ajaran.naik-kelas'))->assertRedirect();

    expect(TahunAjaran::where('is_active', true)->count())->toBe(1);
});
