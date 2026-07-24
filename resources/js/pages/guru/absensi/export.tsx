import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { FileSpreadsheet, Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Kelas {
    id: number;
    tingkat?: string | null;
    nama_kelas: string;
    full_nama_kelas?: string;
    jurusan: { singkatan: string } | null;
}

interface MataPelajaran {
    id: number;
    nama_mapel: string;
    kategori: string;
}

interface Props {
    kelasList: Kelas[];
    mataPelajarans: MataPelajaran[];
}

export default function GuruExportAbsensi({ kelasList, mataPelajarans }: Props) {
    const [mapelIds, setMapelIds] = useState<string[]>([]);
    const [kelasIds, setKelasIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [mapelSearch, setMapelSearch] = useState('');
    const [kelasSearch, setKelasSearch] = useState('');
    const [mapelOpen, setMapelOpen] = useState(false);
    const [kelasOpen, setKelasOpen] = useState(false);

    const allMapelSelected = mapelIds.length === mataPelajarans.length && mataPelajarans.length > 0;
    const allKelasSelected = kelasIds.length === kelasList.length && kelasList.length > 0;

    const toggleMapel = (id: string) => {
        setMapelIds(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
    };

    const toggleAllMapel = () => {
        if (allMapelSelected) {
            setMapelIds([]);
        } else {
            setMapelIds(mataPelajarans.map(m => m.id.toString()));
        }
    };

    const toggleKelas = (id: string) => {
        setKelasIds(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
    };

    const toggleAllKelas = () => {
        if (allKelasSelected) {
            setKelasIds([]);
        } else {
            setKelasIds(kelasList.map(k => k.id.toString()));
        }
    };

    const filteredMapels = mataPelajarans.filter(m =>
        m.nama_mapel.toLowerCase().includes(mapelSearch.toLowerCase())
    );

    const filteredKelas = kelasList.filter(k =>
        (k.full_nama_kelas ?? k.nama_kelas).toLowerCase().includes(kelasSearch.toLowerCase())
    );

    const handleExport = () => {
        if (mapelIds.length === 0) {
            toast.error('Silakan pilih Mata Pelajaran.');
            return;
        }
        const params = new URLSearchParams();
        mapelIds.forEach(id => params.append('mapel_ids[]', id));
        kelasIds.forEach(id => params.append('kelas_ids[]', id));
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);
        window.open('/guru/export-absensi?' + params.toString(), '_blank');
    };

    return (
        <>
            <Head title="Export Absensi" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Export Absensi</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Pilih kelas dan mata pelajaran untuk mengexport data absensi.
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar p-6 shadow-sm dark:border-sidebar-border">
                    <div className="flex flex-wrap items-end gap-4">
                        {/* Pilih Mapel */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Pilih Mapel</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => { setMapelOpen(!mapelOpen); setKelasOpen(false); }}
                                    className="flex h-9 w-[220px] items-center justify-between gap-2 rounded-md border border-input bg-muted/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                >
                                    <span className="line-clamp-1 flex-1 text-left">
                                        {mapelIds.length === 0
                                            ? '-- Pilih Mapel --'
                                            : allMapelSelected
                                                ? 'Semua Mapel'
                                                : `${mapelIds.length} mapel dipilih`}
                                    </span>
                                    <ChevronDown className="size-4 shrink-0 opacity-50" />
                                </button>
                                {mapelOpen && (
                                    <div className="bg-popover text-popover-foreground absolute z-50 mt-1 w-[220px] origin-top overflow-hidden rounded-md border shadow-md">
                                        <div className="flex items-center gap-2 border-b px-3 py-2">
                                            <Search className="size-4 shrink-0 opacity-50" />
                                            <input
                                                value={mapelSearch}
                                                onChange={e => setMapelSearch(e.target.value)}
                                                placeholder="Cari mapel..."
                                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1">
                                            <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                                                <input
                                                    type="checkbox"
                                                    checked={allMapelSelected}
                                                    onChange={toggleAllMapel}
                                                    className="size-4"
                                                />
                                                <span className="font-medium">Semua Mapel</span>
                                            </label>
                                            {filteredMapels.length === 0 ? (
                                                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                                                    Tidak ada hasil
                                                </p>
                                            ) : (
                                                filteredMapels.map(m => (
                                                    <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                                                        <input
                                                            type="checkbox"
                                                            checked={mapelIds.includes(m.id.toString())}
                                                            onChange={() => toggleMapel(m.id.toString())}
                                                            className="size-4"
                                                        />
                                                        <span className="flex-1">{m.nama_mapel}</span>
                                                        <span className="text-xs text-muted-foreground">{m.kategori}</span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pilih Kelas */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Pilih Kelas</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => { setKelasOpen(!kelasOpen); setMapelOpen(false); }}
                                    className="flex h-9 w-[220px] items-center justify-between gap-2 rounded-md border border-input bg-muted/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                >
                                    <span className="line-clamp-1 flex-1 text-left">
                                        {kelasIds.length === 0
                                            ? '-- Pilih Kelas --'
                                            : allKelasSelected
                                                ? 'Semua Kelas'
                                                : `${kelasIds.length} kelas dipilih`}
                                    </span>
                                    <ChevronDown className="size-4 shrink-0 opacity-50" />
                                </button>
                                {kelasOpen && (
                                    <div className="bg-popover text-popover-foreground absolute z-50 mt-1 w-[220px] origin-top overflow-hidden rounded-md border shadow-md">
                                        <div className="flex items-center gap-2 border-b px-3 py-2">
                                            <Search className="size-4 shrink-0 opacity-50" />
                                            <input
                                                value={kelasSearch}
                                                onChange={e => setKelasSearch(e.target.value)}
                                                placeholder="Cari kelas..."
                                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1">
                                            <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                                                <input
                                                    type="checkbox"
                                                    checked={allKelasSelected}
                                                    onChange={toggleAllKelas}
                                                    className="size-4"
                                                />
                                                <span className="font-medium">Semua Kelas</span>
                                            </label>
                                            {filteredKelas.length === 0 ? (
                                                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                                                    Tidak ada hasil
                                                </p>
                                            ) : (
                                                filteredKelas.map(k => (
                                                    <label key={k.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                                                        <input
                                                            type="checkbox"
                                                            checked={kelasIds.includes(k.id.toString())}
                                                            onChange={() => toggleKelas(k.id.toString())}
                                                            className="size-4"
                                                        />
                                                        <span className="flex-1">{k.full_nama_kelas ?? k.nama_kelas}</span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tanggal Mulai */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Tanggal Mulai</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-[170px] bg-muted/30 h-9"
                            />
                        </div>

                        {/* Tanggal Selesai */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Tanggal Selesai</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-[170px] bg-muted/30 h-9"
                            />
                        </div>

                        <Button onClick={handleExport} className="h-9 gap-1.5">
                            <FileSpreadsheet className="h-4 w-4" /> Export Excel
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
