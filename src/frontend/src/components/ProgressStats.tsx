import { useGetProgressMetrics } from '../hooks/useQueries';
import { Calendar, Flame, BarChart3, Wine } from 'lucide-react';

export default function ProgressStats() {
  const { data: metrics, isLoading } = useGetProgressMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="brutal-card border-2 border-border p-3 lg:p-4 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-sm border-4 border-primary border-t-transparent"></div>
          </div>
        ))}
      </div>
    );
  }

  const soberDays = Number(metrics?.soberDays ?? 0n);
  const drankDays = Number(metrics?.drankDays ?? 0n);
  const currentStreak = Number(metrics?.currentStreak ?? 0n);

  const stats = [
    {
      icon: Calendar,
      label: 'Sober Days',
      value: soberDays,
      color: 'text-green-400 neon-glow-green',
    },
    {
      icon: Flame,
      label: 'Current Streak',
      value: currentStreak,
      color: 'text-primary neon-glow-pink',
    },
    {
      icon: BarChart3,
      label: 'Days Tracked',
      value: soberDays + drankDays,
      color: 'text-secondary neon-glow-blue',
    },
    {
      icon: Wine,
      label: 'Drunk Days',
      value: drankDays,
      color: 'text-destructive neon-glow-red',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="brutal-card border-2 border-border p-3 lg:p-4">
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${stat.color}`} />
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
              {stat.label}
            </p>
          </div>
          <p className={`text-2xl lg:text-3xl font-black ${stat.color}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
