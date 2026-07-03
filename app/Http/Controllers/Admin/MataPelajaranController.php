<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KategoriPembelajaran;
use App\Models\MataPelajaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MataPelajaranController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/matapelajaran/index', [
            'matapelajarans' => MataPelajaran::with('kategoriPembelajaran')->latest()->paginate(10),
            'kategoriPembelajarans' => KategoriPembelajaran::orderBy('kode')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_mapel' => 'required|string|max:255',
            'kategori_pembelajaran_id' => 'required|exists:kategori_pembelajarans,id',
        ]);

        MataPelajaran::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, string $id)
    {
        $mapel = MataPelajaran::findOrFail($id);

        $validated = $request->validate([
            'nama_mapel' => 'required|string|max:255',
            'kategori_pembelajaran_id' => 'required|exists:kategori_pembelajarans,id',
        ]);

        $mapel->update($validated);

        return redirect()->back();
    }

    public function destroy(string $id)
    {
        MataPelajaran::findOrFail($id)->delete();

        return redirect()->back();
    }
}
