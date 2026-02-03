import { useState, useEffect, useRef } from 'react';
import { useSubmitFollowUpCheckIn, useCheckOnboardingAndCheckInStatus } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import BrutalFriendDialog from './BrutalFriendDialog';
import { loadFeedbackMatrix, searchFeedbackMatrix } from '../lib/feedbackMatrixLoader';

export default function FollowUpCheckInDialog() {
  const [open, setOpen] = useState(false);
  const [showBrutalFriend, setShowBrutalFriend] = useState(false);
  const [hadMoreDrinks, setHadMoreDrinks] = useState<boolean | null>(null);
  const [drinks, setDrinks] = useState('');
  const [brutalFriendMessage, setBrutalFriendMessage] = useState('');

  // Session-level guard to prevent duplicate openings
  const isDialogActiveRef = useRef(false);
  const hasTriggeredRef = useRef(false);

  const { identity } = useInternetIdentity();
  const submitFollowUpCheckIn = useSubmitFollowUpCheckIn();
  const { data: status } = useCheckOnboardingAndCheckInStatus();

  const isAuthenticated = !!identity;

  // Trigger popup based on backend status - for subsequent logins of the same day
  useEffect(() => {
    if (!isAuthenticated || !status || showBrutalFriend) return;

    // Session-level guard: prevent duplicate openings
    if (isDialogActiveRef.current || hasTriggeredRef.current) return;

    // Show follow-up popup only if:
    // 1. needsFollowUp is true (user has completed onboarding)
    // 2. isFirstLoginOfDay is false (this is NOT the first login of the day)
    const shouldShowPopup = status.needsFollowUp && !status.isFirstLoginOfDay;

    console.log('Follow-up check logic:', {
      needsFollowUp: status.needsFollowUp,
      isFirstLoginOfDay: status.isFirstLoginOfDay,
      shouldShowPopup,
    });

    if (shouldShowPopup) {
      // Mark dialog as triggered to prevent duplicate triggers
      hasTriggeredRef.current = true;
      
      // Trigger popup with 800ms delay
      const timer = setTimeout(() => {
        if (!isDialogActiveRef.current) {
          isDialogActiveRef.current = true;
          setOpen(true);
        }
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, status, showBrutalFriend]);

  const handleRemainedSober = async () => {
    // Close follow-up dialog immediately
    setOpen(false);

    // Generate feedback message for "remained sober"
    try {
      // Generate message from feedback matrix
      console.log('Generating feedback for remained sober...');
      const matrix = await loadFeedbackMatrix();
      const userState = {
        ageRange: 'any',
        motivation: 'family' as any,
        baselineTier: 'medium' as any,
        secondarySubstance: undefined,
      };
      const matrixMessage = searchFeedbackMatrix(matrix, userState);
      setBrutalFriendMessage(matrixMessage);

      // Show BrutalFriendDialog immediately
      setShowBrutalFriend(true);
    } catch (error) {
      console.error('Failed to generate feedback:', error);
      // Use fallback message
      setBrutalFriendMessage("Good. Staying consistent.");
      setShowBrutalFriend(true);
    }
  };

  const handleHadMoreDrinks = () => {
    setHadMoreDrinks(true);
  };

  const handleSubmitMoreDrinks = async () => {
    const drinkCount = parseInt(drinks);
    if (!drinks || isNaN(drinkCount) || drinkCount < 1) {
      toast.error('How many drinks? Be honest.');
      return;
    }

    // Close follow-up dialog immediately
    setOpen(false);

    // Submit follow-up check-in
    try {
      const result = await submitFollowUpCheckIn.mutateAsync({
        drinks: BigInt(drinkCount),
      });
      
      // Use backend message if available, otherwise generate from matrix
      if (result.message && result.message.trim() !== '') {
        setBrutalFriendMessage(result.message);
      } else {
        // Fallback: generate message from feedback matrix
        console.log('Backend message empty, generating from matrix...');
        const matrix = await loadFeedbackMatrix();
        const userState = {
          ageRange: 'any',
          motivation: 'family' as any,
          baselineTier: 'medium' as any,
          secondarySubstance: undefined,
        };
        const matrixMessage = searchFeedbackMatrix(matrix, userState);
        setBrutalFriendMessage(matrixMessage);
      }

      // Show BrutalFriendDialog immediately after submission
      setShowBrutalFriend(true);
    } catch (error) {
      toast.error('Submission failed. Try again.');
      console.error(error);
      // Reset dialog active flag on error
      isDialogActiveRef.current = false;
    }

    setHadMoreDrinks(null);
    setDrinks('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset session flag when dialog is closed manually
      isDialogActiveRef.current = false;
      setHadMoreDrinks(null);
      setDrinks('');
    }
  };

  const handleBrutalFriendClose = () => {
    setShowBrutalFriend(false);
    setBrutalFriendMessage('');
    // Reset dialog active flag after complete flow
    isDialogActiveRef.current = false;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md bg-popover border-2 border-border z-[100]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight neon-glow-pink">
              BACK SO SOON?
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-wider">
              Quick check-in. How's it going?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {hadMoreDrinks === null ? (
              <>
                {/* Initial Question */}
                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-wider">
                    Since your last check-in:
                  </Label>
                  <div className="space-y-3">
                    <Button
                      onClick={handleRemainedSober}
                      variant="outline"
                      className="w-full justify-start border-2 border-border hover:border-primary font-bold uppercase tracking-wider text-left h-auto py-4"
                    >
                      <div>
                        <div className="text-sm">REMAINED SOBER</div>
                        <div className="text-xs text-muted-foreground normal-case font-normal mt-1">
                          Still clean since last check-in
                        </div>
                      </div>
                    </Button>
                    <Button
                      onClick={handleHadMoreDrinks}
                      variant="outline"
                      className="w-full justify-start border-2 border-border hover:border-destructive font-bold uppercase tracking-wider text-left h-auto py-4"
                    >
                      <div>
                        <div className="text-sm">HAD MORE DRINKS</div>
                        <div className="text-xs text-muted-foreground normal-case font-normal mt-1">
                          Need to update today's count
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Drink Count Input */}
                <div className="space-y-2">
                  <Label htmlFor="followup-drinks" className="text-sm font-bold uppercase tracking-wider">
                    How many more? <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="followup-drinks"
                    type="number"
                    min="1"
                    value={drinks}
                    onChange={(e) => setDrinks(e.target.value)}
                    placeholder="Enter number"
                    className="border-2 font-mono"
                    autoFocus
                    required
                  />
                  <p className="text-xs text-muted-foreground font-mono">
                    &gt; Will be added to today's total
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setHadMoreDrinks(null);
                      setDrinks('');
                    }}
                    className="flex-1 font-bold uppercase tracking-wider border-2"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmitMoreDrinks}
                    disabled={submitFollowUpCheckIn.isPending}
                    className="flex-1 bg-primary hover:bg-primary/90 font-bold uppercase tracking-wider border-2 border-primary"
                  >
                    {submitFollowUpCheckIn.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-sm border-4 border-white border-t-transparent"></div>
                        SENDING...
                      </>
                    ) : (
                      'SUBMIT'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>

          {hadMoreDrinks === null && (
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleOpenChange(false)} 
                className="flex-1 font-bold uppercase tracking-wider border-2"
              >
                Skip
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Brutal Friend Dialog - displays message from backend or matrix fallback */}
      <BrutalFriendDialog 
        open={showBrutalFriend} 
        onOpenChange={handleBrutalFriendClose}
        message={brutalFriendMessage}
      />
    </>
  );
}
