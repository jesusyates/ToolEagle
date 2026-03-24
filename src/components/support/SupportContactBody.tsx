"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  getSupportEnterpriseWeChatQr,
  getSupportQqLabel,
  getSupportQqLink,
  getSupportWeChatQr,
  hasAnySupportChannel
} from "@/config/support-contact";

type Props = {
  /** For analytics */
  sourcePage: string;
  /** `plain` = no inner white card (e.g. inside SupportContactModal) */
  embedStyle?: "card" | "plain";
};

/**
 * Shared content: enterprise WeChat / WeChat / QQ channels (V100.4).
 * Used by SupportContactModal (dialog) and any future inline embeds.
 */
export function SupportContactBody({ sourcePage, embedStyle = "card" }: Props) {
  const ent = getSupportEnterpriseWeChatQr();
  const wx = getSupportWeChatQr();
  const qqLink = getSupportQqLink();
  const qqLabel = getSupportQqLabel();

  useEffect(() => {
    if (!hasAnySupportChannel()) return;
    trackEvent("support_contact_view", {
      route: sourcePage,
      market: "cn",
      locale: "zh",
      source_page: sourcePage
    });
  }, [sourcePage]);

  if (!hasAnySupportChannel()) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 text-sm text-slate-600">
        <h2 className="text-sm font-bold text-slate-900">人工支持</h2>
        <p className="mt-2 text-xs leading-relaxed">
          线上客服入口暂未开放时，请先到支持页查看说明与留言渠道。
        </p>
        <Link href="/zh/support" className="mt-3 inline-block text-sm font-medium text-red-800 underline">
          前往中文站支持页 →
        </Link>
      </div>
    );
  }

  function channelClick(channel: string) {
    trackEvent("support_channel_click", {
      route: sourcePage,
      market: "cn",
      locale: "zh",
      source_page: sourcePage,
      support_channel: channel
    });
  }

  const inner = (
    <>
      <h2 className="text-sm font-bold text-slate-900">需要人工帮助？</h2>
      <p className="mt-2 text-xs text-slate-600 leading-relaxed">
        若遇<strong>支付失败、账号/权益异常、紧急故障</strong>或商务合作，可优先通过企业微信联系；个人微信与 QQ
        为补充渠道。请勿在公开群泄露订单隐私。
      </p>

      <div className="mt-4 space-y-6">
        {ent ? (
          <div>
            <p className="text-xs font-semibold text-slate-800 mb-2">企业微信（推荐）</p>
            {ent.startsWith("http") ? (
              <a
                href={ent}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-red-800 font-medium underline inline-block"
                onClick={() => {
                  channelClick("enterprise_wechat");
                  trackEvent("support_contact_click", {
                    route: sourcePage,
                    market: "cn",
                    locale: "zh",
                    source_page: sourcePage
                  });
                }}
              >
                打开企业微信入口 →
              </a>
            ) : (
              <button
                type="button"
                className="inline-block text-left"
                onClick={() => {
                  channelClick("enterprise_wechat");
                  trackEvent("support_contact_click", {
                    route: sourcePage,
                    market: "cn",
                    locale: "zh",
                    source_page: sourcePage
                  });
                }}
              >
                <Image
                  src={ent}
                  alt="企业微信"
                  width={140}
                  height={140}
                  className="rounded-lg border border-slate-200 bg-white"
                  unoptimized={ent.startsWith("http")}
                />
              </button>
            )}
          </div>
        ) : null}

        {wx ? (
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">微信（备用）</p>
            <div onClick={() => channelClick("wechat")} className="inline-block cursor-default">
              <Image
                src={wx}
                alt="微信客服"
                width={120}
                height={120}
                className="rounded-lg border border-slate-200 bg-white"
                unoptimized={wx.startsWith("http")}
              />
            </div>
          </div>
        ) : null}

        {qqLink ? (
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">{qqLabel}</p>
            <a
              href={qqLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-sky-800 font-medium hover:underline"
              onClick={() => {
                channelClick("qq");
                trackEvent("support_contact_click", {
                  route: sourcePage,
                  market: "cn",
                  locale: "zh",
                  source_page: sourcePage
                });
              }}
            >
              打开 {qqLabel} 联系 →
            </a>
          </div>
        ) : null}
      </div>
    </>
  );

  if (embedStyle === "plain") {
    return <div>{inner}</div>;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">{inner}</div>
  );
}
