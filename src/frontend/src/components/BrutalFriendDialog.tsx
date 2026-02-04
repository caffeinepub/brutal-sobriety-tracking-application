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
  // ORIGINAL 20 MESSAGES
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
  // NEW MESSAGES 21-55
  "If you're over 40 and still binge drinking, congratulations on still being alive. Kind of.",
  "Hangover or just existential dread, aged 35+? Hard to tell these days.",
  "Alcohol isn't a personality type, especially not for the under-25 crowd.",
  "Drinking with kids at home? Just admit you're running from responsibility.",
  "Mixing alcohol with sports — the main reason your gym progress is non-existent.",
  "More wine nights than date nights? That's why you're single, not mysterious.",
  "If your morning routine includes regret and painkillers, you're doing adulthood wrong.",
  "Saved money by not drinking this week? Invest it, don't spend it on vape and takeout.",
  "Still think smoking weed balances out drinking? That's not diplomatic — just stupid.",
  "Playing video games drunk doesn't make you better, just sloppier.",
  "If you're over 30 and bragging about shots taken, you need a new hobby.",
  "Moderation isn't just a myth told to kids — try it sometime.",
  "Your liver isn't a superhero; even it has limits.",
  "If your high school reunion is your only sobering experience, you're doing it wrong.",
  "Thinking alcohol makes you better at sex? Newsflash: It's ruining both.",
  "If you're 18 and can't remember last night, that's a warning sign, not a flex.",
  "Drinking solo isn't self-care, just self-destruction with better marketing.",
  "If \"let's grab a drink\" is your default plan, maybe try water for once.",
  "Alcohol isn't therapy, and you can't \"talk it out\" after 10 beers.",
  "Bragging about handling your liquor? Congrats on achieving absolutely nothing.",
  "If you drink to feel young, maybe just try exercise instead.",
  "Mid-life crisis solved with a six-pack? That's a recipe for more crises.",
  "Party trick: Outdrinking everyone. Reality: Outliving no one.",
  "If your kids know how to mix drinks, it's time to reevaluate your priorities.",
  "Teenage drinking might be cool, but liver transplants definitely aren't.",
  "Drunk texting your ex isn't romantic, it's just proof alcohol lowers standards.",
  "Sobriety isn't boring, your drunk self just has shitty stories.",
  "Alcohol as pain relief is a temporary fix for lifelong problems.",
  "If hangovers last two days, congrats — you're now officially old.",
  "Alcohol and fitness are mutually exclusive, no matter what your influencers say.",
  "Sports performance and alcohol consumption can't coexist. Choose wisely.",
  "If you run better drunk, it's the police, not athletics.",
  "Drinking doesn't improve your looks; beer goggles aren't a mirror.",
  "Social drinking shouldn't be your only social activity.",
  "Your family would prefer your presence, not your drunken absence.",
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
