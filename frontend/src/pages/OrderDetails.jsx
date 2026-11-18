import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChevronRight, 
  User, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  Clock,
  ArrowLeft
} from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import CancelOrderModal from '../components/CancelOrderModal';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.data);
    } catch (err) {
      console.error('Failed to load order', err);
      setErrorMessage(err.response?.data?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const res = await api.patch(`/orders/${id}/status`, { status: newStatus });
      setOrder(res.data.data);
      setSuccessMessage(`Order status updated to ${newStatus}`);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    setCancelLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const res = await api.patch(`/orders/${id}/cancel`);
      setOrder(res.data.data);
      setCancelModalOpen(false);
      setSuccessMessage('Order cancelled and inventory restored to stock successfully!');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 mb-4">Order not found.</p>
        <Link to="/orders" className="text-emerald-700 font-semibold underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const isCompleted = order.status === 'completed';

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-150">
      {/* Breadcrumbs (Mockup Screen 09) */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link to="/orders" className="hover:text-slate-700 transition">Orders</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-800">{order.order_number}</span>
      </nav>

      {/* Header and Action Controls (Mockup Screen 09) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Order Details</h1>
          <p className="text-sm text-slate-500 mt-0.5">View order information, items and status.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Transition Selector */}
          {!isCancelled && !isCompleted && (
            <select
              value={order.status}
              disabled={statusLoading}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white shadow-2xs outline-none focus:border-emerald-600"
            >
              <option value="placed" disabled>Placed</option>
              <option value="processing">Mark Processing</option>
              <option value="completed">Mark Completed</option>
            </select>
          )}

          {/* Cancel Order Button */}
          {!isCancelled && !isCompleted && (
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              className="px-4 py-2 rounded-xl border border-rose-200 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition shadow-2xs"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Order Info Bar (Mockup Screen 09) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-1">Order No.</span>
          <span className="text-xl font-black text-slate-900 font-mono">{order.order_number}</span>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-1">Status</span>
          <StatusBadge status={order.status} type="order" />
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-1">Order Date</span>
          <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {formatDateTime(order.created_at)}
          </span>
        </div>

        {order.cancelled_at && (
          <div>
            <span className="text-xs font-semibold text-rose-400 block mb-1">Cancelled On</span>
            <span className="text-sm font-semibold text-rose-700">
              {formatDateTime(order.cancelled_at)}
            </span>
          </div>
        )}
      </div>

      {/* Customer Information Card (Mockup Screen 09) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Customer Information
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{order.customer?.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {order.customer?.email} {order.customer?.phone ? `• ${order.customer.phone}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items Table (Mockup Screen 09) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Order Items ({order.items?.length || 0})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/70 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">#</th>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">Unit Price (₹)</th>
                <th className="px-6 py-3.5">Qty</th>
                <th className="px-6 py-3.5 text-right">Subtotal (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items?.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{item.product?.name || `Product #${item.product_id}`}</p>
                    <p className="text-xs text-slate-400 font-mono">{item.product?.sku}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Total Row */}
            <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200">
              <tr>
                <td colSpan="4" className="px-6 py-4 text-right text-slate-700 text-sm">
                  Total Amount
                </td>
                <td className="px-6 py-4 text-right text-xl font-black text-slate-900">
                  {formatCurrency(order.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Cancel Order Confirmation Modal (Mockup Screen 10) */}
      <CancelOrderModal
        isOpen={cancelModalOpen}
        order={order}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        loading={cancelLoading}
      />
    </div>
  );
};

export default OrderDetails;
