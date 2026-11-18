<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'order_number' => 'ORD-' . fake()->unique()->numberBetween(100000, 999999),
            'customer_id' => Customer::factory(),
            'total_amount' => fake()->randomFloat(2, 500, 50000),
            'status' => 'placed',
        ];
    }
}
