'use client';

import React from 'react';
import {
  Sparkles,
  TrendingUp,
  Award,
  AlertCircle,
  Tag,
  Lightbulb,
  ArrowRight,
  TrendingDown,
  Percent,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import Link from 'next/link';

export default function AIInsightsPage() {
  const { dashboard } = useStock();
  const insightsList = dashboard?.ai_recommendations || [];
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#ebecf0]">
      <Topbar
        title="AI วิเคราะห์เมนู"
        subtitle="คำแนะนำเมนูขายดี ต้นทุน และแนวทางดันยอดขาย"
      />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Hero Banner */}
        <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              คำแนะนำอัจฉริยะ
            </div>
            <h2 className="text-xl font-bold">วิเคราะห์ความคุ้มค่าและเมนูแนะนำ</h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              วิเคราะห์จากสัดส่วนต้นทุนวัตถุดิบและยอดสั่งซื้อ เพื่อช่วยวางแผนราคาและปรับโปรโมชัน
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-center min-w-36 shrink-0">
            <div className="text-xs text-slate-300">อัตรากำไรเฉลี่ย</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{dashboard.profit_margin || 0}%</div>
            <div className="text-[10px] text-slate-400 mt-0.5">จากออเดอร์ทั้งหมด</div>
          </div>
        </div>

        {/* AI Analyzed Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insightsList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{item.name}</h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      หมวด: {item.category} • ยอดขาย {item.order_count} ออเดอร์
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${item.tag_color}`}>
                    {item.tag}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[11px] text-slate-400">กำไรขั้นต้น (BOM Margin)</div>
                    <div className="text-base font-bold text-emerald-700 mt-0.5">{item.margin}%</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[11px] text-slate-400">ยอดสั่งซื้อสะสม</div>
                    <div className="text-base font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      {item.order_count || 0} ออเดอร์
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900">
                    <span className="font-bold flex items-center gap-1">
                      <Lightbulb className="w-4 h-4 text-amber-600" /> คำแนะนำจาก AI:
                    </span>
                    <p className="mt-1 leading-relaxed">{item.insight || (item as any).suggestion || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">อัปเดตสถิติล่าสุด</span>
                <Link
                  href="/menu"
                  className="font-bold text-[#4fb0a5] hover:text-[#12312d] flex items-center gap-1"
                >
                  ปรับปรุงสูตรเมนู <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
