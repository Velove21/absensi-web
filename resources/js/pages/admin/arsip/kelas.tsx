import { Head, Link } from '@inertiajs/react';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { dashboard as adminDashboard } from '@/routes/admin';
import adminTahunAjaran from '@/routes/admin/tahun-ajaran';
export default function ArsipKelas({ tahunAjaran, kelasList, jenjang, jurusan }: any) {
  return (
    <>
      <Head title={`Arsip ${jenjang.nama_jenjang} ${jurusan.singkatan} ${tahunAjaran.tahun_awal}/${tahunAjaran.tahun_akhir}`} />
      <div className="flex h-full w-full flex-1 flex-col gap-4 p-8">
        <div className="flex items-center gap-3">
          <Link href={`/admin/tahun-ajaran/${tahunAjaran.id}/arsip`} className="inline-flex items-center justify-center rounded-md border p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-2xl font-bold tracking-tight">Arsip Presensi Tahun {tahunAjaran.tahun_awal}/{tahunAjaran.tahun_akhir} - {jenjang.nama_jenjang} {jurusan.singkatan}</h1>
        </div>
        {kelasList.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Belum ada data arsip untuk {jenjang.nama_jenjang} {jurusan.singkatan} di tahun ajaran ini.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {kelasList.map((k: any) => (
              <Link key={k.id} href={`/admin/tahun-ajaran/${tahunAjaran.id}/arsip/kelas/${k.id}/detail`} className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-accent transition-colors">
                <div className="rounded-lg bg-primary/10 p-2"><GraduationCap className="h-5 w-5 text-primary" /></div>
                <div><p className="font-medium text-sm text-black dark:text-white">{k.full_nama_kelas}</p></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
ArsipKelas.layout = { breadcrumbs: [{ title: 'Admin', href: adminDashboard.url() }, { title: 'Tahun Ajaran', href: adminTahunAjaran.index.url() }, { title: 'Arsip' }] };
