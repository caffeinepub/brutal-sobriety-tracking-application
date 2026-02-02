import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetLast14Days, useGetProgressMetrics } from '../hooks/useQueries';
import Header from '../components/Header';
import DrinksChart from '../components/DrinksChart';
import DailyCheckInDialog from '../components/DailyCheckInDialog';
import FollowUpCheckInDialog from '../components/FollowUpCheckInDialog';
import UnifiedHeaderSection from '../components/UnifiedHeaderSection';
import ChanceOfDrinkingCard from '../components/ChanceOfDrinkingCard';
import CycleWindowCard from '../components/CycleWindowCard';
import SoberDaysSection from '../components/SoberDaysSection';
import StatusIndicatorsSection from '../components/StatusIndicatorsSection';
import { SiX, SiFacebook, SiInstagram } from 'react-icons/si';
import { Heart } from 'lucide-react';

export default function Dashboard() {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: chartData = [], isLoading: chartLoading, isFetching: chartFetching } = useGetLast14Days();
  const { data: metrics } = useGetProgressMetrics();

  if (!identity) {
    return null;
  }

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header onLogout={handleLogout} />
      
      {/* Daily Check-in Dialog */}
      <DailyCheckInDialog />
      
      {/* Follow-up Check-in Dialog */}
      <FollowUpCheckInDialog />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-1 max-w-7xl">
        {/* Redesigned Dashboard Layout */}
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* 1. Unified Header Section - Brutal Friend Feedback + Motivation Button */}
          <UnifiedHeaderSection />

          {/* 2. Side-by-Side Cards Row - Chance of Drinking Tomorrow + Cycle Window */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            <ChanceOfDrinkingCard />
            <CycleWindowCard />
          </div>

          {/* 3. Sober Days Section - Streak and Target */}
          <SoberDaysSection metrics={metrics} />

          {/* 4. Status Indicators Section - Weekly Average, Yesterday, Today */}
          <StatusIndicatorsSection chartData={chartData} />

          {/* 5. 14-Day Chart at Bottom */}
          <DrinksChart data={chartData} isLoading={chartLoading} isFetching={chartFetching} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border py-4 sm:py-6 bg-card mt-auto">
        <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            {/* Copyright */}
            <div className="text-xs sm:text-sm text-muted-foreground font-mono text-center sm:text-left">
              © 2025. Built with <Heart className="inline w-3 h-3 sm:w-4 sm:h-4 text-primary" /> using{' '}
              <a
                href="https://caffeine.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors underline"
              >
                caffeine.ai
              </a>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 sm:gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <SiX className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <SiFacebook className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <SiInstagram className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
