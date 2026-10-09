import { Head, useForm, router } from '@inertiajs/react';
import { Edit2, Trash2, Plus, Save, Layers, Search } from 'lucide-react';
import { useState, useRef } from 'react';
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
import adminKelas from '@/routes/admin/kelas';

interface Jurusan {
    id: number;
    nama_jurusan: string;
    singkatan: string;
}

interface JenjangKelas {
    id: number;
    nama_jenjang: string;
}

interface Kelas {
    id: number;
    jurusan_id: number | null;
    jenjang_kelas_id: number | null;
    nama_kelas: string | null;
    full_nama_kelas: string;
    jurusan?: Jurusan;
    jenjang_kelas?: JenjangKelas;
}

interface PaginatedData<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function KelasIndex({
    kelas,
    jurusans,
    jenjangKelasList,
    filters,
}: {
    kelas: PaginatedData<Kelas>;
    jurusans: Jurusan[];
    jenjangKelasList: JenjangKelas[];
    filters?: { search?: string | null };
}) {
    const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [deletingKelasId, setDeletingKelasId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters?.search ?? '');
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useAutoRefresh(true, 5000);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        jurusan_id: '',
        jenjang_kelas_id: '',
        nama_kelas: '',
    });

    const handleOpenCreate = () => {
        reset();
        clearErrors();
        setEditingKelas(null);
        setShowForm(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingKelas) {
            put(adminKelas.update.url({ kela: editingKelas.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Kelas berhasil diperbarui');
                    router.reload({ only: ['kelas'], preserveScroll: true, preserveUrl: true } as unknown as never);
                },
            });
        } else {
            post(adminKelas.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Kelas berhasil ditambahkan');
                    router.reload({ only: ['kelas'], preserveScroll: true, preserveUrl: true } as unknown as never);
                },
            });
        }
    };

    const handleEdit = (k: Kelas) => {
        setEditingKelas(k);
        clearErrors();
        setData({
            jurusan_id: k.jurusan_id ? k.jurusan_id.toString() : '',
            jenjang_kelas_id: k.jenjang_kelas_id ? k.jenjang_kelas_id.toString() : '',
            nama_kelas: k.nama_kelas ?? '',
        });
        setShowForm(true);
    };

    const handleCancel = () => {
        setEditingKelas(null);
        reset();
        clearErrors();
        setShowForm(false);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get(adminKelas.index.url(), { search: value || undefined } as never, {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            });
        }, 400);
    };

    const executeDelete = () => {
        if (!deletingKelasId) {
            return;
        }

        router.delete(adminKelas.destroy.url({ kela: deletingKelasId }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Kelas berhasil dihapus');
                setDeletingKelasId(null);
                router.reload({ only: ['kelas'], preserveScroll: true, preserveUrl: true } as unknown as never);
            },
            onError: () => setDeletingKelasId(null),
        });
    };

    return (
        <>
            <Head title="Manajemen Kelas" />
            <div className="flex h-full w-full flex-1 flex-col gap-6 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manajemen Kelas</h1>
                        <p className="text-muted-foreground">Kelola data tingkat dan pembagian kelas siswa menjadi, contoh: XII PPLG A.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleOpenCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah
                        </Button>
                        <CsvImport entity="kelas" title="Impor Kelas" description="Header: nama_kelas, jurusan_singkatan, jenjang_nama" />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari kelas, jenjang atau jurusan..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="bg-muted/30 pl-9"
                        />
                    </div>
                    <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                    <tr>
                                        <th scope="col" className="px-3 py-2.5 text-xs">
                                            Nama Kelas
                                        </th>
                                        <th scope="col" className="px-3 py-2.5 text-xs">
                                            Jurusan
                                        </th>
                                        <th scope="col" className="px-3 py-2.5 text-right text-xs">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {kelas.data.map((k) => (
                                        <tr
                                            key={k.id}
                                            className={`group transition-colors hover:bg-muted/30 ${editingKelas?.id === k.id ? 'bg-primary/5' : ''}`}
                                        >
                                            <td className="px-3 py-2.5 font-medium text-foreground">{k.full_nama_kelas}</td>
                                            <td className="px-3 py-2.5 text-muted-foreground">{k.jurusan?.nama_jurusan}</td>
                                            <td className="px-3 py-2.5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(k)}
                                                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeletingKelasId(k.id)}
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {kelas.data.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-3 py-10 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Layers className="h-8 w-8 opacity-20" />
                                                    <p>Belum ada data kelas.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <Pagination links={kelas.links} />
                </div>
            </div>

            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingKelas ? 'Edit Kelas' : 'Tambah Kelas'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="jenjang_kelas_id">Jenjang</Label>
                            <select
                                id="jenjang_kelas_id"
                                className="flex h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-1 text-xs shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none sm:text-sm"
                                value={data.jenjang_kelas_id}
                                onChange={(e) => setData('jenjang_kelas_id', e.target.value)}
                            >
                                <option value="">Pilih Jenjang</option>
                                {jenjangKelasList.map((j) => (
                                    <option key={j.id} value={j.id}>
                                        {j.nama_jenjang}
                                    </option>
                                ))}
                            </select>
                            {errors.jenjang_kelas_id && <p className="text-xs text-destructive">{errors.jenjang_kelas_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jurusan_id">
                                Jurusan <span className="text-destructive">*</span>
                            </Label>
                            <select
                                id="jurusan_id"
                                className="flex h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-1 text-xs shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none sm:text-sm"
                                value={data.jurusan_id}
                                onChange={(e) => setData('jurusan_id', e.target.value)}
                                required
                            >
                                <option value="">Pilih Jurusan</option>
                                {jurusans.map((j) => (
                                    <option key={j.id} value={j.id}>
                                        {j.nama_jurusan}
                                    </option>
                                ))}
                            </select>
                            {errors.jurusan_id && <p className="text-xs text-destructive">{errors.jurusan_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nama_kelas">Nama Kelas</Label>
                            <Input
                                id="nama_kelas"
                                value={data.nama_kelas}
                                onChange={(e) => setData('nama_kelas', e.target.value)}
                                placeholder="Contoh: A, B, 1, 2"
                                className="bg-muted/30"
                            />
                            {errors.nama_kelas && <p className="text-xs text-destructive">{errors.nama_kelas}</p>}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing} className="flex-1">
                                {processing ? (
                                    'Proses...'
                                ) : editingKelas ? (
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

            <AlertDialog open={deletingKelasId !== null} onOpenChange={(open) => !open && setDeletingKelasId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus kelas ini? Semua data siswa terkait akan terhapus.
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

KelasIndex.layout = {
    breadcrumbs: [
        { title: 'Admin', href: adminDashboard.url() },
        { title: 'Kelas', href: adminKelas.index.url() },
    ],
};
