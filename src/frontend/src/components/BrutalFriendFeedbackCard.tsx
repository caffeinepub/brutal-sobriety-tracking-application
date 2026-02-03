import { useGetLatestBrutalFriendFeedback } from '../hooks/useQueries';
import { Skull } from 'lucide-react';

export default function BrutalFriendFeedbackCard() {
  const { data: feedback, isLoading } = useGetLatestBrutalFriendFeedback();

  // Show loading state while fetching
  if (isLoading) {
    return (
      <div className="brutalist-card p-6 h-full flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-sm border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Show empty state if no feedback yet
  if (!feedback || feedback.trim() === '') {
    return (
      <div className="brutalist-card p-6 h-full">
        <div className="flex items-center gap-3 mb-4">
          <Skull className="w-6 h-6 text-primary" />
          <h3 className="text-sm font-black uppercase tracking-wider">
            YOUR BRUTALLY HONEST FRIEND
          </h3>
        </div>
        <p className="text-sm text-muted-foreground italic">
          Complete your first check-in to hear from your brutally honest friend.
        </p>
      </div>
    );
  }

  // Show feedback
  return (
    <div className="brutalist-card p-6 h-full">
      <div className="flex items-center gap-3 mb-4">
        <Skull className="w-6 h-6 text-primary" />
        <h3 className="text-sm font-black uppercase tracking-wider">
          YOUR BRUTALLY HONEST FRIEND
        </h3>
      </div>
      <p className="text-base leading-relaxed neon-glow-pink">
        {feedback}
      </p>
    </div>
  );
}
