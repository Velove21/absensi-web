import { Head } from '@inertiajs/react';
import { FileSpreadsheet, Search, ChevronDown, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import guruAbsensi from '@/routes/guru/absensi';
import guruExport from '@/routes/guru/export';
import { exportAbsensi as guruExportAbsensi } from '@/routes/guru';

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
    activeYear?: { tahun_awal: string; tahun_akhir: string; start: string; end: string } | null;
}

export default function GuruExportAbsensi({ kelasList, mataPelajarans, activeYear }: Props) {
    const [mapelIds, setMapelIds] = useState<string[]>([]);
    const [kelasIds, setKelasIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [mapelSearch, setMapelSearch] = useState('');
    const [kelasSearch, setKelasSearch] = useState('');
    const [mapelOpen, setMapelOpen] = useState(false);
    const [kelasOpen, setKelasOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const mapelRef = useRef<HTMLDivElement>(null);
    const kelasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (mapelRef.current && !mapelRef.current.contains(e.target as Node)) {
                setMapelOpen(false);
            }
            if (kelasRef.current && !kelasRef.current.contains(e.target as Node)) {
                setKelasOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const allMapelSelected = mapelIds.length === mataPelajarans.length && mataPelajarans.length > 0;
    const allKelasSelected = kelasIds.length === kelasList.length && kelasList.length > 0;

    const toggleMapel = (id: string) => {
        setMapelIds(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
        setMapelOpen(false);
    };

    const toggleAllMapel = () => {
        if (allMapelSelected) {
            setMapelIds([]);
        } else {
            setMapelIds(mataPelajarans.map(m => m.id.toString()));
        }
        setMapelOpen(false);
    };

    const toggleKelas = (id: string) => {
        setKelasIds(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
        setKelasOpen(false);
    };

    const toggleAllKelas = () => {
        if (allKelasSelected) {
            setKelasIds([]);
        } else {
            setKelasIds(kelasList.map(k => k.id.toString()));
        }
        setKelasOpen(false);
    };

    const filteredMapels = mataPelajarans.filter(m =>
        m.nama_mapel.toLowerCase().includes(mapelSearch.toLowerCase())
    );

    const filteredKelas = kelasList.filter(k =>
        (k.full_nama_kelas ?? k.nama_kelas).toLowerCase().includes(kelasSearch.toLowerCase())
    );

    const handleExport = async () => {
        if (kelasIds.length === 0) {
            toast.error('Silakan pilih Kelas untuk ekspor.');
            return;
        }
        if (activeYear && ((startDate && (startDate < activeYear.start || startDate > activeYear.end)) || (endDate && (endDate < activeYear.start || endDate > activeYear.end)))) {
            toast.error(`Rentang ekspor harus dalam tahun ajaran aktif ${activeYear.tahun_awal}/${activeYear.tahun_akhir} (${activeYear.start} s/d ${activeYear.end}).`);
            return;
        }
        // Mapel opsional untuk format bersih No|NIS|Nama|Kelas|Keterangan
        const params = new URLSearchParams();
        mapelIds.forEach(id => params.append('mapel_ids[]', id));
        kelasIds.forEach(id => params.append('kelas_ids[]', id));

        if (startDate) {
            params.set('start_date', startDate);
        }

        if (endDate) {
            params.set('end_date', endDate);
        }
        params.set('simple', '1');

        setExporting(true);

        try {
            const response = await fetch(guruExportAbsensi.url() + '?' + params.toString(), {
                headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/json, text/html, */*' },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                let msg = 'Gagal mengunduh file export.';
                try {
                    const ct = response.headers.get('Content-Type') || '';
                    if (ct.includes('application/json')) {
                        const j = await response.json();
                        msg = j.message || j.error || msg;
                    } else {
                        const txt = await response.text();
                        try {
                            const j2 = JSON.parse(txt);
                            msg = j2.message || j2.error || msg;
                        } catch {
                            if (txt.includes('<!DOCTYPE') || txt.includes('<html')) {
                                msg = 'Gagal mengunduh: sesi berakhir atau data tidak valid. Silakan refresh dan coba lagi.';
                            } else if (txt.trim().length > 0 && txt.trim().length < 300) {
                                msg = txt.trim();
                            }
                        }
                    }
                } catch {}
                toast.error(msg);
                return;
            }
            const contentType = response.headers.get('Content-Type') || '';
            // XLSX asli: application/vnd.openxmlformats..., jangan dianggap error jika text/html tapi sebenarnya XLSX
            if (contentType.includes('text/html') && !contentType.includes('application/vnd.openxmlformats') && !contentType.includes('application/vnd.ms-excel')) {
                const txt = await response.text();
                if (txt.includes('<!DOCTYPE') || txt.includes('<html')) {
                    toast.error('Gagal mengunduh: sesi berakhir atau data tidak valid. Silakan refresh dan coba lagi.');
                    return;
                }
            }

            const blob = await response.blob();
            if (blob.size < 100) {
                toast.error('Data kosong untuk filter ini.');
                return;
            }
            const disposition = response.headers.get('Content-Disposition') || '';
            const filenameMatch = disposition.match(/filename="?([^";\n]+)"?/);
            const filename = filenameMatch ? filenameMatch[1] : 'rekap-presensi.xlsx';
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            toast.success('File export berhasil diunduh.');
        } catch {
            toast.error('Terjadi kesalahan saat export.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <>
            <Head title="Ekspor Presensi" />

            <div className="flex h-full w-full flex-1 flex-col gap-6 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Ekspor Presensi</h1>
                        <p className="text-sm text-foreground mt-1">
                            Memberikan ekspor presensi untuk guru pengampu yang memerlukan rekap presensi siswa.
                        </p>
                    </div>
                </div>

                <div className={`rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border w-full max-w-[560px] min-h-[260px] flex flex-col`}>
                    <div className="flex flex-wrap items-end gap-4 w-full">
                        {/* Pilih Mapel */}
                        <div className="space-y-1.5 w-full sm:w-auto">
                            <label className="text-xs font-medium text-muted-foreground">Pilih Mapel</label>
                            <div ref={mapelRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
 setMapelOpen(!mapelOpen); setKelasOpen(false); 
}}
                                    className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-muted/30 px-3 py-1 text-xs leading-tight shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none sm:w-[220px] sm:text-sm"
                                >
                                    <span className="min-w-0 flex-1 truncate text-left text-xs leading-tight sm:text-sm">
                                        {mapelIds.length === 0
                                            ? 'Pilih Mapel'
                                            : allMapelSelected
                                                ? 'Semua Mapel'
                                                : `${mapelIds.length} mapel dipilih`}
                                    </span>
                                    <ChevronDown className="size-4 shrink-0 opacity-50" />
                                </button>
                                {mapelOpen && (
                                    <div className="bg-popover text-popover-foreground absolute z-[100] mt-1 w-full origin-top overflow-hidden rounded-md border shadow-md sm:w-[220px]">
                                        <div className="flex items-center gap-2 border-b px-3 py-2">
                                            <Search className="size-4 shrink-0 opacity-50" />
                                            <input
                                                value={mapelSearch}
                                                onChange={e => setMapelSearch(e.target.value)}
                                                placeholder="Cari mapel..."
                                                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground sm:text-sm"
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1">
                                            <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent sm:text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={allMapelSelected}
                                                    onChange={toggleAllMapel}
                                                    className="size-4 shrink-0"
                                                />
                                                <span className="font-medium">Semua Mapel</span>
                                            </label>
                                            {filteredMapels.length === 0 ? (
                                                <p className="px-2 py-6 text-center text-xs text-muted-foreground sm:text-sm">
                                                    Tidak ada hasil
                                                </p>
                                            ) : (
                                                filteredMapels.map(m => (
                                                    <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent sm:text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={mapelIds.includes(m.id.toString())}
                                                            onChange={() => toggleMapel(m.id.toString())}
                                                            className="size-4 shrink-0"
                                                        />
                                                        <span className="flex-1 break-words whitespace-normal leading-snug">{m.nama_mapel}</span>
                                                        <span className="shrink-0 text-[11px] text-muted-foreground sm:text-xs">{m.kategori}</span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pilih Kelas */}
                        <div className="space-y-1.5 w-full sm:w-auto">
                            <label className="text-xs font-medium text-muted-foreground">Pilih Kelas</label>
                            <div ref={kelasRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
 setKelasOpen(!kelasOpen); setMapelOpen(false); 
}}
                                    className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-muted/30 px-3 py-1 text-xs leading-tight shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none sm:w-[220px] sm:text-sm"
                                >
                                    <span className="min-w-0 flex-1 truncate text-left text-xs leading-tight sm:text-sm">
                                        {kelasIds.length === 0
                                            ? 'Pilih Kelas'
                                            : allKelasSelected
                                                ? 'Semua Kelas'
                                                : `${kelasIds.length} kelas dipilih`}
                                    </span>
                                    <ChevronDown className="size-4 shrink-0 opacity-50" />
                                </button>
                                {kelasOpen && (
                                    <div className="bg-popover text-popover-foreground absolute z-[100] mt-1 w-full origin-top overflow-hidden rounded-md border shadow-md sm:w-[220px]">
                                        <div className="flex items-center gap-2 border-b px-3 py-2">
                                            <Search className="size-4 shrink-0 opacity-50" />
                                            <input
                                                value={kelasSearch}
                                                onChange={e => setKelasSearch(e.target.value)}
                                                placeholder="Cari kelas..."
                                                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground sm:text-sm"
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1">
                                            <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent sm:text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={allKelasSelected}
                                                    onChange={toggleAllKelas}
                                                    className="size-4 shrink-0"
                                                />
                                                <span className="font-medium">Semua Kelas</span>
                                            </label>
                                            {filteredKelas.length === 0 ? (
                                                <p className="px-2 py-6 text-center text-xs text-muted-foreground sm:text-sm">
                                                    Tidak ada hasil
                                                </p>
                                            ) : (
                                                filteredKelas.map(k => (
                                                    <label key={k.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent sm:text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={kelasIds.includes(k.id.toString())}
                                                            onChange={() => toggleKelas(k.id.toString())}
                                                            className="size-4 shrink-0"
                                                        />
                                                        <span className="flex-1 break-words whitespace-normal leading-snug">{k.full_nama_kelas ?? k.nama_kelas}</span>
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
                                min={activeYear?.start}
                                max={activeYear?.end}
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
                                min={activeYear?.start}
                                max={activeYear?.end}
                            />
                        </div>

                        <Button type="button" onClick={handleExport} disabled={exporting} className="h-9 gap-1.5">
                            {exporting ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Mengunduh...</>
                            ) : (
                                <><FileSpreadsheet className="h-4 w-4" /> Ekspor</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

GuruExportAbsensi.layout = {
    breadcrumbs: [
        { title: 'Guru', href: guruAbsensi.index.url() },
        { title: 'Ekspor Presensi', href: guruExport.index.url() },
    ],
};
