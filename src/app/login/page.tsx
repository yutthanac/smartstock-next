'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/Button';

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

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-slate-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-3xl bg-white p-2.5 shadow-md shadow-emerald-500/10 border border-slate-200/80 flex items-center justify-center overflow-hidden">
            <img
              src="/images/logo_ss.png"
              alt="SmartStock Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
          SmartStock
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 font-medium">
          เข้าสู่ระบบจัดการสต็อกวัตถุดิบ & ระบบขายหน้าร้าน
        </p>
      </div>

      {/* Card Container (30% secondary surface) */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl sm:px-9 border border-slate-200/80">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-semibold text-xs">เกิดข้อผิดพลาด</p>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold normal-text-700 mb-1.5">
                อีเมลผู้ใช้งาน (Email)
              </label>
              <div className="relative rounded-2xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@smartstock.local"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative rounded-2xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-xs transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              size="lg"
              className="w-full mt-2"
            >
              เข้าสู่ระบบ
            </Button>
          </form>

          {/* Quick Login Section for Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <span>บัญชีทดสอบด่วน (Quick Test Accounts):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('admin@smartstock.local')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  email === 'admin@smartstock.local'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className={`text-xs font-semibold ${email === 'admin@smartstock.local' ? 'text-white' : 'text-slate-900'}`}>Admin (เจ้าของร้าน)</div>
                <div className={`text-[10px] mt-0.5 truncate ${email === 'admin@smartstock.local' ? 'text-slate-300' : 'text-slate-400'}`}>admin@smartstock.local</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('manager@smartstock.local')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  email === 'manager@smartstock.local'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className={`text-xs font-semibold ${email === 'manager@smartstock.local' ? 'text-white' : 'text-slate-900'}`}>Manager (ผู้จัดการ)</div>
                <div className={`text-[10px] mt-0.5 truncate ${email === 'manager@smartstock.local' ? 'text-slate-300' : 'text-slate-400'}`}>manager@smartstock.local</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('chef@smartstock.local')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  email === 'chef@smartstock.local'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className={`text-xs font-semibold ${email === 'chef@smartstock.local' ? 'text-white' : 'text-slate-900'}`}>Chef (หัวหน้าครัว)</div>
                <div className={`text-[10px] mt-0.5 truncate ${email === 'chef@smartstock.local' ? 'text-slate-300' : 'text-slate-400'}`}>chef@smartstock.local</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('cashier@smartstock.local')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  email === 'cashier@smartstock.local'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className={`text-xs font-semibold ${email === 'cashier@smartstock.local' ? 'text-white' : 'text-slate-900'}`}>Cashier (หน้าร้าน POS)</div>
                <div className={`text-[10px] mt-0.5 truncate ${email === 'cashier@smartstock.local' ? 'text-slate-300' : 'text-slate-400'}`}>cashier@smartstock.local</div>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              รหัสผ่านเริ่มต้นสำหรับทุก User: <span className="text-slate-600 font-mono font-medium">password123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
