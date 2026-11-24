<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ChangePasswordRequest;
use App\Http\Requests\Api\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();
        $ownerEmail = (string) config('app.owner_email', '');

        if ($ownerEmail === '' || ! hash_equals(mb_strtolower($ownerEmail), mb_strtolower($credentials['email']))
            || ! Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ។'],
            ]);
        }

        $user = $request->user();
        $token = $user->createToken('afiya-admin')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
        ]);
    }

    public function me(): JsonResponse
    {
        $user = request()->user();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ]);
    }

    public function logout(): JsonResponse
    {
        request()->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'បានចាកចេញពីគណនី។']);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $request->user()->forceFill([
            'password' => Hash::make($request->validated('password')),
        ])->save();
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'បានប្ដូរពាក្យសម្ងាត់រួចរាល់។']);
    }
}
