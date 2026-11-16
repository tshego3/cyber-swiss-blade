const DAY_MS = 86_400_000;

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromIsoDate(isoDate: string): Date {
  const [year = 1970, month = 1, day = 1] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(isoDate: string, days: number): string {
  const date = fromIsoDate(isoDate);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function startOfWeek(isoDate: string): string {
  const mondayOffset = (fromIsoDate(isoDate).getDay() + 6) % 7;
  return addDays(isoDate, -mondayOffset);
}

export function formatDate(isoDate: string, style: 'short' | 'long' = 'short'): string {
  const options: Intl.DateTimeFormatOptions =
    style === 'short' ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat(undefined, options).format(fromIsoDate(isoDate));
}

export function relativeTime(isoTimestamp: string, now = Date.now()): string {
  const seconds = Math.round((now - Date.parse(isoTimestamp)) / 1000);
  if (seconds < 45) return 'just now';
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < DAY_MS / 1000) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / (DAY_MS / 1000))}d ago`;
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}
