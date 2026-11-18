import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@stockroom.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Left Hero Section (Mockup 01) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#082f25] text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Abstract background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-transparent pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Boxes className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-wider">STOCKROOM</span>
          </div>

          <div className="mt-28 max-w-md">
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              Order & Inventory Management
            </h1>
            <p className="mt-4 text-emerald-200/80 text-base leading-relaxed">
              Manage products, track stock, create orders, and keep your business in sync with enterprise ACID transaction guarantees.
            </p>
          </div>
        </div>

        {/* Hero warehouse badge image preview mockup */}
        <div className="relative z-10 bg-[#0f3d32] border border-emerald-800/40 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              InnoDB Concurrency Safe
            </span>
          </div>
          <p className="text-xs text-emerald-200/70 leading-relaxed">
            Row-level pessimistic locking (<code className="text-emerald-300">lockForUpdate</code>) eliminates race conditions on low-stock items.
          </p>
        </div>
      </div>

      {/* Right Login Form (Mockup 01) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900">Welcome Back</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@stockroom.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm text-slate-800 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm text-slate-800 outline-none transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => alert('Demo account: admin@stockroom.com / password123')}
                className="text-emerald-700 hover:text-emerald-800 font-semibold"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#082f25] hover:bg-[#06241c] text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Log In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Reminder */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-400 block mb-1">Pre-configured Demo Credentials</span>
            <p className="text-xs font-mono font-medium text-slate-600 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-200 inline-block">
              admin@stockroom.com / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
