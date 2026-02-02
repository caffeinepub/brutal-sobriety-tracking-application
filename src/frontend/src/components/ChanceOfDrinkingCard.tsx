import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';

export default function ChanceOfDrinkingCard() {
  // Placeholder logic: Random status for now
  const riskStatus = useMemo(() => {
    const statuses = ['Low', 'Moderate', 'High'];
    const randomIndex = Math.floor(Math.random() * statuses.length);
    return statuses[randomIndex];
  }, []);

  const getRiskColor = (status: string) => {
    switch (status) {
      case 'Low':
        return 'text-green-500 neon-glow-green';
      case 'Moderate':
        return 'text-yellow-500 neon-glow-yellow';
      case 'High':
        return 'text-red-500 neon-glow-red';
      default:
        return 'text-muted-foreground';
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'Low':
        return 'border-green-500';
      case 'Moderate':
        return 'border-yellow-500';
      case 'High':
        return 'border-red-500';
      default:
        return 'border-muted';
    }
  };

  return (
    <Card className={`border-2 ${getBorderColor(riskStatus)} bg-card/50 backdrop-blur-sm h-full flex flex-col`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 ${getRiskColor(riskStatus)} flex-shrink-0`} />
          <span className="break-words">Chance of Drinking Tomorrow</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl sm:text-4xl font-black ${getRiskColor(riskStatus)}`}>
                {riskStatus}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mt-2">
                &gt; Based on your patterns
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
