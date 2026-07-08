import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import adminSchedule from '@/routes/admin/schedule';
import { dashboard as adminDashboard } from '@/routes/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Edit2, X, Plus, Save, Clock } from 'lucide-react';

interface Schedule {
    id: number;
    nama: string;
    waktu_mulai: string;
    waktu_selesai: string;
    urutan: number;
}

export default function SchedulesIndex({ schedules }: { schedules: Schedule[] }) {
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama: '',
        waktu_mulai: '07:00',
        waktu_selesai: '07:45',
        urutan: 1,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSchedule) {
            put(adminSchedule.update.url({ schedule: editingSchedule.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Jam pelajaran berhasil diperbarui');
                },
            });
        } else {
            post(adminSchedule.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    setData(prev => ({
                        ...prev,
                        nama: '',
                        urutan: Number(prev.urutan) + 1,
                    }));
                    toast.success('Jam pelajaran berhasil ditambahkan');
                },
            });
        }
    };

    const handleEdit = (schedule: Schedule) => {
        setEditingSchedule(schedule);
        clearErrors();
        setData({
            nama: schedule.nama,
            waktu_mulai: schedule.waktu_mulai,
            waktu_selesai: schedule.waktu_selesai,
            urutan: schedule.urutan,
        });
    };

    const handleCancel = () => {
        setEditingSchedule(null);
        reset();
        clearErrors();
    };

    return (
        <>
            <Head title="Manajemen Jam Pelajaran" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Manajemen Jam Pelajaran
                        </h1>
                        <p className="text-muted-foreground">
                            Atur daftar jam pelajaran yang tersedia.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="col-span-1">
                        <div className="sticky top-6 rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    {editingSchedule ? (
                                        <><Edit2 className="h-4 w-4 text-primary" /> Edit Jam Pelajaran</>
                                    ) : (
                                        <><Plus className="h-4 w-4 text-primary" /> Tambah Jam Pelajaran</>
                                    )}
                                </h2>
                                {editingSchedule && (
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
                                    <Label htmlFor="nama">Nama</Label>
                                    <Input
                                        id="nama"
                                        value={data.nama}
                                        onChange={(e) => setData('nama', e.target.value)}
                                        placeholder="Contoh: Jam 1, Upacara"
                                        className="bg-muted/30"
                                    />
                                    {errors.nama && (
                                        <p className="text-xs text-destructive">{errors.nama}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="waktu_mulai">Waktu Mulai</Label>
                                        <Input
                                            id="waktu_mulai"
                                            type="time"
                                            value={data.waktu_mulai}
                                            onChange={(e) => setData('waktu_mulai', e.target.value)}
                                            className="bg-muted/30"
                                        />
                                        {errors.waktu_mulai && (
                                            <p className="text-xs text-destructive">{errors.waktu_mulai}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="waktu_selesai">Waktu Selesai</Label>
                                        <Input
                                            id="waktu_selesai"
                                            type="time"
                                            value={data.waktu_selesai}
                                            onChange={(e) => setData('waktu_selesai', e.target.value)}
                                            className="bg-muted/30"
                                        />
                                        {errors.waktu_selesai && (
                                            <p className="text-xs text-destructive">{errors.waktu_selesai}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="urutan">Urutan</Label>
                                    <Input
                                        id="urutan"
                                        type="number"
                                        min="0"
                                        value={data.urutan}
                                        onChange={(e) => setData('urutan', parseInt(e.target.value) || 0)}
                                        className="bg-muted/30"
                                    />
                                    {errors.urutan && (
                                        <p className="text-xs text-destructive">{errors.urutan}</p>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {editingSchedule && (
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
                                        ) : editingSchedule ? (
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
                        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Urutan</th>
                                            <th className="px-6 py-4">Nama</th>
                                            <th className="px-6 py-4">Waktu Mulai</th>
                                            <th className="px-6 py-4">Waktu Selesai</th>
                                            <th className="px-6 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                        {schedules.map((schedule) => (
                                            <tr
                                                key={schedule.id}
                                                className={`transition-colors hover:bg-muted/30 ${editingSchedule?.id === schedule.id ? 'bg-primary/5' : ''}`}
                                            >
                                                <td className="px-6 py-4 text-muted-foreground">{schedule.urutan}</td>
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    {schedule.nama}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">{schedule.waktu_mulai}</td>
                                                <td className="px-6 py-4 text-muted-foreground">{schedule.waktu_selesai}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(schedule)}
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {schedules.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Clock className="h-8 w-8 opacity-20" />
                                                        <p>Belum ada data jam pelajaran.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

SchedulesIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: adminDashboard.url() },
        { title: 'Jam Pelajaran', href: adminSchedule.index.url() },
    ],
};
