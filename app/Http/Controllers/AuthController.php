<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;


class AuthController extends Controller
{
    public function register(Request $request)
{
    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users',
        'password' => 'required|string|min:6|confirmed',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'errors' => $validator->errors()
        ], 422);
    }

    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->password)
    ]);

    $token = JWTAuth::fromUser($user);

    return response()->json([
        'success' => true,
        'message' => 'User registered successfully',
        'user' => $user,
        'token' => $token
    ], 201);
}

    public function login(Request $request)
{
    $credentials = $request->only('email', 'password');

    if (!$token = JWTAuth::attempt($credentials)) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid credentials'
        ], 401);
    }

    return response()->json([
        'success' => true,
        'user' => auth()->user(),
        'token' => $token
    ], 200);
}
    public function me()
   {
    return response()->json([
        'success' => true,
        'user' => auth()->user()
    ]);
   }
   public function logout()
{
    JWTAuth::invalidate(JWTAuth::getToken());

    return response()->json([
        'success' => true,
        'message' => 'Successfully logged out'
    ]);
}
    public function refresh()
{
    $newToken = JWTAuth::refresh(JWTAuth::getToken());

    return response()->json([
        'success' => true,
        'token' => $newToken
    ]);
}


}
