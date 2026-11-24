<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOwner
{
    public function handle(Request $request, Closure $next): Response
    {
        $ownerEmail = (string) config('app.owner_email', '');

        abort_unless(
            $request->user() && $ownerEmail !== '' && hash_equals(
                mb_strtolower($ownerEmail),
                mb_strtolower($request->user()->email)
            ),
            403,
            'គណនីនេះមិនមានសិទ្ធិម្ចាស់ហាងទេ។'
        );

        return $next($request);
    }
}
