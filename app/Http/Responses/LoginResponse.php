<?php

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  Request  $request
     */
    public function toResponse($request): Response
    {
        $role = $request->user()->role;

        if ($role === 'admin') {
            return redirect()->route('admin.dashboard');
        } elseif ($role === 'guru') {
            return redirect()->route('guru.absensi.index');
        } elseif ($role === 'siswa') {
            return redirect()->route('siswa.dashboard');
        }

        return redirect()->intended(config('fortify.home'));
    }
}
