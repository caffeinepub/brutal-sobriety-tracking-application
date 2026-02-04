import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target } from 'lucide-react';

interface SoberDaysSectionProps {
  metrics?: {
    soberDays: bigint;
    drankDays: bigint;
    currentStreak: bigint;
    totalCheckIns: bigint;
  };
  soberDaysTarget?: number;
}

export default function SoberDaysSection({ metrics, soberDaysTarget = 30 }: SoberDaysSectionProps) {
  const soberDays = Number(metrics?.soberDays || 0);
  const currentStreak = Number(metrics?.currentStreak || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
      {/* Sober Days Streak */}
      <Card className="brutal-card hover:brutal-card-neon transition-all duration-300 border-2 border-primary">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Sober Days Streak
            </div>
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div className="text-6xl font-black text-primary neon-glow-pink mb-2">
            {currentStreak}
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
            &gt; Keep the momentum going
          </p>
        </CardContent>
      </Card>

      {/* Sober Days Target */}
      <Card className="brutal-card hover:brutal-card-neon transition-all duration-300 border-2 border-secondary">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Sober Days Target
            </div>
            <Target className="w-6 h-6 text-secondary" />
          </div>
          <div className="text-6xl font-black text-secondary neon-glow-blue mb-2">
            {soberDaysTarget}
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
            &gt; {soberDays}/{soberDaysTarget} days completed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
