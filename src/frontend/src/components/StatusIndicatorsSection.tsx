import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar, Clock } from 'lucide-react';
import { useMemo } from 'react';
import type { AggregatedEntry } from '../backend';

interface StatusIndicatorsSectionProps {
  chartData: AggregatedEntry[];
}

type StatusType = 'Sober' | 'Few Drinks' | 'Not Sure' | 'Drunk';

export default function StatusIndicatorsSection({ chartData }: StatusIndicatorsSectionProps) {
  const { weeklyAverage, yesterday, today } = useMemo(() => {
    const now = Date.now();
    
    // Helper to get start of day
    const getStartOfDay = (timestamp: number): number => {
      const adjustedTimestamp = timestamp - 21_600_000;
      const days = Math.floor(adjustedTimestamp / (24 * 60 * 60 * 1000));
      return days * 24 * 60 * 60 * 1000;
    };

    const todayNormalized = getStartOfDay(now);
    const yesterdayNormalized = getStartOfDay(now - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Find today's entry
    const todayEntry = chartData.find(e => Number(e.date) === todayNormalized);
    const todayStatus: StatusType = todayEntry 
      ? (todayEntry.sober ? 'Sober' : (Number(todayEntry.drinks) <= 2 ? 'Few Drinks' : 'Drunk'))
      : 'Not Sure';

    // Find yesterday's entry
    const yesterdayEntry = chartData.find(e => Number(e.date) === yesterdayNormalized);
    const yesterdayStatus: StatusType = yesterdayEntry
      ? (yesterdayEntry.sober ? 'Sober' : (Number(yesterdayEntry.drinks) <= 2 ? 'Few Drinks' : 'Drunk'))
      : 'Not Sure';

    // Calculate weekly average
    const lastWeekEntries = chartData.filter(e => Number(e.date) >= getStartOfDay(sevenDaysAgo));
    const totalDrinks = lastWeekEntries.reduce((sum, e) => sum + Number(e.drinks), 0);
    const avgDrinks = lastWeekEntries.length > 0 ? totalDrinks / lastWeekEntries.length : 0;
    
    let weeklyAvgStatus: StatusType;
    if (avgDrinks === 0) {
      weeklyAvgStatus = 'Sober';
    } else if (avgDrinks <= 2) {
      weeklyAvgStatus = 'Few Drinks';
    } else {
      weeklyAvgStatus = 'Drunk';
    }

    return {
      weeklyAverage: weeklyAvgStatus,
      yesterday: yesterdayStatus,
      today: todayStatus,
    };
  }, [chartData]);

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case 'Sober':
        return 'text-green-500 neon-glow-green border-green-500';
      case 'Few Drinks':
        return 'text-yellow-500 neon-glow-yellow border-yellow-500';
      case 'Drunk':
        return 'text-red-500 neon-glow-red border-red-500';
      case 'Not Sure':
        return 'text-muted-foreground border-muted';
      default:
        return 'text-muted-foreground border-muted';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
      {/* Weekly Average */}
      <Card className={`border-2 ${getStatusColor(weeklyAverage).split(' ')[2]} bg-card/50 backdrop-blur-sm`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>Weekly Average</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-xl sm:text-2xl font-black ${getStatusColor(weeklyAverage).split(' ')[0]} ${getStatusColor(weeklyAverage).split(' ')[1]}`}>
            {weeklyAverage}
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mt-2">
            &gt; Last 7 days
          </p>
        </CardContent>
      </Card>

      {/* Yesterday */}
      <Card className={`border-2 ${getStatusColor(yesterday).split(' ')[2]} bg-card/50 backdrop-blur-sm`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>Yesterday</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-xl sm:text-2xl font-black ${getStatusColor(yesterday).split(' ')[0]} ${getStatusColor(yesterday).split(' ')[1]}`}>
            {yesterday}
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mt-2">
            &gt; Previous day
          </p>
        </CardContent>
      </Card>

      {/* Today */}
      <Card className={`border-2 ${getStatusColor(today).split(' ')[2]} bg-card/50 backdrop-blur-sm`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>Today</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-xl sm:text-2xl font-black ${getStatusColor(today).split(' ')[0]} ${getStatusColor(today).split(' ')[1]}`}>
            {today}
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mt-2">
            &gt; Current status
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
