import { useState } from 'react';
import { useGetMotivationMessage, useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { toast } from 'sonner';
import BrutalFriendDialog from './BrutalFriendDialog';
import { loadFeedbackMatrix, searchFeedbackMatrix } from '../lib/feedbackMatrixLoader';

export default function MotivationButton() {
  const [showDialog, setShowDialog] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState('');
  const getMotivationMessage = useGetMotivationMessage();
  const { data: userProfile } = useGetCallerUserProfile();

  const handleClick = async () => {
    try {
      // First, try to get message from backend (which tracks click limits)
      const result = await getMotivationMessage.mutateAsync();
      
      if (result.isLimitReached) {
        toast.error(result.message);
        return;
      }

      // If backend returns a message, use it
      if (result.message && result.message.trim() !== '') {
        setMotivationMessage(result.message);
        setShowDialog(true);
        return;
      }

      // Fallback: Load from feedbackMatrix.json if backend message is empty
      if (userProfile) {
        const matrix = await loadFeedbackMatrix();
        const fallbackMessage = searchFeedbackMatrix(matrix, {
          ageRange: userProfile.onboardingAnswers.ageRange,
          motivation: userProfile.onboardingAnswers.motivation,
          baselineTier: userProfile.onboardingAnswers.baselineTier,
          secondarySubstance: userProfile.onboardingAnswers.secondarySubstance,
        });
        
        setMotivationMessage(fallbackMessage);
        setShowDialog(true);
      } else {
        toast.error('Unable to load motivation message');
      }
    } catch (error) {
      console.error('Failed to get motivation message:', error);
      
      // Final fallback: Try to load from matrix without backend
      if (userProfile) {
        try {
          const matrix = await loadFeedbackMatrix();
          const fallbackMessage = searchFeedbackMatrix(matrix, {
            ageRange: userProfile.onboardingAnswers.ageRange,
            motivation: userProfile.onboardingAnswers.motivation,
            baselineTier: userProfile.onboardingAnswers.baselineTier,
            secondarySubstance: userProfile.onboardingAnswers.secondarySubstance,
          });
          
          setMotivationMessage(fallbackMessage);
          setShowDialog(true);
        } catch (matrixError) {
          console.error('Failed to load from matrix:', matrixError);
          toast.error('Failed to load motivation. Try again.');
        }
      } else {
        toast.error('Failed to load motivation. Try again.');
      }
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={getMotivationMessage.isPending}
        className="w-full sm:w-auto px-8 py-6 bg-secondary hover:bg-secondary/90 font-bold uppercase tracking-wider border-2 border-secondary text-sm neon-glow-blue"
      >
        {getMotivationMessage.isPending ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-sm border-4 border-white border-t-transparent"></div>
            LOADING...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-5 w-5" />
            Need Motivation?
          </>
        )}
      </Button>

      <BrutalFriendDialog 
        open={showDialog} 
        onOpenChange={setShowDialog}
        message={motivationMessage}
      />
    </>
  );
}

