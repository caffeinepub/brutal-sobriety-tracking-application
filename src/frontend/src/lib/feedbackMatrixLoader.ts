import type { FeedbackMatrixEntry, MotivationLens, DrinkingBaseline } from '../backend';

let cachedMatrix: FeedbackMatrixEntry[] = [];

export async function loadFeedbackMatrix(): Promise<FeedbackMatrixEntry[]> {
  if (cachedMatrix.length > 0) {
    return cachedMatrix;
  }

  try {
    const response = await fetch('/feedbackMatrix.json');
    if (!response.ok) {
      throw new Error('Failed to load feedback matrix');
    }
    const data = await response.json();
    
    // Transform JSON data to match backend types
    cachedMatrix = data.map((entry: any) => ({
      ageRange: entry.ageRange,
      motivation: entry.motivation as MotivationLens,
      baselineTier: entry.baselineTier as DrinkingBaseline,
      secondarySubstance: entry.secondarySubstance || undefined,
      streakRatio: entry.streakRatio || undefined,
      isWeekend: entry.isWeekend !== null ? entry.isWeekend : undefined,
      daysUntilFullMoon: entry.daysUntilFullMoon !== null ? BigInt(entry.daysUntilFullMoon) : undefined,
      chanceOfDrinkingTomorrow: entry.chanceOfDrinkingTomorrow || undefined,
      message: entry.message,
    }));
    
    return cachedMatrix;
  } catch (error) {
    console.error('Failed to load feedback matrix:', error);
    return [];
  }
}

export function searchFeedbackMatrix(
  matrix: FeedbackMatrixEntry[],
  userState: {
    ageRange: string;
    motivation: MotivationLens;
    baselineTier: DrinkingBaseline;
    secondarySubstance?: string;
  }
): string {
  // Find all matching entries
  const matches = matrix.filter(entry => {
    const ageMatches = entry.ageRange === userState.ageRange || entry.ageRange === 'any';
    const motivationMatches = entry.motivation === userState.motivation;
    const baselineMatches = entry.baselineTier === userState.baselineTier;
    
    const substanceMatches = 
      !entry.secondarySubstance || 
      entry.secondarySubstance === 'any' ||
      entry.secondarySubstance === userState.secondarySubstance;

    return ageMatches && motivationMatches && baselineMatches && substanceMatches;
  });

  // Prioritize exact age matches over "any"
  const exactAgeMatches = matches.filter(m => m.ageRange === userState.ageRange);
  const finalMatches = exactAgeMatches.length > 0 ? exactAgeMatches : matches;

  // Randomly select one if multiple matches
  if (finalMatches.length > 0) {
    const randomIndex = Math.floor(Math.random() * finalMatches.length);
    return finalMatches[randomIndex].message;
  }

  // Fallback message
  return "Keep going. One day at a time.";
}
