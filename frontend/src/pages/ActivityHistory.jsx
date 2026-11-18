import React, { useState, useEffect } from 'react';
import { Search, Filter, History, Calendar, Clock, UserCheck } from 'lucide-react';
import api from '../api/client';

const ActivityHistory = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, per_page: 15 };
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;

      const res = await api.get('/activity-logs', { params });
      const lData = res.data.data;
      setLogs(lData.data || []);
      setPagination({
        current_page: lData.current_page,
        last_page: lData.last_page,
        total: lData.total,
      });
    } catch (err) {
      console.error('Failed to load activity logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [search, actionFilter]);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadge = (action) => {
    const act = String(action || '').toLowerCase();
    if (act.includes('cancelled')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 font-mono">
          {action}
        </span>
      );
    }
    if (act.includes('created')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 font-mono">
          {action}
        </span>
      );
    }
    if (act.includes('decreased')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 font-mono">
          {action}
        </span>
      );
    }
    if (act.includes('restored')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 font-mono">
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 font-mono">
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Activity History</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track key actions across products, orders and inventory.</p>
      </div>

      {/* Filter Bar (Mockup Screen 11) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, entity or description..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:border-emerald-600 outline-none font-medium"
          >
            <option value="">All Actions</option>
            <option value="order.created">order.created</option>
            <option value="order.cancelled">order.cancelled</option>
            <option value="stock.decreased">stock.decreased</option>
            <option value="stock.restored">stock.restored</option>
            <option value="product.created">product.created</option>
            <option value="product.updated">product.updated</option>
          </select>
        </div>
      </div>

      {/* Activity Table (Mockup Screen 11) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/70 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4 text-right">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                    No activity records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    {/* Time */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>

                    {/* Action Badge */}
                    <td className="px-6 py-4">
                      {getActionBadge(log.action)}
                    </td>

                    {/* Details */}
                    <td className="px-6 py-4 text-slate-800 font-medium">
                      {log.description}
                    </td>

                    {/* User */}
                    <td className="px-6 py-4 text-right text-xs font-semibold text-slate-600">
                      {log.user?.name || 'Admin'}
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
            Showing {logs.length > 0 ? (pagination.current_page - 1) * 15 + 1 : 0} to{' '}
            {Math.min(pagination.current_page * 15, pagination.total)} of {pagination.total} activities
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fetchLogs(pagination.current_page - 1)}
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
              onClick={() => fetchLogs(pagination.current_page + 1)}
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

export default ActivityHistory;
