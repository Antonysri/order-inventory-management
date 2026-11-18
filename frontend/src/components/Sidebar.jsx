import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Boxes, 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingBag, 
  History, 
  Settings 
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Orders', path: '/orders', icon: ShoppingBag },
    { name: 'Activity History', path: '/activity', icon: History },
  ];

  return (
    <aside className="w-64 bg-[#082f25] text-emerald-100 flex flex-col min-h-screen shrink-0 border-r border-emerald-950/40">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-emerald-900/30">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
          <Boxes className="w-5 h-5" />
        </div>
        <span className="font-extrabold text-lg tracking-wider text-white">STOCKROOM</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#10483a] text-white shadow-sm'
                    : 'text-emerald-200/70 hover:bg-[#0c3b2f] hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Settings */}
      <div className="p-4 border-t border-emerald-900/30">
        <button 
          type="button"
          onClick={() => alert('STOCKROOM v2.4 Enterprise Edition - Operational')}
          className="flex items-center gap-3 px-3.5 py-2 text-sm text-emerald-200/70 hover:text-white w-full rounded-lg hover:bg-[#0c3b2f] transition"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
