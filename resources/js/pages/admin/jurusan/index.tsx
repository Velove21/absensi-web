import { Head, useForm, router } from '@inertiajs/react';
import { Edit2, Trash2, Plus, Save, School } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CsvImport from '@/components/csv-import';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { dashboard as adminDashboard } from '@/routes/admin';
import adminJurusan from '@/routes/admin/jurusan';

interface Jurusan {
    id: number;
    nama_jurusan: string;
    singkatan: string;
}

interface PaginatedData<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function JurusanIndex({ jurusans }: { jurusans: PaginatedData<Jurusan> }) {
    const [editingJurusan, setEditingJurusan] = useState<Jurusan | null>(null);
    const [deletingJurusanId, setDeletingJurusanId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);

    useAutoRefresh(true, 5000);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama_jurusan: '',
        singkatan: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingJurusan) {
            put(adminJurusan.update.url({ jurusan: editingJurusan.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Jurusan berhasil diperbarui');
                    router.reload({ only: ['jurusans'], preserveScroll: true, preserveUrl: true } as unknown as never);
                },
            });
        } else {
            post(adminJurusan.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Jurusan berhasil ditambahkan');
                    router.reload({ only: ['jurusans'], preserveScroll: true, preserveUrl: true } as unknown as never);
                },
            });
        }
    };

    const handleEdit = (jurusan: Jurusan) => {
        setEditingJurusan(jurusan);
        clearErrors();
        setData({
            nama_jurusan: jurusan.nama_jurusan,
            singkatan: jurusan.singkatan || '',
        });
        setShowForm(true);
    };

    const handleCancel = () => {
        setEditingJurusan(null);
        setShowForm(false);
        reset();
        clearErrors();
    };

    const handleOpenCreate = () => {
        setEditingJurusan(null);
        reset();
        clearErrors();
        setShowForm(true);
    };

    const executeDelete = () => {
        if (!deletingJurusanId) {
            return;
        }

        router.delete(adminJurusan.destroy.url({ jurusan: deletingJurusanId }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Jurusan berhasil dihapus');
                setDeletingJurusanId(null);
                router.reload({ only: ['jurusans'], preserveScroll: true, preserveUrl: true } as unknown as never);
            },
            onError: () => setDeletingJurusanId(null),
        });
    };

    return (
        <>
            <Head title="Manajemen Jurusan" />
            <div className="flex h-full w-full flex-1 flex-col gap-6 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manajemen Jurusan</h1>
                        <p className="text-muted-foreground">Kelola data jurusan sekolah.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleOpenCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah
                        </Button>
                        <CsvImport entity="jurusan" title="Impor Jurusan" description="Header: nama_jurusan, singkatan" />
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                <tr>
                                    <th scope="col" className="px-3 py-2">Nama Jurusan</th>
                                    <th scope="col" className="px-3 py-2">Singkatan</th>
                                    <th scope="col" className="px-3 py-2 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {jurusans.data.map((jurusan) => (
                                    <tr
                                        key={jurusan.id}
                                        className={`group text-xs transition-colors hover:bg-muted/30 ${editingJurusan?.id === jurusan.id ? 'bg-primary/5' : ''}`}
                                    >
                                        <td className="px-3 py-2.5 font-medium text-foreground">{jurusan.nama_jurusan}</td>
                                        <td className="px-3 py-2.5 font-mono text-xs">{jurusan.singkatan || '-'}</td>
                                        <td className="px-3 py-2.5 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(jurusan)}
                                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeletingJurusanId(jurusan.id)}
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {jurusans.data.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-3 py-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <School className="h-8 w-8 opacity-20" />
                                                <p className="text-sm">Belum ada data jurusan.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <Pagination links={jurusans.links} />
            </div>

            <Dialog open={showForm} onOpenChange={(open) => !open && handleCancel()}>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editingJurusan ? (
                                <>
                                    <Edit2 className="h-4 w-4 text-primary" /> Edit Jurusan
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 text-primary" /> Tambah Jurusan
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nama_jurusan">Nama Jurusan</Label>
                            <Input
                                id="nama_jurusan"
                                value={data.nama_jurusan}
                                onChange={(e) => setData('nama_jurusan', e.target.value)}
                                placeholder="Contoh: Rekayasa Perangkat Lunak"
                                className="bg-muted/30"
                            />
                            {errors.nama_jurusan && <p className="text-xs text-destructive">{errors.nama_jurusan}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="singkatan">Singkatan</Label>
                            <Input
                                id="singkatan"
                                value={data.singkatan}
                                onChange={(e) => setData('singkatan', e.target.value)}
                                placeholder="Contoh: RPL"
                                className="bg-muted/30"
                            />
                            {errors.singkatan && <p className="text-xs text-destructive">{errors.singkatan}</p>}
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing} className="flex-1">
                                {processing ? 'Proses...' : editingJurusan ? <><Save className="mr-2 h-4 w-4" /> Update</> : <><Plus className="mr-2 h-4 w-4" /> Simpan</>}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deletingJurusanId !== null} onOpenChange={(open) => !open && setDeletingJurusanId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus jurusan ini? Semua data kelas dan siswa terkait akan terhapus.
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

JurusanIndex.layout = {
    breadcrumbs: [
        { title: 'Admin', href: adminDashboard.url() },
        { title: 'Jurusan', href: adminJurusan.index.url() },
    ],
};
