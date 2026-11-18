import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, ShoppingBag, Filter } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, per_page: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/orders', { params });
      const oData = res.data.data;
      setOrders(oData.data || []);
      setPagination({
        current_page: oData.current_page,
        last_page: oData.last_page,
        total: oData.total,
      });
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [search, statusFilter]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">View, search and manage customer orders.</p>
        </div>

        <Link
          to="/orders/create"
          className="inline-flex items-center gap-2 bg-[#082f25] hover:bg-[#06241c] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Create Order</span>
        </Link>
      </div>

      {/* Search and Filters Bar (Mockup Screen 08) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order no. or customer..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:border-emerald-600 outline-none font-medium"
          >
            <option value="">All Status</option>
            <option value="placed">Placed</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table (Mockup Screen 08) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/70 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Order No.</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    Loading customer orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition">
                    {/* Order No */}
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {o.order_number}
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {o.customer?.name || 'Customer'}
                    </td>

                    {/* Total */}
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrency(o.total_amount)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={o.status} type="order" />
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                      {formatDate(o.created_at)}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/orders/${o.id}`}
                        title="View Order Details"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {orders.length > 0 ? (pagination.current_page - 1) * 10 + 1 : 0} to{' '}
            {Math.min(pagination.current_page * 10, pagination.total)} of {pagination.total} orders
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fetchOrders(pagination.current_page - 1)}
              disabled={pagination.current_page <= 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-[#082f25] text-white font-bold">
              {pagination.current_page}
            </span>
            <button
              type="button"
              onClick={() => fetchOrders(pagination.current_page + 1)}
              disabled={pagination.current_page >= pagination.last_page}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
