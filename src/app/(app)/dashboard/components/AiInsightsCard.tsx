import React from 'react';
import { Sparkles, ChevronRight, Flame } from 'lucide-react';
import Link from 'next/link';
import { DashboardKPI } from '@/types';

interface AiInsightsCardProps {
  recommendations: DashboardKPI['ai_recommendations'];
}

export const AiInsightsCard: React.FC<AiInsightsCardProps> = ({ recommendations }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4fb0a5] to-[#12312d] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">AI แนะนำเมนูขายดี & กลยุทธ์</h3>
              <p className="text-xs text-slate-500">วิเคราะห์จากความถี่ออเดอร์และอัตรากำไร</p>
            </div>
          </div>
          <Link
            href="/menu/ai-insights"
            className="text-xs font-semibold text-[#4fb0a5] hover:underline flex items-center"
          >
            วิเคราะห์เต็ม <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3 mt-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#4fb0a5]/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-800 text-sm">{rec.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    หมวด: {rec.category} • ยอดสั่ง {rec.order_count} จาน
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${rec.tag_color}`}>
                  {rec.tag}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 bg-white p-2 rounded-lg border border-slate-100/80 leading-relaxed">
                💡 {rec.insight}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Flame className="w-4 h-4 text-rose-500" /> อัปเดตข้อมูลอัตโนมัติทุก 1 ชั่วโมง
        </span>
        <span className="font-medium text-slate-700">โมเดลสถิติ Ranking AI</span>
      </div>
    </div>
  );
};
