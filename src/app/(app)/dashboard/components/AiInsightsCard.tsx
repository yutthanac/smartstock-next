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
            <div className="w-10 h-10 rounded-xl skeuo-inset flex items-center justify-center text-slate-700">
              <Sparkles className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">AI แนะนำเมนูขายดี & กลยุทธ์</h3>
              <p className="text-sm text-slate-500 mt-0.5 font-normal">วิเคราะห์จากความถี่ออเดอร์และอัตรากำไร</p>
            </div>
          </div>
          <Link
            href="/menu/ai-insights"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 skeuo-btn-secondary px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow-2xs"
          >
            วิเคราะห์เต็ม <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>

        <div className="space-y-3.5 mt-5">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-2xl skeuo-inset hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900 text-base">{rec.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-normal">
                    หมวด: {rec.category} • ยอดสั่ง {rec.order_count} แก้ว/เสิร์ฟ
                  </div>
                </div>
                <span className="text-xs font-medium px-3 py-0.5 rounded-full skeuo-badge-green">
                  {rec.tag}
                </span>
              </div>
              <p className="text-sm text-slate-700 mt-3 skeuo-card p-3 rounded-xl leading-relaxed font-normal">
                💡 {rec.insight}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-normal">
        <span className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-rose-500" /> อัปเดตข้อมูลอัตโนมัติ
        </span>
        <span className="text-slate-600">ประมวลผลจากยอดขายจริง</span>
      </div>
    </div>
  );
};
