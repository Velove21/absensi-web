<?php

use App\Http\Controllers\Guru\DataAbsensiController;
use App\Models\User;
use Illuminate\Http\Request;

$user = User::where('role', 'guru')->first();
echo "user {$user->id} guru {$user->guru->id}\n";
$request = Request::create('/guru/data-absensi?kelas_id=61&tanggal=2026-09-08&berhalangan_hadir=false', 'GET');
$request->setUserResolver(fn () => $user);
$request->headers->set('X-Inertia', 'true');
$request->headers->set('X-Inertia-Version', 'test');

$controller = new DataAbsensiController;
try {
    $response = $controller->index($request);
    echo 'response class '.get_class($response)."\n";
    // Try to get props via reflection
    $ref = new ReflectionClass($response);
    if ($ref->hasProperty('props')) {
        $prop = $ref->getProperty('props');
        $prop->setAccessible(true);
        $props = $prop->getValue($response);
        echo 'props keys: '.implode(',', array_keys($props))."\n";
        echo 'absensis count: '.count($props['absensis'] ?? [])."\n";
        if (! empty($props['absensis'])) {
            echo json_encode(array_slice($props['absensis'], 0, 1), JSON_PRETTY_PRINT)."\n";
        }
        echo 'stats: '.json_encode($props['stats'] ?? [])."\n";
    } else {
        echo "no props property, try getData\n";
        var_dump($response);
    }
} catch (Throwable $e) {
    echo 'error: '.$e->getMessage()."\n";
    echo $e->getTraceAsString()."\n";
}
