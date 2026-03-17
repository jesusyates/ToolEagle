import { ImageResponse } from "next/og";

// Use Node.js runtime to avoid Edge 1MB size limit (ImageResponse + deps exceed it)

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram"
};

const TYPE_LABELS: Record<string, string> = {
  captions: "Captions",
  hashtags: "Hashtags",
  titles: "Titles",
  hooks: "Hooks",
  bio: "Bio"
};

function formatTopic(topic: string): string {
  return topic
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cleanSlug = slug.replace(/\.png$/, "");

  // V66: zh keyword OG - /og/tiktok-zhangfen-ruhe etc.
  try {
    const { getKeywordBySlug } = await import("@/lib/keyword-patterns");
    const { getKeywordContent } = await import("@/lib/zh-keyword-content");
    const entry = getKeywordBySlug(cleanSlug);
    const content = getKeywordContent(cleanSlug);
    if (entry && content) {
      const title = content.title || content.h1 || entry.keyword;
      return new ImageResponse(
        (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0f172a",
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 48
              }}
            >
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 700,
                  color: "white",
                  textAlign: "center",
                  maxWidth: 1000
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: 22,
                  color: "#94a3b8",
                  marginTop: 16
                }}
              >
                ToolEagle · 中文创作者指南
              </div>
            </div>
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }
  } catch {
    // fall through
  }

  // zh default OG image for Chinese pages
  if (cleanSlug === "zh-default" || cleanSlug.startsWith("zh-")) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0f172a",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 48
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: "white",
                textAlign: "center",
                maxWidth: 1000
              }}
            >
              中文创作者指南（2026最新）
            </div>
            <div
              style={{
                fontSize: 24,
                color: "#94a3b8",
                marginTop: 16
              }}
            >
              ToolEagle · TikTok、YouTube、Instagram 涨粉与内容策略
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const parts = cleanSlug.split("-");
  let platform = "tiktok";
  let type = "captions";
  let topic = "funny";

  if (parts.length >= 3) {
    const typeIndex = parts.findIndex((p) =>
      ["captions", "hashtags", "titles", "hooks", "bio"].includes(p)
    );
    if (typeIndex >= 0) {
      platform = parts.slice(0, typeIndex).join("-") || "tiktok";
      type = parts[typeIndex];
      topic = parts.slice(typeIndex + 1).join("-") || "funny";
    } else {
      platform = parts[0] || "tiktok";
      type = parts[1] || "captions";
      topic = parts.slice(2).join("-") || "funny";
    }
  } else if (parts.length === 2) {
    platform = parts[0] || "tiktok";
    type = "captions";
    topic = parts[1] || "funny";
  } else if (parts.length === 1) {
    topic = parts[0] || "funny";
  }

  const platformLabel = PLATFORM_LABELS[platform] ?? platform;
  const typeLabel = TYPE_LABELS[type] ?? type;
  const topicLabel = formatTopic(topic);
  const title = `${topicLabel} ${platformLabel} ${typeLabel}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 48
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "white",
              textAlign: "center",
              maxWidth: 1000
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#94a3b8",
              marginTop: 16
            }}
          >
            ToolEagle · Free AI Tools for Creators
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
