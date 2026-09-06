'use client';

import React, { useState } from 'react';
import { useAuth, StoreInfo } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Store, Coffee, UtensilsCrossed, Cookie, Building2, ChevronRight, LogOut, Sparkles, MapPin, Phone } from 'lucide-react';

const STORE_TYPE_META: Record<string, { icon: React.ComponentType<any>; label: string; color: string; bg: string; border: string; glow: string }> = {
  restaurant: {
    icon: UtensilsCrossed,
    label: 'ร้านอาหาร',
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    glow: 'shadow-slate-500/10',
  },
  cafe: {
    icon: Coffee,
    label: 'คาเฟ่',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    glow: 'shadow-amber-500/20',
  },
  bakery: {
    icon: Cookie,
    label: 'เบเกอรี่',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    glow: 'shadow-rose-500/20',
  },
  other: {
    icon: Building2,
    label: 'อื่นๆ',
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    glow: 'shadow-slate-500/20',
  },
};

const ROLE_LABEL: Record<string, string> = {
  owner:   'เจ้าของ',
  manager: 'ผู้จัดการ',
  staff:   'พนักงาน',
};

export default function StorePickerPage() {
  const { user, stores, setActiveStore, logout } = useAuth();
  const router = useRouter();
  const [selecting, setSelecting] = useState<number | null>(null);

  const handleSelect = (store: StoreInfo) => {
    setSelecting(store.id);
    setActiveStore(store);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex flex-col relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-slate-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200/60 bg-white/70 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
            <img src="/images/logo_ss.png" alt="SmartStock" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 leading-tight">SmartStock</p>
            <p className="text-[10px] text-slate-400">สวัสดี, {user?.name}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-rose-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ออกจากระบบ</span>
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-normal px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3 h-3" />
            <span>เลือกระบบที่ต้องการจัดการ</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">เลือกร้านค้า</h1>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            คุณมีสิทธิ์เข้าถึง {stores.length} ร้าน — กดเลือกเพื่อเข้าจัดการระบบ
          </p>
        </div>

        {/* Store Cards Grid */}
        <div className={`w-full max-w-2xl grid gap-4 ${stores.length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {[...stores].sort((a, b) => (a.type === 'cafe' ? -1 : b.type === 'cafe' ? 1 : 0)).map((store) => {
            const meta = STORE_TYPE_META[store.type] ?? STORE_TYPE_META.other;
            const Icon = meta.icon;
            const isLoading = selecting === store.id;

            return (
              <button
                key={store.id}
                onClick={() => handleSelect(store)}
                disabled={selecting !== null}
                className={`group relative text-left p-5 rounded-2xl border-2 bg-white shadow-lg transition-all duration-200
                  ${isLoading
                    ? `${meta.border} ${meta.bg} scale-[0.98]`
                    : `border-slate-200 hover:${meta.border} hover:shadow-xl hover:shadow-${meta.glow} hover:-translate-y-1 active:scale-[0.98]`
                  }
                  disabled:opacity-70`}
              >
                {/* Store type badge */}
                <div className={`inline-flex items-center gap-1.5 ${meta.bg} ${meta.border} ${meta.color} text-[10px] font-bold px-2.5 py-0.5 rounded-full border mb-4`}>
                  <Icon className="w-3 h-3" />
                  <span>{meta.label}</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight truncate">{store.name}</h3>
                    <p className={`text-xs font-semibold mt-1 ${meta.color}`}>
                      {ROLE_LABEL[store.my_role] ?? store.my_role}
                    </p>
                  </div>

                  <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60" />
                    ) : (
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    )}
                  </div>
                </div>

                <div className={`mt-4 pt-3 border-t ${meta.border} flex items-center justify-between`}>
                  <span className="text-[10px] text-slate-400 font-mono">{store.slug}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:${meta.color}`} />
                </div>
              </button>
            );
          })}
        </div>

        {stores.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">ยังไม่มีร้านในระบบ</p>
            <p className="text-xs mt-1">ติดต่อ Admin เพื่อสร้างร้านใหม่</p>
          </div>
        )}
      </div>
    </div>
  );
}
