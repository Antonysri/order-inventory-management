<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query();

        // Search by name or SKU
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($status = $request->query('status')) {
            if ($status === 'active' || $status === 'inactive') {
                $query->where('status', $status);
            } elseif ($status === 'low_stock') {
                $query->lowStock();
            } elseif ($status === 'out_of_stock') {
                $query->outOfStock();
            }
        }

        $perPage = min((int) $request->query('per_page', 10), 100);
        $products = $query->orderBy('id', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products,sku',
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $product = Product::create($validated);

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'product.created',
            'entity_type' => 'Product',
            'entity_id' => $product->id,
            'description' => "Product '{$product->name}' (SKU: {$product->sku}) created",
            'metadata' => [
                'name' => $product->name,
                'sku' => $product->sku,
                'price' => $product->price,
                'stock' => $product->stock_quantity,
            ],
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => $product,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => ['required', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($product->id)],
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $oldStock = $product->stock_quantity;
        $product->update($validated);

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'product.updated',
            'entity_type' => 'Product',
            'entity_id' => $product->id,
            'description' => "Product '{$product->name}' updated",
            'metadata' => [
                'old_stock' => $oldStock,
                'new_stock' => $product->stock_quantity,
            ],
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $product,
        ]);
    }

    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $newStatus = $product->status === 'active' ? 'inactive' : 'active';
        $product->status = $newStatus;
        $product->save();

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'product.status_changed',
            'entity_type' => 'Product',
            'entity_id' => $product->id,
            'description' => "Product '{$product->name}' status changed to {$newStatus}",
            'metadata' => ['status' => $newStatus],
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Product status changed to {$newStatus}",
            'data' => $product,
        ]);
    }

    public function adjustStock(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'adjustment' => 'required|integer',
            'reason' => 'nullable|string',
        ]);

        $adjustment = (int) $validated['adjustment'];

        $product = DB::transaction(function () use ($id, $adjustment, $request, $validated) {
            $product = Product::whereKey($id)->lockForUpdate()->firstOrFail();

            if ($product->stock_quantity + $adjustment < 0) {
                abort(422, "Cannot reduce stock below zero. Current stock: {$product->stock_quantity}");
            }

            $oldStock = $product->stock_quantity;
            $product->stock_quantity += $adjustment;
            $product->save();

            ActivityLog::create([
                'user_id' => $request->user()?->id,
                'action' => $adjustment >= 0 ? 'stock.increased' : 'stock.decreased',
                'entity_type' => 'Product',
                'entity_id' => $product->id,
                'description' => "Stock adjusted for '{$product->name}' by {$adjustment} (reason: " . ($validated['reason'] ?? 'manual adjustment') . ")",
                'metadata' => [
                    'old_stock' => $oldStock,
                    'new_stock' => $product->stock_quantity,
                    'adjustment' => $adjustment,
                ],
                'created_at' => now(),
            ]);

            return $product;
        });

        return response()->json([
            'success' => true,
            'message' => 'Stock adjusted successfully',
            'data' => $product,
        ]);
    }
}
