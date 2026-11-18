import React from 'react';

const StatusBadge = ({ status, type = 'order' }) => {
  const norm = String(status || '').toLowerCase();

  if (type === 'product') {
    if (norm === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          Active
        </span>
      );
    }
    if (norm === 'low_stock' || norm === 'low stock') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          Low Stock
        </span>
      );
    }
    if (norm === 'out_of_stock' || norm === 'out of stock') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
          Out of Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
        Inactive
      </span>
    );
  }

  // Order Status Badges
  if (norm === 'placed') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
        Placed
      </span>
    );
  }
  if (norm === 'processing') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
        Processing
      </span>
    );
  }
  if (norm === 'completed') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
        Completed
      </span>
    );
  }
  if (norm === 'cancelled') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
      {status}
    </span>
  );
};

export default StatusBadge;
