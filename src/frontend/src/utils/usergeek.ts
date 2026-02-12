// UserGeek analytics wrapper with deduplication and safety checks

// Check if UserGeek snippet is available
function isUserGeekAvailable(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).UserGeek !== 'undefined';
}

// Session-based deduplication store
const sessionDedupeStore = new Map<string, boolean>();

// Per-view tracking for page views
let lastTrackedView: string | null = null;

/**
 * Clean properties: remove undefined/null values
 */
function cleanPropertiesHelper(properties: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Identify a user in UserGeek with profile properties
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (!isUserGeekAvailable()) {
    console.warn('UserGeek not available for identify call');
    return;
  }

  try {
    const cleanProperties = properties ? cleanPropertiesHelper(properties) : {};
    (window as any).UserGeek('identify', userId, cleanProperties);
    console.log('UserGeek identify:', userId, cleanProperties);
  } catch (error) {
    console.error('UserGeek identify error:', error);
  }
}

/**
 * Track a custom event with properties
 */
export function trackEvent(eventName: string, properties?: Record<string, any>, dedupeKey?: string) {
  if (!isUserGeekAvailable()) {
    console.warn('UserGeek not available for track call');
    return;
  }

  // Check dedupe
  if (dedupeKey && sessionDedupeStore.has(dedupeKey)) {
    console.log('UserGeek event deduplicated:', eventName, dedupeKey);
    return;
  }

  try {
    const cleanProps = properties ? cleanPropertiesHelper(properties) : {};
    (window as any).UserGeek('track', eventName, cleanProps);
    console.log('UserGeek track:', eventName, cleanProps);

    // Mark as tracked
    if (dedupeKey) {
      sessionDedupeStore.set(dedupeKey, true);
    }
  } catch (error) {
    console.error('UserGeek track error:', error);
  }
}

/**
 * Track a page view
 */
export function trackPageView(pageName: string, path: string) {
  if (!isUserGeekAvailable()) {
    console.warn('UserGeek not available for page call');
    return;
  }

  // Dedupe: only track if different from last view
  if (lastTrackedView === pageName) {
    console.log('UserGeek page view deduplicated:', pageName);
    return;
  }

  try {
    (window as any).UserGeek('page', pageName, { path });
    console.log('UserGeek page:', pageName, path);
    lastTrackedView = pageName;
  } catch (error) {
    console.error('UserGeek page error:', error);
  }
}

/**
 * Generate a stable dedupe key for initial sync
 */
export function getInitialSyncDedupeKey(userId: string): string {
  return `initial-sync-${userId}`;
}

/**
 * Generate a dedupe key for onboarding completion
 */
export function getOnboardingDedupeKey(userId: string): string {
  return `onboarding-completed-${userId}`;
}

/**
 * Generate a dedupe key for check-in submission
 */
export function getCheckInDedupeKey(userId: string, timestamp: number): string {
  return `check-in-${userId}-${timestamp}`;
}

/**
 * Generate a dedupe key for feedback shown
 */
export function getFeedbackDedupeKey(feedbackId: string): string {
  return `feedback-${feedbackId}`;
}

/**
 * Generate a dedupe key for motivation click
 */
export function getMotivationClickDedupeKey(userId: string, timestamp: number): string {
  return `motivation-${userId}-${timestamp}`;
}

/**
 * Reset page view tracking (useful for testing or navigation resets)
 */
export function resetPageViewTracking() {
  lastTrackedView = null;
}
