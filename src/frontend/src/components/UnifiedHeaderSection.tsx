import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Zap } from 'lucide-react';
import { useGetLatestBrutalFriendFeedback, useGetMotivationMessage } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import BrutalFriendDialog from './BrutalFriendDialog';

export default function UnifiedHeaderSection() {
  const { data: feedback, isLoading, isError } = useGetLatestBrutalFriendFeedback();
  const [showDialog, setShowDialog] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState('');
  const [remainingClicks, setRemainingClicks] = useState(3);
  const [isLimitReached, setIsLimitReached] = useState(false);
  
  const { mutate: getMotivation, isPending } = useGetMotivationMessage();

  const handleMotivationClick = () => {
    getMotivation(undefined, {
      onSuccess: (data) => {
        setMotivationMessage(data.message);
        setRemainingClicks(Number(data.remainingClicks));
        setIsLimitReached(data.isLimitReached);
        setShowDialog(true);
      },
      onError: (error) => {
        console.error('Failed to get motivation:', error);
      },
    });
  };

  // Safely handle feedback - ensure it's a string before calling string methods
  const cleanFeedback = (() => {
    if (!feedback || typeof feedback !== 'string') {
      return '';
    }
    try {
      return feedback
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');
    } catch (error) {
      console.error('Error cleaning feedback:', error);
      return '';
    }
  })();

  return (
    <>
      <Card className="border-2 border-primary bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Brutal Friend Feedback - Takes 2 columns on large screens */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider neon-glow-pink">
                  YOUR BRUTALLY HONEST FRIEND
                </h3>
              </div>
              
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                </div>
              ) : isError ? (
                <p className="text-sm text-destructive uppercase tracking-wider font-mono">
                  &gt; Failed to load feedback. Try refreshing.
                </p>
              ) : !cleanFeedback || cleanFeedback === '' ? (
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-mono">
                  &gt; Complete a check-in to receive feedback
                </p>
              ) : (
                <p className="text-sm sm:text-base font-bold leading-relaxed neon-glow-pink">
                  {cleanFeedback}
                </p>
              )}
            </div>

            {/* Motivation Button - Takes 1 column on large screens */}
            <div className="flex flex-col justify-center space-y-2">
              <Button
                onClick={handleMotivationClick}
                disabled={isPending || isLimitReached}
                className="w-full bg-primary hover:bg-primary/90 font-bold uppercase tracking-wider border-2 border-primary text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed neon-glow-pink py-4 sm:py-6"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {isPending ? 'Loading...' : isLimitReached ? 'Limit Reached' : 'Need Motivation?'}
              </Button>
              
              {!isLimitReached && remainingClicks < 3 && (
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono text-center">
                  &gt; {remainingClicks} {remainingClicks === 1 ? 'click' : 'clicks'} remaining today
                </p>
              )}
              
              {isLimitReached && (
                <p className="text-xs text-primary uppercase tracking-wider font-mono text-center neon-glow-pink">
                  &gt; Come back tomorrow
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <BrutalFriendDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        message={motivationMessage}
      />
    </>
  );
}
