import { Head, Link } from '@inertiajs/react';
import { BookOpen, Users, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { dashboard as adminDashboard } from '@/routes/admin';
import adminTahunAjaran from '@/routes/admin/tahun-ajaran';
export default function ArsipTingkat({ tahunAjaran, jenjangs, jurusans, hasAnyArsip }: any) {
  useAutoRefresh(true, 5000);
  return (
    <>
      <Head title={`Arsip ${tahunAjaran.tahun_awal}/${tahunAjaran.tahun_akhir}`} />
      <div className="flex h-full w-full flex-1 flex-col gap-4 p-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/tahun-ajaran" className="inline-flex items-center justify-center rounded-md border p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Arsip Presensi Tahun {tahunAjaran.tahun_awal}/{tahunAjaran.tahun_akhir}</h1>
            <p className="text-sm text-muted-foreground">Pilih jurusan untuk melihat arsip presensi kelas.</p>
          </div>
        </div>
        {!hasAnyArsip ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Belum ada data arsip untuk tahun ajaran ini.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jenjangs.map((j: any) => (
              <Card key={j.id} className="hover:bg-accent/50 transition-colors">
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-primary" /> {j.nama_jenjang}</CardTitle></CardHeader>
                <CardContent className="space-y-1.5">
                  {jurusans.map((jur: any) => (
                    <Link key={jur.id} href={`/admin/tahun-ajaran/${tahunAjaran.id}/arsip/${j.id}/${jur.id}`} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-primary hover:bg-primary/10 hover:underline"><Users className="h-3.5 w-3.5" /> {jur.singkatan} <span className="text-xs text-muted-foreground">— {jur.nama_jurusan}</span></Link>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
ArsipTingkat.layout = { breadcrumbs: [{ title: 'Admin', href: adminDashboard.url() }, { title: 'Tahun Ajaran', href: adminTahunAjaran.index.url() }, { title: 'Arsip' }] };
