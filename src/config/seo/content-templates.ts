/**
 * SEO Engine v2 - Content templates
 * 1 template + topic replacement = many pages
 */
import { getBaseTopic } from "./intents";

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

export function getSeoFaq(
  platformLabel: string,
  typeLabel: string,
  topicLabel: string
): { question: string; answer: string }[] {
  const typeLower = typeLabel.toLowerCase();
  return [
    {
      question: `What is a good ${platformLabel} ${typeLower}?`,
      answer: `A good ${platformLabel} ${typeLower} is short, engaging, and matches your content. ${topicLabel} ${typeLower} work best when they feel authentic and add value—whether that's humor, curiosity, or a clear call to action. Use our AI generator to create multiple options and pick the one that fits your voice.`
    },
    {
      question: `How long should a ${platformLabel} ${typeLower} be?`,
      answer: `For ${platformLabel}, keep ${typeLower} under 150 characters for best visibility. Shorter ${typeLower} (under 100 characters) often perform better because they're easier to read and don't get cut off. Our generator creates options in different lengths so you can choose what works.`
    },
    {
      question: `Do ${typeLower} affect ${platformLabel} views?`,
      answer: `Yes. Strong ${typeLower} can improve engagement, which signals to the algorithm to show your content to more people. ${topicLabel} ${typeLower} that spark curiosity or invite comments tend to get more views. Try our free AI tool to generate ${typeLower} optimized for engagement.`
    }
  ];
}

export function getExamples(
  contentType: string,
  topic: string
): string[] {
  const baseTopic = getBaseTopic(topic);
  switch (contentType) {
    case "captions":
      return getCaptionExamples(baseTopic);
    case "hashtags":
      return getHashtagExamples(baseTopic);
    case "titles":
      return getTitleExamples(baseTopic);
    case "hooks":
      return getHookExamples(baseTopic);
    case "bio":
      return getBioExamples(baseTopic);
    default:
      return getCaptionExamples(baseTopic);
  }
}
