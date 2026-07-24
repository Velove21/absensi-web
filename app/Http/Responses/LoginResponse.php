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
        $target = $this->redirectTarget($request);

        $intended = session()->get('url.intended');
        if ($intended && (str_ends_with(parse_url($intended, PHP_URL_PATH) ?? '', '/login') || $intended === url('/'))) {
            session()->forget('url.intended');
        }

        return redirect()->intended($target);
    }

    public static function redirectTarget(Request $request): string
    {
        $role = $request->user()?->role;

        return match ($role) {
            'admin' => route('admin.dashboard'),
            'guru' => route('guru.absensi.index'),
            'siswa' => route('siswa.dashboard'),
            default => config('fortify.home'),
        };
    }
}
