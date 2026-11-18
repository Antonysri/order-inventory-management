# STOCKROOM — Order & Inventory Management System

**Candidate:** Antony S  
**GitHub:** [Antonysri](https://github.com/Antonysri) | antonysri17@gmail.com / antony777sri@gmail.com  
**Target Evaluation:** Digient Technologies Private Limited (Full-Stack Developer Assessment)  

---

## 🌟 Executive Architectural Summary

**STOCKROOM** is an enterprise-grade Order and Inventory Management application engineered to solve real-world e-commerce concurrency challenges: race conditions on low-stock items, atomic order deductions, idempotent stock restorations, and strict separation of concerns.

The UI is a **1:1 pixel-accurate implementation** of the 12-screen **STOCKROOM design system**, powered by **Laravel 13 on PHP 8.3**, **MySQL InnoDB**, and **React 18 + Vite + Tailwind CSS**.

---

## 🛡️ Critical Evaluation Requirements Solved

### 1. Concurrency & Race Condition Defense (The Core Challenge)
* **The Scenario:** A product has exactly `1` remaining unit. Two concurrent customers attempt to order the item simultaneously.
* **The Failure Mode in Naive Systems:** Both transactions read `stock = 1`, both allow order creation, and stock decrements to `-1` (overselling / inventory loss).
* **Our Solution:**
  1. We wrap the order workflow inside an atomic database transaction: `DB::transaction(..., 3)`.
  2. Before checking inventory, we acquire an exclusive row-level lock using MySQL InnoDB:
     ```php
     Product::whereIn('id', $sortedProductIds)
         ->orderBy('id', 'asc')
         ->lockForUpdate()
         ->get();
     ```
  3. **Deadlock Prevention:** We sort requested product IDs in **deterministic ascending order** before locking. Two transactions touching overlapping products in different orders will never deadlock.
  4. Only after locks are acquired does the system evaluate stock. Exactly one transaction captures the unit (stock becomes `0`), while the second transaction receives a clean `422 Unprocessable Entity` with `OUT_OF_STOCK` error type.
  5. Stock **never** drops to negative values.

### 2. Zero-Trust Server-Side Price Calculation
* Frontend prices or cart totals are treated strictly as non-authoritative previews.
* Unit prices are fetched directly from locked database product records at transaction time.
* Line item subtotals (`bcmul`) and final order totals (`bcadd`) are computed using decimal-safe arbitrary-precision arithmetic.
* Unit price is captured historically in `order_items.unit_price`, ensuring future product price changes never alter past financial records.

### 3. Idempotent Order Cancellation & Stock Recovery
* Cancelling an order restores the exact quantities of all associated line items atomically.
* **Strict Idempotency Guard:** An already cancelled order row is locked and validated (`if ($order->status === 'cancelled')`). Subsequent attempts are rejected with `INVALID_STATE`, preventing accidental double-restoration of inventory.
* Completed orders cannot be cancelled unless permitted by business rules.

---

## 🏗️ Technical Architecture & Monorepo Structure

```text
order-inventory-management/
│
├── backend/                             # Laravel 13 API (PHP 8.3)
│   ├── app/
│   │   ├── Http/Controllers/Api/        # Auth, Product, Customer, Order, Dashboard, Activity
│   │   ├── Models/                      # Product, Customer, Order, OrderItem, ActivityLog, User
│   │   ├── Services/OrderService.php    # Concurrency-safe business domain engine
│   │   └── Exceptions/                  # OutOfStockException, InvalidOrderStateException
│   ├── database/
│   │   ├── migrations/                  # Strict InnoDB schemas with foreign keys & indexes
│   │   ├── factories/                   # Model factories for isolated feature tests
│   │   └── seeders/DatabaseSeeder.php   # Mockup dataset (iPhone 16, Samsung S25, etc.)
│   ├── routes/api.php                   # Sanctum-authenticated & public API routes
│   └── tests/Feature/                   # 17 automated feature & concurrency tests (100% Pass)
│
├── frontend/                            # React 18 + Vite + Tailwind CSS SPA
│   ├── src/
│   │   ├── api/client.js                # Axios instance with envelope unwrapping
│   │   ├── context/AuthContext.jsx      # Sanctum session & token provider
│   │   ├── components/                  # Sidebar, Header, Modals (Cancel, Logout), StatusBadge
│   │   ├── pages/                       # Login, Dashboard, Products, Orders, Customers, Activity
│   │   └── App.jsx                      # React Router configuration
│   └── vite.config.js                   # Development proxy to backend (/api)
│
├── docker-compose.yml                   # App + MySQL 8.0 + Redis 7 orchestration
├── Dockerfile                           # Multi-stage production container
├── nginx.conf                           # Reverse proxy serving React SPA & PHP-FPM API
├── setup.sh                             # Automated 1-click launch script
└── .github/workflows/ci.yml             # GitHub Actions CI/CD test runner
```

---

## 💾 Database Schema & Indexing Strategy

1. **`products`**:
   - `id` (PK), `name`, `sku` (UNIQUE), `category`, `price` (DECIMAL 12,2), `stock_quantity` (UNSIGNED INT), `status` (ENUM: active, inactive).
   - **Indexes:** `unique(sku)`, `index(status)`, composite `index(status, stock_quantity)`.
2. **`customers`**:
   - `id` (PK), `name`, `email` (UNIQUE), `phone`.
3. **`orders`**:
   - `id` (PK), `order_number` (UNIQUE, e.g. `ORD-000148`), `customer_id` (FK -> customers), `total_amount` (DECIMAL 12,2), `status` (ENUM: placed, processing, completed, cancelled), `cancelled_at`.
   - **Indexes:** `unique(order_number)`, `index(customer_id)`, composite `index(status, created_at)`.
4. **`order_items`**:
   - `id` (PK), `order_id` (FK CASCADE), `product_id` (FK RESTRICT), `quantity` (UNSIGNED INT), `unit_price` (DECIMAL 12,2), `subtotal` (DECIMAL 12,2).
   - **Indexes:** `index(order_id)`, `index(product_id)`.
5. **`activity_logs`**:
   - `id` (PK), `user_id` (FK), `action`, `entity_type`, `entity_id`, `description`, `metadata` (JSON), `created_at`.
   - **Indexes:** `index(action)`, composite `index(entity_type, entity_id)`, `index(created_at)`.

---

## 🚀 Quick Start Guide

### Option A: 1-Click Automated Docker Setup (Recommended)
```bash
chmod +x setup.sh
./setup.sh
```
This builds the container, launches MySQL 8 and Redis, executes migrations & seeders, runs the 17-test suite, and serves the app at `http://localhost:8000`.

### Option B: Local Native Setup

#### 1. Backend:
```bash
cd backend
composer install
cp .env.example .env
# Configure DB_DATABASE=stockroom_db in .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
# Backend runs at http://localhost:8000
```

#### 2. Frontend:
```bash
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:3000
```

---

## 🔑 Demo Credentials

* **Email:** `admin@stockroom.com`
* **Password:** `password123`
* *(Or click the pre-filled credentials on the login screen to sign in instantly).*

---

## 🧪 Automated Testing Suite (100% Pass)

To run the complete automated test suite using isolated in-memory SQLite:
```bash
cd backend
php artisan test
```

### Verified Test Coverage:
* `AuthTest`: Registration, login, profile guards, token revocation.
* `ProductTest`: Catalog pagination, search by SKU/name, status filter, negative stock rejection.
* `OrderCreationTest`: Server-side total calculation, stock decrements, out-of-stock rejection, rollback integrity.
* `OrderCancellationTest`: Atomic stock restoration, strict idempotency defense against repeated cancellations.
* `ConcurrencySimulationTest`: Simulation of concurrent requests competing for the final remaining inventory unit (Phase 9 scenario).

---

## 📄 Evaluation Debrief Highlights

* **Row-Level Locking:** Uses `SELECT ... FOR UPDATE` exclusively inside active transactions so locks release immediately on `COMMIT` or `ROLLBACK`.
* **Deterministic Lock Ordering:** Product rows are locked in ascending ID sequence (`1 -> 2 -> 3`), mathematically preventing circular wait conditions (deadlocks).
* **Transactional Audit Trail:** Every stock decrement, restoration, and cancellation writes an immutable activity log entry within the same atomic transaction.
