import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';

const CancelOrderModal = ({ isOpen, order, onClose, onConfirm, loading }) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Cancel Order?</h3>
            <p className="text-sm text-slate-500 mt-1">
              This will cancel order <span className="font-semibold text-slate-800">{order.order_number}</span> and restore the ordered quantities to inventory.
            </p>
          </div>
        </div>

        {/* Stock to be Restored preview card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
            Stock to be Restored
          </p>
          <div className="space-y-2">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{item.product?.name || `Product #${item.product_id}`}</span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
                  +{item.quantity} {item.quantity === 1 ? 'unit' : 'units'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Keep Order
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition shadow-sm disabled:opacity-50"
          >
            {loading ? 'Restoring Stock...' : 'Yes, Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderModal;
