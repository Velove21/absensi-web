import { Head, Link } from '@inertiajs/react';
import { FileSpreadsheet, GraduationCap, ArrowLeft, Calendar } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { dashboard as adminDashboard } from '@/routes/admin';
import adminTahunAjaran from '@/routes/admin/tahun-ajaran';

interface Record {
  id: number;
  nis: string;
  nama: string;
  foto_url: string | null;
  kelas: string;
  is_alumni: boolean;
  status: string;
  tanggal: string;
  tanggal_formatted: string;
  jam_ke: string | null;
  mapel: string;
  guru: string;
  keterangan: string | null;
}

export default function ArsipDetail({ tahunAjaran, kelas, records, stats }: { tahunAjaran: any; kelas: any; records: Record[]; stats: any }) {
  const [selectedDate, setSelectedDate] = useState<string>('');

  const dates = useMemo(() => {
    const s = new Set(records.map(r => r.tanggal));
    return Array.from(s).sort();
  }, [records]);

  const filtered = useMemo(() => {
    if (!selectedDate) return [];
    return records.filter(r => r.tanggal === selectedDate);
  }, [records, selectedDate]);

  const filteredStats = useMemo(() => {
    const c: Record<string, number> = { hadir: 0, sakit: 0, izin: 0, alpha: 0, dispensasi: 0 };
    filtered.forEach(r => { if (c[r.status] !== undefined) c[r.status]++; });
    return c;
  }, [filtered]);

  const showStats = selectedDate ? filteredStats : stats;

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      hadir: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      sakit: 'bg-blue-50 text-blue-700 ring-blue-600/20',
      izin: 'bg-orange-50 text-orange-700 ring-orange-600/20',
      alpha: 'bg-red-50 text-red-700 ring-red-600/20',
      dispensasi: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    };
    return map[s] ?? 'bg-muted text-muted-foreground';
  };

  const hari = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { weekday: 'long' });
  };

  return (
    <>
      <Head title={`Arsip ${kelas.full_nama_kelas} ${tahunAjaran.tahun_awal}/${tahunAjaran.tahun_akhir}`} />
      <div className="flex h-full w-full flex-1 flex-col gap-4 p-8 font-sans">
        <div className="flex items-center gap-3">
          <Link href={`/admin/tahun-ajaran/${tahunAjaran.id}/arsip`} className="inline-flex items-center justify-center rounded-md border p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Arsip {tahunAjaran.tahun_awal}/{tahunAjaran.tahun_akhir} — {kelas.full_nama_kelas}</h1>
            <p className="text-sm text-muted-foreground font-normal">pilih tanggal untuk melihat presensi atau pilih ekspor data untuk melihat rekap presensi per tahun ajaran.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Pilih Tanggal</label>
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-[200px] h-9 bg-muted/30" />
          </div>
          <Button asChild className="gap-2 h-9"><a href={`/admin/tahun-ajaran/${tahunAjaran.id}/arsip/kelas/${kelas.id}/export`}><FileSpreadsheet className="h-4 w-4" /> Ekspor Arsip</a></Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Card><CardContent className="p-4 text-center"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hadir</p><p className="text-2xl font-bold text-emerald-600 mt-1">{showStats.hadir}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sakit</p><p className="text-2xl font-bold text-blue-600 mt-1">{showStats.sakit}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Izin</p><p className="text-2xl font-bold text-orange-600 mt-1">{showStats.izin}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alpha</p><p className="text-2xl font-bold text-red-600 mt-1">{showStats.alpha}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dispensasi</p><p className="text-2xl font-bold text-indigo-600 mt-1">{showStats.dispensasi}</p></CardContent></Card>
        </div>

        {selectedDate && (
          <Card className="overflow-hidden">
            <CardHeader className="py-2.5 px-4"><CardTitle className="flex items-center gap-2 text-sm font-semibold leading-none"><GraduationCap className="h-4 w-4" /> {kelas.full_nama_kelas} - {hari(selectedDate)}, {selectedDate.split('-').reverse().join('-')}</CardTitle></CardHeader>
            <CardContent className="p-0">
              {filtered.length === 0 ? <div className="py-4 text-center text-sm text-muted-foreground leading-none">Tidak ada data pada tanggal ini.</div> : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/40 text-xs"><TableHead className="w-[40px] text-center py-2">No</TableHead><TableHead className="w-[70px] py-2 text-center">NIS</TableHead><TableHead className="py-2">Nama</TableHead><TableHead className="w-[110px] py-2">Kelas</TableHead><TableHead className="w-[80px] py-2">Hari</TableHead><TableHead className="w-[95px] py-2">Tanggal</TableHead><TableHead className="w-[85px] py-2">Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {filtered.map((r, i) => (
                      <TableRow key={`${r.id}-${r.tanggal}`} className="text-sm">
                        <TableCell className="text-center text-muted-foreground py-2">{i+1}</TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5">
                            <Avatar className="size-6 shrink-0"><AvatarImage src={r.foto_url ?? undefined} /><AvatarFallback className="text-[9px]">{r.nama?.slice(0,2)?.toUpperCase()}</AvatarFallback></Avatar>
                            <span className="font-mono text-xs">{r.nis}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium py-2 text-xs">{r.nama}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap py-2">{r.kelas} {r.is_alumni && <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-medium text-amber-700">Alumni</span>}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap py-2">{hari(r.tanggal)}</TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap py-2">{r.tanggal_formatted}</TableCell>
                        <TableCell className="py-2"><span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadge(r.status)}`}>{r.status}</span></TableCell>
                      </TableRow>
                    ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
ArsipDetail.layout = { breadcrumbs: [{ title: 'Admin', href: adminDashboard.url() }, { title: 'Tahun Ajaran', href: adminTahunAjaran.index.url() }, { title: 'Arsip' }] };
