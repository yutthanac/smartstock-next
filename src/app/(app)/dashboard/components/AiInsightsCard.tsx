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
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <TrendingUp className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm md:text-base">
                บทวิเคราะห์ & ข้อเสนอแนะเชิงกลยุทธ์
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                วิเคราะห์สัดส่วนกำไรขั้นต้น และความถี่คำสั่งซื้อจริง
              </p>
            </div>
          </div>
          <Link href="/menu/ai-insights">
            <Button
              variant="outline"
              size="sm"
              icon={<ChevronRight className="w-3.5 h-3.5" />}
              iconPosition="right"
              className="text-xs font-normal text-slate-700"
            >
              ดูการวิเคราะห์เต็ม
            </Button>
          </Link>
        </div>

        <div className="space-y-3 mt-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{rec.name}</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      ({rec.category})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-normal">
                    <span>ยอดขาย: <strong className="font-medium text-slate-800">{rec.order_count}</strong> แก้ว</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-medium">กำไร {rec.margin}%</span>
                  </div>
                </div>
                <Badge
                  variant={rec.margin >= 60 ? 'neutral' : 'warning'}
                  size="sm"
                  className="font-normal"
                >
                  {rec.tag}
                </Badge>
              </div>

              <div className="mt-2.5 pt-2.5 border-t border-slate-200/50 flex items-start gap-2 text-xs text-slate-600 font-normal leading-relaxed">
                <span className="text-slate-400 font-mono text-[11px] shrink-0 font-medium">คำแนะนำ:</span>
                <span>{rec.insight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-normal">
        <span className="flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-slate-500" /> คำนวณตามฐานข้อมูลระบบ POS
        </span>
        <Link
          href="/menu/ai-insights"
          className="text-slate-600 hover:text-slate-900 font-normal inline-flex items-center gap-1 transition-colors"
        >
          วิเคราะห์ต่อยอด <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
