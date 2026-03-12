export default function Head() {
  const title = "TikTok Caption Generator | ToolEagle";
  const description =
    "Generate scroll-stopping TikTok captions from a simple video idea, complete with emojis and hashtags.";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
    </>
  );
}

