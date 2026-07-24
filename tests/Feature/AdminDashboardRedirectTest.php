<?php

use App\Models\Guru;
use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

uses(LazilyRefreshDatabase::class);

test('admin with false password_default can access admin dashboard directly', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'password_default' => false,
    ]);

    $response = $this->actingAs($admin)->get(route('admin.dashboard'));

    $response->assertOk();
});

test('admin with true password_default is redirected to force change password', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'password_default' => true,
    ]);

    $response = $this->actingAs($admin)->get(route('admin.dashboard'));

    $response->assertRedirect(route('password.change.show'));
});

test('admin can authenticate and redirect to admin dashboard when password_default is false', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'password_default' => false,
    ]);

    $response = $this->post(route('login.store'), [
        'login' => $admin->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('admin.dashboard'));
});

test('admin can authenticate and handles password_default true without loop', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'password_default' => true,
    ]);

    $response = $this->post(route('login.store'), [
        'login' => $admin->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('admin.dashboard'));

    $nextResponse = $this->get(route('admin.dashboard'));
    $nextResponse->assertRedirect(route('password.change.show'));
});

test('guru can authenticate and redirect to guru absensi index', function () {
    $user = User::factory()->create([
        'role' => 'guru',
        'password_default' => false,
    ]);

    Guru::create([
        'user_id' => $user->id,
        'nama' => 'Guru Test',
        'nip' => '12345678',
    ]);

    $response = $this->post(route('login.store'), [
        'login' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('guru.absensi.index'));
});

test('siswa can authenticate and redirect to siswa dashboard', function () {
    $kelas = Kelas::create([
        'nama_kelas' => 'X RPL 1',
    ]);

    $user = User::factory()->create([
        'role' => 'siswa',
        'password_default' => false,
    ]);

    Siswa::create([
        'user_id' => $user->id,
        'kelas_id' => $kelas->id,
        'nama' => 'Siswa Test',
        'nis' => '87654321',
    ]);

    $response = $this->post(route('login.store'), [
        'login' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('siswa.dashboard'));
});

test('authenticated user accessing /dashboard redirects to appropriate role dashboard', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'password_default' => false,
    ]);

    $response = $this->actingAs($admin)->get('/dashboard');

    $response->assertRedirect(route('admin.dashboard'));
});
