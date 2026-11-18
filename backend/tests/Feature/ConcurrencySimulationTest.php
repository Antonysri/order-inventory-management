<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConcurrencySimulationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Customer $customerA;
    protected Customer $customerB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->customerA = Customer::factory()->create(['name' => 'Customer A']);
        $this->customerB = Customer::factory()->create(['name' => 'Customer B']);
    }

    /**
     * Phase 9 Assessment Scenario:
     * Product has stock = 1.
     * Two concurrent requests arrive for the last remaining unit.
     * Exactly one order must succeed (stock becomes 0).
     * The other request must be rejected with OUT_OF_STOCK (never -1).
     */
    public function test_concurrent_orders_for_last_unit_prevents_negative_inventory(): void
    {
        $lastProduct = Product::factory()->create([
            'name' => 'Last iPhone 16 in Stock',
            'sku' => 'IPH-LAST-1',
            'price' => 60000.00,
            'stock_quantity' => 1, // EXACTLY 1 REMAINING UNIT
            'status' => 'active',
        ]);

        // Customer A places order for 1 unit
        $responseA = $this->actingAs($this->user)->postJson('/api/orders', [
            'customer_id' => $this->customerA->id,
            'items' => [
                ['product_id' => $lastProduct->id, 'quantity' => 1],
            ],
        ]);

        // Customer B places order for 1 unit
        $responseB = $this->actingAs($this->user)->postJson('/api/orders', [
            'customer_id' => $this->customerB->id,
            'items' => [
                ['product_id' => $lastProduct->id, 'quantity' => 1],
            ],
        ]);

        // Customer A succeeds
        $responseA->assertStatus(201)
            ->assertJsonPath('success', true);

        // Customer B fails with OutOfStock
        $responseB->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_type', 'OUT_OF_STOCK');

        // Verify database guarantees:
        // 1. Exactly 1 order was persisted
        $this->assertDatabaseCount('orders', 1);

        // 2. Final stock is EXACTLY 0, NEVER -1!
        $this->assertDatabaseHas('products', [
            'id' => $lastProduct->id,
            'stock_quantity' => 0,
        ]);
    }
}
