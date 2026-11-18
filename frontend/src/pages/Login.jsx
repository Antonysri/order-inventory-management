import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@stockroom.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen w-screen flex bg-slate-50 font-sans">
      {/* Left Hero Section (Mockup 01) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#063f30] text-white p-12 flex-col justify-between relative overflow-hidden select-none">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
              <Boxes className="w-6 h-6" />
            </div>
            <span className="font-black text-xl tracking-wider text-white">STOCKROOM</span>
          </div>

          <div className="mt-20 max-w-md">
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
              Order & Inventory Management
            </h1>
            <p className="mt-4 text-emerald-100/80 text-sm leading-relaxed">
              Manage products, track stock, create orders, and keep your business in sync with zero negative inventory guarantees.
            </p>
          </div>
        </div>

        {/* Warehouse Visual Graphic (Mockup 01 Hero) */}
        <div className="relative z-10 mt-8 rounded-2xl overflow-hidden border border-emerald-700/40 bg-gradient-to-t from-[#04261d] to-[#0a4d3b] p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                MySQL InnoDB Pessimistic Lock
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-300/70 bg-emerald-950/60 px-2 py-0.5 rounded">
              lockForUpdate()
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-100/90 bg-emerald-900/30 p-2.5 rounded-lg border border-emerald-700/30">
              <span>iPhone 16 (Available: 5)</span>
              <span className="text-emerald-400 font-bold">Order Placement → Stock: 3</span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-100/90 bg-emerald-900/30 p-2.5 rounded-lg border border-emerald-700/30">
              <span>Concurrent Race Test (Stock: 1)</span>
              <span className="text-amber-300 font-bold">1 Success • 1 Out of Stock</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Section (Mockup 01) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#063f30] focus:ring-2 focus:ring-emerald-500/20 text-sm text-slate-800 outline-none transition"
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-[#063f30] focus:ring-2 focus:ring-emerald-500/20 text-sm text-slate-800 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-[#063f30] focus:ring-[#063f30]"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => alert('Demo account: admin@stockroom.com / password123')}
                className="text-[#063f30] hover:underline font-semibold"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#063f30] hover:bg-[#042d22] text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Log In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-400 block mb-1">Pre-configured Demo Account</span>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@stockroom.com');
                setPassword('password123');
              }}
              className="text-xs font-mono font-bold text-[#063f30] bg-emerald-50 hover:bg-emerald-100 py-1.5 px-3 rounded-lg border border-emerald-200 inline-block transition cursor-pointer"
            >
              admin@stockroom.com / password123 (Click to fill)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
