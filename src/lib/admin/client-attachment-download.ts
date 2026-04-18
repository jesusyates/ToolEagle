/**
 * Client-only helpers for attachment downloads (parse Content-Disposition, trigger save).
 * Safe to import from "use client" components (no Node APIs).
 */

export function parseContentDispositionFilename(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const star = header.match(/filename\*\s*=\s*UTF-8''([^;\n]+)/i);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1]!.trim()) || fallback;
    } catch {
      /* ignore */
    }
  }
  const quoted = header.match(/filename\s*=\s*"([^"]+)"/i);
  if (quoted?.[1]) return quoted[1]!.trim() || fallback;
  const plain = header.match(/filename\s*=\s*([^;\n]+)/i);
  if (plain?.[1]) return plain[1]!.trim().replace(/^["']|["']$/g, "") || fallback;
  return fallback;
}

export function triggerAttachmentDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
