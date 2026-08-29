<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\ManagesProfileFoto;
use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SiswaController extends Controller
{
    use ManagesProfileFoto;

    public function index(Request $request)
    {
        $search = $request->input('search');

        $siswas = Siswa::with(['user', 'foto', 'kelas.jurusan'])
            ->when($search, function ($query, $search) {
                $query->where('nama', 'like', "%{$search}%")
                    ->orWhere('nis', 'like', "%{$search}%")
                    ->orWhereHas('kelas', fn ($q) => $q->where('nama_kelas', 'like', "%{$search}%"));
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/siswa/index', [
            'siswas' => $siswas,
            'kelasList' => Kelas::with('jurusan')->get(),
        ]);
    }

    public function show(string $id)
    {
        $siswa = Siswa::with(['user', 'foto', 'kelas.jurusan'])
            ->findOrFail($id);

        return Inertia::render('admin/siswa/profil', [
            'siswa' => $siswa,
        ]);
    }

    public function store(Request $request)
    {
        $this->normalizeFotoInput($request);

        $validated = $request->validate([
            'nis' => ['required', 'string', 'max:20', 'unique:siswas,nis', 'regex:/^[0-9]{2}\.[0-9]{6}$/'],
            'nama' => 'required|string|max:255',
            'jenis_kelamin' => 'nullable|in:laki-laki,perempuan',
            'foto' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
            'kelas_id' => 'required|exists:kelas,id',
        ], [
            'nis.regex' => 'Format NIS harus berupa XX.XXXXXX (misal: 24.012505).',
        ]);

        $user = User::create([
            'name' => $validated['nama'],
            'username' => $validated['nis'],
            'password' => Hash::make('password'),
            'password_default' => true,
            'role' => 'siswa',
        ]);

        $siswa = Siswa::create([
            'user_id' => $user->id,
            'kelas_id' => $validated['kelas_id'],
            'nis' => $validated['nis'],
            'nama' => $validated['nama'],
            'jenis_kelamin' => $validated['jenis_kelamin'] ?? null,
        ]);

        if ($request->hasFile('foto')) {
            $this->storeFoto($siswa, $request->file('foto'));
        }

        return redirect()->back();
    }

    public function update(Request $request, string $id)
    {
        $siswa = Siswa::findOrFail($id);
        $this->normalizeFotoInput($request);

        $validated = $request->validate([
            'nis' => ['required', 'string', 'max:20', Rule::unique('siswas')->ignore($siswa->id), 'regex:/^[0-9]{2}\.[0-9]{6}$/'],
            'nama' => 'required|string|max:255',
            'jenis_kelamin' => 'nullable|in:laki-laki,perempuan',
            'kelas_id' => 'required|exists:kelas,id',
            'password' => 'nullable|string|min:8',
            'foto' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
            'remove_foto' => 'nullable|boolean',
        ], [
            'nis.regex' => 'Format NIS harus berupa XX.XXXXXX (misal: 24.012505).',
        ]);

        $siswa->update([
            'nis' => $validated['nis'],
            'nama' => $validated['nama'],
            'kelas_id' => $validated['kelas_id'],
            'jenis_kelamin' => $validated['jenis_kelamin'] ?? null,
        ]);

        $userUpdate = [
            'name' => $validated['nama'],
            'username' => $validated['nis'],
        ];

        if (! empty($validated['password'])) {
            $userUpdate['password'] = Hash::make($validated['password']);
        }

        $siswa->user->update($userUpdate);

        if ($request->hasFile('foto')) {
            $this->replaceFoto($siswa, $request->file('foto'));
        } elseif (! empty($validated['remove_foto'])) {
            $this->removeFoto($siswa);
        }

        return redirect()->back();
    }

    public function destroy(string $id)
    {
        $siswa = Siswa::findOrFail($id);
        $this->removeFoto($siswa);
        $siswa->user->delete();

        return redirect()->back();
    }
}
