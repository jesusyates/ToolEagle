import { ImageResponse } from "next/og";

export const runtime = "edge";

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
  const parts = slug.replace(/\.png$/, "").split("-");
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
