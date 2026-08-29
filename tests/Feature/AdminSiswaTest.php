<?php

use App\Models\JenjangKelas;
use App\Models\Jurusan;
use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin', 'password_default' => false]);
    $this->actingAs($this->admin);

    $this->kelas = Kelas::create([
        'jurusan_id' => Jurusan::create(['nama_jurusan' => 'Aplikasi Perkantoran', 'singkatan' => 'AP'])->id,
        'jenjang_kelas_id' => JenjangKelas::create(['nama_jenjang' => 'XI', 'urutan' => 11])->id,
        'nama_kelas' => 'A',
    ]);
});

test('guest is redirected to login on siswa index', function () {
    auth()->logout();

    $this->get(route('admin.siswa.index'))->assertRedirect(route('login'));
});

test('admin can view siswa list', function () {
    Siswa::create([
        'user_id' => User::factory()->create(['role' => 'siswa', 'username' => '24.012505'])->id,
        'kelas_id' => $this->kelas->id,
        'nis' => '24.012505',
        'nama' => 'Velove Azalia Putri',
    ]);

    $this->get(route('admin.siswa.index'))->assertOk();
});

test('admin can create siswa with valid NIS format', function () {
    $response = $this->post(route('admin.siswa.store'), [
        'nis' => '24.012505',
        'nama' => 'Velove Azalia Putri',
        'jenis_kelamin' => 'perempuan',
        'kelas_id' => $this->kelas->id,
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('siswas', [
        'nis' => '24.012505',
        'nama' => 'Velove Azalia Putri',
        'jenis_kelamin' => 'perempuan',
    ]);
});

test('admin cannot create siswa with wrong NIS format', function () {
    $response = $this->post(route('admin.siswa.store'), [
        'nis' => '24.0125',
        'nama' => 'Velove Azalia Putri',
        'kelas_id' => $this->kelas->id,
    ]);

    $response->assertSessionHasErrors(['nis']);
});

test('admin can update siswa with its existing NIS', function () {
    $siswa = Siswa::create([
        'user_id' => User::factory()->create(['role' => 'siswa', 'username' => '24.012505'])->id,
        'kelas_id' => $this->kelas->id,
        'nis' => '24.012505',
        'nama' => 'Velove Azalia Putri',
    ]);

    $response = $this->put(route('admin.siswa.update', $siswa->id), [
        'nis' => '24.012505',
        'nama' => 'Velove Azalia Putri',
        'jenis_kelamin' => 'perempuan',
        'kelas_id' => $this->kelas->id,
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('siswas', [
        'id' => $siswa->id,
        'nis' => '24.012505',
        'jenis_kelamin' => 'perempuan',
    ]);
});

test('admin can create siswa with an uploaded foto', function () {
    Storage::fake('public');

    $response = $this->post(route('admin.siswa.store'), [
        'nis' => '24.012505',
        'nama' => 'Velove Azalia Putri',
        'jenis_kelamin' => 'perempuan',
        'kelas_id' => $this->kelas->id,
        'foto' => UploadedFile::fake()->image('foto.jpg')->size(500),
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('siswas', ['nis' => '24.012505']);

    $siswa = Siswa::where('nis', '24.012505')->first();
    $this->assertDatabaseHas('fotos', ['fotoable_id' => $siswa->id]);

    Storage::disk('public')->assertExists($siswa->foto->file_path);
    expect($siswa->foto_url)->toBeString()->toStartWith('/storage/fotos/');
});

test('uploaded foto is cropped to a 4x4 (square) ratio', function () {
    Storage::fake('public');

    $this->post(route('admin.siswa.store'), [
        'nis' => '24.012505',
        'nama' => 'Velove Azalia Putri',
        'kelas_id' => $this->kelas->id,
        'foto' => UploadedFile::fake()->image('foto.jpg', 200, 120)->size(300),
    ])->assertRedirect();

    $siswa = Siswa::where('nis', '24.012505')->first();
    $fotoPath = $siswa->foto->file_path;

    Storage::disk('public')->assertExists($fotoPath);

    $info = getimagesizefromstring(Storage::disk('public')->get($fotoPath));
    expect($info[0])->toBe(480);
    expect($info[1])->toBe(480);
});

test('admin can update siswa with existing foto sent as URL string', function () {
    Storage::fake('public');

    $siswa = Siswa::create([
        'user_id' => User::factory()->create(['role' => 'siswa', 'username' => '24.012505'])->id,
        'kelas_id' => $this->kelas->id,
        'nis' => '24.012505',
        'nama' => 'Velove Azalia Putri',
    ]);

    $foto = UploadedFile::fake()->image('profil.jpg')->store('fotos', 'public');

    $siswa->foto()->create([
        'file_path' => $foto,
        'original_name' => 'profil.jpg',
        'mime_type' => 'image/jpeg',
        'file_size' => 1024,
    ]);

    $response = $this->put(route('admin.siswa.update', $siswa->id), [
        'nis' => '24.012505',
        'nama' => 'Velove Azalia Putri',
        'jenis_kelamin' => 'perempuan',
        'kelas_id' => $this->kelas->id,
        'foto' => Storage::disk('public')->url($foto),
        'remove_foto' => false,
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('siswas', ['id' => $siswa->id]);
    $this->assertDatabaseHas('fotos', [
        'fotoable_id' => $siswa->id,
        'file_path' => $foto,
    ]);
});

test('admin can view siswa profile', function () {
    $siswa = Siswa::create([
        'user_id' => User::factory()->create(['role' => 'siswa', 'username' => '24.012505'])->id,
        'kelas_id' => $this->kelas->id,
        'nis' => '24.012505',
        'nama' => 'Velove Azalia Putri',
    ]);

    $this->get(route('admin.siswa.profil', $siswa->id))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/siswa/profil')
            ->where('siswa.nis', '24.012505')
            ->has('siswa.foto_url'));
});
