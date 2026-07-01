<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Jurusan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JurusanController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/jurusan/index', [
            'jurusans' => Jurusan::latest()->paginate(10),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_jurusan' => 'required|string|max:255',
            'singkatan' => 'nullable|string|max:20',
        ]);

        Jurusan::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, string $id)
    {
        $jurusan = Jurusan::findOrFail($id);

        $validated = $request->validate([
            'nama_jurusan' => 'required|string|max:255',
            'singkatan' => 'nullable|string|max:20',
        ]);

        $jurusan->update($validated);

        return redirect()->back();
    }

    public function destroy(string $id)
    {
        Jurusan::findOrFail($id)->delete();

        return redirect()->back();
    }
}
