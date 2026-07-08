<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CalendarOverride;
use App\Models\ScheduleTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CalendarOverrideController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/calendar-overrides/index', [
            'overrides' => CalendarOverride::with('template')->orderByDesc('tanggal')->get(),
            'templates' => ScheduleTemplate::orderBy('nama')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tanggal' => 'required|date|unique:calendar_overrides,tanggal',
            'template_id' => 'required|exists:schedule_templates,id',
            'catatan' => 'nullable|string|max:255',
        ]);

        CalendarOverride::create($validated);

        return back()->with('success', 'Penyesuaian jadwal berhasil ditambahkan.');
    }

    public function update(Request $request, string $id)
    {
        $override = CalendarOverride::findOrFail($id);

        $validated = $request->validate([
            'tanggal' => 'required|date|unique:calendar_overrides,tanggal,'.$override->id,
            'template_id' => 'required|exists:schedule_templates,id',
            'catatan' => 'nullable|string|max:255',
        ]);

        $override->update($validated);

        return back()->with('success', 'Penyesuaian jadwal berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $override = CalendarOverride::findOrFail($id);
        $override->delete();

        return back()->with('success', 'Penyesuaian jadwal berhasil dihapus.');
    }
}
