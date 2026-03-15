/**
 * SEO Engine v2 - Content templates
 * 1 template + topic replacement = many pages
 */

export function getCaptionExamples(topic: string): string[] {
  const t = topic.replace(/-/g, " ");
  return [
    `You need to see this ${t} 👇`,
    `Nobody is talking about ${t}…`,
    `POV: your algorithm gets ${t}`,
    `Save this for later 📌`,
    `The one thing nobody tells you about ${t}`,
    `Stop scrolling for a sec 👇`,
    `Wait for it…`,
    `I tried ${t} so you don't have to`,
    `Real talk 💀`,
    `That's it. That's the post.`,
    `No caption needed`,
    `Vibes only ✨`,
    `Period.`,
    `Facts.`,
    `No cap.`,
    `This hit different 😂`,
    `Comment if you agree`,
    `Tag someone who needs this`,
    `Swipe for more 👉`,
    `The truth about ${t}`
  ];
}

export function getHashtagExamples(topic: string): string[] {
  const base = topic.replace(/-/g, "");
  return [
    `#${base} #fyp #viral #creators`,
    `#${base} #contentcreator #trending #foryou`,
    `#${base} #tiktok #reels #shorts`,
    `#${base} #explore #creator #niche`,
    `#${base} #viral #fyp #trending`,
    `#fyp #viral #${base} #contentcreator`,
    `#trending #${base} #creators #explore`,
    `#${base} #reels #shorts #tiktok`,
    `#contentcreator #${base} #foryou #viral`,
    `#${base} #fyp #explore #niche`
  ];
}

export function getTitleExamples(topic: string): string[] {
  const t = topic.replace(/-/g, " ");
  return [
    `I Tried ${t} So You Don't Have To`,
    `The Truth About ${t} Nobody Talks About`,
    `7 ${t} No One Talks About`,
    `${t} in 10 Minutes: Full Guide`,
    `Stop Doing ${t} Wrong (Do This Instead)`,
    `The Secret to ${t}`,
    `How to ${t} in 2025`,
    `${t} for Beginners`,
    `What ${t} Experts Don't Tell You`,
    `5 ${t} That Actually Work`,
    `The Ultimate ${t} Guide`,
    `${t} That Get Views`,
    `Why ${t} Matters`,
    `${t} Explained`,
    `Best ${t} for Creators`,
    `${t} Tips That Work`,
    `How I Mastered ${t}`,
    `${t} Mistakes to Avoid`,
    `The ${t} Formula`,
    `${t} That Convert`
  ];
}

export function getHookExamples(topic: string): string[] {
  const t = topic.replace(/-/g, " ");
  return [
    `Stop scrolling if you want ${t}`,
    `You're doing ${t} wrong, here's why:`,
    `No one is talking about ${t}`,
    `If you ${t}, watch this`,
    `I tried ${t} so you don't have to`,
    `POV: ${t} without the struggle`,
    `Nobody tells you this about ${t}`,
    `The ${t} secret that changed everything`,
    `Stop scrolling if you ${t}`,
    `What happens when you ${t}`,
    `The truth about ${t}`,
    `Why ${t} matters`,
    `How to ${t} in 3 seconds`,
    `${t} that actually work`,
    `The ${t} hack nobody uses`,
    `If you ${t}, save this`,
    `POV: you finally get ${t}`,
    `The ${t} formula`,
    `Why your ${t} isn't working`,
    `The ${t} mistake everyone makes`
  ];
}

export function getBioExamples(topic: string): string[] {
  const t = topic.replace(/-/g, " ");
  return [
    `${t} creator | DM for collabs`,
    `Here for the ${t} vibes ✨`,
    `Making ${t} content that hits`,
    `${t} | Link in bio`,
    `Creator | ${t} | [value]`,
    `✨ ${t} content`,
    `${t} daily | Follow for more`,
    `Living for ${t} | Creator`,
    `${t} enthusiast | Collabs welcome`,
    `Here for ${t} | [niche]`
  ];
}

export function getExamples(
  contentType: string,
  topic: string
): string[] {
  switch (contentType) {
    case "captions":
      return getCaptionExamples(topic);
    case "hashtags":
      return getHashtagExamples(topic);
    case "titles":
      return getTitleExamples(topic);
    case "hooks":
      return getHookExamples(topic);
    case "bio":
      return getBioExamples(topic);
    default:
      return getCaptionExamples(topic);
  }
}
