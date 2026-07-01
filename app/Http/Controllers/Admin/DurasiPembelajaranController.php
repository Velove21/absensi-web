<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DurasiPembelajaran;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DurasiPembelajaranController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/durasipembelajaran/index', [
            'durasiPembelajaran' => DurasiPembelajaran::orderBy('hari')->orderBy('jam_ke')->paginate(15),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'hari' => 'required|string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'jam_ke' => [
                'required',
                'integer',
                'min:1',
                Rule::unique('durasi_pembelajarans')->where(fn ($query) => $query->where('hari', $request->hari)),
            ],
            'waktu_mulai' => 'required|date_format:H:i',
            'waktu_selesai' => 'required|date_format:H:i|after:waktu_mulai',
        ], [
            'jam_ke.unique' => 'Jam ke- tersebut sudah ada pada hari yang dipilih.',
            'waktu_selesai.after' => 'Waktu selesai harus setelah waktu mulai.',
        ]);

        DurasiPembelajaran::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, string $id)
    {
        $durasi = DurasiPembelajaran::findOrFail($id);

        $validated = $request->validate([
            'hari' => 'required|string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'jam_ke' => [
                'required',
                'integer',
                'min:1',
                Rule::unique('durasi_pembelajarans')
                    ->where(fn ($query) => $query->where('hari', $request->hari))
                    ->ignore($durasi->id),
            ],
            'waktu_mulai' => 'required|date_format:H:i',
            'waktu_selesai' => 'required|date_format:H:i|after:waktu_mulai',
        ], [
            'jam_ke.unique' => 'Jam ke- tersebut sudah ada pada hari yang dipilih.',
            'waktu_selesai.after' => 'Waktu selesai harus setelah waktu mulai.',
        ]);

        $durasi->update($validated);

        return redirect()->back();
    }

    public function destroy(string $id)
    {
        DurasiPembelajaran::findOrFail($id)->delete();

        return redirect()->back();
    }
}
