import { Head, useForm, router } from '@inertiajs/react';
import { Edit2, Trash2, X, Plus, Save, ListOrdered } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Pagination from '@/components/pagination';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CsvImport from '@/components/csv-import';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { dashboard as adminDashboard } from '@/routes/admin';
import adminJenjang from '@/routes/admin/jenjang';

interface Jenjang {
    id: number;
    nama_jenjang: string;
}

interface PaginatedData<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function JenjangIndex({
    jenjang,
}: {
    jenjang: PaginatedData<Jenjang>;
}) {
    const [editingJenjang, setEditingJenjang] = useState<Jenjang | null>(null);
    const [deletingJenjangId, setDeletingJenjangId] = useState<number | null>(null);

    useAutoRefresh(true, 5000);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama_jenjang: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingJenjang) {
            put(adminJenjang.update.url({ jenjang: editingJenjang.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Jenjang berhasil diperbarui');
                    router.reload({ only: ['jenjang'], preserveScroll: true, preserveUrl: true } as unknown as never);
                },
            });
        } else {
            post(adminJenjang.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    toast.success('Jenjang berhasil ditambahkan');
                    router.reload({ only: ['jenjang'], preserveScroll: true, preserveUrl: true } as unknown as never);
                },
            });
        }
    };

    const handleEdit = (jenjang: Jenjang) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setEditingJenjang(jenjang);
        clearErrors();
        setData({ nama_jenjang: jenjang.nama_jenjang });
    };

    const handleCancel = () => {
        setEditingJenjang(null);
        reset();
        clearErrors();
    };

    const executeDelete = () => {
        if (!deletingJenjangId) {
return;
}

        router.delete(adminJenjang.destroy.url({ jenjang: deletingJenjangId }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Jenjang berhasil dihapus');
                setDeletingJenjangId(null);
                router.reload({ only: ['jenjang'], preserveScroll: true, preserveUrl: true } as unknown as never);
            },
            onError: () => setDeletingJenjangId(null),
        });
    };

    return (
        <>
            <Head title="Manajemen Jenjang" />
            <div className="flex h-full w-full flex-1 flex-col gap-6 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Manajemen Jenjang
                        </h1>
                        <p className="text-muted-foreground">
                            Kelola data jenjang angkatan untuk melanjutkan ke data tingkat kelas.
                        </p>
                    </div>
                    <CsvImport entity="jenjang" title="Impor Jenjang" description="Header: nama_jenjang" />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
                    {/* Form Input */}
                    <div className="col-span-1 flex flex-col gap-6"><div className="sticky top-8 flex flex-col rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    {editingJenjang ? (
                                        <><Edit2 className="h-4 w-4 text-primary" /> Edit Jenjang</>
                                    ) : (
                                        <><Plus className="h-4 w-4 text-primary" /> Tambah Jenjang</>
                                    )}
                                </h2>
                                {editingJenjang && (
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
                                    <Label htmlFor="nama_jenjang">Nama Jenjang</Label>
                                    <Input
                                        id="nama_jenjang"
                                        value={data.nama_jenjang}
                                        onChange={(e) =>
                                            setData('nama_jenjang', e.target.value)
                                        }
                                        placeholder="Contoh: X, XI, XII, 1, 2"
                                        className="bg-muted/30"
                                        maxLength={20}
                                    />
                                    {errors.nama_jenjang && (
                                        <p className="text-xs text-destructive">
                                            {errors.nama_jenjang}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {editingJenjang && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleCancel}
                                            className="flex-1"
                                        >
                                            Batal
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1"
                                    >
                                        {processing ? (
                                            'Proses...'
                                        ) : editingJenjang ? (
                                            <><Save className="mr-2 h-4 w-4" /> Update</>
                                        ) : (
                                            <><Plus className="mr-2 h-4 w-4" /> Simpan</>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
                        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 w-16">
                                                No
                                            </th>
                                            <th scope="col" className="px-6 py-4">
                                                Nama Jenjang
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-4 text-right"
                                            >
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                        {jenjang.data.map((jenjang, index) => (
                                            <tr
                                                key={jenjang.id}
                                                className={`group transition-colors hover:bg-muted/30 ${editingJenjang?.id === jenjang.id ? 'bg-primary/5' : ''}`}
                                            >
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    {jenjang.nama_jenjang}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(jenjang)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeletingJenjangId(jenjang.id)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {jenjang.data.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={3}
                                                    className="px-6 py-12 text-center text-muted-foreground"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <ListOrdered className="h-8 w-8 opacity-20" />
                                                        <p>Belum ada data jenjang.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <Pagination links={jenjang.links} />
                    </div>
                </div>
            </div>

            <AlertDialog open={deletingJenjangId !== null} onOpenChange={(open) => !open && setDeletingJenjangId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus jenjang ini? Kelas yang menggunakan jenjang ini akan kehilangan data tingkatnya.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

JenjangIndex.layout = {
    breadcrumbs: [
        { title: 'Admin', href: adminDashboard.url() },
        { title: 'Jenjang', href: adminJenjang.index.url() },
    ],
};
