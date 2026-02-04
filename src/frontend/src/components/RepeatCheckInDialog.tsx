import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RepeatCheckInReason } from '../backend';
import { RefreshCw, Zap, Coffee, Repeat, Eye } from 'lucide-react';

interface RepeatCheckInDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: RepeatCheckInReason) => Promise<void>;
  isSubmitting: boolean;
}

const REASONS = [
  {
    value: RepeatCheckInReason.reflection,
    label: 'Reflection',
    description: 'Checking in on my progress',
    icon: RefreshCw,
  },
  {
    value: RepeatCheckInReason.urge,
    label: 'Urge',
    description: 'Feeling tempted to drink',
    icon: Zap,
  },
  {
    value: RepeatCheckInReason.bored,
    label: 'Boredom',
    description: 'Nothing better to do',
    icon: Coffee,
  },
  {
    value: RepeatCheckInReason.habit,
    label: 'Habit',
    description: 'Just checking in as usual',
    icon: Repeat,
  },
  {
    value: RepeatCheckInReason.curiosity,
    label: 'Curiosity',
    description: 'Wondering about my stats',
    icon: Eye,
  },
];

export default function RepeatCheckInDialog({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: RepeatCheckInDialogProps) {
  const [selectedReason, setSelectedReason] = useState<RepeatCheckInReason | null>(null);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Pick a reason. No skipping.');
      return;
    }

    await onSubmit(selectedReason);
    setSelectedReason(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedReason(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover border-2 border-border z-[100]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight neon-glow-pink">
            WHY ARE YOU BACK SO SOON?
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-wider">
            You already checked in today. What brings you back?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Label className="text-sm font-bold uppercase tracking-wider">Select a reason:</Label>
          <div className="space-y-2">
            {REASONS.map((reason) => {
              const Icon = reason.icon;
              return (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => setSelectedReason(reason.value)}
                  className={`w-full p-4 border-2 transition-all text-left ${
                    selectedReason === reason.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-bold uppercase tracking-wider">
                        {reason.label}
                      </div>
                      <div className="text-xs text-muted-foreground normal-case font-normal mt-1">
                        {reason.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
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
            disabled={isSubmitting || !selectedReason}
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
