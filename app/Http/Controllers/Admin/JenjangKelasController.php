<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JenjangKelas;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class JenjangKelasController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/jenjangkelas/index', [
            'jenjangKelas' => JenjangKelas::latest()->paginate(10),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_jenjang' => 'required|string|max:20|unique:jenjang_kelas,nama_jenjang',
        ]);

        JenjangKelas::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, string $id)
    {
        $jenjang = JenjangKelas::findOrFail($id);

        $validated = $request->validate([
            'nama_jenjang' => ['required', 'string', 'max:20', Rule::unique('jenjang_kelas')->ignore($jenjang->id)],
        ]);

        $jenjang->update($validated);

        return redirect()->back();
    }

    public function destroy(string $id)
    {
        JenjangKelas::findOrFail($id)->delete();

        return redirect()->back();
    }
}
