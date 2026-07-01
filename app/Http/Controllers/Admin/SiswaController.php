<?php

namespace App\Http\Controllers\Admin;

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
    public function index()
    {
        return Inertia::render('admin/siswa/index', [
            'siswas' => Siswa::with(['user', 'kelas.jurusan'])->latest()->paginate(10),
            'kelasList' => Kelas::with('jurusan')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nis' => ['required', 'string', 'max:20', 'unique:siswas,nis', 'regex:/^[0-9]{2}\.[0-9]{6}$/'],
            'nama' => 'required|string|max:255',
            'kelas_id' => 'required|exists:kelas,id',
        ]);

        $user = User::create([
            'name' => $validated['nama'],
            'username' => $validated['nis'],
            'password' => Hash::make('password1'),
            'password_default' => true,
            'role' => 'siswa',
        ]);

        Siswa::create([
            'user_id' => $user->id,
            'kelas_id' => $validated['kelas_id'],
            'nis' => $validated['nis'],
            'nama' => $validated['nama'],
        ]);

        return redirect()->back();
    }

    public function update(Request $request, string $id)
    {
        $siswa = Siswa::findOrFail($id);

        $validated = $request->validate([
            'nis' => ['required', 'string', 'max:20', Rule::unique('siswas')->ignore($siswa->id), 'regex:/^[0-9]{2}\.[0-9]{6}$/'],
            'nama' => 'required|string|max:255',
            'kelas_id' => 'required|exists:kelas,id',
        ]);

        $siswa->update([
            'nis' => $validated['nis'],
            'nama' => $validated['nama'],
            'kelas_id' => $validated['kelas_id'],
        ]);

        $siswa->user->update([
            'name' => $validated['nama'],
            'username' => $validated['nis'],
        ]);

        return redirect()->back();
    }

    public function destroy(string $id)
    {
        $siswa = Siswa::findOrFail($id);
        $siswa->user->delete();

        return redirect()->back();
    }
}
