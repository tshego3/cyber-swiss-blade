import type { ThemePreference } from './types';

const STORAGE_KEY = 'csb-theme';
const listeners = new Set<(preference: ThemePreference) => void>();

export function onThemeChange(listener: (preference: ThemePreference) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function setThemePreference(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === 'system') delete root.dataset.theme;
  else root.dataset.theme = preference;
  try {
    if (preference === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    console.warn('Theme preference was applied but could not be stored.');
  }
  for (const listener of listeners) listener(preference);
}

export function nextThemePreference(preference: ThemePreference): ThemePreference {
  const order: readonly ThemePreference[] = ['system', 'light', 'dark'];
  return order[(order.indexOf(preference) + 1) % order.length] ?? 'system';
}
