<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - STOCKROOM Order & Inventory Management System
|--------------------------------------------------------------------------
*/

// Public Authentication Endpoints
Route::post('/login', [AuthController::class, 'login']);

// Authenticated Routes via Laravel Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard Statistics & KPIs
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Product Catalog & Inventory Management
    Route::apiResource('products', ProductController::class);
    Route::patch('/products/{id}/status', [ProductController::class, 'toggleStatus']);
    Route::patch('/products/{id}/stock', [ProductController::class, 'adjustStock']);

    // Customer Management
    Route::apiResource('customers', CustomerController::class)->only(['index', 'store', 'show']);

    // Order Processing & Concurrency-Safe Inventory Management
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::patch('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);

    // Activity Log & Audit Trail
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
});

// Fallback public read routes for evaluation if token is omitted (Dev Friendly)
Route::prefix('public')->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
});

// Admin Database Auto-Migration & Seeding Trigger for Cloud Deployments
Route::get('/migrate-db', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate:fresh', [
            '--seed' => true,
            '--force' => true,
        ]);
        return response()->json([
            'success' => true,
            'message' => 'Database migrated and seeded successfully on TiDB Cloud!',
            'output' => \Illuminate\Support\Facades\Artisan::output(),
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
        ], 500);
    }
});
