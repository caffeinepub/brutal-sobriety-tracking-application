/**
 * Converts sobriety duration text from onboarding into a numeric day count.
 * Handles various text formats like "2 days", "1 week", "1 month", etc.
 * Returns 30 as a fallback when input is missing or cannot be parsed.
 */
export function parseSobrietyDurationToDays(duration: string | undefined): number {
  if (!duration) {
    return 30; // Default fallback
  }

  const normalized = duration.toLowerCase().trim();

  // Direct day matches
  if (normalized.includes('2 days') || normalized === '2') {
    return 2;
  }
  if (normalized.includes('5 days') || normalized === '5') {
    return 5;
  }

  // Week matches
  if (normalized.includes('1 week') || normalized === '7 days') {
    return 7;
  }
  if (normalized.includes('2 weeks') || normalized === '14 days') {
    return 14;
  }

  // Month matches
  if (normalized.includes('1 month') || normalized.includes('30 days')) {
    return 30;
  }

  // Try to extract a number from the string
  const numberMatch = normalized.match(/(\d+)/);
  if (numberMatch) {
    const num = parseInt(numberMatch[1], 10);
    if (!isNaN(num) && num > 0 && num <= 365) {
      return num;
    }
  }

  // Fallback to 30 if we can't parse
  return 30;
}
