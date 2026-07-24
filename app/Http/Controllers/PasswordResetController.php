<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetController extends Controller
{
    /**
     * Show the force-change-password page (when password is still default).
     */
    public function show(): Response
    {
        return Inertia::render('auth/force-change-password');
    }

    /**
     * Handle the forced password change submission.
     */
    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'current_password.required' => 'Password lama wajib diisi.',
            'password.required' => 'Password baru wajib diisi.',
            'password.min' => 'Password baru minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Password lama tidak sesuai.']);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'password_default' => false,
        ]);

        return redirect()->intended('/dashboard');
    }

    /**
     * Show the voluntary change-password page (accessible from dashboard).
     */
    public function showChange(): Response
    {
        $role = request()->user()->role;

        $page = match ($role) {
            'admin' => 'admin/change-password',
            'guru' => 'guru/change-password',
            default => 'siswa/change-password',
        };

        return Inertia::render($page);
    }

    /**
     * Handle voluntary password change from dashboard.
     */
    public function updateChange(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'current_password.required' => 'Password lama wajib diisi.',
            'password.required' => 'Password baru wajib diisi.',
            'password.min' => 'Password baru minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Password lama tidak sesuai.']);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'password_default' => false,
        ]);

        return back()->with('success', 'Password berhasil diubah.');
    }
}
