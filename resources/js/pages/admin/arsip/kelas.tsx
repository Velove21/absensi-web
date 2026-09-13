import { Head, Link } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
export default function ArsipKelas({ tahunAjaran, kelasList, jenjang, jurusan }: any) {
  return (
    <>
      <Head title={`Arsip ${jenjang.nama_jenjang} ${jurusan.singkatan}`} />
      <div className="flex h-full w-full flex-1 flex-col gap-6 p-8">
        <h1 className="text-2xl font-bold">Arsip {tahunAjaran.tahun_awal}/{tahunAjaran.tahun_akhir} - {jenjang.nama_jenjang} {jurusan.singkatan}</h1>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {kelasList.map((k: any) => (
            <Link key={k.id} href={`/admin/tahun-ajaran/${tahunAjaran.id}/arsip/${k.id}/detail`} className="rounded-xl border bg-card p-4 hover:bg-accent flex items-center gap-2"><GraduationCap className="h-4 w-4" /> {k.full_nama_kelas} {k.nama_kelas}</Link>
          ))}
          {kelasList.length===0 && <Card><CardContent className="p-6 text-muted-foreground">Belum ada kelas</CardContent></Card>}
        </div>
      </div>
    </>
  );
}
