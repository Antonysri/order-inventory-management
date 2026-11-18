import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Plus, 
  Trash2, 
  Minus, 
  ShoppingBag, 
  ShieldCheck, 
  AlertCircle,
  Package
} from 'lucide-react';
import api from '../api/client';

const CreateOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customer_id');

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId || '');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [addQty, setAddQty] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/customers?per_page=100'),
      api.get('/products?per_page=100&status=active'),
    ])
      .then(([custRes, prodRes]) => {
        const custs = custRes.data?.data?.data || [];
        const prods = prodRes.data?.data?.data || [];
        setCustomers(custs);
        setProducts(prods);

        if (!selectedCustomerId && custs.length > 0) {
          setSelectedCustomerId(custs[0].id);
        }
      })
      .catch((err) => console.error('Failed to load initial order data', err))
      .finally(() => setInitialLoading(false));
  }, []);

  const handleAddItem = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedProductId) {
      setError('Please select a product to add');
      return;
    }

    const prod = products.find((p) => String(p.id) === String(selectedProductId));
    if (!prod) return;

    const qtyToAdd = Math.max(1, parseInt(addQty, 10) || 1);

    // Check available stock
    const existing = cartItems.find((item) => item.product_id === prod.id);
    const currentCartQty = existing ? existing.quantity : 0;
    const totalDesiredQty = currentCartQty + qtyToAdd;

    if (totalDesiredQty > prod.stock_quantity) {
      setError(
        `Cannot add ${qtyToAdd} unit(s). Only ${prod.stock_quantity} available in stock (${currentCartQty} already in order preview).`
      );
      return;
    }

    if (existing) {
      setCartItems(
        cartItems.map((item) =>
          item.product_id === prod.id
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          product_id: prod.id,
          product: prod,
          unit_price: parseFloat(prod.price),
          quantity: qtyToAdd,
        },
      ]);
    }

    // Reset selection
    setSelectedProductId('');
    setAddQty(1);
  };

  const handleUpdateQty = (productId, delta) => {
    setError('');
    const item = cartItems.find((i) => i.product_id === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    if (newQty > item.product.stock_quantity) {
      setError(`Cannot exceed available stock of ${item.product.stock_quantity} for ${item.product.name}.`);
      return;
    }

    setCartItems(
      cartItems.map((i) => (i.product_id === productId ? { ...i, quantity: newQty } : i))
    );
  };

  const handleRemoveItem = (productId) => {
    setCartItems(cartItems.filter((i) => i.product_id !== productId));
  };

  const calculatePreviewTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handlePlaceOrder = async () => {
    setError('');
    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }
    if (cartItems.length === 0) {
      setError('Please add at least one product item to the order.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customer_id: parseInt(selectedCustomerId, 10),
        items: cartItems.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      };

      const res = await api.post('/orders', payload);
      const createdOrder = res.data.data;
      navigate(`/orders/${createdOrder.id}`);
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.error_type === 'OUT_OF_STOCK') {
        setError(resp.message || 'Out of stock error occurred.');
      } else if (resp?.errors) {
        const firstErrorKey = Object.keys(resp.errors)[0];
        setError(resp.errors[firstErrorKey][0]);
      } else {
        setError(resp?.message || 'Failed to place order. Transaction rolled back safely.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-12 text-center text-slate-500">Loading order form...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-150">
      {/* Breadcrumbs (Mockup Screen 07) */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link to="/orders" className="hover:text-slate-700 transition">Orders</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-800">Create Order</span>
      </nav>

      <div>
        <h1 className="text-2xl font-black text-slate-900">Create Order</h1>
        <p className="text-sm text-slate-500 mt-0.5">Create a new customer order with one or more products.</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Order Validation / Stock Guard Notice</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Customer <span className="text-rose-500">*</span>
              </label>
              <Link
                to="/customers"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                + New Customer
              </Link>
            </div>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 text-sm text-slate-800 bg-white outline-none font-medium"
            >
              <option value="">Select a Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          {/* Add Products Section (Mockup Screen 07) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
              Add Products
            </h2>

            <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 text-sm text-slate-800 bg-white outline-none"
                >
                  <option value="">Select a product...</option>
                  {products.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                      disabled={p.stock_quantity <= 0}
                    >
                      {p.name} — {formatCurrency(p.price)} (Stock: {p.stock_quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-24">
                <input
                  type="number"
                  min="1"
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                  placeholder="Qty"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 text-sm text-center text-slate-800 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#082f25] hover:bg-[#06241c] text-white text-sm font-semibold transition shadow-sm"
              >
                Add
              </button>
            </form>

            {/* Selected Products List Table */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Selected Line Items ({cartItems.length})
              </h3>

              {cartItems.length === 0 ? (
                <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  No products added yet. Select a product above to add to this order.
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-emerald-800 flex items-center justify-center font-bold">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.product.name}</p>
                          <p className="text-xs text-slate-500 font-mono">
                            {formatCurrency(item.unit_price)} each
                          </p>
                        </div>
                      </div>

                      {/* Quantity Stepper & Subtotal */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.product_id, -1)}
                            className="p-1 text-slate-400 hover:text-slate-700"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.product_id, 1)}
                            className="p-1 text-slate-400 hover:text-slate-700"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="font-bold text-slate-900 text-sm w-24 text-right">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.product_id)}
                          className="text-slate-400 hover:text-rose-600 transition p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Order Summary Card (Mockup Screen 07) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-5 sticky top-24">
            <h2 className="text-base font-bold text-slate-900">Order Summary</h2>

            <div className="space-y-3 pt-2 border-t border-slate-100 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(calculatePreviewTotal())}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxes & Processing</span>
                <span className="font-semibold text-slate-800">₹0</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrency(calculatePreviewTotal())}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={loading || cartItems.length === 0}
              className="w-full py-3 px-4 rounded-xl bg-[#082f25] hover:bg-[#06241c] text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{loading ? 'Executing DB Transaction...' : 'Place Order'}</span>
            </button>

            {/* Architectural Security Notice */}
            <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-200/50 flex items-start gap-2.5 text-xs text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                Backend verifies actual inventory via <code className="font-mono font-bold">lockForUpdate()</code> and calculates trusted totals inside MySQL transaction.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;
