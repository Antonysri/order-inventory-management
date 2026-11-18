<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderCancellationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->customer = Customer::factory()->create();
    }

    public function test_cancelling_order_restores_product_stock_atomically(): void
    {
        $product = Product::factory()->create([
            'name' => 'iPhone 16',
            'stock_quantity' => 5, // Was reduced to 5
        ]);

        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'total_amount' => 120000.00,
            'status' => 'placed',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 60000.00,
            'subtotal' => 120000.00,
        ]);

        $response = $this->actingAs($this->user)->patchJson("/api/orders/{$order->id}/cancel");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'cancelled');

        // Stock restored from 5 to 7!
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock_quantity' => 7,
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_cannot_cancel_an_already_cancelled_order_idempotency_defense(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 7]);

        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 60000.00,
            'subtotal' => 120000.00,
        ]);

        // Second attempt to cancel must be rejected!
        $response = $this->actingAs($this->user)->patchJson("/api/orders/{$order->id}/cancel");

        $response->assertStatus(422)
            ->assertJsonPath('error_type', 'INVALID_STATE');

        // Stock MUST remain 7, never inflated to 9!
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock_quantity' => 7,
        ]);
    }

    public function test_cannot_cancel_a_completed_order(): void
    {
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'status' => 'completed',
        ]);

        $response = $this->actingAs($this->user)->patchJson("/api/orders/{$order->id}/cancel");

        $response->assertStatus(422)
            ->assertJsonPath('error_type', 'INVALID_STATE');
    }
}
