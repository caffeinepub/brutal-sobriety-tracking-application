import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skull } from 'lucide-react';

interface BrutalFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

const fallbackMessages = [
  "Still sober? Blink twice if you're hostage to your own self-control.",
  "You resisted again? The bar staff are starting to worry.",
  "One day without drinks — your liver just sent a thank you emoji.",
  "You slipped? Don't worry, legends stumble too, just less gracefully.",
  "Another sober day? Your wallet is confused but grateful.",
  "Congrats on not drinking! Your future self owes you a non-alcoholic high-five.",
  "You drank today? Well, at least you're consistent with disappointing yourself.",
  "Sober streak continues! Even your demons are impressed.",
  "You fell off the wagon? Don't worry, it wasn't going that fast anyway.",
  "Another day, another victory over your own worst instincts.",
];

export default function BrutalFriendDialog({ open, onOpenChange, message }: BrutalFriendDialogProps) {
  const [displayMessage, setDisplayMessage] = useState('');

  // Use provided message from backend (cached), or pick a random fallback
  useEffect(() => {
    if (open) {
      if (message && message.trim() !== '') {
        setDisplayMessage(message);
      } else {
        const selectedMessage = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
        setDisplayMessage(selectedMessage);
      }
    }
  }, [open, message]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover border-2 border-primary z-[110]">
        <div className="py-8 space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center w-24 h-24 border-2 border-primary bg-primary/10 neon-glow-pink">
              <Skull className="w-12 h-12 text-primary" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4 text-center">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-tight neon-glow-pink px-4">
              {displayMessage}
            </h2>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
              &gt; Your brutally honest friend
            </p>
          </div>

          {/* Dismiss Button */}
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-primary hover:bg-primary/90 font-bold uppercase tracking-wider border-2 border-primary text-sm"
          >
            Shut up, I'm trying.
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
