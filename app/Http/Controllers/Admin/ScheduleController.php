<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/schedules/index', [
            'schedules' => Schedule::orderBy('urutan')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'hari' => 'required|string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'waktu_mulai' => 'required|date_format:H:i',
            'waktu_selesai' => 'required|date_format:H:i|after:waktu_mulai',
            'urutan' => 'required|integer|min:0',
        ]);

        Schedule::create($validated);

        return back()->with('success', 'Jam pelajaran berhasil ditambahkan.');
    }

    public function update(Request $request, string $id)
    {
        $schedule = Schedule::findOrFail($id);

        $validated = $request->validate([
            'hari' => 'required|string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'waktu_mulai' => 'required|date_format:H:i',
            'waktu_selesai' => 'required|date_format:H:i|after:waktu_mulai',
            'urutan' => 'required|integer|min:0',
        ]);

        $schedule->update($validated);

        return back()->with('success', 'Jam pelajaran berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $schedule = Schedule::findOrFail($id);

        $schedule->delete();

        return back()->with('success', 'Jam pelajaran berhasil dihapus.');
    }
}
