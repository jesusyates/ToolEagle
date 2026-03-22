"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ZhDonationDeferred } from "@/components/zh/ZhDonationDeferred";
import { ZH } from "@/lib/zh-site/paths";
import { trackEvent } from "@/lib/analytics";
import { getSupportClientAnalyticsId } from "@/lib/supporter/client-analytics-id";
import { FeedbackLauncher } from "@/components/feedback/FeedbackLauncher";
import { ZhDonationPaymentPanel } from "@/components/monetization/ZhDonationPaymentPanel";

type Entry = {
  id: string;
  amount: number | null;
  created_at: string;
  source_page: string | null;
  message: string | null;
  channel: string | null;
  order_id?: string;
};

type HistoryPayload = {
  entries: Entry[];
  stats: { count: number; sum: number };
  level: string;
  perks: {
    dailyGenerationBonus: number;
    freeVisibleExtraSlots: number;
    earlyFeatureAccess: boolean;
  };
  acknowledgments: { at: string; message: string | null }[];
};

const LEVEL_LABEL: Record<string, string> = {
  none: "访客",
  early_supporter: "早期支持者",
  supporter: "支持者",
  core_supporter: "核心支持者"
};

export function ZhSupportPageClient() {
  const [data, setData] = useState<HistoryPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("support_page_view", {
      route: ZH.support,
      market: "cn",
      locale: "zh",
      source_page: ZH.support,
      supporter_id: getSupportClientAnalyticsId()
    });
  }, []);

  function refresh() {
    fetch("/api/donation/history", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) setLoadError(String(d.error));
        else setData(d as HistoryPayload);
      })
      .catch(() => setLoadError("加载失败"));
  }

  useEffect(() => {
    refresh();
  }, []);

  const level = data?.level ?? "none";

  return (
    <div className="flex-1 container py-10 pb-16 max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-red-800">支持者 · 中文站</p>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-2">支持者中心</h1>
      <p className="mt-3 text-slate-600 text-sm leading-relaxed">
        打赏通过<strong>支付订单</strong>完成：支付平台回调验签后自动记账并更新权益。本站不依赖手动「已付款」登记。
      </p>

      {loadError ? (
        <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {loadError}（若刚部署，请确认已执行数据库迁移并配置 <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code>）
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
        <h2 className="text-sm font-bold text-slate-900">当前状态（基于已验证支付）</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">等级</dt>
            <dd className="font-semibold text-red-900">{LEVEL_LABEL[level] ?? level}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">已验证支付笔数</dt>
            <dd className="font-medium text-slate-900">{data?.stats?.count ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">已验证金额合计</dt>
            <dd className="font-medium text-slate-900">
              {data?.stats?.sum != null ? `¥${data.stats.sum.toFixed(2)}` : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">每日免费生成加成</dt>
            <dd className="font-medium text-emerald-800">
              +{data?.perks?.dailyGenerationBonus ?? 0} 次 / 天
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">免费档可见文案包</dt>
            <dd className="font-medium text-slate-900">
              {3 + (data?.perks?.freeVisibleExtraSlots ?? 0)} 套（核心支持者 +1）
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">早期功能体验</dt>
            <dd className="font-medium text-slate-900">
              {data?.perks?.earlyFeatureAccess ? "已开启" : "未开启"}
            </dd>
          </div>
        </dl>
        <Link
          href={ZH.pricing}
          className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
        >
          想获得更强功能，升级 Pro →
        </Link>
      </section>

      <div className="mt-8">
        <p className="text-xs text-slate-500 mb-2">
          需要<strong>人工帮助</strong>（企业微信 / 微信 / QQ）？请点任意中文页页脚「人工帮助」打开弹窗，与反馈入口并列。
        </p>
        <FeedbackLauncher
          variant="inline"
          localeUi="zh"
          context={{
            route: ZH.support,
            market: "cn",
            locale: "zh",
            sourcePage: ZH.support,
            toolType: null,
            userPlan: null
          }}
        />
      </div>

      <section id="zh-donate" className="mt-10 scroll-mt-24">
        <h2 className="text-sm font-bold text-slate-900 mb-3">扫码打赏（订单支付）</h2>
        <ZhDonationPaymentPanel onPaid={() => refresh()} />
      </section>

      <section className="mt-10 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
        <ZhDonationDeferred variant="zh" prominent={false} fallbackUnrecorded />
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-bold text-slate-900 mb-3">感谢与时间线</h2>
        {!data ? (
          <p className="text-sm text-slate-500">加载中…</p>
        ) : data.acknowledgments.length === 0 ? (
          <p className="text-sm text-slate-500">暂无已验证的打赏记录。完成上方订单支付后会自动显示。</p>
        ) : (
          <ul className="space-y-3">
            {data.acknowledgments.map((a, i) => (
              <li
                key={`${a.at}-${i}`}
                className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2 text-sm text-red-950"
              >
                <time className="text-xs text-red-800/80 block">
                  {new Date(a.at).toLocaleString("zh-CN")}
                </time>
                <span className="font-medium">{a.message ?? "感谢你的支持 ❤️"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-bold text-slate-900 mb-3">支付明细</h2>
        {!data || data.entries.length === 0 ? (
          <p className="text-sm text-slate-500">暂无明细。</p>
        ) : (
          <ul className="text-xs text-slate-600 space-y-2">
            {data.entries.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-x-2 border-b border-slate-100 pb-2">
                <span>{new Date(e.created_at).toLocaleString("zh-CN")}</span>
                <span>·</span>
                <span>已验证支付</span>
                {e.order_id ? (
                  <>
                    <span>·</span>
                    <span className="font-mono text-[10px]">{e.order_id.slice(0, 18)}…</span>
                  </>
                ) : null}
                {e.amount != null ? (
                  <>
                    <span>·</span>
                    <span className="font-semibold text-red-900">¥{Number(e.amount).toFixed(2)}</span>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 text-xs text-slate-500">
        <button type="button" onClick={() => refresh()} className="text-red-800 underline">
          刷新数据
        </button>
      </p>
    </div>
  );
}
