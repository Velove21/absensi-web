<?php

use App\Models\Jurusan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guest is redirected to login', function () {
    $response = $this->get(route('admin.matapelajaran.index'));
    $response->assertRedirect(route('login'));
});

test('admin can view mata pelajaran list', function () {
    $admin = User::create([
        'name' => 'Admin Test',
        'email' => 'admin@school.com',
        'password' => bcrypt('password'),
        'role' => 'admin',
        'username' => 'admin',
    ]);

    $this->actingAs($admin);

    $response = $this->get(route('admin.matapelajaran.index'));
    $response->assertOk();
});

test('admin can create general subject (MPU) without major', function () {
    $admin = User::create([
        'name' => 'Admin Test',
        'email' => 'admin@school.com',
        'password' => bcrypt('password'),
        'role' => 'admin',
        'username' => 'admin',
    ]);

    $this->actingAs($admin);

    $response = $this->post(route('admin.matapelajaran.store'), [
        'nama_mapel' => 'Pendidikan Jasmani',
        'kategori' => 'MPU',
        'jurusan_id' => '',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('mata_pelajarans', [
        'nama_mapel' => 'Pendidikan Jasmani',
        'kategori' => 'MPU',
        'jurusan_id' => null,
    ]);
});

test('admin cannot create kejuruan subject (KK) without major', function () {
    $admin = User::create([
        'name' => 'Admin Test',
        'email' => 'admin@school.com',
        'password' => bcrypt('password'),
        'role' => 'admin',
        'username' => 'admin',
    ]);

    $this->actingAs($admin);

    $response = $this->post(route('admin.matapelajaran.store'), [
        'nama_mapel' => 'Pemrograman Berorientasi Objek',
        'kategori' => 'KK',
        'jurusan_id' => '',
    ]);

    $response->assertSessionHasErrors(['jurusan_id']);
});

test('admin can create kejuruan subject (KK) with valid major', function () {
    $admin = User::create([
        'name' => 'Admin Test',
        'email' => 'admin@school.com',
        'password' => bcrypt('password'),
        'role' => 'admin',
        'username' => 'admin',
    ]);

    $this->actingAs($admin);

    $jurusan = Jurusan::create([
        'nama_jurusan' => 'Rekayasa Perangkat Lunak',
        'singkatan' => 'RPL',
    ]);

    $response = $this->post(route('admin.matapelajaran.store'), [
        'nama_mapel' => 'Pemrograman Berorientasi Objek',
        'kategori' => 'KK',
        'jurusan_id' => $jurusan->id,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('mata_pelajarans', [
        'nama_mapel' => 'Pemrograman Berorientasi Objek',
        'kategori' => 'KK',
        'jurusan_id' => $jurusan->id,
    ]);
});

test('admin can create dynamic class structure for SD/SMP (no tingkat and major)', function () {
    $admin = User::create([
        'name' => 'Admin Test',
        'email' => 'admin@school.com',
        'password' => bcrypt('password'),
        'role' => 'admin',
        'username' => 'admin',
    ]);

    $this->actingAs($admin);

    $response = $this->post(route('admin.kelas.store'), [
        'nama_kelas' => 'Kelas 1 A',
        'tingkat' => '',
        'jurusan_id' => '',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('kelas', [
        'nama_kelas' => 'Kelas 1 A',
        'tingkat' => null,
        'jurusan_id' => null,
    ]);
});
