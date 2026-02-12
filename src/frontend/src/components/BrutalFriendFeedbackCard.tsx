import { useGetLatestBrutalFriendFeedback, useGetProgressMetrics, useGetCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useEffect, useRef } from 'react';
import { trackEvent, getFeedbackDedupeKey } from '../utils/usergeek';
import { parseSobrietyDurationToDays } from '../utils/sobrietyDuration';

export default function BrutalFriendFeedbackCard() {
  const { identity } = useInternetIdentity();
  const { data: feedback, isLoading, error } = useGetLatestBrutalFriendFeedback();
  const { data: progressMetrics } = useGetProgressMetrics();
  const { data: userProfile } = useGetCallerUserProfile();

  const lastTrackedFeedbackRef = useRef<string | null>(null);

  // Track feedback shown event
  useEffect(() => {
    if (!feedback || typeof feedback !== 'string' || !feedback.trim()) return;
    if (lastTrackedFeedbackRef.current === feedback) return;

    // Generate a stable feedback ID (hash of the message)
    const feedbackId = btoa(feedback).substring(0, 16);
    const dedupeKey = getFeedbackDedupeKey(feedbackId);

    // Get mood and streak ratio if available
    const last14Days = progressMetrics?.last14Days || [];
    const latestEntry = last14Days.length > 0 ? last14Days[last14Days.length - 1] : null;
    const mood = latestEntry?.mood ? (latestEntry.mood as any).__kind__ : undefined;

    const currentStreak = progressMetrics?.currentStreak ? Number(progressMetrics.currentStreak) : undefined;
    const sobrietyGoal = userProfile?.onboardingAnswers?.sobrietyDuration;
    const streakTarget = sobrietyGoal ? parseSobrietyDurationToDays(sobrietyGoal) : undefined;
    const streakRatio = currentStreak !== undefined && streakTarget && streakTarget > 0
      ? Math.round((currentStreak / streakTarget) * 100) / 100
      : undefined;

    trackEvent('BrutalFriend Feedback Shown', {
      feedbackId,
      mood,
      streakRatio,
    }, dedupeKey);

    lastTrackedFeedbackRef.current = feedback;
  }, [feedback, progressMetrics, userProfile]);

  if (isLoading) {
    return (
      <div className="brutal-card border-2 border-border p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-sm border-4 border-primary border-t-transparent mx-auto mb-2"></div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Loading feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="brutal-card border-2 border-border p-6 h-full flex items-center justify-center">
        <p className="text-sm text-destructive uppercase tracking-wider">Failed to load feedback</p>
      </div>
    );
  }

  // Safely handle feedback - ensure it's a string and provide fallback
  const displayFeedback = (() => {
    if (!feedback || typeof feedback !== 'string') {
      return 'No feedback yet. Complete your first check-in!';
    }
    try {
      const cleaned = feedback.trim();
      return cleaned || 'No feedback yet. Complete your first check-in!';
    } catch (error) {
      console.error('Error processing feedback:', error);
      return 'No feedback yet. Complete your first check-in!';
    }
  })();

  return (
    <div className="brutal-card border-2 border-border p-6 h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <p className="text-lg font-bold text-center neon-glow-pink uppercase tracking-wide leading-relaxed">
          {displayFeedback}
        </p>
      </div>
    </div>
  );
}
