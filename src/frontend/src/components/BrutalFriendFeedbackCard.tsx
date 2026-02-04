import { useGetLatestBrutalFriendFeedback } from '../hooks/useQueries';

export default function BrutalFriendFeedbackCard() {
  const { data: feedback, isLoading, error } = useGetLatestBrutalFriendFeedback();

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
