import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Smartphone, 
  Laptop, 
  Headphones, 
  Tablet, 
  Package, 
  Edit3, 
  RotateCw,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, per_page: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/products', { params });
      const pData = res.data.data;
      setProducts(pData.data || []);
      setPagination({
        current_page: pData.current_page,
        last_page: pData.last_page,
        total: pData.total,
      });
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [search, statusFilter]);

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/products/${id}/status`);
      fetchProducts(pagination.current_page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle product status');
    }
  };

  const handleAdjustStock = async (id, delta) => {
    try {
      await api.patch(`/products/${id}/stock`, {
        adjustment: delta,
        reason: 'Quick dashboard adjustment',
      });
      fetchProducts(pagination.current_page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const getCategoryIcon = (category) => {
    const cat = String(category || '').toLowerCase();
    if (cat.includes('phone')) return Smartphone;
    if (cat.includes('laptop')) return Laptop;
    if (cat.includes('headphone') || cat.includes('accessory')) return Headphones;
    if (cat.includes('tablet')) return Tablet;
    return Package;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const getDerivedStatus = (p) => {
    if (p.status !== 'active') return 'inactive';
    if (p.stock_quantity <= 0) return 'out_of_stock';
    if (p.stock_quantity <= 5) return 'low_stock';
    return 'active';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your product catalog and stock.</p>
        </div>

        <Link
          to="/products/add"
          className="inline-flex items-center gap-2 bg-[#082f25] hover:bg-[#06241c] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Filter and Search Bar (Mockup Screen 03) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
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
            <option value="active">Active</option>
            <option value="low_stock">Low Stock (≤ 5)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Products Table (Mockup Screen 03) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/70 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const CatIcon = getCategoryIcon(p.category);
                  const derivedStatus = getDerivedStatus(p);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      {/* Product Name & Icon */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            <CatIcon className="w-5 h-5 text-emerald-800" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{p.name}</p>
                            <p className="text-xs text-slate-400">{p.category || 'General'}</p>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">
                        {p.sku}
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatCurrency(p.price)}
                      </td>

                      {/* Stock Stepper */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${p.stock_quantity === 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {p.stock_quantity}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(p.id, -1)}
                              disabled={p.stock_quantity <= 0}
                              title="Decrease stock by 1"
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <MinusCircle className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(p.id, 1)}
                              title="Increase stock by 1"
                              className="text-slate-400 hover:text-slate-700"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={derivedStatus} type="product" />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/products/${p.id}/edit`}
                            title="Edit Product"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(p.id)}
                            title={p.status === 'active' ? 'Deactivate Product' : 'Activate Product'}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                              p.status === 'active'
                                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                            }`}
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (Mockup Screen 03) */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {products.length > 0 ? (pagination.current_page - 1) * 10 + 1 : 0} to{' '}
            {Math.min(pagination.current_page * 10, pagination.total)} of {pagination.total} products
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fetchProducts(pagination.current_page - 1)}
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
              onClick={() => fetchProducts(pagination.current_page + 1)}
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

export default Products;
