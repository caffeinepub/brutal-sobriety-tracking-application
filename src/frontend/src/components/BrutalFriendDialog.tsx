import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skull } from 'lucide-react';

interface BrutalFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

const brutalMessages = [
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
  "You stayed strong today! Your liver is doing a little happy dance.",
  "Slipped up again? Your willpower called in sick, apparently.",
  "Sober today? Plot twist: you're actually capable of self-control.",
  "You drank? Shocking. Said no one who knows you.",
  "Clean day achieved! Your bank account is slowly recovering.",
  "You resisted temptation! Hell just froze over a little bit.",
  "Another drink day? Your liver is writing its resignation letter.",
  "Sober success! You're like a unicorn, but real and slightly less magical.",
  "You slipped? Don't worry, even superheroes have off days.",
  "Clean streak intact! You're basically a sobriety ninja now.",
];

export default function BrutalFriendDialog({ open, onOpenChange, message }: BrutalFriendDialogProps) {
  const [displayMessage, setDisplayMessage] = useState('');

  // Use provided message from backend, or pick a random one as fallback
  useEffect(() => {
    if (open) {
      if (message && message.trim() !== '') {
        setDisplayMessage(message);
      } else {
        const selectedMessage = brutalMessages[Math.floor(Math.random() * brutalMessages.length)];
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
