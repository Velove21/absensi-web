import { Head, Link } from '@inertiajs/react';
import { BookOpen, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard as adminDashboard } from '@/routes/admin';
export default function ArsipTingkat({ tahunAjaran, jenjangs, jurusans }: any) {
  return (
    <>
      <Head title={`Arsip ${tahunAjaran.tahun_awal}/${tahunAjaran.tahun_akhir}`} />
      <div className="flex h-full w-full flex-1 flex-col gap-6 p-8">
        <h1 className="text-2xl font-bold">Arsip {tahunAjaran.tahun_awal}/{tahunAjaran.tahun_akhir} - Pilih Tingkat</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {jenjangs.map((j: any) => (
            <Card key={j.id} className="hover:bg-accent">
              <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> {j.nama_jenjang}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {jurusans.map((jur: any) => (
                  <Link key={jur.id} href={`/admin/tahun-ajaran/${tahunAjaran.id}/arsip/${j.id}/${jur.id}`} className="flex items-center gap-2 text-sm text-primary hover:underline"><Users className="h-3 w-3" /> {jur.singkatan}</Link>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
ArsipTingkat.layout = { breadcrumbs: [{ title: 'Admin', href: adminDashboard.url() }, { title: 'Tahun Ajaran' }, { title: 'Arsip' }] };
