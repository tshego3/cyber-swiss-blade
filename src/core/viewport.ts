const TOUCH_ONLY = '(hover: none) and (pointer: coarse)';

export function lockMobileZoom(): void {
  if (!window.matchMedia(TOUCH_ONLY).matches) return;
  const block = (event: Event): void => event.preventDefault();
  document.addEventListener('gesturestart', block, { passive: false });
  document.addEventListener('gesturechange', block, { passive: false });
}
