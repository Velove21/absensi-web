import { Head, Link } from '@inertiajs/react';
import { FileSpreadsheet, Users, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
export default function ArsipDetail({ tahunAjaran, kelas, records, stats }: any) {
  return (
    <>
      <Head title={`Arsip ${kelas.full_nama_kelas}`} />
      <div className="flex h-full w-full flex-1 flex-col gap-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Arsip {tahunAjaran.tahun_awal}/{tahunAjaran.tahun_akhir} - {kelas.full_nama_kelas}</h1>
            <p className="text-sm text-muted-foreground">Admin &gt; Tahun Ajaran &gt; {tahunAjaran.tahun_awal}/{tahunAjaran.tahun_akhir} &gt; {kelas.jurusan?.singkatan} &gt; {kelas.full_nama_kelas} • Read-only</p>
          </div>
          <Button asChild className="gap-2"><a href={`/admin/tahun-ajaran/${tahunAjaran.id}/arsip/${kelas.id}/export`}><FileSpreadsheet className="h-4 w-4" /> Ekspor Data</a></Button>
        </div>
        <div className="grid grid-cols-5 gap-3">
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Hadir</p><p className="text-xl font-bold text-emerald-600">{stats.hadir}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Sakit</p><p className="text-xl font-bold text-blue-600">{stats.sakit}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Izin</p><p className="text-xl font-bold text-orange-600">{stats.izin}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Alpha</p><p className="text-xl font-bold text-red-600">{stats.alpha}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Dispensasi</p><p className="text-xl font-bold text-indigo-600">{stats.dispensasi}</p></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Rekap {kelas.full_nama_kelas}</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader><TableRow><TableHead>No</TableHead><TableHead>Foto</TableHead><TableHead>NIS</TableHead><TableHead>Nama Siswa</TableHead><TableHead>Kelas</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {records.length===0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Belum ada arsip {tahunAjaran.tahun_awal}/{tahunAjaran.tahun_akhir}</TableCell></TableRow> :
                  records.map((r:any,i:number)=>(
                    <TableRow key={r.id}><TableCell>{i+1}</TableCell><TableCell><Avatar className="size-8"><AvatarImage src={r.foto_url} /><AvatarFallback>{r.nama?.slice(0,2)}</AvatarFallback></Avatar></TableCell><TableCell className="font-mono text-xs">{r.nis}</TableCell><TableCell className="font-medium">{r.nama}</TableCell><TableCell><span className="inline-flex items-center gap-1">{r.kelas} {r.is_alumni && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">Alumni</span>}</span></TableCell><TableCell>{r.status}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
