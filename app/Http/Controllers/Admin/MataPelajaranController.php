<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Jurusan;
use App\Models\KategoriPembelajaran;
use App\Models\MataPelajaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MataPelajaranController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/matapelajaran/index', [
            'matapelajarans' => MataPelajaran::with(['jurusan', 'kategoriPembelajaran'])->latest()->paginate(10),
            'jurusans' => Jurusan::all(),
            'kategoriPembelajarans' => KategoriPembelajaran::orderBy('kode')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_mapel' => 'required|string|max:255',
            'kategori_pembelajaran_id' => 'required|exists:kategori_pembelajarans,id',
            'jurusan_id' => 'nullable|exists:jurusans,id',
        ]);

        $kategori = KategoriPembelajaran::findOrFail($validated['kategori_pembelajaran_id']);
        if ($kategori->kode === 'KK' && empty($validated['jurusan_id'])) {
            return back()->withErrors(['jurusan_id' => 'Spesialisasi Jurusan wajib dipilih jika kategori mapel adalah Konsentrasi Kejuruan (KK).'])->withInput();
        }

        MataPelajaran::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, string $id)
    {
        $mapel = MataPelajaran::findOrFail($id);

        $validated = $request->validate([
            'nama_mapel' => 'required|string|max:255',
            'kategori_pembelajaran_id' => 'required|exists:kategori_pembelajarans,id',
            'jurusan_id' => 'nullable|exists:jurusans,id',
        ]);

        $kategori = KategoriPembelajaran::findOrFail($validated['kategori_pembelajaran_id']);
        if ($kategori->kode === 'KK' && empty($validated['jurusan_id'])) {
            return back()->withErrors(['jurusan_id' => 'Spesialisasi Jurusan wajib dipilih jika kategori mapel adalah Konsentrasi Kejuruan (KK).'])->withInput();
        }

        $mapel->update($validated);

        return redirect()->back();
    }

    public function destroy(string $id)
    {
        MataPelajaran::findOrFail($id)->delete();

        return redirect()->back();
    }
}
