import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Moon } from 'lucide-react';
import { useMemo } from 'react';

// 2026 Full Moon Dates (MM-DD format)
const FULL_MOON_DATES_2026 = [
  { month: 1, day: 3 },   // 03-01
  { month: 2, day: 1 },   // 01-02
  { month: 3, day: 3 },   // 03-03
  { month: 4, day: 1 },   // 01-04
  { month: 5, day: 1 },   // 01-05
  { month: 5, day: 31 },  // 31-05
  { month: 6, day: 29 },  // 29-06
  { month: 7, day: 29 },  // 29-07
  { month: 8, day: 28 },  // 28-08
  { month: 10, day: 25 }, // 25-10
  { month: 11, day: 24 }, // 24-11
  { month: 12, day: 23 }, // 23-12
];

interface CycleData {
  fridayMessage: string;
  fridayBrutalMessage: string;
  moonMessage: string;
  moonBrutalMessage: string;
}

function getDaysUntilFriday(now: Date): number {
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  
  if (dayOfWeek === 5) {
    return 0; // It's Friday
  } else if (dayOfWeek === 6) {
    return 6; // Saturday, next Friday is 6 days away
  } else if (dayOfWeek === 0) {
    return 5; // Sunday, next Friday is 5 days away
  } else {
    return 5 - dayOfWeek; // Monday-Thursday
  }
}

function getDaysUntilNextFullMoon(now: Date): number {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
  const currentDay = now.getDate();

  // Find the next full moon
  for (const fullMoon of FULL_MOON_DATES_2026) {
    const fullMoonDate = new Date(currentYear, fullMoon.month - 1, fullMoon.day);
    
    // If this full moon is in the future
    if (fullMoonDate > now) {
      const diffTime = fullMoonDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
  }

  // If no full moon found in current year, check next year
  const nextYearFirstMoon = new Date(currentYear + 1, FULL_MOON_DATES_2026[0].month - 1, FULL_MOON_DATES_2026[0].day);
  const diffTime = nextYearFirstMoon.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getCycleData(now: Date): CycleData {
  const dayOfWeek = now.getDay();
  const daysUntilFriday = getDaysUntilFriday(now);
  const daysUntilFullMoon = getDaysUntilNextFullMoon(now);

  let fridayMessage = '';
  let fridayBrutalMessage = '';

  // Friday logic
  if (dayOfWeek === 5) {
    fridayMessage = 'Friday';
    fridayBrutalMessage = 'Friday vibes — your liver is nervous';
  } else if (dayOfWeek === 6 || dayOfWeek === 0) {
    fridayMessage = 'Weekend';
    fridayBrutalMessage = 'Weekend mode — stay strong or don\'t';
  } else if (dayOfWeek === 1) {
    fridayMessage = `${daysUntilFriday} days until Friday`;
    fridayBrutalMessage = 'Monday blues — at least you\'re sober';
  } else if (daysUntilFriday === 1) {
    fridayMessage = '1 day until Friday';
    fridayBrutalMessage = 'Weekend incoming — brace yourself';
  } else {
    fridayMessage = `${daysUntilFriday} days until Friday`;
    fridayBrutalMessage = 'Midweek grind — keep pushing';
  }

  // Full moon logic
  let moonMessage = '';
  let moonBrutalMessage = '';

  if (daysUntilFullMoon === 0) {
    moonMessage = 'Full moon tonight';
    moonBrutalMessage = 'Full moon tonight — better stay grounded';
  } else if (daysUntilFullMoon === 1) {
    moonMessage = '1 day until full moon';
    moonBrutalMessage = 'Full moon tomorrow — chaos incoming';
  } else if (daysUntilFullMoon <= 3) {
    moonMessage = `${daysUntilFullMoon} days until full moon`;
    moonBrutalMessage = `Full moon in ${daysUntilFullMoon} days — better stay grounded`;
  } else if (daysUntilFullMoon <= 7) {
    moonMessage = `${daysUntilFullMoon} days until full moon`;
    moonBrutalMessage = 'Full moon approaching — stay vigilant';
  } else {
    moonMessage = `${daysUntilFullMoon} days until full moon`;
    moonBrutalMessage = 'Moon cycle tracking — you\'re prepared';
  }

  return {
    fridayMessage,
    fridayBrutalMessage,
    moonMessage,
    moonBrutalMessage,
  };
}

export default function CycleWindowCard() {
  // Recalculate on every render to ensure daily updates
  const cycleData = useMemo(() => {
    const now = new Date();
    return getCycleData(now);
  }, []);

  return (
    <Card className="border-2 border-secondary bg-card/50 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
          <span className="neon-glow-blue">Cycle Window</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center">
        <div className="space-y-3 sm:space-y-4 w-full">
          {/* Friday/Weekend Section */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-secondary flex-shrink-0" />
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider neon-glow-blue break-words">
                {cycleData.fridayMessage}
              </p>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono pl-5 sm:pl-7 break-words">
              &gt; {cycleData.fridayBrutalMessage}
            </p>
          </div>

          {/* Full Moon Section */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <Moon className="w-3 h-3 sm:w-4 sm:h-4 text-secondary flex-shrink-0" />
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider neon-glow-blue break-words">
                {cycleData.moonMessage}
              </p>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono pl-5 sm:pl-7 break-words">
              &gt; {cycleData.moonBrutalMessage}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
