import { Head, Link } from '@inertiajs/react';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { dashboard as adminDashboard } from '@/routes/admin';
export default function AlumniKelas({ tahunAjaran, kelasList }: any) {
  return (
    <>
      <Head title={`Alumni ${tahunAjaran.tahun_awal}/${tahunAjaran.tahun_akhir}`} />
      <div className="flex h-full w-full flex-1 flex-col gap-4 p-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/alumni" className="inline-flex items-center justify-center rounded-md border p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Alumni {tahunAjaran.tahun_awal}/{tahunAjaran.tahun_akhir}</h1>
            <p className="text-sm text-muted-foreground">Pilih kelas — XII per jurusan.</p>
          </div>
        </div>
        {kelasList.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Belum ada alumni di tahun ini.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {kelasList.map((k: any) => (
              <Link key={k.id} href={`/admin/alumni/${tahunAjaran.id}/kelas/${k.id}`} className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-accent transition-colors">
                <div className="rounded-lg bg-primary/10 p-2"><GraduationCap className="h-5 w-5 text-primary" /></div>
                <div><p className="font-medium text-sm text-black dark:text-white">{k.full_nama_kelas}</p><p className="text-xs text-muted-foreground">{k.alumni_count} siswa</p></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
AlumniKelas.layout = { breadcrumbs: [{ title: 'Admin', href: adminDashboard.url() }, { title: 'Alumni', href: '/admin/alumni' }, { title: 'Kelas' }] };
