type IconProps = { className?: string };

export function TikTokMark({ className }: IconProps) {
  return (
    <span className={`inline-flex ${className ?? ""}`} aria-hidden>
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
        <path d="M14 3c.2 1.8 1.3 3.3 3 4.1 1 .5 2 .8 3 .8v3c-2 0-3.9-.6-5.5-1.7V15a6 6 0 1 1-6-6c.5 0 1 .1 1.5.2v3.2a3 3 0 1 0 1.5 2.6V3h2.5Z" />
      </svg>
    </span>
  );
}

export function InstagramMark({ className }: IconProps) {
  return (
    <span className={`inline-flex ${className ?? ""}`} aria-hidden>
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
        <path d="M7.75 2C4.57 2 2 4.57 2 7.75v8.5C2 19.43 4.57 22 7.75 22h8.5A5.75 5.75 0 0 0 22 16.25v-8.5C22 4.57 19.43 2 16.25 2h-8.5Zm0 1.9h8.5A3.85 3.85 0 0 1 20.1 7.75v8.5a3.85 3.85 0 0 1-3.85 3.85h-8.5A3.85 3.85 0 0 1 3.9 16.25v-8.5A3.85 3.85 0 0 1 7.75 3.9Zm8.8 1.45a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 1.9A3.1 3.1 0 1 1 8.9 12 3.1 3.1 0 0 1 12 8.9Z" />
      </svg>
    </span>
  );
}

