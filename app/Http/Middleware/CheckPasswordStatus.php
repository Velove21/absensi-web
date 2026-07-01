<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPasswordStatus
{
    /**
     * Redirect users with a default password to the force-change-password page.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->password_default && ! $request->routeIs('password.change.*')) {
            return redirect()->route('password.change.show');
        }

        return $next($request);
    }
}
