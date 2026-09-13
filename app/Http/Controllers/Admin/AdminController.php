<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $admins = User::where('role', 'admin')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/admin/index', [
            'admins' => $admins,
        ]);
    }

    public function tambahAdmin(Request $request)
    {
        $search = $request->input('search');
        $admins = User::where('role', 'admin')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/tambah-admin', [
            'admins' => $admins,
            'totalAdmins' => User::where('role', 'admin')->count(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'username' => 'nullable|string|max:255|unique:users,username',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $password = $validated['password'] ?? 'password';

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'] ?? strstr($validated['email'], '@', true),
            'password' => Hash::make($password),
            'role' => 'admin',
            'password_default' => empty($validated['password']),
        ]);

        return redirect()->back()->with('success', 'Admin berhasil ditambahkan. Data tetap terpusat — semua admin melihat data yang sama.');
    }

    public function update(Request $request, string $id)
    {
        $admin = User::where('role', 'admin')->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($admin->id)],
            'username' => ['nullable', 'string', 'max:255', Rule::unique('users')->ignore($admin->id)],
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'] ?? $admin->username,
        ];

        if (! empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
            $data['password_default'] = false;
        }

        $admin->update($data);

        return redirect()->back()->with('success', 'Data admin berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $admin = User::where('role', 'admin')->findOrFail($id);

        if (auth()->id() === $admin->id) {
            return redirect()->back()->with('error', 'Tidak dapat menghapus akun sendiri.');
        }

        $adminCount = User::where('role', 'admin')->count();
        if ($adminCount <= 1) {
            return redirect()->back()->with('error', 'Tidak dapat menghapus admin terakhir.');
        }

        $admin->delete();

        return redirect()->back()->with('success', 'Admin berhasil dihapus.');
    }

    public function resetPassword(string $id)
    {
        $admin = User::where('role', 'admin')->findOrFail($id);

        $admin->update([
            'password' => Hash::make('password'),
            'password_default' => true,
        ]);

        return redirect()->back()->with('success', 'Password admin berhasil direset ke default (password).');
    }
}
