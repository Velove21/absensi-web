import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { FileSpreadsheet, Search, CheckCircle, Clock, FileWarning, UserCircle, CalendarDays } from 'lucide-react';
import adminRekapAbsensiGuru from '@/routes/admin/rekap-absensi-guru';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Guru {
    id: number;
    nama: string;
    nip: string | null;
}

interface RekapItem {
    id: number;
    tanggal: string;
    status: string;
    keterangan: string | null;
    guru_id: number;
    guru_nama: string;
}

interface Props {
    gurus: Guru[];
    filters: {
        guru_id: string | null;
        start_date: string | null;
        end_date: string | null;
    };
    rekap: RekapItem[];
}

export default function AdminGuruAbsensiRekap({ gurus, filters, rekap = [] }: Props) {
    const [guruId, setGuruId] = useState(filters.guru_id || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [guruSearch, setGuruSearch] = useState('');
    const [guruOpen, setGuruOpen] = useState(false);

    const selectedGuru = gurus.find(g => g.id.toString() === guruId);

    const filteredGurus = gurus.filter(g =>
        g.nama.toLowerCase().includes(guruSearch.toLowerCase()) ||
        (g.nip && g.nip.toLowerCase().includes(guruSearch.toLowerCase()))
    );

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (guruId) params.set('guru_id', guruId);
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);

        router.get(
            adminRekapAbsensiGuru.index.url() + '?' + params.toString(),
            {},
            { preserveState: true, preserveScroll: true }
        );
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'hadir':
                return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"><CheckCircle className="h-3 w-3" /> Hadir</span>;
            case 'izin':
                return <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20"><FileWarning className="h-3 w-3" /> Izin</span>;
            case 'sakit':
                return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20"><Clock className="h-3 w-3" /> Sakit</span>;
            default:
                return <span>{status}</span>;
        }
    };

    return (
        <>
            <Head title="Rekap Absensi Guru" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Rekap Absensi Guru
                    </h1>
                    <p className="text-muted-foreground">
                        Lihat rekap kehadiran guru berdasarkan nama dan rentang tanggal.
                    </p>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                    <div className="flex flex-wrap gap-3 items-end">
                        {/* Pilih Guru */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Nama Guru</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setGuruOpen(!guruOpen)}
                                    className="flex h-9 w-[250px] items-center justify-between gap-2 rounded-md border border-input bg-muted/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                >
                                    <span className="line-clamp-1 flex-1 text-left">
                                        {selectedGuru ? `${selectedGuru.nama} (${selectedGuru.nip || '-'})` : '-- Pilih Guru --'}
                                    </span>
                                    <Search className="size-4 shrink-0 opacity-50" />
                                </button>
                                {guruOpen && (
                                    <div className="bg-popover text-popover-foreground absolute z-50 mt-1 w-[250px] origin-top overflow-hidden rounded-md border shadow-md">
                                        <div className="flex items-center gap-2 border-b px-3 py-2">
                                            <Search className="size-4 shrink-0 opacity-50" />
                                            <input
                                                value={guruSearch}
                                                onChange={e => setGuruSearch(e.target.value)}
                                                placeholder="Cari guru..."
                                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1">
                                            {filteredGurus.length === 0 ? (
                                                <p className="px-2 py-6 text-center text-sm text-muted-foreground">Tidak ada hasil</p>
                                            ) : (
                                                filteredGurus.map(g => (
                                                    <button
                                                        key={g.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setGuruId(g.id.toString());
                                                            setGuruOpen(false);
                                                            setGuruSearch('');
                                                        }}
                                                        className={`w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent ${guruId === g.id.toString() ? 'bg-accent font-medium' : ''}`}
                                                    >
                                                        <UserCircle className="size-4 shrink-0 text-muted-foreground" />
                                                        <span className="flex-1 text-left">{g.nama}</span>
                                                        <span className="text-xs text-muted-foreground">{g.nip || '-'}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Tanggal Mulai</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-[170px] bg-muted/30 h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Tanggal Selesai</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-[170px] bg-muted/30 h-9"
                            />
                        </div>
                        <Button onClick={handleSearch} className="h-9 gap-1.5">
                            <Search className="h-4 w-4" /> Cari
                        </Button>
                    </div>
                </div>

                {/* Result table */}
                {rekap.length > 0 && (
                    <div className="rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 w-12 text-center">No</th>
                                        <th className="px-6 py-4">Nama Guru</th>
                                        <th className="px-6 py-4">Tanggal</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 min-w-[200px]">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {rekap.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 text-center text-muted-foreground">{idx + 1}</td>
                                            <td className="px-6 py-4 font-medium">{item.guru_nama}</td>
                                            <td className="px-6 py-4">{item.tanggal}</td>
                                            <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">{item.keterangan || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {guruId && rekap.length === 0 && (
                    <div className="flex flex-col items-center justify-center border border-dashed border-sidebar-border/70 bg-card rounded-xl p-12 text-center">
                        <CalendarDays className="h-12 w-12 text-primary opacity-25 mb-4" />
                        <h3 className="text-lg font-semibold">Belum Ada Data</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-1">
                            Tidak ditemukan rekap absensi untuk guru yang dipilih pada rentang tanggal tersebut.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
