<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'sku' => strtoupper(fake()->bothify('SKU-###-???')),
            'category' => fake()->randomElement(['Smartphone', 'Laptop', 'Accessories', 'Tablet']),
            'description' => fake()->sentence(),
            'price' => fake()->randomFloat(2, 500, 100000),
            'stock_quantity' => fake()->numberBetween(1, 50),
            'status' => 'active',
        ];
    }
}
