<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KategoriPembelajaran;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class KategoriPembelajaranController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/kategoripembelajaran/index', [
            'kategoriPembelajaran' => KategoriPembelajaran::latest()->paginate(10),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_kategori' => 'required|string|max:255',
            'kode' => 'required|string|max:20|unique:kategori_pembelajarans,kode',
        ]);

        KategoriPembelajaran::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, string $id)
    {
        $kategori = KategoriPembelajaran::findOrFail($id);

        $validated = $request->validate([
            'nama_kategori' => 'required|string|max:255',
            'kode' => ['required', 'string', 'max:20', Rule::unique('kategori_pembelajarans')->ignore($kategori->id)],
        ]);

        $kategori->update($validated);

        return redirect()->back();
    }

    public function destroy(string $id)
    {
        KategoriPembelajaran::findOrFail($id)->delete();

        return redirect()->back();
    }
}
