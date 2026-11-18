<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_can_list_products_with_pagination(): void
    {
        Product::factory()->count(15)->create();

        $response = $this->actingAs($this->user)->getJson('/api/products?per_page=10');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(10, 'data.data');
    }

    public function test_can_search_products_by_name_or_sku(): void
    {
        Product::factory()->create(['name' => 'Special iPhone', 'sku' => 'SPEC-IPH']);
        Product::factory()->create(['name' => 'Regular Device', 'sku' => 'REG-DEV']);

        $response = $this->actingAs($this->user)->getJson('/api/products?search=Special');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.sku', 'SPEC-IPH');
    }

    public function test_can_create_product_with_valid_data(): void
    {
        $payload = [
            'name' => 'Google Pixel 9 Pro',
            'sku' => 'PIX-9PRO',
            'category' => 'Smartphone',
            'description' => 'Flagship Gemini AI phone',
            'price' => 84999.00,
            'stock_quantity' => 15,
            'status' => 'active',
        ];

        $response = $this->actingAs($this->user)->postJson('/api/products', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.sku', 'PIX-9PRO');

        $this->assertDatabaseHas('products', ['sku' => 'PIX-9PRO', 'stock_quantity' => 15]);
    }

    public function test_cannot_create_product_with_negative_price_or_stock(): void
    {
        $payload = [
            'name' => 'Invalid Product',
            'sku' => 'INV-001',
            'price' => -100.00,
            'stock_quantity' => -5,
            'status' => 'active',
        ];

        $response = $this->actingAs($this->user)->postJson('/api/products', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['price', 'stock_quantity']);
    }

    public function test_can_toggle_product_status(): void
    {
        $product = Product::factory()->create(['status' => 'active']);

        $response = $this->actingAs($this->user)->patchJson("/api/products/{$product->id}/status");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'inactive');

        $this->assertDatabaseHas('products', ['id' => $product->id, 'status' => 'inactive']);
    }
}
