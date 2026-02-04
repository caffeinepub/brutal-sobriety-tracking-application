import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface FollowUpCheckInDialogProps {
  open: boolean;
  onClose: () => void;
  onRemainedSober: () => void;
  onHadMoreDrinks: (drinks: number) => Promise<void>;
  isSubmitting: boolean;
}

export default function FollowUpCheckInDialog({
  open,
  onClose,
  onRemainedSober,
  onHadMoreDrinks,
  isSubmitting,
}: FollowUpCheckInDialogProps) {
  const [hadMoreDrinks, setHadMoreDrinks] = useState<boolean | null>(null);
  const [drinks, setDrinks] = useState('');

  const handleRemainedSober = () => {
    onRemainedSober();
    setHadMoreDrinks(null);
    setDrinks('');
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

    await onHadMoreDrinks(drinkCount);

    setHadMoreDrinks(null);
    setDrinks('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setHadMoreDrinks(null);
      setDrinks('');
      onClose();
    }
  };

  return (
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmitMoreDrinks}
                  disabled={isSubmitting}
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
            </>
          )}
        </div>

        {hadMoreDrinks === null && (
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleOpenChange(false)} 
              className="flex-1 font-bold uppercase tracking-wider border-2"
              disabled={isSubmitting}
            >
              Skip
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
