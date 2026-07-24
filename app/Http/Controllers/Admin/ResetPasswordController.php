<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Siswa;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ResetPasswordController extends Controller
{
    /** Default password for guru accounts. */
    private const GURU_DEFAULT_PASSWORD = 'password';

    /** Default password for siswa accounts. */
    private const SISWA_DEFAULT_PASSWORD = 'password';

    /**
     * Reset a guru's password to the default value.
     */
    public function resetGuru(Request $request, string $id): RedirectResponse
    {
        $guru = Guru::with('user')->findOrFail($id);

        $guru->user->update([
            'password' => Hash::make(self::GURU_DEFAULT_PASSWORD),
            'password_default' => true,
        ]);

        return back()->with('success', "Password guru {$guru->nama} berhasil direset ke default.");
    }

    /**
     * Reset a siswa's password to the default value.
     */
    public function resetSiswa(Request $request, string $id): RedirectResponse
    {
        $siswa = Siswa::with('user')->findOrFail($id);

        $siswa->user->update([
            'password' => Hash::make(self::SISWA_DEFAULT_PASSWORD),
            'password_default' => true,
        ]);

        return back()->with('success', "Password siswa {$siswa->nama} berhasil direset ke default.");
    }
}
