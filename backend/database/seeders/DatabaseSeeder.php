<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@stockroom.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password123'),
            ]
        );

        // 2. Products from mockup
        $productsData = [
            [
                'name' => 'iPhone 16',
                'sku' => 'IPH-C16',
                'category' => 'Smartphone',
                'description' => 'Apple iPhone 16 with A18 Bionic chip, 128GB Storage, Super Retina XDR.',
                'price' => 60000.00,
                'stock_quantity' => 10,
                'status' => 'active',
            ],
            [
                'name' => 'Samsung S25',
                'sku' => 'SAM-S25',
                'category' => 'Smartphone',
                'description' => 'Samsung Galaxy S25 5G, 256GB Storage, Dynamic AMOLED 2X display.',
                'price' => 70000.00,
                'stock_quantity' => 3,
                'status' => 'active',
            ],
            [
                'name' => 'OnePlus 13',
                'sku' => 'OP-013',
                'category' => 'Smartphone',
                'description' => 'OnePlus 13 with Snapdragon 8 Elite, 16GB RAM, Hasselblad Camera.',
                'price' => 45000.00,
                'stock_quantity' => 0,
                'status' => 'active',
            ],
            [
                'name' => 'MacBook Air M3',
                'sku' => 'MBA-M3',
                'category' => 'Laptop',
                'description' => 'Apple MacBook Air 13.6-inch Liquid Retina Display, M3 chip, 8GB Unified Memory.',
                'price' => 105000.00,
                'stock_quantity' => 8,
                'status' => 'active',
            ],
            [
                'name' => 'AirPods Pro',
                'sku' => 'APP-002',
                'category' => 'Accessories',
                'description' => 'Apple AirPods Pro 2nd Gen with USB-C, Active Noise Cancellation.',
                'price' => 24900.00,
                'stock_quantity' => 15,
                'status' => 'active',
            ],
            [
                'name' => 'iPad Air (M2)',
                'sku' => 'IPD-M2',
                'category' => 'Tablet',
                'description' => 'Apple iPad Air with M2 chip, 11-inch Liquid Retina display, Wi-Fi 128GB.',
                'price' => 59900.00,
                'stock_quantity' => 20,
                'status' => 'active',
            ],
            [
                'name' => 'Dell XPS 15',
                'sku' => 'DLL-X15',
                'category' => 'Laptop',
                'description' => 'Dell XPS 15 OLED Touch display, Intel Core i7 13th Gen, 16GB RAM, 1TB SSD.',
                'price' => 145000.00,
                'stock_quantity' => 5,
                'status' => 'active',
            ],
            [
                'name' => 'Sony WH-1000XM5',
                'sku' => 'SNY-XM5',
                'category' => 'Accessories',
                'description' => 'Sony Wireless Noise-Cancelling Headphones with Auto NC Optimizer.',
                'price' => 29990.00,
                'stock_quantity' => 12,
                'status' => 'active',
            ],
        ];

        $products = [];
        foreach ($productsData as $p) {
            $products[$p['sku']] = Product::create($p);
        }

        // 3. Customers from mockup
        $customersData = [
            ['name' => 'Antony Raj', 'email' => 'antony@acme.com', 'phone' => '+91 98765 43210'],
            ['name' => 'Kumar Selvan', 'email' => 'kumar@mail.com', 'phone' => '+91 87654 32109'],
            ['name' => 'Ramesh V', 'email' => 'ramesh@tech.com', 'phone' => '+91 93456 78901'],
            ['name' => 'Priya S', 'email' => 'priya@mail.com', 'phone' => '+91 90987 65432'],
            ['name' => 'Dinesh Kumar', 'email' => 'dinesh@corp.com', 'phone' => '+91 95877 66554'],
        ];

        $customers = [];
        foreach ($customersData as $c) {
            $customers[$c['name']] = Customer::create($c);
        }

        // 4. Orders from mockup
        // Order 1: ORD-000148 (Antony Raj, Placed, iPhone 16 x 2 + Samsung S25 x 1 = 1,90,000)
        $order1 = Order::create([
            'order_number' => 'ORD-000148',
            'customer_id' => $customers['Antony Raj']->id,
            'total_amount' => 190000.00,
            'status' => 'placed',
            'created_at' => now()->subHours(2),
        ]);
        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $products['IPH-C16']->id,
            'quantity' => 2,
            'unit_price' => 60000.00,
            'subtotal' => 120000.00,
        ]);
        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $products['SAM-S25']->id,
            'quantity' => 1,
            'unit_price' => 70000.00,
            'subtotal' => 70000.00,
        ]);

        // Order 2: ORD-000147 (Kumar Selvan, Processing, Samsung S25 x 1 = 70,000)
        $order2 = Order::create([
            'order_number' => 'ORD-000147',
            'customer_id' => $customers['Kumar Selvan']->id,
            'total_amount' => 70000.00,
            'status' => 'processing',
            'created_at' => now()->subDays(1),
        ]);
        OrderItem::create([
            'order_id' => $order2->id,
            'product_id' => $products['SAM-S25']->id,
            'quantity' => 1,
            'unit_price' => 70000.00,
            'subtotal' => 70000.00,
        ]);

        // Order 3: ORD-000146 (Priya S, Completed, OnePlus 13 x 1 = 45,000)
        $order3 = Order::create([
            'order_number' => 'ORD-000146',
            'customer_id' => $customers['Priya S']->id,
            'total_amount' => 45000.00,
            'status' => 'completed',
            'created_at' => now()->subDays(2),
        ]);
        OrderItem::create([
            'order_id' => $order3->id,
            'product_id' => $products['OP-013']->id,
            'quantity' => 1,
            'unit_price' => 45000.00,
            'subtotal' => 45000.00,
        ]);

        // Order 4: ORD-000145 (Ramesh V, Cancelled, MacBook Air M3 x 1 = 1,05,000)
        $order4 = Order::create([
            'order_number' => 'ORD-000145',
            'customer_id' => $customers['Ramesh V']->id,
            'total_amount' => 105000.00,
            'status' => 'cancelled',
            'cancelled_at' => now()->subDays(3)->addHours(4),
            'created_at' => now()->subDays(3),
        ]);
        OrderItem::create([
            'order_id' => $order4->id,
            'product_id' => $products['MBA-M3']->id,
            'quantity' => 1,
            'unit_price' => 105000.00,
            'subtotal' => 105000.00,
        ]);

        // Order 5: ORD-000144 (Dinesh Kumar, Completed, iPhone 16 x 2 = 1,20,000)
        $order5 = Order::create([
            'order_number' => 'ORD-000144',
            'customer_id' => $customers['Dinesh Kumar']->id,
            'total_amount' => 120000.00,
            'status' => 'completed',
            'created_at' => now()->subDays(4),
        ]);
        OrderItem::create([
            'order_id' => $order5->id,
            'product_id' => $products['IPH-C16']->id,
            'quantity' => 2,
            'unit_price' => 60000.00,
            'subtotal' => 120000.00,
        ]);

        // 5. Activity Logs matching mockup screen 11
        ActivityLog::create([
            'user_id' => $admin->id,
            'action' => 'order.cancelled',
            'entity_type' => 'Order',
            'entity_id' => $order4->id,
            'description' => 'Order ORD-000145 cancelled',
            'metadata' => ['order_number' => 'ORD-000145', 'restored_items' => [['sku' => 'MBA-M3', 'qty' => 1]]],
            'created_at' => now()->subDays(3)->addHours(4),
        ]);

        ActivityLog::create([
            'user_id' => $admin->id,
            'action' => 'order.created',
            'entity_type' => 'Order',
            'entity_id' => $order1->id,
            'description' => 'Order ORD-000148 created',
            'metadata' => ['order_number' => 'ORD-000148', 'total' => 190000.00],
            'created_at' => now()->subHours(2),
        ]);

        ActivityLog::create([
            'user_id' => $admin->id,
            'action' => 'stock.decreased',
            'entity_type' => 'Product',
            'entity_id' => $products['IPH-C16']->id,
            'description' => 'iPhone 16 stock decreased by 2',
            'metadata' => ['product' => 'iPhone 16', 'decrement' => 2, 'remaining_stock' => 10],
            'created_at' => now()->subHours(2),
        ]);

        ActivityLog::create([
            'user_id' => $admin->id,
            'action' => 'stock.decreased',
            'entity_type' => 'Product',
            'entity_id' => $products['SAM-S25']->id,
            'description' => 'Samsung S25 stock decreased by 1',
            'metadata' => ['product' => 'Samsung S25', 'decrement' => 1, 'remaining_stock' => 3],
            'created_at' => now()->subHours(2),
        ]);

        ActivityLog::create([
            'user_id' => $admin->id,
            'action' => 'product.updated',
            'entity_type' => 'Product',
            'entity_id' => $products['SAM-S25']->id,
            'description' => 'Samsung S25 stock updated to 3',
            'metadata' => ['product' => 'Samsung S25', 'stock' => 3],
            'created_at' => now()->subHours(1),
        ]);
    }
}
