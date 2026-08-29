<?php

use App\Models\Guru;
use App\Models\JenjangKelas;
use App\Models\Jurusan;
use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function createSiswaProfile(array $extra = []): array
{
    $kelas = Kelas::create([
        'jurusan_id' => Jurusan::create(['nama_jurusan' => 'Aplikasi Perkantoran', 'singkatan' => 'AP'])->id,
        'jenjang_kelas_id' => JenjangKelas::create(['nama_jenjang' => 'XI', 'urutan' => 11])->id,
        'nama_kelas' => 'A',
    ]);

    $user = User::factory()->create(array_merge(['role' => 'siswa', 'password_default' => false], $extra));

    $siswa = Siswa::create([
        'user_id' => $user->id,
        'kelas_id' => $kelas->id,
        'nis' => '24.012505',
        'nama' => 'Velove Azalia Putri',
        'jenis_kelamin' => 'perempuan',
    ]);

    return [$user, $siswa];
}

test('siswa can view his own profile page with kelas identity', function () {
    [$user] = createSiswaProfile();

    $this->actingAs($user)
        ->get(route('siswa.profil'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('siswa/profil')
            ->where('profil.nis', '24.012505')
            ->where('profil.nama', 'Velove Azalia Putri')
            ->where('profil.jenis_kelamin', 'perempuan')
            ->where('profil.kelas.full_nama_kelas', 'XI AP A')
            ->has('profil.foto_url'));
});

test('shared auth user of siswa exposes profile data and kelas identity', function () {
    [$user] = createSiswaProfile();

    $this->actingAs($user)
        ->get(route('siswa.profil'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.role', 'siswa')
            ->where('auth.user.siswa.nis', '24.012505')
            ->where('auth.user.siswa.nama', 'Velove Azalia Putri')
            ->where('auth.user.siswa.kelas.full_nama_kelas', 'XI AP A')
            ->has('auth.user.avatar'));
});

test('guru role cannot access siswa profile page', function () {
    $user = User::factory()->create(['role' => 'guru', 'password_default' => false]);
    Guru::create([
        'user_id' => $user->id,
        'nip' => '198501012010011001',
        'nama' => 'Ahmad Fauzi',
    ]);

    $this->actingAs($user)
        ->get(route('siswa.profil'))
        ->assertForbidden();
});
