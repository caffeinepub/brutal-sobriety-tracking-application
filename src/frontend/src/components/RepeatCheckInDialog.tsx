import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';

interface RepeatCheckInDialogProps {
  open: boolean;
  onClose: () => void;
  onStillSober: () => void;
  onDrank: (drinks: number) => Promise<void>;
  isSubmitting: boolean;
}

export default function RepeatCheckInDialog({
  open,
  onClose,
  onStillSober,
  onDrank,
  isSubmitting,
}: RepeatCheckInDialogProps) {
  const [step, setStep] = useState<'question' | 'drinks'>('question');
  const [drinks, setDrinks] = useState('');

  const handleYesStillSober = () => {
    onStillSober();
    // Reset state
    setStep('question');
    setDrinks('');
  };

  const handleNoDrank = () => {
    setStep('drinks');
  };

  const handleSubmitDrinks = async () => {
    const drinksNum = parseInt(drinks, 10);
    
    if (isNaN(drinksNum) || drinksNum < 0) {
      toast.error('Enter a valid number of drinks (0 or more).');
      return;
    }

    await onDrank(drinksNum);
    
    // Reset state
    setStep('question');
    setDrinks('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('question');
      setDrinks('');
      onClose();
    }
  };

  const handleBack = () => {
    setStep('question');
    setDrinks('');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover border-2 border-border z-[100]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight neon-glow-pink">
            BACK SO SOON?
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-wider">
            You already checked in today.
          </DialogDescription>
        </DialogHeader>

        {step === 'question' ? (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <p className="text-lg font-bold uppercase tracking-wider mb-6">
                Are you still sober?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleYesStillSober}
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 font-bold uppercase tracking-wider border-2 border-primary h-14 text-base"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Yes, Still Sober
              </Button>
              <Button
                onClick={handleNoDrank}
                disabled={isSubmitting}
                variant="outline"
                className="w-full font-bold uppercase tracking-wider border-2 h-14 text-base"
              >
                <XCircle className="w-5 h-5 mr-2" />
                No, I Drank
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="drinks" className="text-sm font-bold uppercase tracking-wider">
                How many drinks?
              </Label>
              <Input
                id="drinks"
                type="number"
                min="0"
                value={drinks}
                onChange={(e) => setDrinks(e.target.value)}
                placeholder="Enter number of drinks"
                className="border-2 font-mono text-lg"
                disabled={isSubmitting}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Enter the number of drinks you had.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 font-bold uppercase tracking-wider border-2"
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmitDrinks}
                disabled={isSubmitting || !drinks}
                className="flex-1 bg-primary hover:bg-primary/90 font-bold uppercase tracking-wider border-2 border-primary"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-sm border-4 border-white border-t-transparent"></div>
                    SENDING...
                  </>
                ) : (
                  'SUBMIT'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
