/**
 * V65 Welcome email content - 5条爆款内容模板 + 1个工具推荐
 * V69: Add affiliate tool links for email monetization
 */
export const WELCOME_EMAIL_SUBJECT = "你的免费爆款内容模板已送达 🎉";

type AffiliateLink = { name: string; url: string };

export function getWelcomeEmailHtml(affiliateLinks?: AffiliateLink[]): string {
  const toolSection =
    affiliateLinks && affiliateLinks.length > 0
      ? `
  <h2 style="color:#0f172a;font-size:1.1em">🛠 推荐工具（提高效率）</h2>
  <p>以下工具可大幅提升创作效率，限时免费：</p>
  <ul style="list-style:none;padding:0">
    ${affiliateLinks
      .slice(0, 3)
      .map(
        (t) =>
          `<li style="margin:8px 0"><a href="${t.url}" style="color:#0284c7;font-weight:600">${t.name}</a> - 一键生成爆款内容</li>`
      )
      .join("")}
  </ul>
  <p style="margin-top:12px">点击上方链接即可使用，无需注册。</p>
  `
      : `
  <h2 style="color:#0f172a;font-size:1.1em">🛠 工具推荐</h2>
  <p>使用 <a href="https://www.tooleagle.com" style="color:#0284c7">ToolEagle</a> 免费 AI 工具，一键生成爆款文案、钩子和标题，无需注册。</p>
  `;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>爆款内容模板</title></head>
<body style="font-family:sans-serif;line-height:1.6;color:#334155;max-width:600px;margin:0 auto;padding:20px">
  <h1 style="color:#0f172a">你的免费爆款内容模板</h1>
  <p>感谢订阅！以下是 5 条可直接使用的爆款内容模板：</p>
  
  <h2 style="color:#0f172a;font-size:1.1em">📌 模板 1 - 钩子开场</h2>
  <p style="background:#f8fafc;padding:12px;border-radius:8px">「90%的人都不知道，其实...」+ 你的核心观点</p>
  
  <h2 style="color:#0f172a;font-size:1.1em">📌 模板 2 - 数字冲击</h2>
  <p style="background:#f8fafc;padding:12px;border-radius:8px">「3个方法让你 [目标] 提升10倍」</p>
  
  <h2 style="color:#0f172a;font-size:1.1em">📌 模板 3 - 痛点共鸣</h2>
  <p style="background:#f8fafc;padding:12px;border-radius:8px">「你是不是也遇到过 [痛点]？试试这个...」</p>
  
  <h2 style="color:#0f172a;font-size:1.1em">📌 模板 4 - 结果承诺</h2>
  <p style="background:#f8fafc;padding:12px;border-radius:8px">「跟着做，7天 [具体结果]」</p>
  
  <h2 style="color:#0f172a;font-size:1.1em">📌 模板 5 - 好奇悬念</h2>
  <p style="background:#f8fafc;padding:12px;border-radius:8px">「最后一个方法，大多数人不知道...」</p>
  
  ${toolSection}
  
  <p style="margin-top:24px;font-size:0.9em;color:#64748b">— ToolEagle 团队</p>
</body>
</html>
`;
}
