import { Head, useForm, router } from '@inertiajs/react';
import { Edit2, Trash2, X, Plus, Save, BookOpen, Search } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CsvImport from '@/components/csv-import';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { dashboard as adminDashboard } from '@/routes/admin';
import adminMataPelajaran from '@/routes/admin/matapelajaran';

interface KategoriPembelajaran {
    id: number;
    nama_kategori: string;
    kode: string;
}

interface MataPelajaran {
    id: number;
    nama_mapel: string;
    kategori_pembelajaran_id: number;
    kategori_pembelajaran?: KategoriPembelajaran;
}

interface PaginatedData<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

const kategoriColorPalette = [
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20', // MPU - hijau
    'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20', // KK - ungu
    'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
    'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
    'bg-cyan-50 text-cyan-700 ring-cyan-600/20 dark:bg-cyan-500/10 dark:text-cyan-400 dark:ring-cyan-500/20',
    'bg-pink-50 text-pink-700 ring-pink-600/20 dark:bg-pink-500/10 dark:text-pink-400 dark:ring-pink-500/20',
    'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20',
    'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-400 dark:ring-teal-500/20',
    'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
    'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20',
    'bg-lime-50 text-lime-700 ring-lime-600/20 dark:bg-lime-500/10 dark:text-lime-400 dark:ring-lime-500/20',
    'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
];

function getKategoriColor(kode?: string | null, id?: number | null): string {
    if (kode === 'MPU') return kategoriColorPalette[0];
    if (kode === 'KK') return kategoriColorPalette[1];
    const key = `${kode ?? ''}|${id ?? ''}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    // Hindari tabrakan dengan MPU/KK (index 0,1) untuk kategori lain
    const paletteWithoutReserved = kategoriColorPalette.length - 2;
    const idx = 2 + (hash % paletteWithoutReserved);
    return kategoriColorPalette[idx];
}

export default function MataPelajaranIndex({
    matapelajarans,
    kategoriPembelajarans,
    filters,
}: {
    matapelajarans: PaginatedData<MataPelajaran>;
    kategoriPembelajarans: KategoriPembelajaran[];
    filters?: { search?: string | null };
}) {
    const [editingMapel, setEditingMapel] = useState<MataPelajaran | null>(null);
    const [deletingMapelId, setDeletingMapelId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters?.search ?? '');
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useAutoRefresh(true, 5000);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama_mapel: '',
        kategori_pembelajaran_id: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingMapel) {
            put(adminMataPelajaran.update.url({ matapelajaran: editingMapel.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Mata Pelajaran berhasil diperbarui');
                    router.reload({ only: ['matapelajarans'], preserveScroll: true, preserveUrl: true } as unknown as never);
                },
            });
        } else {
            post(adminMataPelajaran.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    toast.success('Mata Pelajaran berhasil ditambahkan');
                    router.reload({ only: ['matapelajarans'], preserveScroll: true, preserveUrl: true } as unknown as never);
                },
            });
        }
    };

    const handleEdit = (m: MataPelajaran) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setEditingMapel(m);
        clearErrors();
        setData({
            nama_mapel: m.nama_mapel,
            kategori_pembelajaran_id: m.kategori_pembelajaran_id.toString(),
        });
    };

    const handleCancel = () => {
        setEditingMapel(null);
        reset();
        clearErrors();
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get(adminMataPelajaran.index.url(), { search: value || undefined } as never, {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            });
        }, 400);
    };

    const executeDelete = () => {
        if (!deletingMapelId) {
return;
}

        router.delete(adminMataPelajaran.destroy.url({ matapelajaran: deletingMapelId }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Mata Pelajaran berhasil dihapus');
                setDeletingMapelId(null);
                router.reload({ only: ['matapelajarans'], preserveScroll: true, preserveUrl: true } as unknown as never);
            },
            onError: () => setDeletingMapelId(null),
        });
    };

    return (
        <>
            <Head title="Manajemen Mata Pelajaran" />
            <div className="flex h-full w-full flex-1 flex-col gap-6 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Manajemen Mata Pelajaran
                        </h1>
                        <p className="text-muted-foreground">
                            Kelola mata pelajaran dan kategori pelajaran.
                        </p>
                    </div>
                    <CsvImport entity="mata-pelajaran" title="Impor Mapel" description="Header: nama_mapel, kategori_kode" />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
                    {/* Form Input */}
                    <div className="col-span-1 flex flex-col gap-6"><div className="sticky top-8 min-h-[260px] flex flex-col rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    {editingMapel ? (
                                        <><Edit2 className="h-4 w-4 text-primary" /> Edit Mapel</>
                                    ) : (
                                        <><Plus className="h-4 w-4 text-primary" /> Tambah Mapel</>
                                    )}
                                </h2>
                                {editingMapel && (
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
                                    <Label htmlFor="nama_mapel">Nama Mata Pelajaran</Label>
                                    <Input
                                        id="nama_mapel"
                                        value={data.nama_mapel}
                                        onChange={(e) =>
                                            setData('nama_mapel', e.target.value)
                                        }
                                        placeholder="Contoh: Matematika, Pemrograman Web"
                                        className="bg-muted/30"
                                        required
                                    />
                                    {errors.nama_mapel && (
                                        <p className="text-xs text-destructive">
                                            {errors.nama_mapel}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="kategori_pembelajaran_id">Kategori</Label>
                                    <select
                                        id="kategori_pembelajaran_id"
                                        className="flex h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-1 text-xs shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none sm:text-sm"
                                        value={data.kategori_pembelajaran_id}
                                        onChange={(e) =>
                                            setData('kategori_pembelajaran_id', e.target.value)
                                        }
                                        required
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {kategoriPembelajarans.map((k) => (
                                            <option key={k.id} value={k.id}>
                                                {k.nama_kategori} ({k.kode})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.kategori_pembelajaran_id && (
                                        <p className="text-xs text-destructive">
                                            {errors.kategori_pembelajaran_id}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {editingMapel && (
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
                                        ) : editingMapel ? (
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
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari mata pelajaran atau kategori..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9 bg-muted/30"
                            />
                        </div>
                        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <tr>
                                            <th scope="col" className="px-6 py-4">Mata Pelajaran</th>
                                            <th scope="col" className="px-6 py-4">Kategori</th>
                                            <th scope="col" className="px-6 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                        {matapelajarans.data.map((m) => (
                                            <tr
                                                key={m.id}
                                                className={`group transition-colors hover:bg-muted/30 ${editingMapel?.id === m.id ? 'bg-primary/5' : ''}`}
                                            >
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    {m.nama_mapel}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getKategoriColor(m.kategori_pembelajaran?.kode, m.kategori_pembelajaran_id)}`}>
                                                        {m.kategori_pembelajaran?.nama_kategori}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(m)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeletingMapelId(m.id)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {matapelajarans.data.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={3}
                                                    className="px-6 py-12 text-center text-muted-foreground"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <BookOpen className="h-8 w-8 opacity-20" />
                                                        <p>Belum ada data mata pelajaran.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <Pagination links={matapelajarans.links} />
                    </div>
                </div>
            </div>

            <AlertDialog open={deletingMapelId !== null} onOpenChange={(open) => !open && setDeletingMapelId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus mata pelajaran ini? Semua data riwayat presensi yang terikat pada mapel ini juga akan terhapus.
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

MataPelajaranIndex.layout = {
    breadcrumbs: [
        { title: 'Admin', href: adminDashboard.url() },
        { title: 'Mata Pelajaran', href: adminMataPelajaran.index.url() },
    ],
};
