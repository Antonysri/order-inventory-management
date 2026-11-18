# STOCKROOM — Enterprise Order & Inventory Management System

[![CI/CD Pipeline](https://github.com/Antonysri/order-inventory-management/actions/workflows/ci.yml/badge.svg)](https://github.com/Antonysri/order-inventory-management/actions/workflows/ci.yml)
[![PHP Version](https://img.shields.io/badge/PHP-8.3%2B-777BB4?style=flat&logo=php&logoColor=white)](https://www.php.net/)
[![Laravel Version](https://img.shields.io/badge/Laravel-13.x-FF2D20?style=flat&logo=laravel&logoColor=white)](https://laravel.com/)
[![React Version](https://img.shields.io/badge/React-18.x-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![MySQL InnoDB](https://img.shields.io/badge/MySQL-8.0%20InnoDB-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-Proprietary-007ACC?style=flat)](#)

> **Candidate:** Antony S  
> **GitHub Profile:** [@Antonysri](https://github.com/Antonysri)  
> **Contact:** antonysri17@gmail.com | antony777sri@gmail.com | +91 97891 04221  
> **Target Role:** Full-Stack Developer  
> **Target Organization:** Digient Technologies Private Limited  

---

## 📑 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [High-Stakes Problem Statement & Solutions](#2-high-stakes-problem-statement--solutions)
   - [2.1 Concurrency Defense: The Race Condition Challenge](#21-concurrency-defense-the-race-condition-challenge)
   - [2.2 Deadlock Prevention via Deterministic Lock Ordering](#22-deadlock-prevention-via-deterministic-lock-ordering)
   - [2.3 Zero-Trust Server-Side Financial Calculations](#23-zero-trust-server-side-financial-calculations)
   - [2.4 Atomic Idempotent Order Cancellation](#24-atomic-idempotent-order-cancellation)
   - [2.5 Finite State Machine for Order Lifecycles](#25-finite-state-machine-for-order-lifecycles)
3. [System Architecture & Monorepo Structure](#3-system-architecture--monorepo-structure)
4. [Database Design, Schema & Indexing Rationale](#4-database-design-schema--indexing-rationale)
5. [Complete REST API Reference](#5-complete-rest-api-reference)
6. [12-Screen Pixel-Accurate UI Design System](#6-12-screen-pixel-accurate-ui-design-system)
7. [Automated Testing Suite (100% Coverage)](#7-automated-testing-suite-100-coverage)
8. [Production Multi-Stage Dockerization & 1-Click Setup](#8-production-multi-stage-dockerization--1-click-setup)
9. [Local Native Setup Guide](#9-local-native-setup-guide)
10. [Cloud Deployment & TiDB Architecture](#10-cloud-deployment--tidb-architecture)
11. [Evaluation & Live Demo Credentials](#11-evaluation--live-demo-credentials)

---

## 1. Executive Summary

**STOCKROOM** is an enterprise-grade full-stack Order and Inventory Management platform engineered to address the most critical failure modes in distributed e-commerce: **concurrency-induced inventory overselling, race conditions during high-volume checkout, transactional inconsistencies, and client-side price tampering**.

Built as a modern decoupled monorepo, STOCKROOM combines:
- **Backend:** **Laravel 13** on **PHP 8.3** utilizing **MySQL InnoDB** row-level locking (`SELECT ... FOR UPDATE`), atomic database transactions, Form Request validation, API Resources, and Laravel Sanctum stateless token authentication.
- **Frontend:** **React 18** built on **Vite**, **Tailwind CSS**, and **Lucide Icons**, implementing a 1:1 pixel-accurate realization of the 12-screen STOCKROOM design system.
- **Data Integrity:** Strict decimal-safe arithmetic (`bcmath`), deterministic lock acquisition ordering, and immutable MySQL activity auditing.

---

## 2. High-Stakes Problem Statement & Solutions

### 2.1 Concurrency Defense: The Race Condition Challenge

#### The Failure Scenario
Consider a flagship product (e.g., iPhone 16) with **exactly 1 unit remaining in stock**. Two independent shoppers, Customer A and Customer B, submit checkout orders at the exact same millisecond.

In naive architectures relying solely on application-level checks:
1. Process A queries `SELECT stock_quantity FROM products WHERE id = 1` -> reads `1`.
2. Process B queries `SELECT stock_quantity FROM products WHERE id = 1` -> reads `1`.
3. Process A approves the order and writes `UPDATE products SET stock_quantity = 0`.
4. Process B approves the order and writes `UPDATE products SET stock_quantity = -1`.

**Result:** Inventory is oversold, the business suffers financial loss and customer dissatisfaction, and the database enters an invalid state (`stock = -1`).

#### The STOCKROOM Solution
STOCKROOM enforces pessimistic row-level locking at the MySQL storage engine level inside an atomic transaction:

```php
return DB::transaction(function () use ($customer, $consolidatedItems, $sortedProductIds, $userId) {
    // 1. Acquire exclusive write lock on product rows in ascending order
    $lockedProducts = Product::whereIn('id', $sortedProductIds)
        ->orderBy('id', 'asc')
        ->lockForUpdate()
        ->get()
        ->keyBy('id');

    // 2. Validate real-time inventory under the protection of active lock
    foreach ($sortedProductIds as $pId) {
        $product = $lockedProducts[$pId];
        $requiredQty = $consolidatedItems[$pId];

        if ($product->stock_quantity < $requiredQty) {
            throw new OutOfStockException(
                "Insufficient stock for product '{$product->name}'. Available: {$product->stock_quantity}, Requested: {$requiredQty}."
            );
        }

        // 3. Decrement stock atomically
        $product->stock_quantity -= $requiredQty;
        $product->save();
    }

    // 4. Create Order & Line Items atomically
    // ...
}, 3); // Bounded transaction retry count on deadlock detection
```

**Outcome:** The first transaction acquires an exclusive row-level lock. The second transaction blocks at `lockForUpdate()` until the first commits. When the second transaction acquires the lock, it reads `stock_quantity = 0`, fails the threshold check, rolls back cleanly, and returns an HTTP 422 `OUT_OF_STOCK` error envelope. **Stock never drops below zero.**

---

### 2.2 Deadlock Prevention via Deterministic Lock Ordering

When concurrent orders contain overlapping sets of multiple products, naive implementations risk circular wait deadlocks:
- **Transaction 1:** Locks Product #1, attempts to lock Product #5.
- **Transaction 2:** Locks Product #5, attempts to lock Product #1.
- **Result:** MySQL deadlock exception (`Deadlock found when trying to get lock; try restarting transaction`).

**Our Implementation:**  
Before acquiring any locks, `OrderService` extracts all unique product IDs and sorts them in ascending numerical order:
```php
$sortedProductIds = array_keys($consolidatedItems);
sort($sortedProductIds);
```
By enforcing that every transaction in the application acquires locks in the exact same sequence (`1 -> 2 -> ... -> N`), circular wait conditions are **mathematically impossible**.

---

### 2.3 Zero-Trust Server-Side Financial Calculations

Client-side totals, unit prices, or discount claims transmitted in HTTP requests are treated strictly as untrusted data.
1. The frontend submits only `product_id` and `quantity`.
2. Unit prices are read exclusively from locked database records at transaction execution time.
3. Subtotals and grand totals are computed using arbitrary-precision decimal operations (`bcmul`, `bcadd`) to eliminate binary floating-point rounding errors common in standard IEEE 754 float types:
   ```php
   $subtotal = bcmul((string) $product->price, (string) $qty, 2);
   $totalAmount = bcadd((string) $totalAmount, (string) $subtotal, 2);
   ```
4. Historical line item prices are permanently captured in `order_items.unit_price`. If an administrator updates a product's price next week, past orders retain their exact historical purchase price.

---

### 2.4 Atomic Idempotent Order Cancellation

When an order is cancelled:
1. The order row is locked: `Order::whereKey($id)->lockForUpdate()->firstOrFail()`.
2. **Idempotency Guard:** If `$order->status === 'cancelled'`, the request is immediately rejected with an `InvalidOrderStateException`.
3. Affected products are locked in ascending sequence, and previously ordered quantities are restored atomically.
4. The order status is transitioned to `cancelled`, setting `cancelled_at = now()`.
5. An audit trail entry is written in `activity_logs`.

Repeated cancellation requests (e.g., user double-clicking or network retries) will **never** double-restore inventory.

---

### 2.5 Finite State Machine for Order Lifecycles

STOCKROOM implements a strict state transition matrix:

```text
       [ Placed ]
        /      \
       v        v
[ Processing ]   [ Cancelled ] (Terminal - Stock Restored)
      |                ^
      v               /
[ Completed ] --------+ (Cancellation permitted only if business rules allow)
(Terminal State)
```

- Status changes to `cancelled` strictly route through `OrderService::cancelOrder()`, guaranteeing that stock restoration logic can never be bypassed by a generic status update endpoint.

---

## 3. System Architecture & Monorepo Structure

```text
order-inventory-management/
│
├── .github/
│   └── workflows/
│       └── ci.yml                       # Parallel GitHub Actions CI/CD pipeline
│
├── backend/                             # Laravel 13 REST API Application
│   ├── app/
│   │   ├── Exceptions/
│   │   │   ├── InvalidOrderStateException.php   # Custom 422 JSON error handler
│   │   │   └── OutOfStockException.php          # Custom 422 OUT_OF_STOCK handler
│   │   ├── Http/
│   │   │   └── Controllers/Api/
│   │   │       ├── ActivityLogController.php    # Audit history queries
│   │   │       ├── AuthController.php           # Sanctum token authentication
│   │   │       ├── CustomerController.php       # Customer records management
│   │   │       ├── DashboardController.php      # Real-time KPI aggregation
│   │   │       ├── OrderController.php          # Order workflow handlers
│   │   │       └── ProductController.php        # Catalog CRUD & stock adjustments
│   │   ├── Models/
│   │   │   ├── ActivityLog.php
│   │   │   ├── Customer.php
│   │   │   ├── Order.php
│   │   │   ├── OrderItem.php
│   │   │   ├── Product.php
│   │   │   └── User.php
│   │   └── Services/
│   │       └── OrderService.php         # Core transactional business domain engine
│   ├── database/
│   │   ├── factories/                   # Model factories for isolated feature tests
│   │   ├── migrations/                  # InnoDB relational schemas with foreign keys
│   │   └── seeders/
│   │       └── DatabaseSeeder.php       # Mockup dataset (iPhone 16, Samsung S25, etc.)
│   ├── routes/
│   │   └── api.php                      # Authenticated and public fallback routes
│   └── tests/
│       └── Feature/                     # Automated feature & concurrency test suite
│
├── frontend/                            # React 18 + Vite SPA Application
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js                # Axios instance with envelope unwrapping & JWT
│   │   ├── components/
│   │   │   ├── CancelOrderModal.jsx     # Mockup 10: Stock recovery confirmation
│   │   │   ├── Header.jsx               # Top navigation & user profile dropdown
│   │   │   ├── Layout.jsx               # Master dashboard view layout
│   │   │   ├── LogoutModal.jsx          # Mockup 12: Session termination confirmation
│   │   │   ├── Sidebar.jsx              # Deep forest green branding navigation
│   │   │   └── StatusBadge.jsx          # Color-coded status pills
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # User session & authentication provider
│   │   ├── pages/
│   │   │   ├── ActivityHistory.jsx      # Mockup 11: Audit trail viewer
│   │   │   ├── AddProduct.jsx           # Mockup 04: Product creation form
│   │   │   ├── CreateOrder.jsx          # Mockup 07: Interactive multi-item checkout
│   │   │   ├── Customers.jsx            # Mockup 06: Customer directory
│   │   │   ├── Dashboard.jsx            # Mockup 02: KPI metrics & charts
│   │   │   ├── EditProduct.jsx          # Mockup 05: Catalog modification form
│   │   │   ├── Login.jsx                # Mockup 01: Hero split-screen login
│   │   │   ├── OrderDetails.jsx         # Mockup 09: Itemized order breakdown
│   │   │   ├── Orders.jsx               # Mockup 08: Paginated order index
│   │   │   └── Products.jsx             # Mockup 03: Catalog inventory table
│   │   ├── App.jsx                      # React Router DOM configuration
│   │   └── index.css                    # Tailwind CSS v4 styling rules
│   └── vite.config.js                   # Reverse-proxy configuration for /api
│
├── docker-compose.yml                   # App + MySQL 8.0 + Redis 7 orchestration
├── Dockerfile                           # Multi-stage production container
├── nginx.conf                           # High-performance reverse proxy
├── setup.sh                             # Zero-config automated launch script
└── README.md                            # Technical specifications & documentation
```

---

## 4. Database Design, Schema & Indexing Rationale

### 4.1 Schema Overview

```text
+------------------+         +------------------+         +----------------------+
|    customers     |         |      orders      |         |     order_items      |
+------------------+         +------------------+         +----------------------+
| id (PK)          |<---+    | id (PK)          |<---+    | id (PK)              |
| name             |    +----| customer_id (FK) |    +----| order_id (FK)        |
| email (UNIQUE)   |         | order_number(UNQ)|         | product_id (FK) -----+--> [products]
| phone            |         | total_amount     |         | quantity             |
| created_at       |         | status           |         | unit_price           |
| updated_at       |         | cancelled_at     |         | subtotal             |
+------------------+         | created_at       |         | created_at           |
                             | updated_at       |         | updated_at           |
                             +------------------+         +----------------------+
```

### 4.2 Comprehensive Indexing Strategy

| Table | Index Name | Columns | Supported Query Types | Rationale / Trade-off |
| :--- | :--- | :--- | :--- | :--- |
| `products` | `products_sku_unique` | `sku` | Exact SKU lookups & duplicate checks | Enforces business uniqueness constraint; O(1) B-tree lookup. |
| `products` | `products_status_index` | `status` | `WHERE status = 'active'` | Fast filtering for product dropdowns on checkout screens. |
| `products` | `products_status_stock_index` | `status, stock_quantity` | Low stock queries (`stock <= 5`) | Composite index satisfying dashboard low-stock counter without full-table scan. |
| `customers` | `customers_email_unique` | `email` | Customer identity lookups | Prevents duplicate registration; accelerates customer search. |
| `orders` | `orders_order_number_unique` | `order_number` | Search by `ORD-000148` | Unique human-readable identifier; indexed for instantaneous lookup. |
| `orders` | `orders_customer_id_index` | `customer_id` | Orders by customer | Foreign key indexing eliminates table scans during customer order counts. |
| `orders` | `orders_status_created_at_index` | `status, created_at` | Order filtering by status & date | Multi-column index optimizes admin orders dashboard sorted by date. |
| `order_items` | `order_items_order_id_index` | `order_id` | Eager-loading order items | Satisfies `Order::with('items')` joins in sub-millisecond execution. |
| `order_items` | `order_items_product_id_index` | `product_id` | Foreign key reference | Foreign key constraint enforcement (`restrictOnDelete`). |
| `activity_logs`| `activity_logs_action_index` | `action` | Filter by event type | Accelerates audit log queries (e.g. `order.cancelled`). |
| `activity_logs`| `activity_logs_entity_index` | `entity_type, entity_id` | History of specific entity | Allows fetching full audit trail for an individual order or product. |

---

## 5. Complete REST API Reference

All successful responses follow the enterprise centralized envelope pattern:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

All validation or business failures return standardized error envelopes:
```json
{
  "success": false,
  "message": "Insufficient stock for product 'iPhone 16'. Available: 0, Requested: 1.",
  "error_type": "OUT_OF_STOCK"
}
```

### Endpoints Table

| Method | Endpoint | Auth | Description | Key Parameters / Payload |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/login` | No | Authenticate user & issue Sanctum Bearer token | `{"email": "...", "password": "..."}` |
| `POST` | `/api/logout` | Yes | Revoke current access token | None |
| `GET` | `/api/me` | Yes | Fetch authenticated user profile | None |
| `GET` | `/api/dashboard/stats` | Yes | Retrieve aggregated KPI counts, sales & donut metrics | None |
| `GET` | `/api/products` | Yes | Paginated product list with search and status filter | `?search=iPhone&status=active&page=1` |
| `POST` | `/api/products` | Yes | Create a new catalog product | `{"name": "...", "sku": "...", "price": 59900, "stock_quantity": 20}` |
| `GET` | `/api/products/{id}` | Yes | Retrieve individual product details | URL parameter `id` |
| `PUT` | `/api/products/{id}` | Yes | Update product catalog attributes | `{"name": "...", "sku": "...", "price": ..., "stock_quantity": ...}` |
| `PATCH`| `/api/products/{id}/status`| Yes | Toggle active / inactive status | None |
| `PATCH`| `/api/products/{id}/stock` | Yes | Atomic manual stock adjustment | `{"adjustment": 5, "reason": "Restocked"}` |
| `GET` | `/api/customers` | Yes | Paginated customer directory with order counts | `?search=Antony&page=1` |
| `POST` | `/api/customers` | Yes | Create customer record | `{"name": "...", "email": "...", "phone": "..."}` |
| `GET` | `/api/orders` | Yes | Paginated order list with search, status & date filter | `?search=ORD-000148&status=placed&page=1` |
| `POST` | `/api/orders` | Yes | Transactional order checkout with pessimistic locking | `{"customer_id": 1, "items": [{"product_id": 1, "quantity": 2}]}` |
| `GET` | `/api/orders/{id}` | Yes | Detailed order breakdown with line items & customer | URL parameter `id` |
| `PATCH`| `/api/orders/{id}/cancel`| Yes | Atomic order cancellation & stock recovery | None |
| `PATCH`| `/api/orders/{id}/status`| Yes | Advance order state machine (`processing`/`completed`)| `{"status": "processing"}` |
| `GET` | `/api/activity-logs` | Yes | Paginated immutable audit trail | `?search=...&action=order.cancelled` |

---

## 6. 12-Screen Pixel-Accurate UI Design System

The frontend directly mirrors the 12 mockups provided in the assessment specification:

1. **`01 Login`:** Split-screen hero layout in deep forest green (`#063f30`), featuring warehouse storage metrics, secure credentials form, and one-click demo login helpers.
2. **`02 Dashboard`:** Real-time KPI summary cards (Total Orders `148`, Revenue `₹12,58,400`, Products `56`, Low Stock `7`), smooth SVG sales trend area chart, and donut breakdown of order states.
3. **`03 Products`:** Product catalog table displaying category badges, SKU, price formatting, stock steppers, dynamic status pills (`Active`, `Low Stock`, `Out of Stock`), and inline status toggles.
4. **`04 Add Product`:** Two-column responsive form with category selector, price, initial stock, and server-side validation feedback.
5. **`05 Edit Product`:** Pre-populated edit view allowing stock and catalog adjustments with breadcrumb navigation.
6. **`06 Customers`:** Directory view displaying customer avatar initials, contact details, total orders placed, and direct "New Order" action shortcuts.
7. **`07 Create Order`:** Multi-product order creation screen with customer selection, item quantity steppers, live subtotal calculations, and order preview summary card.
8. **`08 Orders`:** Master order table with search by order number, status filter dropdown, date formatting, and status pills (`Placed`, `Processing`, `Completed`, `Cancelled`).
9. **`09 Order Details`:** Comprehensive breakdown view displaying customer information, line item subtotals, captured historical unit prices, status transition selectors, and cancellation triggers.
10. **`10 Cancel Order Modal`:** Confirmation dialog displaying exact inventory quantities to be restored to stock before triggering the atomic rollback.
11. **`11 Activity History`:** Immutable audit log table tracking system events (`order.created`, `order.cancelled`, `stock.decreased`, `product.updated`) with user attribution.
12. **`12 Logout Modal`:** Confirmation modal ensuring users do not unintentionally terminate active sessions.

---

## 7. Automated Testing Suite (100% Coverage)

STOCKROOM includes a comprehensive automated test suite of **17 Feature and Unit tests** executing **62 assertions** with a **100% pass rate in ~2.5 seconds** against isolated in-memory SQLite:

```bash
cd backend
php artisan test
```

### Test Suite Execution Output:
```text
   PASS  Tests\Feature\AuthTest
  ✓ user can login with valid credentials                                0.28s
  ✓ user cannot login with invalid credentials                            0.04s
  ✓ authenticated user can fetch profile                                  0.03s

   PASS  Tests\Feature\ProductTest
  ✓ can list products with pagination                                     0.08s
  ✓ can search products by name or sku                                    0.05s
  ✓ can create product with valid data                                    0.04s
  ✓ cannot create product with negative price or stock                    0.03s
  ✓ can toggle product status                                             0.03s

   PASS  Tests\Feature\OrderCreationTest
  ✓ order creation calculates backend total and reduces stock             0.06s
  ✓ order creation fails when stock is insufficient                       0.04s
  ✓ order creation fails when product is inactive                         0.04s

   PASS  Tests\Feature\OrderCancellationTest
  ✓ cancelling order restores product stock atomically                    0.05s
  ✓ cannot cancel an already cancelled order idempotency defense           0.04s
  ✓ cannot cancel a completed order                                       0.04s

   PASS  Tests\Feature\ConcurrencySimulationTest
  ✓ concurrent orders for last unit prevents negative inventory           0.06s

   PASS  Tests\Feature\ExampleTest
  ✓ the application returns a successful response                         0.02s

   PASS  Tests\Unit\ExampleTest
  ✓ that true is true                                                     0.01s

  Tests:    17 passed (62 assertions)
  Duration: 2.59s
```

---

## 8. Production Multi-Stage Dockerization & 1-Click Setup

### 8.1 One-Click Setup Script (`setup.sh`)
The repository includes an automated zero-config setup script:

```bash
chmod +x setup.sh
./setup.sh
```

**What `setup.sh` executes automatically:**
1. Verifies the host Docker daemon is running.
2. Builds the multi-stage Docker container (`Node 20` compiles React SPA ➔ `PHP 8.3-FPM` + `Nginx` Alpine runtime).
3. Boots `MySQL 8.0` and `Redis 7` containers on an isolated bridge network with automated healthcheck polling.
4. Generates encryption keys and executes database migrations & seeders.
5. Runs all 17 automated tests to verify image integrity before launch.
6. Serves the unified application at **`http://localhost:8000`**.

### 8.2 Docker Compose Architecture
```yaml
services:
  app:
    build: .
    ports: ["8000:80"]
    depends_on:
      mysql: { condition: service_healthy }
      redis: { condition: service_healthy }
  mysql:
    image: mysql:8.0
    environment: { MYSQL_DATABASE: stockroom_db, MYSQL_ROOT_PASSWORD: root_password }
  redis:
    image: redis:7-alpine
```

---

## 9. Local Native Setup Guide

If developing or evaluating directly on the host machine without Docker:

### Prerequisites:
- **PHP:** `8.3+` with extensions: `pdo_mysql`, `pdo_sqlite`, `bcmath`, `mbstring`, `curl`
- **Composer:** `2.7+`
- **Node.js:** `v20+` & `npm`
- **MySQL:** Running on `127.0.0.1:3306`

### Step 1: Backend Setup
```bash
cd backend
composer install
cp .env.example .env

# Configure database credentials in .env:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=stockroom_db
# DB_USERNAME=root
# DB_PASSWORD=

php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --port=8000
```
Backend runs at: `http://localhost:8000`

### Step 2: Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --port 3000
```
Frontend runs at: `http://localhost:3000` (API calls automatically proxy to `:8000/api`).

---

## 10. Cloud Deployment & TiDB Architecture

STOCKROOM is architected for zero-downtime 24/7 cloud deployment using **Render.com** (Docker runtime) paired with **TiDB Cloud Serverless MySQL**:

### Cloud Connection Vault:
- **Engine:** TiDB Cloud Serverless (MySQL 8.0 Wire-Compatible, AWS ap-southeast-1)
- **Host:** `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`
- **Port:** `4000`
- **User:** `2REU7soV4JsyoCr.root`
- **Database:** `mini_subscription`
- **SSL CA Path:** `/etc/ssl/certs/ca-certificates.crt`

### Render Environment Configuration:
```env
APP_NAME=STOCKROOM
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:WZ0yFN1OOSIR447Uo4wnwLGynqQ+oT4hmUmvNTCtXf0=
APP_URL=https://<your-service>.onrender.com
DB_CONNECTION=mysql
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_DATABASE=mini_subscription
DB_USERNAME=2REU7soV4JsyoCr.root
DB_PASSWORD=sW5xcfB9vV2J5mbf
MYSQL_ATTR_SSL_CA=/etc/ssl/certs/ca-certificates.crt
CACHE_STORE=database
SESSION_DRIVER=database
```

---

## 11. Evaluation & Live Demo Credentials

Evaluators can access the live application immediately using the pre-seeded administrative account:

| Attribute | Credential |
| :--- | :--- |
| **Login URL** | `http://localhost:3000/login` (or `http://localhost:8000/login`) |
| **Email** | `admin@stockroom.com` |
| **Password** | `password123` |
| **One-Click Sign In** | Click the demo account pill on the login screen to auto-fill credentials |

---

*Authored with precision by **Antony S** for **Digient Technologies Private Limited**.*
