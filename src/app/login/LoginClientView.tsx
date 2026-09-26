'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/Button';

export function LoginClientView() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectParam = searchParams.get('redirect');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email.trim(), password);
    if (!result.success) {
      setError(result.error || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-stone-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden">
              <img
                src="/images/logo_ss.png"
                alt="SmartStock Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight flex items-center justify-center gap-2">
            SmartStock
          </h2>
        </div>

        {/* Card Container */}
        <div className="bg-white py-8 px-6 shadow-sm rounded-3xl sm:px-8 border border-stone-200/90">
          {redirectNotice && !error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-center gap-2.5 text-amber-900 text-xs shadow-2xs">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
              <p className="font-medium text-xs leading-relaxed">{redirectNotice}</p>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-semibold text-xs text-rose-900">เกิดข้อผิดพลาด</p>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                ชื่อผู้ใช้ หรือ อีเมล (Username or Email)
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin หรือ owner"
                  className="block w-full pl-10 pr-4 py-2.5 bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-800 text-xs transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  className="block w-full pl-10 pr-4 py-2.5 bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-800 text-xs transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              size="lg"
              className="w-full mt-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl shadow-xs font-semibold"
            >
              เข้าสู่ระบบ
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
