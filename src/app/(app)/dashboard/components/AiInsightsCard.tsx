import React from 'react';
import { TrendingUp, ChevronRight, BarChart3, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { DashboardKPI } from '@/types';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';

interface AiInsightsCardProps {
  recommendations: DashboardKPI['ai_recommendations'];
}

export const AiInsightsCard: React.FC<AiInsightsCardProps> = ({ recommendations }) => {
  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-800 shadow-2xs">
              <TrendingUp className="w-4 h-4 text-stone-700" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-base">
                บทวิเคราะห์ & ข้อเสนอแนะเชิงกลยุทธ์
              </h3>
              <p className="text-sm text-stone-500 font-normal">
                วิเคราะห์สัดส่วนกำไรขั้นต้น และความถี่คำสั่งซื้อจริง
              </p>
            </div>
          </div>
          <Link href="/menu/ai-insights">
            <Button
              variant="outline"
              size="sm"
              icon={<ChevronRight className="w-4 h-4" />}
              iconPosition="right"
              className="text-xs font-medium text-stone-700 border-stone-200 hover:bg-stone-50"
            >
              ดูการวิเคราะห์เต็ม
            </Button>
          </Link>
        </div>

        <div className="space-y-3 mt-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/70 hover:border-stone-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900 text-base">{rec.name}</span>
                    <span className="text-xs text-stone-500 font-medium">
                      ({rec.category})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-sm text-stone-600">
                    <span>ยอดขาย: <strong className="font-semibold text-stone-900">{rec.order_count}</strong> แก้ว</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-[#78350f] font-semibold">กำไร {rec.margin}%</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                  rec.margin >= 60 
                    ? 'bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]'
                    : 'bg-stone-200/80 text-stone-800 border border-stone-300/80'
                }`}>
                  {rec.tag}
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-start gap-2 text-sm text-stone-700 leading-relaxed">
                <span className="text-stone-500 font-semibold shrink-0">คำแนะนำ:</span>
                <span>{rec.insight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-stone-600" /> คำนวณตามฐานข้อมูลระบบ POS
        </span>
        <Link
          href="/menu/ai-insights"
          className="text-stone-700 hover:text-stone-900 font-medium inline-flex items-center gap-1 transition-colors"
        >
          วิเคราะห์ต่อยอด <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
