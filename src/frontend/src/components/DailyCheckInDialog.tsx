import { useState, useEffect, useRef } from 'react';
import { useSubmitCheckIn, useCheckOnboardingAndCheckInStatus } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Mood } from '../backend';
import { Smile, Meh, Frown } from 'lucide-react';
import BrutalFriendDialog from './BrutalFriendDialog';
import { loadFeedbackMatrix, searchFeedbackMatrix } from '../lib/feedbackMatrixLoader';

export default function DailyCheckInDialog() {
  const [open, setOpen] = useState(false);
  const [showBrutalFriend, setShowBrutalFriend] = useState(false);
  const [sober, setSober] = useState<boolean | null>(null);
  const [drinks, setDrinks] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [brutalFriendMessage, setBrutalFriendMessage] = useState('');

  // Session-level guard to prevent duplicate openings
  const isDialogActiveRef = useRef(false);
  const hasTriggeredRef = useRef(false);

  const { identity } = useInternetIdentity();
  const submitCheckIn = useSubmitCheckIn();
  const { data: status } = useCheckOnboardingAndCheckInStatus();

  const isAuthenticated = !!identity;

  // Trigger popup based on backend status - only for first login of day
  useEffect(() => {
    if (!isAuthenticated || !status || showBrutalFriend) return;

    // Session-level guard: prevent duplicate openings
    if (isDialogActiveRef.current || hasTriggeredRef.current) return;

    // Only show daily check-in if:
    // 1. needsDailyCheckIn is true (no check-in today yet)
    // 2. isFirstLoginOfDay is true (this is the first login of the day)
    const shouldShowPopup = status.needsDailyCheckIn && status.isFirstLoginOfDay;

    console.log('Daily check-in logic:', {
      needsDailyCheckIn: status.needsDailyCheckIn,
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

  const handleSubmit = async () => {
    if (sober === null || mood === null) {
      toast.error('Answer all questions. No skipping.');
      return;
    }

    if (!sober) {
      const drinkCount = parseInt(drinks);
      if (!drinks || isNaN(drinkCount) || drinkCount < 1) {
        toast.error('How many drinks? Be honest.');
        return;
      }
    }

    const drinkCount = sober ? 0 : parseInt(drinks) || 0;

    // Close check-in dialog immediately
    setOpen(false);

    // Submit check-in
    try {
      const result = await submitCheckIn.mutateAsync({
        date: BigInt(Date.now()),
        sober,
        drinks: BigInt(drinkCount),
        mood,
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

    setSober(null);
    setDrinks('');
    setMood(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset session flag when dialog is closed manually
      isDialogActiveRef.current = false;
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
              DAILY CHECK-IN
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-wider">
              Time to face the truth. How did today go?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Sobriety Status */}
            <div className="space-y-3">
              <Label className="text-sm font-bold uppercase tracking-wider">Stay sober today?</Label>
              <RadioGroup
                value={sober === null ? '' : sober ? 'yes' : 'no'}
                onValueChange={(value) => {
                  setSober(value === 'yes');
                  if (value === 'yes') setDrinks('');
                }}
              >
                <div className="flex items-center space-x-2 p-3 border-2 border-border hover:border-primary cursor-pointer transition-all">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="flex-1 cursor-pointer font-bold uppercase text-xs tracking-wider">
                    YES
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border-2 border-border hover:border-destructive cursor-pointer transition-all">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="flex-1 cursor-pointer font-bold uppercase text-xs tracking-wider">
                    NO
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Drink Count */}
            {sober === false && (
              <div className="space-y-2">
                <Label htmlFor="drinks" className="text-sm font-bold uppercase tracking-wider">
                  How many? <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="drinks"
                  type="number"
                  min="1"
                  value={drinks}
                  onChange={(e) => setDrinks(e.target.value)}
                  placeholder="Enter number"
                  className="border-2 font-mono"
                  required
                />
              </div>
            )}

            {/* Mood */}
            <div className="space-y-3">
              <Label className="text-sm font-bold uppercase tracking-wider">How do you feel?</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMood(Mood.happy)}
                  className={`p-4 border-2 transition-all ${
                    mood === Mood.happy
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <Smile className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase">Happy</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMood(Mood.neutral)}
                  className={`p-4 border-2 transition-all ${
                    mood === Mood.neutral
                      ? 'border-secondary bg-secondary/10'
                      : 'border-border hover:border-secondary'
                  }`}
                >
                  <Meh className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase">Neutral</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMood(Mood.sad)}
                  className={`p-4 border-2 transition-all ${
                    mood === Mood.sad
                      ? 'border-muted-foreground bg-muted'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <Frown className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase">Sad</p>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleOpenChange(false)} 
              className="flex-1 font-bold uppercase tracking-wider border-2"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitCheckIn.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 font-bold uppercase tracking-wider border-2 border-primary"
            >
              {submitCheckIn.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-sm border-4 border-white border-t-transparent"></div>
                  SENDING...
                </>
              ) : (
                'SUBMIT'
              )}
            </Button>
          </div>
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
