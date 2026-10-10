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
        $kelasId = $request->input('kelas_id');

        $siswas = Siswa::with(['user', 'foto', 'kelas.jurusan', 'kelas.jenjangKelas'])
            ->where('is_alumni', false)
            ->when($kelasId, fn ($q) => $q->where('kelas_id', $kelasId))
            ->when($search, function ($query, $search) {
                $searchTrim = trim($search);
                $aliasMap = ['RPL' => 'PPLG', 'TKJ' => 'TJKT'];

                $query->where(function ($q) use ($searchTrim, $aliasMap) {
                    // Cocok nama/nis langsung
                    $q->where('nama', 'like', "%{$searchTrim}%")
                        ->orWhere('nis', 'like', "%{$searchTrim}%")
                        // Cocok full_nama_kelas via concat (mis. "XII PPLG A") - paling akurat untuk pencarian kelas lengkap
                        ->orWhereHas('kelas', function ($kq) use ($searchTrim) {
                            $kq->whereRaw(
                                "CONCAT_WS(' ', COALESCE((SELECT nama_jenjang FROM jenjang_kelas WHERE jenjang_kelas.id = kelas.jenjang_kelas_id), ''), COALESCE((SELECT singkatan FROM jurusans WHERE jurusans.id = kelas.jurusan_id), ''), COALESCE(kelas.nama_kelas, '')) LIKE ?",
                                ["%{$searchTrim}%"]
                            );
                        })
                        // Fallback: cocok komponen terpisah (jenjang, jurusan, nama_kelas) untuk pencarian parsial
                        ->orWhereHas('kelas.jenjangKelas', fn ($jq) => $jq->where('nama_jenjang', 'like', "%{$searchTrim}%"))
                        ->orWhereHas('kelas.jurusan', fn ($jq) => $jq->where('singkatan', 'like', "%{$searchTrim}%")->orWhere('nama_jurusan', 'like', "%{$searchTrim}%"))
                        ->orWhereHas('kelas', fn ($kq) => $kq->where('nama_kelas', 'like', "%{$searchTrim}%"));

                    // Alias: jika user ketik RPL, anggap juga PPLG (untuk pencarian parsial jurusan)
                    $upperSearch = strtoupper($searchTrim);
                    if (isset($aliasMap[$upperSearch])) {
                        $alias = $aliasMap[$upperSearch];
                        $q->orWhereHas('kelas.jurusan', fn ($jq) => $jq->where('singkatan', 'like', "%{$alias}%"));
                    }
                });
            })
            ->orderBy('nis', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/siswa/index', [
            'siswas' => $siswas,
            'kelasList' => Kelas::with(['jurusan', 'jenjangKelas'])->orderByRaw("COALESCE((SELECT nama_jenjang FROM jenjang_kelas WHERE jenjang_kelas.id = kelas.jenjang_kelas_id), '')")->orderByRaw("COALESCE((SELECT singkatan FROM jurusans WHERE jurusans.id = kelas.jurusan_id), '')")->orderBy('nama_kelas')->get(),
            'filters' => ['search' => $search, 'kelas_id' => $kelasId],
        ]);
    }

    public function show(string $id)
    {
        $siswa = Siswa::with(['user', 'foto', 'kelas.jurusan', 'kelas.jenjangKelas'])
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
            'foto' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'kelas_id' => 'required|exists:kelas,id',
        ], [
            'nis.regex' => 'Format NIS harus berupa XX.XXXXXX (misal: 24.012505).',
            'foto.mimes' => 'Foto harus format JPG, JPEG, atau PNG.',
            'foto.max' => 'Ukuran foto maksimal 5 MB.',
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
            'foto' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'remove_foto' => 'nullable|boolean',
        ], [
            'nis.regex' => 'Format NIS harus berupa XX.XXXXXX (misal: 24.012505).',
            'foto.mimes' => 'Foto harus format JPG, JPEG, atau PNG.',
            'foto.max' => 'Ukuran foto maksimal 5 MB.',
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
