import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import adminCalendarOverride from '@/routes/admin/calendar-override';
import { dashboard as adminDashboard } from '@/routes/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Edit2, X, Plus, Save, Trash2, Calendar } from 'lucide-react';

interface Template {
    id: number;
    nama: string;
    hari: string[];
}

interface Override {
    id: number;
    tanggal: string;
    template_id: number;
    catatan: string | null;
    template: Template;
}

interface Props {
    overrides: Override[];
    templates: Template[];
}

export default function CalendarOverridesIndex({ overrides, templates }: Props) {
    const [editingOverride, setEditingOverride] = useState<Override | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        tanggal: new Date().toISOString().split('T')[0],
        template_id: '',
        catatan: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingOverride) {
            put(adminCalendarOverride.update.url({ calendarOverride: editingOverride.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Penyesuaian jadwal berhasil diperbarui');
                },
            });
        } else {
            post(adminCalendarOverride.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Penyesuaian jadwal berhasil ditambahkan');
                },
            });
        }
    };

    const handleEdit = (override: Override) => {
        setEditingOverride(override);
        clearErrors();
        setData({
            tanggal: override.tanggal,
            template_id: String(override.template_id),
            catatan: override.catatan ?? '',
        });
    };

    const handleCancel = () => {
        setEditingOverride(null);
        reset();
        clearErrors();
    };

    const handleDelete = (id: number) => {
        if (!confirm('Hapus penyesuaian jadwal ini?')) return;

        router.delete(
            adminCalendarOverride.destroy.url({ calendarOverride: id }),
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Penyesuaian jadwal berhasil dihapus.');
                    if (editingOverride?.id === id) handleCancel();
                },
            },
        );
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <>
            <Head title="Penyesuaian Jadwal" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Penyesuaian Jadwal
                        </h1>
                        <p className="text-muted-foreground">
                            Ubah template jadwal untuk tanggal tertentu.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="col-span-1">
                        <div className="sticky top-6 rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    {editingOverride ? (
                                        <><Edit2 className="h-4 w-4 text-primary" /> Edit Penyesuaian</>
                                    ) : (
                                        <><Plus className="h-4 w-4 text-primary" /> Tambah Penyesuaian</>
                                    )}
                                </h2>
                                {editingOverride && (
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
                                    <Label htmlFor="tanggal">Tanggal</Label>
                                    <Input
                                        id="tanggal"
                                        type="date"
                                        value={data.tanggal}
                                        onChange={(e) => setData('tanggal', e.target.value)}
                                        className="bg-muted/30"
                                    />
                                    {errors.tanggal && (
                                        <p className="text-xs text-destructive">{errors.tanggal}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="template_id">Template Jadwal</Label>
                                    <Select value={data.template_id} onValueChange={(value) => setData('template_id', value)}>
                                        <SelectTrigger className="bg-muted/30">
                                            <SelectValue placeholder="Pilih template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates.map((template) => (
                                                <SelectItem key={template.id} value={String(template.id)}>
                                                    {template.nama} ({template.hari.join(', ')})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.template_id && (
                                        <p className="text-xs text-destructive">{errors.template_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="catatan">Catatan (Opsional)</Label>
                                    <Input
                                        id="catatan"
                                        value={data.catatan}
                                        onChange={(e) => setData('catatan', e.target.value)}
                                        placeholder="Contoh: Libur nasional, ujian, dll."
                                        className="bg-muted/30"
                                    />
                                    {errors.catatan && (
                                        <p className="text-xs text-destructive">{errors.catatan}</p>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {editingOverride && (
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
                                        ) : editingOverride ? (
                                            <><Save className="mr-2 h-4 w-4" /> Update</>
                                        ) : (
                                            <><Plus className="mr-2 h-4 w-4" /> Simpan</>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="col-span-1">
                        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Tanggal</th>
                                            <th className="px-6 py-4">Template</th>
                                            <th className="px-6 py-4">Hari</th>
                                            <th className="px-6 py-4">Catatan</th>
                                            <th className="px-6 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                        {overrides.map((override) => (
                                            <tr
                                                key={override.id}
                                                className={`transition-colors hover:bg-muted/30 ${editingOverride?.id === override.id ? 'bg-primary/5' : ''}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium">{formatDate(override.tanggal)}</p>
                                                            <p className="text-xs text-muted-foreground">{override.tanggal}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium">{override.template.nama}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-1">
                                                        {override.template.hari.map((day) => (
                                                            <span key={day} className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                                                {day}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {override.catatan ?? '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(override)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(override.id)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {overrides.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Calendar className="h-8 w-8 opacity-20" />
                                                        <p>Belum ada penyesuaian jadwal.</p>
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

CalendarOverridesIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: adminDashboard.url() },
        { title: 'Penyesuaian Jadwal', href: adminCalendarOverride.index.url() },
    ],
};
