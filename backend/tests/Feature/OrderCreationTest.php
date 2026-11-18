<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderCreationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->customer = Customer::factory()->create([
            'name' => 'Antony Raj',
            'email' => 'antony@acme.com',
        ]);
    }

    public function test_order_creation_calculates_backend_total_and_reduces_stock(): void
    {
        $productA = Product::factory()->create([
            'name' => 'iPhone 16',
            'price' => 60000.00,
            'stock_quantity' => 10,
            'status' => 'active',
        ]);

        $productB = Product::factory()->create([
            'name' => 'Samsung S25',
            'price' => 70000.00,
            'stock_quantity' => 5,
            'status' => 'active',
        ]);

        $payload = [
            'customer_id' => $this->customer->id,
            'items' => [
                ['product_id' => $productA->id, 'quantity' => 2], // 2 x 60,000 = 1,20,000
                ['product_id' => $productB->id, 'quantity' => 1], // 1 x 70,000 = 70,000
            ],
            // Even if client attempts to tamper with a fake total, backend recalculates 1,90,000.00!
            'fake_client_total' => 50.00,
        ];

        $response = $this->actingAs($this->user)->postJson('/api/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_amount', '190000.00')
            ->assertJsonPath('data.status', 'placed');

        // Verify atomic stock deduction
        $this->assertDatabaseHas('products', [
            'id' => $productA->id,
            'stock_quantity' => 8, // 10 - 2
        ]);
        $this->assertDatabaseHas('products', [
            'id' => $productB->id,
            'stock_quantity' => 4, // 5 - 1
        ]);
    }

    public function test_order_creation_fails_when_stock_is_insufficient(): void
    {
        $product = Product::factory()->create([
            'name' => 'OnePlus 13',
            'price' => 45000.00,
            'stock_quantity' => 2,
            'status' => 'active',
        ]);

        $payload = [
            'customer_id' => $this->customer->id,
            'items' => [
                ['product_id' => $product->id, 'quantity' => 5], // Exceeds 2
            ],
        ];

        $response = $this->actingAs($this->user)->postJson('/api/orders', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_type', 'OUT_OF_STOCK');

        // Stock remains untouched
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock_quantity' => 2,
        ]);

        // Zero orders created
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_order_creation_fails_when_product_is_inactive(): void
    {
        $product = Product::factory()->create([
            'name' => 'Discontinued Phone',
            'price' => 20000.00,
            'stock_quantity' => 10,
            'status' => 'inactive',
        ]);

        $payload = [
            'customer_id' => $this->customer->id,
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
        ];

        $response = $this->actingAs($this->user)->postJson('/api/orders', $payload);

        $response->assertStatus(422);

        $this->assertDatabaseCount('orders', 0);
    }
}
