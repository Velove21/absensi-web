<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DurasiPembelajaran;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DurasiPembelajaranController extends Controller
{
    public function index(Request $request)
    {
        $hari = $request->query('hari');

        $query = DurasiPembelajaran::query();

        if ($hari && in_array($hari, ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'], true)) {
            $query->where('hari', $hari);
        }

        // Urut Senin -> Minggu, lalu jam_ke
        $query->orderByRaw("FIELD(hari, 'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu')")
            ->orderBy('jam_ke');

        return Inertia::render('admin/durasipembelajaran/index', [
            'durasiPembelajaran' => $query->paginate(15)->withQueryString(),
            'filters' => ['hari' => $hari],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'hari' => 'required|string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'jam_ke' => [
                'required',
                'integer',
                'min:0',
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
                'min:0',
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
        $durasi = DurasiPembelajaran::findOrFail($id);
        $durasi->delete();

        return redirect()->back()->with('success', 'Jam pembelajaran berhasil dihapus.');
    }
}
