import { Head, router, useForm } from '@inertiajs/react';
import { Clock, Edit2, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { dashboard as adminDashboard } from '@/routes/admin';
import adminSchedule from '@/routes/admin/jadwal-pelajaran';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

interface Schedule {
    id: number;
    hari: string;
    waktu_mulai: string;
    waktu_selesai: string;
    urutan: number;
}

export default function SchedulesIndex({ schedules }: { schedules: Schedule[] }) {
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
    const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null);
    const [showForm, setShowForm] = useState(false);

    useAutoRefresh(true, 5000, ['schedules']);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        hari: 'Senin',
        waktu_mulai: '07:00',
        waktu_selesai: '07:45',
        urutan: 1,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingSchedule) {
            put(adminSchedule.update.url(editingSchedule.id), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Jam pelajaran berhasil diperbarui');
                    router.reload({ only: ['schedules'], preserveScroll: true, preserveUrl: true } as unknown as never);
                },
            });
        } else {
            post(adminSchedule.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    setData((prev) => ({
                        ...prev,
                        urutan: Number(prev.urutan) + 1,
                    }));
                    setShowForm(false);
                    clearErrors();
                    toast.success('Jam pelajaran berhasil ditambahkan');
                    router.reload({ only: ['schedules'], preserveScroll: true, preserveUrl: true } as unknown as never);
                },
            });
        }
    };

    const handleEdit = (schedule: Schedule) => {
        setEditingSchedule(schedule);
        clearErrors();
        setData({
            hari: schedule.hari,
            waktu_mulai: schedule.waktu_mulai,
            waktu_selesai: schedule.waktu_selesai,
            urutan: schedule.urutan,
        });
        setShowForm(true);
    };

    const handleCancel = () => {
        setEditingSchedule(null);
        setShowForm(false);
        reset();
        clearErrors();
    };

    const handleOpenCreate = () => {
        setEditingSchedule(null);
        reset();
        clearErrors();
        setShowForm(true);
    };

    const handleDelete = () => {
        if (!deletingSchedule) {
            return;
        }

        router.delete(adminSchedule.destroy.url({ jadwal_pelajaran: deletingSchedule.id }), {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingSchedule(null);
                toast.success('Jam pelajaran berhasil dihapus');
                router.reload({ only: ['schedules'], preserveScroll: true, preserveUrl: true } as unknown as never);
            },
        });
    };

    return (
        <>
            <Head title="Manajemen Jam Pelajaran" />
            <div className="flex h-full w-full flex-1 flex-col gap-6 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manajemen Jam Pelajaran</h1>
                        <p className="text-muted-foreground">Atur daftar jam pelajaran yang tersedia.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleOpenCreate} className="bg-white text-black border border-zinc-200 shadow-xs hover:bg-zinc-50 dark:bg-white dark:text-black dark:border-zinc-200 dark:hover:bg-zinc-100">
                            <Plus className="mr-2 h-4 w-4" /> Tambah
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                    <tr>
                                        <th scope="col" className="px-3 py-2">
                                            Urutan
                                        </th>
                                        <th scope="col" className="px-3 py-2">
                                            Hari
                                        </th>
                                        <th scope="col" className="px-3 py-2">
                                            Waktu Mulai
                                        </th>
                                        <th scope="col" className="px-3 py-2">
                                            Waktu Selesai
                                        </th>
                                        <th scope="col" className="px-3 py-2 text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {schedules.map((schedule) => (
                                        <tr
                                            key={schedule.id}
                                            className={`group text-xs transition-colors hover:bg-muted/30 ${editingSchedule?.id === schedule.id ? 'bg-primary/5' : ''}`}
                                        >
                                            <td className="px-3 py-2.5 text-muted-foreground">{schedule.urutan}</td>
                                            <td className="px-3 py-2.5">
                                                <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                                    {schedule.hari}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-muted-foreground">{schedule.waktu_mulai}</td>
                                            <td className="px-3 py-2.5 text-muted-foreground">{schedule.waktu_selesai}</td>
                                            <td className="px-3 py-2.5 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(schedule)}
                                                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeletingSchedule(schedule)}
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {schedules.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-12 text-center text-muted-foreground">
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

            <Dialog open={showForm} onOpenChange={(open) => !open && handleCancel()}>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editingSchedule ? (
                                <>
                                    <Edit2 className="h-4 w-4 text-primary" /> Edit Jam Pelajaran
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 text-primary" /> Tambah Jam Pelajaran
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="hari">Hari</Label>
                            <Select value={data.hari} onValueChange={(val) => setData('hari', val)}>
                                <SelectTrigger className="bg-muted/30">
                                    <SelectValue placeholder="Pilih hari" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DAYS.map((day) => (
                                        <SelectItem key={day} value={day}>
                                            {day}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.hari && <p className="text-xs text-destructive">{errors.hari}</p>}
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
                                {errors.waktu_mulai && <p className="text-xs text-destructive">{errors.waktu_mulai}</p>}
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
                                {errors.waktu_selesai && <p className="text-xs text-destructive">{errors.waktu_selesai}</p>}
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
                            {errors.urutan && <p className="text-xs text-destructive">{errors.urutan}</p>}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing} className="flex-1">
                                {processing ? (
                                    'Proses...'
                                ) : editingSchedule ? (
                                    <>
                                        <Save className="mr-2 h-4 w-4" /> Update
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" /> Simpan
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deletingSchedule !== null} onOpenChange={(open) => !open && setDeletingSchedule(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Jam Pelajaran</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus jam ke-{deletingSchedule?.urutan}? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

SchedulesIndex.layout = {
    breadcrumbs: [
        { title: 'Admin', href: adminDashboard.url() },
        { title: 'Jam Pelajaran', href: adminSchedule.index.url() },
    ],
};
