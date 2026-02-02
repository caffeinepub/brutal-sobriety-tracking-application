import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import type { AggregatedEntry } from '../backend';

interface DrinksChartProps {
  data: AggregatedEntry[];
  isLoading?: boolean;
  isFetching?: boolean;
}

interface ChartDataPoint {
  date: string;
  drinks: number;
  sober: boolean | null;
}

function getStartOfDay(timestamp: number): number {
  const adjustedTimestamp = timestamp - 21_600_000;
  const days = Math.floor(adjustedTimestamp / (24 * 60 * 60 * 1000));
  return days * 24 * 60 * 60 * 1000;
}

export default function DrinksChart({ data, isLoading = false, isFetching = false }: DrinksChartProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [prevDataHash, setPrevDataHash] = useState('');

  const dataHash = useMemo(() => {
    return data
      .map((entry) => `${entry.date}-${entry.drinks}-${entry.sober}`)
      .join('|');
  }, [data]);

  useEffect(() => {
    if (dataHash && dataHash !== prevDataHash && prevDataHash !== '') {
      setIsUpdating(true);
      const timer = setTimeout(() => setIsUpdating(false), 1500);
      setPrevDataHash(dataHash);
      return () => clearTimeout(timer);
    }
    if (prevDataHash === '') {
      setPrevDataHash(dataHash);
    }
  }, [dataHash, prevDataHash]);

  const chartData: ChartDataPoint[] = useMemo(() => {
    const result: ChartDataPoint[] = [];
    const now = Date.now();

    for (let i = 13; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000);
      const normalizedTimestamp = getStartOfDay(timestamp);

      const displayDate = new Date(normalizedTimestamp + 21_600_000);
      const dayName = displayDate.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const entry = data.find((e) => {
        return Number(e.date) === normalizedTimestamp;
      });

      result.push({
        date: `${dayName} ${monthDay}`,
        drinks: entry ? Number(entry.drinks) : 0,
        sober: entry ? entry.sober : null,
      });
    }

    return result;
  }, [data]);

  const chartConfig = {
    drinks: {
      label: 'Drinks',
      color: 'oklch(var(--chart-1))',
    },
  };

  return (
    <Card 
      className={`brutal-card border-2 transition-all duration-500 h-full flex flex-col ${
        isUpdating ? 'brutal-card-neon scale-[1.01]' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
          14-Day History
          {isFetching && (
            <span className="inline-flex items-center gap-1 text-xs font-normal text-primary">
              <Loader2 className="w-3 h-3 animate-spin" />
              UPDATING...
            </span>
          )}
          {isUpdating && !isFetching && (
            <span className="inline-flex items-center gap-1 text-xs font-normal text-primary animate-neon-pulse">
              <span className="inline-block w-2 h-2 bg-primary rounded-sm"></span>
              SYNCED
            </span>
          )}
        </CardTitle>
        <CardDescription className="text-xs uppercase tracking-wider">
          Your drink count over the past two weeks
        </CardDescription>
      </CardHeader>
      <CardContent className="relative flex-1 min-h-0">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Loading...</p>
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fontWeight: 'bold' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke="oklch(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 10, fontWeight: 'bold' }}
                  label={{ value: 'DRINKS', angle: -90, position: 'insideLeft', style: { fontSize: 10, fontWeight: 'bold' } }}
                  allowDecimals={false}
                  stroke="oklch(var(--muted-foreground))"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="drinks"
                  fill="var(--color-drinks)"
                  radius={[0, 0, 0, 0]}
                  animationDuration={800}
                  animationBegin={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
