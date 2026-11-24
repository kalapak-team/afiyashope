<?php

use App\Http\Controllers\Api\V1\AdminStatsController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProductImageController;
use App\Http\Controllers\Api\V1\SettingsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::middleware('throttle:public-api')->group(function () {
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{product}', [ProductController::class, 'show']);
        Route::get('/settings', [SettingsController::class, 'show']);
    });

    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware(['auth:sanctum', 'owner'])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/password', [AuthController::class, 'changePassword']);

        Route::get('/admin/stats', AdminStatsController::class);
        Route::post('/admin/products', [ProductController::class, 'store']);
        Route::put('/admin/products/{product}', [ProductController::class, 'update']);
        Route::delete('/admin/products/{product}', [ProductController::class, 'destroy']);
        Route::post('/admin/products/{product}/images', [ProductImageController::class, 'store']);
        Route::delete('/admin/products/{product}/images/{image}', [ProductImageController::class, 'destroy']);
        Route::put('/admin/products/{product}/images/reorder', [ProductImageController::class, 'reorder']);

        Route::put('/admin/settings', [SettingsController::class, 'update']);
        Route::post('/admin/settings/avatar', [SettingsController::class, 'avatar']);
        Route::post('/admin/settings/banner', [SettingsController::class, 'banner']);
    });
});
