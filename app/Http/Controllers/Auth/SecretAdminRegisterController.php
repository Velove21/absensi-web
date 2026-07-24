<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SecretAdminRegisterController extends Controller
{
    private function validateKey(Request $request): void
    {
        $validKey = config('app.admin_secret_key', 'supersecret123');
        if ($request->query('key') !== $validKey) {
            abort(403, 'Unauthorized secret key.');
        }
    }

    public function show(Request $request): Response
    {
        $this->validateKey($request);

        return Inertia::render('auth/secret-admin-register', [
            'secretKey' => $request->query('key'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->validateKey($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'username' => 'nullable|string|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'] ?? strstr($validated['email'], '@', true),
            'password' => $validated['password'],
            'role' => 'admin',
            'password_default' => false,
        ]);

        Auth::login($user);

        return redirect()->route('admin.dashboard');
    }
}
