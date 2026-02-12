import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { STREAK_TARGET_OPTIONS, parseStreakTargetToDays } from '../utils/streakTargets';

interface StreakAchievementOverlayProps {
  open: boolean;
  streakDays: number;
  onSelectNewTarget: (targetDays: number) => void;
  isSubmitting?: boolean;
}

export default function StreakAchievementOverlay({
  open,
  streakDays,
  onSelectNewTarget,
  isSubmitting = false,
}: StreakAchievementOverlayProps) {
  const [panel, setPanel] = useState<'achievement' | 'selection'>('achievement');
  const [isClosing, setIsClosing] = useState(false);

  if (!open) return null;

  const handleAcknowledge = () => {
    setPanel('selection');
  };

  const handleSelectTarget = (targetOption: string) => {
    const targetDays = parseStreakTargetToDays(targetOption);
    setIsClosing(true);
    
    // Fade out before calling callback
    setTimeout(() => {
      onSelectNewTarget(targetDays);
      setIsClosing(false);
      setPanel('achievement'); // Reset for next time
    }, 300);
  };

  const getBrutalMessage = (days: number): string => {
    if (days <= 2) {
      return "You made it through 2 days.\nThat's barely a warm-up.\nBut it's something.";
    } else if (days <= 5) {
      return "5 days without a drink.\nYour liver is confused.\nDon't stop now.";
    } else if (days <= 7) {
      return "A full week sober.\nYou're tougher than you thought.\nProve it wasn't luck.";
    } else if (days <= 14) {
      return "Two weeks clean.\nThe hard part is staying clean.\nKeep going.";
    } else {
      return "A full month without alcohol.\nYou've earned this moment.\nNow do it again.";
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl px-6">
        {panel === 'achievement' && (
          <div className="flex flex-col items-center text-center space-y-8 animate-quick-fade">
            {/* Streak number with glow */}
            <div className="relative">
              <div
                className="absolute inset-0 blur-3xl opacity-50 animate-slow-pulse"
                style={{
                  background: 'radial-gradient(circle, oklch(65% 0.25 350) 0%, transparent 70%)',
                }}
              />
              <div className="relative">
                <div className="text-9xl font-black uppercase tracking-tighter neon-glow-pink">
                  {streakDays}
                </div>
                <div className="text-4xl font-black uppercase tracking-wider text-foreground mt-2">
                  {streakDays === 1 ? 'DAY' : 'DAYS'}
                </div>
              </div>
            </div>

            {/* Brutal message */}
            <div className="max-w-lg">
              <p className="text-xl font-bold uppercase tracking-wide text-foreground leading-relaxed whitespace-pre-line">
                {getBrutalMessage(streakDays)}
              </p>
            </div>

            {/* Action button */}
            <Button
              onClick={handleAcknowledge}
              className="mt-8 px-12 py-6 text-xl font-black uppercase tracking-wider border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 neon-outline"
              style={{
                boxShadow: '0 0 20px oklch(65% 0.25 350 / 0.3)',
              }}
            >
              SHUT UP!
            </Button>
          </div>
        )}

        {panel === 'selection' && (
          <div className="flex flex-col items-center text-center space-y-8 animate-quick-fade">
            {/* Title */}
            <h2 className="text-4xl font-black uppercase tracking-tight text-foreground">
              Do you want to try again?
            </h2>

            {/* Target options */}
            <div className="w-full max-w-md space-y-4">
              {STREAK_TARGET_OPTIONS.map((option) => (
                <Button
                  key={option}
                  onClick={() => handleSelectTarget(option)}
                  disabled={isSubmitting}
                  className="w-full h-16 text-lg font-bold uppercase tracking-wider border-2 border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
