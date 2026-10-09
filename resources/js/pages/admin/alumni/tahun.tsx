import { Head, Link } from '@inertiajs/react';
import { GraduationCap, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { dashboard as adminDashboard } from '@/routes/admin';
export default function AlumniTahun({ tahunList }: any) {
  return (
    <>
      <Head title="Alumni" />
      <div className="flex h-full w-full flex-1 flex-col gap-4 p-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alumni</h1>
          <p className="text-sm text-muted-foreground">Pilih tahun ajaran untuk melihat alumni per kelas.</p>
        </div>
        {tahunList.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Belum ada alumni.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tahunList.map((t: any) => (
              <Link key={t.id} href={`/admin/alumni/${t.id}`} className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-accent transition-colors">
                <div className="rounded-lg bg-primary/10 p-2"><Calendar className="h-5 w-5 text-primary" /></div>
                <div><p className="font-medium text-sm text-black dark:text-white">{t.tahun_awal}/{t.tahun_akhir}</p><p className="text-xs text-muted-foreground">{t.alumni_count} alumni</p></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
AlumniTahun.layout = { breadcrumbs: [{ title: 'Admin', href: adminDashboard.url() }, { title: 'Alumni' }] };
