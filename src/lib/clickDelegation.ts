/**
 * Click delegation for browser-translated pages.
 * When Chrome/Translate modifies the DOM, React's event handlers can break.
 * We use document-level capture-phase delegation so clicks work regardless of DOM changes.
 */

const registry = new Map<string, (e: MouseEvent) => void>();
let initialized = false;

function handleDocumentClick(e: MouseEvent) {
  const el = (e.target as Element)?.closest?.("[data-delegate-click]");
  if (!el) return;
  const id = el.getAttribute("data-delegate-id");
  if (!id) return;
  const btn = el as HTMLButtonElement;
  if (btn.disabled) return;
  const handler = registry.get(id);
  if (handler) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    handler(e);
  }
}

export function initClickDelegation() {
  if (typeof document === "undefined" || initialized) return;
  initialized = true;
  document.addEventListener("click", handleDocumentClick, true);
}

export function registerClickHandler(id: string, handler: (e: MouseEvent) => void) {
  registry.set(id, handler);
}

export function unregisterClickHandler(id: string) {
  registry.delete(id);
}
