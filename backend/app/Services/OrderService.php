<?php

namespace App\Services;

use App\Exceptions\InvalidOrderStateException;
use App\Exceptions\OutOfStockException;
use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /**
     * Create a customer order transactionally with pessimistic locking.
     *
     * @param int $customerId
     * @param array<array{product_id: int, quantity: int}> $items
     * @param int|null $userId
     * @return Order
     *
     * @throws OutOfStockException
     * @throws ValidationException
     */
    public function createOrder(int $customerId, array $items, ?int $userId = null): Order
    {
        // 1. Verify customer exists
        $customer = Customer::findOrFail($customerId);

        if (empty($items)) {
            throw ValidationException::withMessages([
                'items' => 'An order must contain at least one product item.',
            ]);
        }

        // 2. Consolidate duplicate products in request safely
        $consolidatedItems = [];
        foreach ($items as $item) {
            $pId = (int) $item['product_id'];
            $qty = (int) $item['quantity'];

            if ($qty <= 0) {
                throw ValidationException::withMessages([
                    'items' => "Quantity for Product ID {$pId} must be a positive integer.",
                ]);
            }

            $consolidatedItems[$pId] = ($consolidatedItems[$pId] ?? 0) + $qty;
        }

        // 3. Acquire sorted product IDs to ensure deterministic lock acquisition order (Deadlock Prevention)
        $sortedProductIds = array_keys($consolidatedItems);
        sort($sortedProductIds);

        // 4. Execute atomic transaction with MySQL row-level locking
        return DB::transaction(function () use ($customer, $consolidatedItems, $sortedProductIds, $userId) {
            // Lock rows in deterministic ascending order
            $lockedProducts = Product::whereIn('id', $sortedProductIds)
                ->orderBy('id', 'asc')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            // Verify all products exist and are active
            foreach ($sortedProductIds as $pId) {
                if (!isset($lockedProducts[$pId])) {
                    throw ValidationException::withMessages([
                        'items' => "Product with ID {$pId} does not exist.",
                    ]);
                }

                $product = $lockedProducts[$pId];
                if ($product->status !== 'active') {
                    throw ValidationException::withMessages([
                        'items' => "Product '{$product->name}' is currently inactive and cannot be ordered.",
                    ]);
                }

                $requiredQty = $consolidatedItems[$pId];
                if ($product->stock_quantity < $requiredQty) {
                    throw new OutOfStockException(
                        "Insufficient stock for product '{$product->name}'. Available: {$product->stock_quantity}, Requested: {$requiredQty}."
                    );
                }
            }

            // Calculate authoritative backend total & prepare items
            $totalAmount = '0.00';
            $orderItemsData = [];
            $stockDecrements = [];

            foreach ($consolidatedItems as $pId => $qty) {
                $product = $lockedProducts[$pId];
                $unitPrice = (string) $product->price;
                $subtotal = bcmul($unitPrice, (string) $qty, 2);
                $totalAmount = bcadd($totalAmount, $subtotal, 2);

                // Atomic stock decrement
                $product->stock_quantity -= $qty;
                $product->save();

                $orderItemsData[] = [
                    'product_id' => $pId,
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'subtotal' => $subtotal,
                ];

                $stockDecrements[] = [
                    'product_id' => $pId,
                    'name' => $product->name,
                    'qty' => $qty,
                    'remaining_stock' => $product->stock_quantity,
                ];
            }

            // Generate unique human-readable order number (e.g. ORD-000149)
            $nextSeq = (Order::max('id') ?? 0) + 1;
            $orderNumber = 'ORD-' . str_pad((string) (1000 + $nextSeq), 6, '0', STR_PAD_LEFT);

            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $customer->id,
                'total_amount' => $totalAmount,
                'status' => 'placed',
            ]);

            foreach ($orderItemsData as $itemData) {
                $order->items()->create($itemData);
            }

            // Write transactional audit logs
            ActivityLog::create([
                'user_id' => $userId,
                'action' => 'order.created',
                'entity_type' => 'Order',
                'entity_id' => $order->id,
                'description' => "Order {$order->order_number} created with " . count($orderItemsData) . " item(s)",
                'metadata' => [
                    'order_number' => $order->order_number,
                    'total' => $totalAmount,
                    'customer' => $customer->name,
                ],
                'created_at' => now(),
            ]);

            foreach ($stockDecrements as $dec) {
                ActivityLog::create([
                    'user_id' => $userId,
                    'action' => 'stock.decreased',
                    'entity_type' => 'Product',
                    'entity_id' => $dec['product_id'],
                    'description' => "{$dec['name']} stock decreased by {$dec['qty']}",
                    'metadata' => [
                        'order_number' => $order->order_number,
                        'decrement' => $dec['qty'],
                        'remaining_stock' => $dec['remaining_stock'],
                    ],
                    'created_at' => now(),
                ]);
            }

            return $order->load(['customer', 'items.product']);
        }, 3); // 3 deadlock retry attempts
    }

    /**
     * Atomically cancel an order and restore stock with strict idempotency.
     *
     * @param int $orderId
     * @param int|null $userId
     * @return Order
     *
     * @throws InvalidOrderStateException
     */
    public function cancelOrder(int $orderId, ?int $userId = null): Order
    {
        return DB::transaction(function () use ($orderId, $userId) {
            // 1. Lock the order row to prevent concurrent duplicate cancellations
            $order = Order::whereKey($orderId)->lockForUpdate()->firstOrFail();

            // 2. Strict status check guards
            if ($order->status === 'cancelled') {
                throw new InvalidOrderStateException("Order {$order->order_number} is already cancelled.");
            }

            if ($order->status === 'completed') {
                throw new InvalidOrderStateException("Completed order {$order->order_number} cannot be cancelled.");
            }

            // 3. Lock affected products in deterministic ascending order
            $orderItems = $order->items()->get();
            $productIds = $orderItems->pluck('product_id')->unique()->sort()->values()->all();

            $lockedProducts = Product::whereIn('id', $productIds)
                ->orderBy('id', 'asc')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            // 4. Restore stock
            $restoredAudit = [];
            foreach ($orderItems as $item) {
                if (isset($lockedProducts[$item->product_id])) {
                    $product = $lockedProducts[$item->product_id];
                    $product->stock_quantity += $item->quantity;
                    $product->save();

                    ActivityLog::create([
                        'user_id' => $userId,
                        'action' => 'stock.restored',
                        'entity_type' => 'Product',
                        'entity_id' => $product->id,
                        'description' => "Restored {$item->quantity} unit(s) of '{$product->name}' from cancelled order {$order->order_number}",
                        'metadata' => [
                            'order_number' => $order->order_number,
                            'quantity' => $item->quantity,
                            'new_stock' => $product->stock_quantity,
                        ],
                        'created_at' => now(),
                    ]);

                    $restoredAudit[] = [
                        'sku' => $product->sku,
                        'name' => $product->name,
                        'quantity' => $item->quantity,
                    ];
                }
            }

            // 5. Update order status to cancelled
            $order->status = 'cancelled';
            $order->cancelled_at = now();
            $order->save();

            ActivityLog::create([
                'user_id' => $userId,
                'action' => 'order.cancelled',
                'entity_type' => 'Order',
                'entity_id' => $order->id,
                'description' => "Order {$order->order_number} cancelled",
                'metadata' => [
                    'order_number' => $order->order_number,
                    'restored_items' => $restoredAudit,
                ],
                'created_at' => now(),
            ]);

            return $order->load(['customer', 'items.product']);
        }, 3);
    }

    /**
     * Update order status with valid state transitions.
     *
     * @param int $orderId
     * @param string $newStatus
     * @param int|null $userId
     * @return Order
     *
     * @throws InvalidOrderStateException
     */
    public function updateStatus(int $orderId, string $newStatus, ?int $userId = null): Order
    {
        $allowedStatuses = ['placed', 'processing', 'completed', 'cancelled'];
        if (!in_array($newStatus, $allowedStatuses, true)) {
            throw new InvalidOrderStateException("Invalid order status '{$newStatus}'. Allowed: " . implode(', ', $allowedStatuses));
        }

        // Cancellation must always route through cancelOrder to guarantee stock recovery!
        if ($newStatus === 'cancelled') {
            return $this->cancelOrder($orderId, $userId);
        }

        return DB::transaction(function () use ($orderId, $newStatus, $userId) {
            $order = Order::whereKey($orderId)->lockForUpdate()->firstOrFail();

            if ($order->status === 'cancelled') {
                throw new InvalidOrderStateException("Cannot update status of a cancelled order.");
            }

            if ($order->status === 'completed') {
                throw new InvalidOrderStateException("Completed orders are in a terminal state.");
            }

            // Valid transitions:
            // placed -> processing
            // processing -> completed
            $valid = false;
            if ($order->status === 'placed' && in_array($newStatus, ['processing', 'completed'], true)) {
                $valid = true;
            } elseif ($order->status === 'processing' && $newStatus === 'completed') {
                $valid = true;
            }

            if (!$valid) {
                throw new InvalidOrderStateException("Invalid status transition from '{$order->status}' to '{$newStatus}'.");
            }

            $oldStatus = $order->status;
            $order->status = $newStatus;
            $order->save();

            ActivityLog::create([
                'user_id' => $userId,
                'action' => 'order.status_changed',
                'entity_type' => 'Order',
                'entity_id' => $order->id,
                'description' => "Order {$order->order_number} status changed from {$oldStatus} to {$newStatus}",
                'metadata' => ['from' => $oldStatus, 'to' => $newStatus],
                'created_at' => now(),
            ]);

            return $order->load(['customer', 'items.product']);
        });
    }
}
