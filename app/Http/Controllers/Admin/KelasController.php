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
    public function index()
    {
        return Inertia::render('admin/kelas/index', [
            'kelas' => Kelas::with(['jurusan', 'jenjangKelas'])->latest()->paginate(10),
            'jurusans' => Jurusan::all(),
            'jenjangKelasList' => JenjangKelas::orderBy('nama_jenjang')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'jurusan_id' => 'nullable|exists:jurusans,id',
            'jenjang_kelas_id' => 'nullable|exists:jenjang_kelas,id',
            'nama_kelas' => 'required|string|max:255',
        ]);

        Kelas::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, string $id)
    {
        $kelas = Kelas::findOrFail($id);

        $validated = $request->validate([
            'jurusan_id' => 'nullable|exists:jurusans,id',
            'jenjang_kelas_id' => 'nullable|exists:jenjang_kelas,id',
            'nama_kelas' => 'required|string|max:255',
        ]);

        $kelas->update($validated);

        return redirect()->back();
    }

    public function destroy(string $id)
    {
        Kelas::findOrFail($id)->delete();

        return redirect()->back();
    }
}
