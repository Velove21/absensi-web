<?php

use App\Http\Controllers\Guru\DataAbsensiController;
use App\Models\User;
use Illuminate\Http\Request;

$user = User::where('role', 'guru')->first();
if (! $user) {
    echo "no guru\n";
    exit;
}
echo "guru user {$user->id} guru_id {$user->guru?->id}\n";
$request = Request::create('/guru/data-absensi?kelas_id=61&tanggal=2026-09-08', 'GET');
$request->setUserResolver(fn () => $user);
$controller = new DataAbsensiController;
$response = $controller->index($request);
$data = $response->getData();
echo 'props keys: '.implode(',', array_keys($data['page']['props'] ?? $data))."\n";
if (isset($data['page']['props'])) {
    $props = $data['page']['props'];
} else {
    $props = $data;
}
echo 'kelasList count '.count($props['kelasList'] ?? [])."\n";
echo 'absensis count '.count($props['absensis'] ?? [])."\n";
if (! empty($props['absensis'])) {
    $first = $props['absensis'][0];
    echo json_encode($first, JSON_PRETTY_PRINT)."\n";
}
echo 'stats '.json_encode($props['stats'] ?? [])."\n";
