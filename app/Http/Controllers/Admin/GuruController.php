<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Jurusan;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class GuruController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/guru/index', [
            'gurus' => Guru::with(['user', 'jurusans', 'kelas', 'mataPelajarans'])->latest()->paginate(10),
            'jurusans' => Jurusan::all(),
            'kelas' => Kelas::with(['jurusan', 'jenjangKelas'])->get(),
            'mataPelajarans' => MataPelajaran::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nip' => 'required|string|size:18|unique:gurus,nip',
            'nama' => 'required|string|max:255',
            'password' => 'required|string|min:8',
            'jurusan_ids' => 'nullable|array',
            'jurusan_ids.*' => 'exists:jurusans,id',
            'kelas_ids' => 'nullable|array',
            'kelas_ids.*' => 'exists:kelas,id',
            'mata_pelajaran_ids' => 'nullable|array',
            'mata_pelajaran_ids.*' => 'exists:mata_pelajarans,id',
        ]);

        DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['nama'],
                'username' => $validated['nip'],
                'password' => Hash::make($validated['password']),
                'role' => 'guru',
            ]);

            $guru = Guru::create([
                'user_id' => $user->id,
                'nip' => $validated['nip'],
                'nama' => $validated['nama'],
            ]);

            if (! empty($validated['jurusan_ids'])) {
                $guru->jurusans()->sync($validated['jurusan_ids']);
            }

            if (! empty($validated['kelas_ids'])) {
                $guru->kelas()->sync($validated['kelas_ids']);
            }

            if (! empty($validated['mata_pelajaran_ids'])) {
                $guru->mataPelajarans()->sync($validated['mata_pelajaran_ids']);
            }
        });

        return redirect()->back();
    }

    public function update(Request $request, string $id)
    {
        $guru = Guru::findOrFail($id);

        $validated = $request->validate([
            'nip' => ['required', 'string', 'size:18', Rule::unique('gurus')->ignore($guru->id)],
            'nama' => 'required|string|max:255',
            'password' => 'nullable|string|min:8',
            'jurusan_ids' => 'nullable|array',
            'jurusan_ids.*' => 'exists:jurusans,id',
            'kelas_ids' => 'nullable|array',
            'kelas_ids.*' => 'exists:kelas,id',
            'mata_pelajaran_ids' => 'nullable|array',
            'mata_pelajaran_ids.*' => 'exists:mata_pelajarans,id',
        ]);

        DB::transaction(function () use ($guru, $validated) {
            $guru->update([
                'nip' => $validated['nip'],
                'nama' => $validated['nama'],
            ]);

            $userUpdate = [
                'name' => $validated['nama'],
                'username' => $validated['nip'],
            ];

            if (! empty($validated['password'])) {
                $userUpdate['password'] = Hash::make($validated['password']);
            }

            $guru->user->update($userUpdate);

            // Sync will detach missing and attach new
            $guru->jurusans()->sync($validated['jurusan_ids'] ?? []);
            $guru->kelas()->sync($validated['kelas_ids'] ?? []);
            $guru->mataPelajarans()->sync($validated['mata_pelajaran_ids'] ?? []);
        });

        return redirect()->back();
    }

    public function destroy(string $id)
    {
        $guru = Guru::findOrFail($id);
        // Deleting the user will cascade and delete the guru due to DB constraints
        $guru->user->delete();

        return redirect()->back();
    }
}
