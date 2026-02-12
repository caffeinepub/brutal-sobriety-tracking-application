/**
 * Session-scoped guards for Daily Check-In auto-open behavior
 * Ensures each dialog type auto-opens at most once per local day per browser session
 */

/**
 * Computes a local-day key based on the current date (YYYY-MM-DD format)
 */
export function getLocalDayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if the Daily Check-In dialog has already auto-opened today in this session
 */
export function hasDailyCheckInAutoOpenedToday(): boolean {
  const key = `brutal_daily_checkin_auto_opened_${getLocalDayKey()}`;
  return sessionStorage.getItem(key) === 'true';
}

/**
 * Marks the Daily Check-In dialog as having auto-opened today in this session
 */
export function markDailyCheckInAutoOpened(): void {
  const key = `brutal_daily_checkin_auto_opened_${getLocalDayKey()}`;
  sessionStorage.setItem(key, 'true');
}

/**
 * Clears the Daily Check-In auto-open guard (useful for testing or manual resets)
 */
export function clearDailyCheckInAutoOpenGuard(): void {
  const key = `brutal_daily_checkin_auto_opened_${getLocalDayKey()}`;
  sessionStorage.removeItem(key);
}
