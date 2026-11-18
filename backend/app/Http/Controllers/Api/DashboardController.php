<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $totalOrders = Order::count();
        $revenue = Order::where('status', '!=', 'cancelled')->sum('total_amount');
        $totalProducts = Product::count();
        $lowStockCount = Product::where('stock_quantity', '>', 0)->where('stock_quantity', '<=', 5)->count();
        $outOfStockCount = Product::where('stock_quantity', '<=', 0)->count();

        // Status breakdown
        $statusCounts = [
            'placed' => Order::where('status', 'placed')->count(),
            'processing' => Order::where('status', 'processing')->count(),
            'completed' => Order::where('status', 'completed')->count(),
            'cancelled' => Order::where('status', 'cancelled')->count(),
        ];

        // Recent orders
        $recentOrders = Order::with(['customer', 'items.product'])
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_orders' => $totalOrders,
                'revenue' => (float) $revenue,
                'total_products' => $totalProducts,
                'low_stock_count' => $lowStockCount,
                'out_of_stock_count' => $outOfStockCount,
                'status_counts' => $statusCounts,
                'recent_orders' => $recentOrders,
            ],
        ]);
    }
}
