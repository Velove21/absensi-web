<?php

use App\Models\Guru;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin', 'password_default' => false]);
    $this->actingAs($this->admin);
});

test('guest is redirected to login on guru index', function () {
    auth()->logout();

    $this->get(route('admin.guru.index'))->assertRedirect('/');
});

test('admin can view guru list', function () {
    Guru::create([
        'user_id' => User::factory()->create(['role' => 'guru', 'username' => '199009182014022003'])->id,
        'nip' => '199009182014022003',
        'nama' => 'Arika Prihastanti',
    ]);

    $this->get(route('admin.guru.index'))->assertOk();
});

test('admin can create guru with valid NIP', function () {
    $response = $this->post(route('admin.guru.store'), [
        'nip' => '199009182014022001',
        'nama' => 'Budi Santoso, S.Pd',
        'jenis_kelamin' => 'laki-laki',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('gurus', [
        'nip' => '199009182014022001',
        'nama' => 'Budi Santoso, S.Pd',
        'jenis_kelamin' => 'laki-laki',
    ]);

    $guru = Guru::where('nip', '199009182014022001')->first();
    expect($guru->user->password_default)->toBeTrue();
    expect($guru->user->role)->toBe('guru');
});

test('admin cannot create guru with invalid NIP format', function () {
    $response = $this->post(route('admin.guru.store'), [
        'nip' => '123',
        'nama' => 'Budi Santoso, S.Pd',
    ]);

    $response->assertSessionHasErrors(['nip']);
});

test('admin can update guru with unchanged NIP', function () {
    $guru = Guru::create([
        'user_id' => User::factory()->create(['role' => 'guru', 'username' => '199009182014022003'])->id,
        'nip' => '199009182014022003',
        'nama' => 'Arika Prihastanti',
    ]);

    $response = $this->put(route('admin.guru.update', $guru->id), [
        'nip' => '199009182014022003',
        'nama' => 'Arika Prihastanti Sutami, S.Pd',
        'jenis_kelamin' => 'perempuan',
        'kelas_ids' => [],
        'mata_pelajaran_ids' => [],
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('gurus', [
        'id' => $guru->id,
        'nip' => '199009182014022003',
        'nama' => 'Arika Prihastanti Sutami, S.Pd',
        'jenis_kelamin' => 'perempuan',
    ]);
});

test('admin can view guru profile', function () {
    $guru = Guru::create([
        'user_id' => User::factory()->create(['role' => 'guru', 'username' => '199009182014022003'])->id,
        'nip' => '199009182014022003',
        'nama' => 'Arika Prihastanti',
    ]);

    $this->get(route('admin.guru.profil', $guru->id))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/guru/profil')
            ->where('guru.nip', '199009182014022003')
            ->has('guru.foto_url'));
});

test('admin can create guru with an uploaded foto', function () {
    Storage::fake('public');

    $response = $this->post(route('admin.guru.store'), [
        'nip' => '199009182014022001',
        'nama' => 'Budi Santoso, S.Pd',
        'jenis_kelamin' => 'laki-laki',
        'foto' => UploadedFile::fake()->image('foto.jpg')->size(500),
        'kelas_ids' => [],
        'mata_pelajaran_ids' => [],
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('gurus', ['nip' => '199009182014022001']);

    $guru = Guru::where('nip', '199009182014022001')->first();
    $this->assertDatabaseHas('fotos', ['fotoable_id' => $guru->id]);

    Storage::disk('public')->assertExists($guru->foto->file_path);
    expect($guru->foto_url)->toBeString()->toStartWith('/storage/fotos/');
});

test('admin can update guru with existing foto sent as URL string', function () {
    Storage::fake('public');

    $guru = Guru::create([
        'user_id' => User::factory()->create(['role' => 'guru', 'username' => '199009182014022003'])->id,
        'nip' => '199009182014022003',
        'nama' => 'Arika Prihastanti',
    ]);

    $foto = UploadedFile::fake()->image('profil.jpg')->store('fotos', 'public');

    $guru->foto()->create([
        'file_path' => $foto,
        'original_name' => 'profil.jpg',
        'mime_type' => 'image/jpeg',
        'file_size' => 1024,
    ]);

    $response = $this->put(route('admin.guru.update', $guru->id), [
        'nip' => '199009182014022003',
        'nama' => 'Arika Prihastanti Sutami, S.Pd',
        'jenis_kelamin' => 'perempuan',
        'foto' => Storage::disk('public')->url($foto),
        'remove_foto' => false,
        'kelas_ids' => [],
        'mata_pelajaran_ids' => [],
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('gurus', [
        'id' => $guru->id,
        'nama' => 'Arika Prihastanti Sutami, S.Pd',
    ]);

    $this->assertDatabaseHas('fotos', [
        'fotoable_id' => $guru->id,
        'file_path' => $foto,
    ]);
});

test('admin can delete guru and its foto is removed', function () {
    $guru = Guru::create([
        'user_id' => User::factory()->create(['role' => 'guru', 'username' => '199009182014022003'])->id,
        'nip' => '199009182014022003',
        'nama' => 'Arika Prihastanti',
    ]);

    $guru->foto()->create([
        'file_path' => 'fotos/test.jpg',
        'original_name' => 'test.jpg',
        'mime_type' => 'image/jpeg',
        'file_size' => 1024,
    ]);

    $this->delete(route('admin.guru.destroy', $guru->id))->assertRedirect();

    $this->assertDatabaseMissing('gurus', ['id' => $guru->id]);
    $this->assertDatabaseMissing('fotos', ['fotoable_id' => $guru->id]);
});
