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

  const insightsList = [
    {
      id: 1,
      name: 'กะเพราหมูสับไข่ดาว',
      category: 'อาหารจานเดียว',
      order_count: 142,
      margin: 64.6,
      trend: '+24%',
      tag: 'ยอดฮิต',
      tag_color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      reason: 'สถิติยอดสั่งซื้อสูงสุดอันดับ 1 ตลอด 30 วันที่ผ่านมา มีความถี่การสั่งซื้อซ้ำต่อเนื่อง',
      suggestion: 'ควรสต็อกเนื้อหมูสันคอและใบกะเพราสดไม่ให้ขาดสต็อก และพิจารณาทำเซตคอมโบพร้อมเครื่องดื่มเพื่อเพิ่ม Ticket Size',
    },
    {
      id: 3,
      name: 'สปาเก็ตตี้ขี้เมากุ้งแม่น้ำ',
      category: 'พาสต้า & เส้น',
      order_count: 86,
      margin: 69.7,
      trend: '+12%',
      tag: 'มาร์จิ้นดี',
      tag_color: 'bg-teal-100 text-teal-800 border-teal-300',
      reason: 'อัตรากำไรขั้นต้น (Margin) สูงถึง 69.7% ซึ่งสูงกว่าค่าเฉลี่ยของร้าน (65.9%)',
      suggestion: 'แนะนำให้จัดวางเป็น "เมนูแนะนำประจำสัปดาห์" และอบรมพนักงานเสิร์ฟแนะนำเป็นเมนูชูโรง',
    },
    {
      id: 2,
      name: 'สเต็กเนื้อริบอายพรีเมียม',
      category: 'สเต็ก & ย่าง',
      order_count: 42,
      margin: 62.7,
      trend: '-18%',
      tag: 'สั่งลดลง - ควรทำโปรโมชัน',
      tag_color: 'bg-amber-100 text-amber-800 border-amber-300',
      reason: 'ยอดขายชะลอตัวลง 18% ในช่วง 14 วันหลัง อาจเกิดจากราคาขายค่อนข้างสูงเมื่อเทียบกับกลุ่มจานเดียว',
      suggestion: 'จัดโปรโมชัน Flash Sale ช่วงเย็นวันธรรมดา หรือเซตคู่ไวน์/สลัด เพื่อระบายสต็อกเนื้อริบอายก่อนหมดอายุ',
    },
    {
      id: 5,
      name: 'ข้าวผัดเนื้อริบอายกระเทียมกรอบ',
      category: 'อาหารจานเดียว',
      order_count: 58,
      margin: 67.2,
      trend: '+35%',
      tag: 'กำลังมาแรง',
      tag_color: 'bg-blue-100 text-blue-800 border-blue-300',
      reason: 'ยอดขายเติบโตเร็วที่สุดในกลุ่มเมนูใหม่ มีกระแสตอบรับดีในโซเชียลมีเดีย',
      suggestion: 'โปรโมตเพิ่มผ่านหน้าเพจร้าน และขยายไซส์เป็น "จานใหญ่พิเศษสำหรับแชร์"',
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/70">
      <Topbar
        title="AI แนะนำเมนู & กลยุทธ์การขาย (AI Menu Insights)"
        subtitle="วิเคราะห์ข้อมูลออเดอร์ย้อนหลัง จัดอันดับความนิยม มาร์จิ้น และให้ข้อเสนอแนะอัจฉริยะ"
      />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Hero Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#12312d] via-[#1a4740] to-[#256157] text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4fb0a5]/20 text-[#4fb0a5] border border-[#4fb0a5]/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              Machine Learning & Order Analytics Engine
            </div>
            <h2 className="text-xl font-bold">ระบบวิเคราะห์ข้อมูลการขายและช่วยตัดสินใจ</h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              วิเคราะห์ความคุ้มค่าของสูตรอาหาร (BOM) เชื่อมโยงกับพฤติกรรมการสั่งซื้อจริง
              ช่วยให้คุณปรับกลยุทธ์เมนู เพิ่มกำไรสุทธิ และลดการสูญเสียของวัตถุดิบค้างคลัง
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 text-center min-w-40">
            <div className="text-xs text-slate-300">อัตรากำไรเฉลี่ยร้าน</div>
            <div className="text-2xl font-bold text-[#4fb0a5] mt-0.5">65.9%</div>
            <div className="text-[11px] text-emerald-300 mt-1">อยู่ในเกณฑ์ดีเยี่ยม</div>
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
                    <div className="text-[11px] text-slate-400">แนวโน้มยอดสั่งซื้อ</div>
                    <div
                      className={`text-base font-bold mt-0.5 flex items-center gap-1 ${
                        item.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {item.trend.startsWith('+') ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {item.trend}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-700">🔍 ข้อเท็จจริงจากข้อมูล:</span>
                    <p className="text-slate-600 mt-0.5">{item.reason}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900">
                    <span className="font-bold flex items-center gap-1">
                      <Lightbulb className="w-4 h-4 text-amber-600" /> คำแนะนำจาก AI:
                    </span>
                    <p className="mt-1 leading-relaxed">{item.suggestion}</p>
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
