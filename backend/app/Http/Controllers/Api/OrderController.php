<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['customer', 'items.product']);

        // Search by order number or customer name
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by status
        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        // Date range filter
        if ($dateFrom = $request->query('date_from')) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->query('date_to')) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $perPage = min((int) $request->query('per_page', 10), 100);
        $orders = $query->orderBy('id', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|integer|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $order = $this->orderService->createOrder(
            (int) $validated['customer_id'],
            $validated['items'],
            $request->user()?->id
        );

        return response()->json([
            'success' => true,
            'message' => "Order {$order->order_number} created successfully",
            'data' => $order,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $order = Order::with(['customer', 'items.product'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $order = $this->orderService->cancelOrder($id, $request->user()?->id);

        return response()->json([
            'success' => true,
            'message' => "Order {$order->order_number} cancelled and stock restored",
            'data' => $order,
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:placed,processing,completed,cancelled',
        ]);

        $order = $this->orderService->updateStatus($id, $validated['status'], $request->user()?->id);

        return response()->json([
            'success' => true,
            'message' => "Order status updated to {$order->status}",
            'data' => $order,
        ]);
    }
}
