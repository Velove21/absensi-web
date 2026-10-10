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

        $gurus = Guru::with(['user', 'foto', 'kelas.jurusan', 'kelas.jenjangKelas', 'mataPelajarans.kategoriPembelajaran'])
            ->when($search, function ($query, $search) {
                $searchTrim = trim($search);
                $aliasMap = ['RPL' => 'PPLG', 'TKJ' => 'TJKT'];

                $query->where('nama', 'like', "%{$searchTrim}%")
                    ->orWhere('nip', 'like', "%{$searchTrim}%")
                    ->orWhereHas('kelas', function ($q) use ($searchTrim, $aliasMap) {
                        // Cocok full_nama_kelas via concat (mis. "XI PPLG A")
                        $q->whereRaw(
                            "CONCAT_WS(' ', COALESCE((SELECT nama_jenjang FROM jenjang_kelas WHERE jenjang_kelas.id = kelas.jenjang_kelas_id), ''), COALESCE((SELECT singkatan FROM jurusans WHERE jurusans.id = kelas.jurusan_id), ''), COALESCE(kelas.nama_kelas, '')) LIKE ?",
                            ["%{$searchTrim}%"]
                        )
                        // Fallback: cocok komponen terpisah
                            ->orWhere('nama_kelas', 'like', "%{$searchTrim}%")
                            ->orWhereHas('jurusan', fn ($j) => $j->where('singkatan', 'like', "%{$searchTrim}%")->orWhere('nama_jurusan', 'like', "%{$searchTrim}%"))
                            ->orWhereHas('jenjangKelas', fn ($j) => $j->where('nama_jenjang', 'like', "%{$searchTrim}%"));

                        // Alias: jika user ketik RPL, anggap juga PPLG
                        $upperSearch = strtoupper($searchTrim);
                        if (isset($aliasMap[$upperSearch])) {
                            $alias = $aliasMap[$upperSearch];
                            $q->orWhereHas('jurusan', fn ($j) => $j->where('singkatan', 'like', "%{$alias}%"));
                        }
                    })
                    ->orWhereHas('mataPelajarans', fn ($q) => $q->where('nama_mapel', 'like', "%{$searchTrim}%"));
            })
            ->latest()
            ->paginate(11)
            ->withQueryString();

        // Transform untuk frontend: sediakan key camelCase mataPelajarans (Laravel serialize jadi snake_case mata_pelajarans)
        // agar tabel tidak tampil "-" padahal sudah diinput
        $gurus->getCollection()->transform(function ($guru) {
            $mapels = $guru->getRelation('mataPelajarans') ?? collect();
            // append kategori yang sudah di-eager load agar tidak N+1
            $mapels->each(fn ($m) => $m->setAppends(['kategori']));
            // expose camelCase untuk frontend
            $guru->setAttribute('mataPelajarans', $mapels);
            // kelas juga pastikan key konsisten (sudah benar) tapi tetap set untuk konsistensi
            $guru->setAttribute('kelas', $guru->getRelation('kelas') ?? collect());

            return $guru;
        });

        return Inertia::render('admin/guru/index', [
            'gurus' => $gurus,
            'kelas' => Kelas::with(['jurusan', 'jenjangKelas'])->get(),
            'mataPelajarans' => MataPelajaran::with('kategoriPembelajaran')->get()->each(fn ($m) => $m->setAppends(['kategori'])),
        ]);
    }

    public function show(string $id)
    {
        $guru = Guru::with(['user', 'foto', 'kelas.jurusan', 'kelas.jenjangKelas', 'mataPelajarans.kategoriPembelajaran'])
            ->findOrFail($id);

        $guru->setAttribute('mataPelajarans', $guru->getRelation('mataPelajarans') ?? collect());
        $guru->setAttribute('kelas', $guru->getRelation('kelas') ?? collect());

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
            'foto' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'kelas_ids' => 'nullable|array',
            'kelas_ids.*' => 'exists:kelas,id',
            'mata_pelajaran_ids' => 'nullable|array',
            'mata_pelajaran_ids.*' => 'exists:mata_pelajarans,id',
        ], [
            'foto.mimes' => 'Foto harus format JPG, JPEG, atau PNG.',
            'foto.max' => 'Ukuran foto maksimal 5 MB.',
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
            'foto' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'remove_foto' => 'nullable|boolean',
            'kelas_ids' => 'nullable|array',
            'kelas_ids.*' => 'exists:kelas,id',
            'mata_pelajaran_ids' => 'nullable|array',
            'mata_pelajaran_ids.*' => 'exists:mata_pelajarans,id',
        ], [
            'foto.mimes' => 'Foto harus format JPG, JPEG, atau PNG.',
            'foto.max' => 'Ukuran foto maksimal 5 MB.',
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
