<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\ManagesProfileFoto;
use App\Http\Controllers\Controller;
use App\Models\Guru;
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
    use ManagesProfileFoto;

    public function index(Request $request)
    {
        $search = $request->input('search');

        $gurus = Guru::with(['user', 'foto', 'kelas.jurusan', 'kelas.jenjangKelas', 'mataPelajarans'])
            ->when($search, function ($query, $search) {
                $query->where('nama', 'like', "%{$search}%")
                    ->orWhere('nip', 'like', "%{$search}%")
                    ->orWhereHas('kelas', function ($q) use ($search) {
                        $q->where('nama_kelas', 'like', "%{$search}%")
                            ->orWhereHas('jurusan', fn ($j) => $j->where('singkatan', 'like', "%{$search}%"))
                            ->orWhereHas('jenjangKelas', fn ($j) => $j->where('nama_jenjang', 'like', "%{$search}%"));
                    })
                    ->orWhereHas('mataPelajarans', fn ($q) => $q->where('nama_mapel', 'like', "%{$search}%"));
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/guru/index', [
            'gurus' => $gurus,
            'kelas' => Kelas::with(['jurusan', 'jenjangKelas'])->get(),
            'mataPelajarans' => MataPelajaran::all(),
        ]);
    }

    public function show(string $id)
    {
        $guru = Guru::with(['user', 'foto', 'kelas.jurusan', 'kelas.jenjangKelas', 'mataPelajarans'])
            ->findOrFail($id);

        return Inertia::render('admin/guru/profil', [
            'guru' => $guru,
        ]);
    }

    public function store(Request $request)
    {
        $this->normalizeFotoInput($request);

        $validated = $request->validate([
            'nip' => 'required|digits:18|unique:gurus,nip',
            'nama' => 'required|string|max:255',
            'jenis_kelamin' => 'nullable|in:laki-laki,perempuan',
            'foto' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
            'kelas_ids' => 'nullable|array',
            'kelas_ids.*' => 'exists:kelas,id',
            'mata_pelajaran_ids' => 'nullable|array',
            'mata_pelajaran_ids.*' => 'exists:mata_pelajarans,id',
        ]);

        DB::transaction(function () use ($request, $validated) {
            $user = User::create([
                'name' => $validated['nama'],
                'username' => $validated['nip'],
                'password' => Hash::make('password'),
                'password_default' => true,
                'role' => 'guru',
            ]);

            $guru = Guru::create([
                'user_id' => $user->id,
                'nip' => $validated['nip'],
                'nama' => $validated['nama'],
                'jenis_kelamin' => $validated['jenis_kelamin'] ?? null,
            ]);

            if (! empty($validated['kelas_ids'])) {
                $guru->kelas()->sync($validated['kelas_ids']);
            }

            if (! empty($validated['mata_pelajaran_ids'])) {
                $guru->mataPelajarans()->sync($validated['mata_pelajaran_ids']);
            }

            if ($request->hasFile('foto')) {
                $this->storeFoto($guru, $request->file('foto'));
            }
        });

        return redirect()->back();
    }

    public function update(Request $request, string $id)
    {
        $guru = Guru::findOrFail($id);
        $this->normalizeFotoInput($request);

        $validated = $request->validate([
            'nip' => ['required', 'digits:18', Rule::unique('gurus')->ignore($guru->id)],
            'nama' => 'required|string|max:255',
            'jenis_kelamin' => 'nullable|in:laki-laki,perempuan',
            'password' => 'nullable|string|min:8',
            'foto' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
            'remove_foto' => 'nullable|boolean',
            'kelas_ids' => 'nullable|array',
            'kelas_ids.*' => 'exists:kelas,id',
            'mata_pelajaran_ids' => 'nullable|array',
            'mata_pelajaran_ids.*' => 'exists:mata_pelajarans,id',
        ]);

        DB::transaction(function () use ($request, $guru, $validated) {
            $guru->update([
                'nip' => $validated['nip'],
                'nama' => $validated['nama'],
                'jenis_kelamin' => $validated['jenis_kelamin'] ?? null,
            ]);

            $userUpdate = [
                'name' => $validated['nama'],
                'username' => $validated['nip'],
            ];

            if (! empty($validated['password'])) {
                $userUpdate['password'] = Hash::make($validated['password']);
            }

            $guru->user->update($userUpdate);

            if ($request->hasFile('foto')) {
                $this->replaceFoto($guru, $request->file('foto'));
            } elseif (! empty($validated['remove_foto'])) {
                $this->removeFoto($guru);
            }

            // Sync will detach missing and attach new
            $guru->kelas()->sync($validated['kelas_ids'] ?? []);
            $guru->mataPelajarans()->sync($validated['mata_pelajaran_ids'] ?? []);
        });

        return redirect()->back();
    }

    public function destroy(string $id)
    {
        $guru = Guru::findOrFail($id);
        $this->removeFoto($guru);
        // Deleting the user will cascade and delete the guru due to DB constraints
        $guru->user->delete();

        return redirect()->back();
    }
}
