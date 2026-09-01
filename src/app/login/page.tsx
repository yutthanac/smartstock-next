'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ChefHat, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@smartstock.local');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'เข้าสู่ระบบไม่สำเร็จ');
      setLoading(false);
    }
  };

  const quickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#4fb0a5]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#12312d] rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-3xl bg-white p-2.5 shadow-xl shadow-[#4fb0a5]/20 flex items-center justify-center overflow-hidden">
            <img
              src="/images/logo_ss.png"
              alt="SmartStock Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          SmartStock <span className="text-[#4fb0a5]">PRO</span>
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          เข้าสู่ระบบจัดการสต็อกวัตถุดิบ & ระบบขายหน้าร้าน (POS)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-700/60">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-semibold">เกิดข้อผิดพลาด</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                อีเมลผู้ใช้งาน (Email)
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@smartstock.local"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900/70 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#4fb0a5] focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                รหัสผ่าน (Password)
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900/70 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#4fb0a5] focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold text-slate-950 bg-[#4fb0a5] hover:bg-[#45a096] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4fb0a5] shadow-lg shadow-[#4fb0a5]/25 transition-all transform active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span>กำลังเข้าสู่ระบบ...</span>
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Section for Testing */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4fb0a5] mb-3">
              <Sparkles className="w-4 h-4" />
              <span>บัญชีทดสอบด่วน (Quick Test Accounts):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('admin@smartstock.local')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  email === 'admin@smartstock.local'
                    ? 'bg-[#12312d] border-[#4fb0a5] text-white'
                    : 'bg-slate-900/50 border-slate-700/80 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold text-emerald-400">Admin (เจ้าของร้าน)</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">admin@smartstock.local</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('manager@smartstock.local')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  email === 'manager@smartstock.local'
                    ? 'bg-[#12312d] border-[#4fb0a5] text-white'
                    : 'bg-slate-900/50 border-slate-700/80 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold text-sky-400">Manager (ผู้จัดการ)</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">manager@smartstock.local</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('chef@smartstock.local')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  email === 'chef@smartstock.local'
                    ? 'bg-[#12312d] border-[#4fb0a5] text-white'
                    : 'bg-slate-900/50 border-slate-700/80 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold text-amber-400">Chef (หัวหน้าครัว)</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">chef@smartstock.local</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('cashier@smartstock.local')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  email === 'cashier@smartstock.local'
                    ? 'bg-[#12312d] border-[#4fb0a5] text-white'
                    : 'bg-slate-900/50 border-slate-700/80 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold text-purple-400">Cashier (หน้าร้าน POS)</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">cashier@smartstock.local</div>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              รหัสผ่านเริ่มต้นสำหรับทุก User: <span className="text-slate-200 font-mono">password123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
