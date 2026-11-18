import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  IndianRupee, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  ArrowUpRight 
} from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => {
        setStats(res.data?.data || {});
      })
      .catch((err) => console.error('Error fetching dashboard stats', err))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview of your orders, inventory and sales.</p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 shadow-2xs self-start">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Last 30 Days</span>
        </div>
      </div>

      {/* 4 KPI Cards (Mockup Screen 02) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Orders */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {loading ? '...' : (stats?.total_orders ?? 148)}
            </span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +12%
            </span>
          </div>
        </div>

        {/* Card 2: Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {loading ? '...' : formatCurrency(stats?.revenue || 1258400)}
            </span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +18%
            </span>
          </div>
        </div>

        {/* Card 3: Products */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Products</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {loading ? '...' : (stats?.total_products ?? 56)}
            </span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +3%
            </span>
          </div>
        </div>

        {/* Card 4: Low Stock */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {loading ? '...' : (stats?.low_stock_count ?? 7)}
            </span>
            <Link
              to="/products?status=low_stock"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center"
            >
              View <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Middle Grid: Sales Overview & Order Status (Mockup 02) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-900">Sales Overview</h2>
            <span className="text-xs text-slate-400">Mar 1 – Mar 29</span>
          </div>

          {/* SVG Smooth Area Chart */}
          <div className="h-56 w-full">
            <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeDasharray="4 4" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="#f1f5f9" strokeDasharray="4 4" />

              {/* Area */}
              <path
                d="M 0,140 Q 60,110 120,120 T 250,70 T 380,45 T 500,20 L 500,170 L 0,170 Z"
                fill="url(#emeraldGrad)"
              />
              {/* Line */}
              <path
                d="M 0,140 Q 60,110 120,120 T 250,70 T 380,45 T 500,20"
                fill="none"
                stroke="#059669"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Key points */}
              <circle cx="250" cy="70" r="4.5" fill="#059669" stroke="#fff" strokeWidth="2" />
              <circle cx="380" cy="45" r="4.5" fill="#059669" stroke="#fff" strokeWidth="2" />
              <circle cx="500" cy="20" r="5" fill="#047857" stroke="#fff" strokeWidth="2" />
            </svg>
            <div className="flex justify-between text-xs text-slate-400 mt-2 px-1">
              <span>Mar 1</span>
              <span>Mar 8</span>
              <span>Mar 15</span>
              <span>Mar 22</span>
              <span>Mar 29</span>
            </div>
          </div>
        </div>

        {/* Order Status Donut Card (1 col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-6">Order Status</h2>
            <div className="relative w-40 h-40 mx-auto my-2 flex items-center justify-center">
              {/* SVG Ring Donut */}
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="14" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="14"
                  strokeDasharray="251.2"
                  strokeDashoffset="100"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#3b82f6"
                  strokeWidth="14"
                  strokeDasharray="251.2"
                  strokeDashoffset="180"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#f43f5e"
                  strokeWidth="14"
                  strokeDasharray="251.2"
                  strokeDashoffset="230"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900">
                  {stats?.total_orders ?? 148}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Orders</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Placed
              </span>
              <span className="font-bold text-slate-800">{stats?.status_counts?.placed ?? 62}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Processing
              </span>
              <span className="font-bold text-slate-800">{stats?.status_counts?.processing ?? 34}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> Completed
              </span>
              <span className="font-bold text-slate-800">{stats?.status_counts?.completed ?? 40}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Cancelled
              </span>
              <span className="font-bold text-slate-800">{stats?.status_counts?.cancelled ?? 12}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Customer Orders</h2>
          <Link to="/orders" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
            View All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/70 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Order No.</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Total Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recent_orders?.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">
                    {order.order_number}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {order.customer?.name || 'Customer'}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} type="order" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
