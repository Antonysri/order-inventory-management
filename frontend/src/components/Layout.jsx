import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import LogoutModal from './LogoutModal';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { isAuthenticated, loading, logout } = useAuth();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#063f30] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-700">Loading STOCKROOM...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleConfirmLogout = async () => {
    await logout();
    setLogoutModalOpen(false);
  };

  return (
    <div className="flex h-screen w-screen bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header onOpenLogout={() => setLogoutModalOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
};

export default Layout;
