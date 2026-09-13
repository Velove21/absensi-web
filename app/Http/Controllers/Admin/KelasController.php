<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JenjangKelas;
use App\Models\Jurusan;
use App\Models\Kelas;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KelasController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');

        $kelasQuery = Kelas::with(['jurusan', 'jenjangKelas'])->orderBy('id', 'asc');

        if ($search) {
            $kelasQuery->where(function ($q) use ($search) {
                $q->where('nama_kelas', 'like', "%{$search}%")
                    ->orWhereHas('jurusan', fn ($jq) => $jq->where('nama_jurusan', 'like', "%{$search}%")->orWhere('singkatan', 'like', "%{$search}%"))
                    ->orWhereHas('jenjangKelas', fn ($jq) => $jq->where('nama_jenjang', 'like', "%{$search}%"));
            });
        }

        return Inertia::render('admin/kelas/index', [
            'kelas' => $kelasQuery->paginate(10)->withQueryString(),
            'jurusans' => Jurusan::all(),
            'jenjangKelasList' => JenjangKelas::orderBy('nama_jenjang')->get(),
            'filters' => ['search' => $search],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'jurusan_id' => 'required|exists:jurusans,id',
            'jenjang_kelas_id' => 'nullable|exists:jenjang_kelas,id',
            'nama_kelas' => 'nullable|string|max:255',
        ]);

        // Jika nama_kelas kosong, simpan sebagai null agar full_nama_kelas hanya jenjang + jurusan
        if (isset($validated['nama_kelas']) && trim($validated['nama_kelas']) === '') {
            $validated['nama_kelas'] = null;
        }

        Kelas::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, string $id)
    {
        $kelas = Kelas::findOrFail($id);

        $validated = $request->validate([
            'jurusan_id' => 'required|exists:jurusans,id',
            'jenjang_kelas_id' => 'nullable|exists:jenjang_kelas,id',
            'nama_kelas' => 'nullable|string|max:255',
        ]);

        if (isset($validated['nama_kelas']) && trim($validated['nama_kelas']) === '') {
            $validated['nama_kelas'] = null;
        }

        $kelas->update($validated);

        return redirect()->back();
    }

    public function destroy(string $id)
    {
        Kelas::findOrFail($id)->delete();

        return redirect()->back();
    }
}
