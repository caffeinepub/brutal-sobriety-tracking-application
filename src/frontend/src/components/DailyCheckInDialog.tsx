import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Mood } from '../backend';
import { Smile, Meh, Frown } from 'lucide-react';

interface DailyCheckInDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { sober: boolean; drinks: number; mood: Mood }) => Promise<void>;
  isSubmitting: boolean;
}

export default function DailyCheckInDialog({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: DailyCheckInDialogProps) {
  const [sober, setSober] = useState<boolean | null>(null);
  const [drinks, setDrinks] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);

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

    await onSubmit({ sober, drinks: drinkCount, mood });

    // Reset form
    setSober(null);
    setDrinks('');
    setMood(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSober(null);
      setDrinks('');
      setMood(null);
      onClose();
    }
  };

  return (
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
            disabled={isSubmitting}
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
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
      </DialogContent>
    </Dialog>
  );
}
