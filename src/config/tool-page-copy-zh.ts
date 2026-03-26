/**
 * 中文站工具页：母语说明 + 一行操作路径（非英译中堆砌）。
 * Keys 与 `TOOL_PAGE_COPY_EN` 一致（非 cnOnly 工具）。
 */
import type { ToolPageCopy } from "@/config/tool-page-copy-en";

export const TOOL_PAGE_COPY_ZH: Record<string, ToolPageCopy> = {
  "tiktok-caption-generator": {
    hero: "该工具的作用：用一个创意生成完整的 TikTok 帖子文案，并为你提供开场句式、口播要点、正文、行动号召（CTA）和可直接使用的话题标签。",
    steps: "在此生成并复制，打开 TikTok 发布页，将文案粘贴到「描述你的帖子」输入框，点发布，再到「我」主页查看刚发的作品。"
  },
  "ai-caption-generator": {
    hero: "把一个选题或卖点拉成「能直接拍、能直接发」的多平台文案包：开头、要点、正文、引导与话题，一次生成。",
    steps: "在此生成并复制，按你要发的平台分别粘贴到对应发布页的说明区或描述区，再按你的口吻微调后发布。"
  },
  "hashtag-generator": {
    hero: "根据你的领域或视频主题生成话题标签组合，偏实用、可贴进说明区，而不是乱堆热词。",
    steps: "在此生成并复制标签行，粘贴到作品说明区或首条评论（按平台习惯），再发布。"
  },
  "hook-generator": {
    hero: "专治「开头没劲」：给你多种黄金开头句式，并配套可拍、可念的要点，方便你直接开拍或写进文案。",
    steps: "在此生成并复制，把开头用在视频前 1～3 秒口播或大字幕上，其余可放进说明区或脚本里。"
  },
  "title-generator": {
    hero: "把一个主题拆成多条标题角度，可用于 YouTube、TikTok、Reels、Shorts 等上传页的标题栏。",
    steps: "在此生成并复制，到各平台上传或编辑页，把标题粘进「标题」字段再发布。"
  },
  "tiktok-bio-generator": {
    hero: "帮你写简短清晰的 TikTok 个人简介：你是谁、发什么、观众下一步做什么。",
    steps: "在此生成并复制，打开 TikTok「我」→ 编辑资料 → 简介，粘贴后保存。"
  },
  "youtube-title-generator": {
    hero: "围绕一个主题生成多条 YouTube 长视频标题思路，兼顾可读与搜索。",
    steps: "在此生成并复制，打开 YouTube 工作室 → 对应视频 → 详情 → 标题栏，粘贴后保存。"
  },
  "instagram-caption-generator": {
    hero: "把想法写成可发的图文/Reels 配文：有结构、有引导，而不是一句话敷衍。",
    steps: "在此生成并复制，发新帖时在「说明文字」框粘贴，再发布。"
  },
  "youtube-description-generator": {
    hero: "生成带关键词与引导的长描述草稿，方便你放到视频说明区。",
    steps: "在此生成并复制，到工作室该视频的「说明」栏粘贴，检查链接与时间轴后保存。"
  },
  "tiktok-username-generator": {
    hero: "按你的领域给一批好记、好念的账号名思路；最终能否改名以 App 内提示为准。",
    steps: "在此选一个复制，到 TikTok「编辑资料」里改用户名（若可用），保存。"
  },
  "instagram-username-generator": {
    hero: "给一批符合你人设的账号名思路；是否占用以 Instagram 提示为准。",
    steps: "在此复制候选名，到「编辑资料」里修改用户名或名称，保存。"
  },
  "tiktok-idea-generator": {
    hero: "把笼统领域拆成「这周能拍」的具体选题角度，而不是空泛热词。",
    steps: "在此生成并复制到选题表或备忘录，再按其中一条去写脚本与开拍。"
  },
  "youtube-video-idea-generator": {
    hero: "围绕频道方向给可执行的选题，而不是一句话标题党。",
    steps: "在此复制进你的排期表或工作室「新视频」草稿，再进入制作流程。"
  },
  "tiktok-script-generator": {
    hero: "给竖屏口播的分段与气口，减少对着镜头现编。",
    steps: "在此复制到备忘录或提词器，拍完再把配文贴进 TikTok「描述你的帖子」。"
  },
  "youtube-script-generator": {
    hero: "给长视频的结构化口播/分镜要点：开头、主体、结尾引导。",
    steps: "在此复制到文档或提词器，录制剪辑后，把摘要贴进视频说明也可。"
  },
  "viral-hook-generator": {
    hero: "一批强开头句式，适合短视频前几秒抓注意力。",
    steps: "在此复制，用作第一句口播或首帧大字，再让画面与后文跟上。"
  },
  "story-hook-generator": {
    hero: "适合叙事、复盘、经历类内容的开头句式，快速入戏。",
    steps: "在此复制进脚本或分镜第一条，再按故事线拍下去。"
  },
  "clickbait-title-generator": {
    hero: "提供「好奇缺口」式标题角度；发布前请确保与内容一致，避免标题党伤号。",
    steps: "在此复制到各平台上传标题栏，确认画面与承诺匹配后再发。"
  },
  "ai-video-title-generator": {
    hero: "面向算法与点击的标题变体，可再按你频道语气微调。",
    steps: "在此复制到上传页标题字段或 A/B 测试列表。"
  },
  "social-media-post-generator": {
    hero: "生成可直接粘贴的动态短文，你再按平台字数与语气裁剪。",
    steps: "在此复制到对应 App 的发帖框（动态、社群、图文等），再发布。"
  },
  "instagram-hashtag-generator": {
    hero: "按主题给 Reels/动态用的话题标签组合，注意别过量堆砌。",
    steps: "在此复制，粘贴到发帖「说明」区再发布。"
  },
  "youtube-tag-generator": {
    hero: "给一批与主题相关的标签词，用于补充视频元数据（配合标题与说明）。",
    steps: "在此复制到工作室该视频的标签栏，保存。"
  },
  "tiktok-hashtag-generator": {
    hero: "按领域给 TikTok 说明区用的话题标签行，尽量与画面内容一致。",
    steps: "在此复制，粘贴到「描述你的帖子」再发布。"
  },
  "reel-caption-generator": {
    hero: "写 Reels 配文：开头、正文、引导与标签一块出。",
    steps: "在此复制，发 Reels 时在说明栏粘贴后发布。"
  },
  "shorts-title-generator": {
    hero: "给 Shorts 用的短标题思路，适合手机预览与缩略图旁展示。",
    steps: "在此复制到 Shorts 上传流程的标题栏再发布。"
  },
  "tiktok-hook-generator": {
    hero: "偏 TikTok 语境的开头句式，方便你对准前 1 秒。",
    steps: "在此复制用作开场口播或首屏字，再把补充文案放进说明区。"
  },
  "tiktok-comment-reply-generator": {
    hero: "给评论回复话术，省时间、保持互动感。",
    steps: "在此复制，打开对应评论→回复→粘贴发送。"
  },
  "tiktok-story-generator": {
    hero: "给轻量、短句型文案，适合快拍或轻更新场景。",
    steps: "在此复制到快拍文字或贴纸说明，按 App 当前入口发布。"
  },
  "tiktok-trend-caption-generator": {
    hero: "结合热点/音乐场景的配文角度，避免与画面脱节。",
    steps: "在此复制，选好同款声音或模板后，贴进「描述你的帖子」。"
  },
  "tiktok-video-idea-generator": {
    hero: "把细分赛道拆成可拍的选题，而不是空泛「涨粉」。",
    steps: "在此复制进选题表，再选一条做脚本与拍摄。"
  },
  "youtube-shorts-title-generator": {
    hero: "给 Shorts 标题变体，突出前几个字的可读性。",
    steps: "在此复制到 Shorts 发布标题栏。"
  },
  "youtube-thumbnail-text-generator": {
    hero: "给封面大字思路：字少、对比强、三秒内能读完。",
    steps: "在此复制到 Canva/剪映/PS 封面字，导出封面再上传。"
  },
  "youtube-hook-generator": {
    hero: "长视频或 Shorts 前五秒可用的开场句，可口播或上字幕。",
    steps: "在此复制到脚本开头或时间线 0～5 秒画面。"
  },
  "instagram-reels-caption-generator": {
    hero: "偏 Reels 的完整配文：引导与标签一起考虑。",
    steps: "在此复制到 Reels 发布页的说明栏。"
  },
  "instagram-bio-generator": {
    hero: "写清你是谁、价值点、下一步动作（关注/私信/链接）。",
    steps: "在此复制到「编辑资料」→ 简介，保存。"
  },
  "instagram-comment-reply-generator": {
    hero: "给评论区的回复句式，语气自然不敷衍。",
    steps: "在此复制，在对应评论下回复并发送。"
  },
  "instagram-story-caption-generator": {
    hero: "给快拍用的短句、引导或贴纸文案思路。",
    steps: "在此复制到快拍文字或贴纸，再发布。"
  },
  "tiktok-transition-generator": {
    hero: "给转场与镜头衔接灵感，方便你按清单拍摄与剪辑。",
    steps: "在此复制到分镜或剪辑备注，按顺序拍剪。"
  },
  "youtube-community-post-generator": {
    hero: "给社群动态帖：预告、提问、投票导语等。",
    steps: "在此复制到工作室「社群」发帖框，再发布。"
  },
  "instagram-carousel-caption-generator": {
    hero: "给多图轮播写总说明，并可按滑页节奏微调首段。",
    steps: "在此复制到轮播帖说明栏，再按顺序上传各张图。"
  },
  "tiktok-duet-idea-generator": {
    hero: "给合拍/跟拍角度，让你这边画面有增量信息。",
    steps: "在此选好角度，在 TikTok 里选原视频进入合拍/跟拍再拍。"
  },
  "youtube-end-screen-generator": {
    hero: "给片尾引导语：订阅、下集、playlist 等短句。",
    steps: "在此复制到口播结尾或片尾画面，并在工作室设置结束画面元素。"
  },
  "instagram-dm-generator": {
    hero: "私信开场与跟进话术，注意频率与合规，避免骚扰感。",
    steps: "在此复制到私信输入框再发送。"
  },
  "tiktok-challenge-idea-generator": {
    hero: "给挑战赛式选题：动作清晰、可参与、好传播。",
    steps: "在此复制发起视频说明，再引导参与者用同一标签或动作。"
  },
  "youtube-playlist-title-generator": {
    hero: "给合集命名，让人一眼知道这一组视频讲什么。",
    steps: "在此复制到工作室播放列表标题，保存。"
  },
  "instagram-poll-idea-generator": {
    hero: "给快拍投票的问题与选项思路。",
    steps: "在此复制到快拍投票贴纸里，再发布。"
  },
  "short-form-script-generator": {
    hero: "竖屏短片的提纲：开头—中段—收口，一次能拍完。",
    steps: "在此复制到提词器或备忘录，拍完再贴各平台说明区。"
  },
  "viral-caption-generator": {
    hero: "多平台可用的说明区文案角度，你再按字数裁剪。",
    steps: "在此复制到对应 App 的帖子说明或描述框。"
  },
  "reel-hook-generator": {
    hero: "针对 Reels 的前几秒句式，配合无声预览习惯。",
    steps: "在此复制为首句口播或封面字，再展开正文。"
  },
  "content-idea-bank": {
    hero: "批量选题句，方便你丢进日历或表格里排期。",
    steps: "在此复制到 Notion/表格，再择优做成脚本。"
  },
  "script-outline-generator": {
    hero: "短内容提纲：钩子等要点与说明区提示一并给。",
    steps: "在此复制到脚本文档，拍完再贴发布说明。"
  }
};

export function getToolPageCopyZh(slug: string): ToolPageCopy | undefined {
  return TOOL_PAGE_COPY_ZH[slug];
}
