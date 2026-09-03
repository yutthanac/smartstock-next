import React from 'react';
import { Sparkles, ChevronRight, Flame } from 'lucide-react';
import Link from 'next/link';
import { DashboardKPI } from '@/types';

interface AiInsightsCardProps {
  recommendations: DashboardKPI['ai_recommendations'];
}

export const AiInsightsCard: React.FC<AiInsightsCardProps> = ({ recommendations }) => {
  return (
    <div className="skeuo-card rounded-3xl p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl skeuo-inset flex items-center justify-center text-emerald-700">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">AI แนะนำเมนูขายดี & กลยุทธ์</h3>
              <p className="text-xs text-slate-500">วิเคราะห์จากความถี่ออเดอร์และอัตรากำไร</p>
            </div>
          </div>
          <Link
            href="/menu/ai-insights"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 skeuo-btn-secondary px-3 py-1.5 rounded-xl flex items-center gap-1"
          >
            วิเคราะห์เต็ม <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3 mt-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-2xl skeuo-inset hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{rec.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">
                    หมวด: {rec.category} • ยอดสั่ง {rec.order_count} จาน
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full skeuo-badge-green">
                  {rec.tag}
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-2.5 skeuo-card p-2.5 rounded-xl leading-relaxed font-medium">
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
