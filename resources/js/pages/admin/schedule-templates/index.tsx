import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import adminScheduleTemplate from '@/routes/admin/schedule-template';
import { dashboard as adminDashboard } from '@/routes/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Edit2, X, Plus, Save, Trash2, GripVertical } from 'lucide-react';

interface Schedule {
    id: number;
    nama: string;
    waktu_mulai: string;
    waktu_selesai: string;
    urutan: number;
}

interface TemplateSchedule {
    id: number;
    schedule_id: number;
    urutan: number;
    schedule: Schedule;
}

interface ScheduleTemplate {
    id: number;
    nama: string;
    hari: string[];
    schedule_templates: TemplateSchedule[];
}

interface Props {
    templates: ScheduleTemplate[];
    allSchedules: Schedule[];
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

export default function ScheduleTemplatesIndex({ templates, allSchedules }: Props) {
    const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama: '',
        hari: [] as string[],
        schedules: [] as number[],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTemplate) {
            put(adminScheduleTemplate.update.url({ schedule_template: editingTemplate.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Template jadwal berhasil diperbarui');
                },
            });
        } else {
            post(adminScheduleTemplate.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Template jadwal berhasil ditambahkan');
                },
            });
        }
    };

    const handleEdit = (template: ScheduleTemplate) => {
        setEditingTemplate(template);
        clearErrors();
        setData({
            nama: template.nama,
            hari: [...template.hari],
            schedules: template.schedule_templates.map(st => st.schedule_id),
        });
    };

    const handleCancel = () => {
        setEditingTemplate(null);
        reset();
        clearErrors();
    };

    const toggleDay = (day: string) => {
        setData('hari', data.hari.includes(day) ? data.hari.filter(d => d !== day) : [...data.hari, day]);
    };

    const toggleSchedule = (scheduleId: number) => {
        setData('schedules', data.schedules.includes(scheduleId) ? data.schedules.filter(id => id !== scheduleId) : [...data.schedules, scheduleId]);
    };

    const moveSchedule = (index: number, direction: 'up' | 'down') => {
        const newSchedules = [...data.schedules];
        if (direction === 'up' && index > 0) {
            [newSchedules[index], newSchedules[index - 1]] = [newSchedules[index - 1], newSchedules[index]];
        } else if (direction === 'down' && index < newSchedules.length - 1) {
            [newSchedules[index], newSchedules[index + 1]] = [newSchedules[index + 1], newSchedules[index]];
        }
        setData('schedules', newSchedules);
    };

    const formatTime = (time: string) => time.substring(0, 5);

    return (
        <>
            <Head title="Manajemen Template Jadwal" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Manajemen Template Jadwal
                        </h1>
                        <p className="text-muted-foreground">
                            Kelola template jadwal untuk setiap hari.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="col-span-1">
                        <div className="sticky top-6 rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    {editingTemplate ? (
                                        <><Edit2 className="h-4 w-4 text-primary" /> Edit Template</>
                                    ) : (
                                        <><Plus className="h-4 w-4 text-primary" /> Tambah Template</>
                                    )}
                                </h2>
                                {editingTemplate && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleCancel}
                                        className="h-8 w-8 rounded-full"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nama">Nama Template</Label>
                                    <Input
                                        id="nama"
                                        value={data.nama}
                                        onChange={(e) => setData('nama', e.target.value)}
                                        placeholder="Contoh: Senin/Upacara"
                                        className="bg-muted/30"
                                    />
                                    {errors.nama && (
                                        <p className="text-xs text-destructive">{errors.nama}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Hari</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS.map((day) => (
                                            <Button
                                                key={day}
                                                type="button"
                                                variant={data.hari.includes(day) ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => toggleDay(day)}
                                            >
                                                {day}
                                            </Button>
                                        ))}
                                    </div>
                                    {errors.hari && (
                                        <p className="text-xs text-destructive">{errors.hari}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Jam Pelajaran</Label>
                                    <div className="space-y-2 max-h-60 overflow-y-auto rounded-md border border-input p-2">
                                        {allSchedules.map((schedule) => {
                                            const index = data.schedules.indexOf(schedule.id);
                                            return (
                                                <div
                                                    key={schedule.id}
                                                    className={`flex items-center gap-2 rounded-md p-2 ${index >= 0 ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                                                >
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 cursor-grab"
                                                        disabled={index < 0}
                                                    >
                                                        <GripVertical className="h-3 w-3" />
                                                    </Button>
                                                    <input
                                                        type="checkbox"
                                                        checked={index >= 0}
                                                        onChange={() => toggleSchedule(schedule.id)}
                                                        className="h-4 w-4 rounded border-gray-300"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{schedule.nama}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatTime(schedule.waktu_mulai)} - {formatTime(schedule.waktu_selesai)}
                                                        </p>
                                                    </div>
                                                    {index >= 0 && (
                                                        <div className="flex gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => moveSchedule(index, 'up')}
                                                                disabled={index === 0}
                                                            >
                                                                <Edit2 className="h-3 w-3 rotate-180" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => moveSchedule(index, 'down')}
                                                                disabled={index === data.schedules.length - 1}
                                                            >
                                                                <Edit2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {errors.schedules && (
                                        <p className="text-xs text-destructive">{errors.schedules}</p>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {editingTemplate && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleCancel}
                                            className="flex-1"
                                        >
                                            Batal
                                        </Button>
                                    )}
                                    <Button type="submit" disabled={processing} className="flex-1">
                                        {processing ? (
                                            'Proses...'
                                        ) : editingTemplate ? (
                                            <><Save className="mr-2 h-4 w-4" /> Update</>
                                        ) : (
                                            <><Plus className="mr-2 h-4 w-4" /> Simpan</>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="col-span-1 lg:col-span-2">
                        <div className="space-y-4">
                            {templates.map((template) => (
                                <div
                                    key={template.id}
                                    className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border"
                                >
                                    <div className="flex items-center justify-between p-4 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                        <div>
                                            <h3 className="font-semibold">{template.nama}</h3>
                                            <div className="flex gap-1 mt-1">
                                                {template.hari.map((day) => (
                                                    <span key={day} className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                                        {day}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(template)}
                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-3">#</th>
                                                    <th className="px-6 py-3">Nama</th>
                                                    <th className="px-6 py-3">Waktu Mulai</th>
                                                    <th className="px-6 py-3">Waktu Selesai</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                                {template.schedule_templates.map((st) => (
                                                    <tr key={st.id}>
                                                        <td className="px-6 py-3 text-muted-foreground">{st.urutan}</td>
                                                        <td className="px-6 py-3 font-medium">{st.schedule.nama}</td>
                                                        <td className="px-6 py-3 text-muted-foreground">{formatTime(st.schedule.waktu_mulai)}</td>
                                                        <td className="px-6 py-3 text-muted-foreground">{formatTime(st.schedule.waktu_selesai)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                            {templates.length === 0 && (
                                <div className="rounded-xl border border-sidebar-border/70 bg-card p-12 text-center text-muted-foreground shadow-sm dark:border-sidebar-border">
                                    <p>Belum ada template jadwal.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

ScheduleTemplatesIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: adminDashboard.url() },
        { title: 'Template Jadwal', href: adminScheduleTemplate.index.url() },
    ],
};
