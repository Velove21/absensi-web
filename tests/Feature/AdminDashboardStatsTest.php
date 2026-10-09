<?php

use App\Models\JenjangKelas;
use App\Models\Jurusan;
use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $admin = User::factory()->create(['role' => 'admin', 'password_default' => false]);
    $this->actingAs($admin);

    $jenjang = JenjangKelas::create(['nama_jenjang' => 'X', 'urutan' => 1]);
    $pplg = Jurusan::create(['nama_jurusan' => 'Pengembangan Perangkat Lunak dan Gim', 'singkatan' => 'PPLG']);
    $dpib = Jurusan::create(['nama_jurusan' => 'Desain Pemodelan dan Informasi Bangunan', 'singkatan' => 'DPIB']);

    $this->kelasPplg = Kelas::create(['jurusan_id' => $pplg->id, 'jenjang_kelas_id' => $jenjang->id, 'nama_kelas' => 'A']);
    $this->kelasDpib = Kelas::create(['jurusan_id' => $dpib->id, 'jenjang_kelas_id' => $jenjang->id, 'nama_kelas' => 'A']);
});

function buatSiswaDiKelas(int $kelasId, string $nis, string $nama, bool $isAlumni = false): Siswa
{
    return Siswa::create([
        'user_id' => User::factory()->create(['role' => 'siswa', 'username' => $nis])->id,
        'kelas_id' => $kelasId,
        'nis' => $nis,
        'nama' => $nama,
        'is_alumni' => $isAlumni,
    ]);
}

test('dashboard total siswa dan distribusi per jurusan hanya menghitung siswa aktif', function () {
    buatSiswaDiKelas($this->kelasPplg->id, '25.013001', 'Siswa PPLG Satu');
    buatSiswaDiKelas($this->kelasPplg->id, '25.013002', 'Siswa PPLG Dua');
    buatSiswaDiKelas($this->kelasDpib->id, '25.013003', 'Siswa DPIB Satu');
    buatSiswaDiKelas($this->kelasPplg->id, '25.013004', 'Siswa Alumni', true);

    $this->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard')
            ->where('stats.total_siswa', 3)
            ->where('studentsPerJurusan', function ($jurusans) {
                $map = collect($jurusans)->pluck('count', 'singkatan')->all();

                return ($map['PPLG'] ?? null) === 2 && ($map['DPIB'] ?? null) === 1;
            })
        );
});

test('dashboard total siswa bertambah saat tambah data dan berkurang saat hapus data', function () {
    $this->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('stats.total_siswa', 0));

    $this->post(route('admin.siswa.store'), [
        'nis' => '25.013001',
        'nama' => 'Siswa Baru',
        'kelas_id' => $this->kelasPplg->id,
    ])->assertRedirect();

    $this->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('stats.total_siswa', 1));

    $siswa = Siswa::where('nis', '25.013001')->firstOrFail();

    $this->delete(route('admin.siswa.destroy', $siswa->id))->assertRedirect();

    $this->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('stats.total_siswa', 0));
});
