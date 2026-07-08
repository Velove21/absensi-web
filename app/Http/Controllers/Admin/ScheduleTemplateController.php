<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\ScheduleTemplate;
use App\Models\TemplateSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleTemplateController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/schedule-templates/index', [
            'templates' => ScheduleTemplate::with('schedules')->get(),
            'allSchedules' => Schedule::orderBy('urutan')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:100',
            'hari' => 'required|array|min:1',
            'schedules' => 'required|array|min:1',
        ]);

        $template = ScheduleTemplate::create([
            'nama' => $validated['nama'],
            'hari' => $validated['hari'],
        ]);

        foreach ($validated['schedules'] as $index => $scheduleId) {
            TemplateSchedule::create([
                'template_id' => $template->id,
                'schedule_id' => $scheduleId,
                'urutan' => $index,
            ]);
        }

        return back()->with('success', 'Template jadwal berhasil ditambahkan.');
    }

    public function update(Request $request, string $id)
    {
        $template = ScheduleTemplate::findOrFail($id);

        $validated = $request->validate([
            'nama' => 'required|string|max:100',
            'hari' => 'required|array|min:1',
            'schedules' => 'required|array|min:1',
        ]);

        $template->update([
            'nama' => $validated['nama'],
            'hari' => $validated['hari'],
        ]);

        $template->schedules()->detach();

        foreach ($validated['schedules'] as $index => $scheduleId) {
            TemplateSchedule::create([
                'template_id' => $template->id,
                'schedule_id' => $scheduleId,
                'urutan' => $index,
            ]);
        }

        return back()->with('success', 'Template jadwal berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $template = ScheduleTemplate::findOrFail($id);

        $defaultTemplate = ScheduleTemplate::where('is_default', true)
            ->where('id', '!=', $template->id)
            ->first();

        if ($defaultTemplate) {
            return back()->with('error', 'Tidak dapat menghapus template default. Ubah template default terlebih dahulu.');
        }

        $template->delete();

        return back()->with('success', 'Template jadwal berhasil dihapus.');
    }
}
