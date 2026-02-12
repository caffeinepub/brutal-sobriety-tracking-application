import { useState, useEffect, useRef } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetLast14Days,
  useGetProgressMetrics,
  useGetCallerUserProfile,
  useCheckOnboardingAndCheckInStatus,
  useSubmitCheckIn,
  useSubmitFollowUpCheckIn,
  useSubmitRepeatCheckIn,
  useSetStreakTarget,
  useMarkAchievementAsShown,
} from '../hooks/useQueries';
import Header from '../components/Header';
import DailyCheckInDialog from '../components/DailyCheckInDialog';
import RepeatCheckInDialog from '../components/RepeatCheckInDialog';
import DataLoggedDialog from '../components/DataLoggedDialog';
import BrutalFriendDialog from '../components/BrutalFriendDialog';
import ProgressStats from '../components/ProgressStats';
import DrinksChart from '../components/DrinksChart';
import UnifiedHeaderSection from '../components/UnifiedHeaderSection';
import SoberDaysSection from '../components/SoberDaysSection';
import StatusIndicatorsSection from '../components/StatusIndicatorsSection';
import ChanceOfDrinkingCard from '../components/ChanceOfDrinkingCard';
import CycleWindowCard from '../components/CycleWindowCard';
import BeerDonationDialog from '../components/BeerDonationDialog';
import StreakAchievementOverlay from '../components/StreakAchievementOverlay';
import { Button } from '@/components/ui/button';
import { Beer } from 'lucide-react';
import { toast } from 'sonner';
import { parseSobrietyDurationToDays } from '../utils/sobrietyDuration';
import { RepeatCheckInReason } from '../backend';
import { trackEvent, trackPageView, getCheckInDedupeKey } from '../utils/usergeek';
import {
  hasDailyCheckInAutoOpenedToday,
  markDailyCheckInAutoOpened,
} from '../utils/dailyCheckInAutoOpenGuards';

export default function Dashboard() {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const { data: status } = useCheckOnboardingAndCheckInStatus();
  const { data: progressMetrics } = useGetProgressMetrics();
  const { data: last14Days } = useGetLast14Days();
  const { data: userProfile } = useGetCallerUserProfile();

  const { mutate: submitCheckIn, isPending: isSubmittingCheckIn } = useSubmitCheckIn();
  const { mutate: submitFollowUpCheckIn, isPending: isSubmittingFollowUp } = useSubmitFollowUpCheckIn();
  const { mutate: submitRepeatCheckIn, isPending: isSubmittingRepeat } = useSubmitRepeatCheckIn();
  const { mutate: setStreakTarget, isPending: isSettingTarget } = useSetStreakTarget();
  const { mutate: markAchievementAsShown } = useMarkAchievementAsShown();

  const [dailyCheckInOpen, setDailyCheckInOpen] = useState(false);
  const [repeatCheckInOpen, setRepeatCheckInOpen] = useState(false);
  const [dataLoggedOpen, setDataLoggedOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [beerDialogOpen, setBeerDialogOpen] = useState(false);
  const [achievementOverlayOpen, setAchievementOverlayOpen] = useState(false);

  const checkInSubmittedRef = useRef(false);
  const repeatAutoOpenedRef = useRef(false);
  const suppressFollowUpAutoOpenRef = useRef(false);

  // Track page view for daily check-in dialog
  useEffect(() => {
    if (dailyCheckInOpen) {
      trackPageView('Daily Check-In', '/dashboard/check-in');
    }
  }, [dailyCheckInOpen]);

  // Check if achievement overlay should be shown
  useEffect(() => {
    if (
      userProfile &&
      progressMetrics &&
      !achievementOverlayOpen &&
      !dailyCheckInOpen &&
      !repeatCheckInOpen
    ) {
      const currentStreak = Number(progressMetrics.currentStreak);
      const streakTarget = Number(userProfile.streakTarget);
      const achievementShown = userProfile.achievementShownForThisTarget;

      if (currentStreak >= streakTarget && !achievementShown) {
        setAchievementOverlayOpen(true);
        // Mark achievement as shown immediately to prevent re-showing on refresh
        markAchievementAsShown();
      }
    }
  }, [userProfile, progressMetrics, achievementOverlayOpen, dailyCheckInOpen, repeatCheckInOpen, markAchievementAsShown]);

  // Auto-open DailyCheckInDialog: once per local day per session when needsDailyCheckIn is true
  useEffect(() => {
    if (
      status?.needsDailyCheckIn &&
      !dailyCheckInOpen &&
      !repeatCheckInOpen &&
      !achievementOverlayOpen &&
      !hasDailyCheckInAutoOpenedToday()
    ) {
      setDailyCheckInOpen(true);
      markDailyCheckInAutoOpened();
    }
  }, [status, dailyCheckInOpen, repeatCheckInOpen, achievementOverlayOpen]);

  // Auto-open RepeatCheckInDialog: on subsequent same-day logins (unlimited follow-ups)
  // Only auto-open once per mount/session, and not immediately after first check-in submission
  useEffect(() => {
    if (
      status &&
      !status.needsDailyCheckIn &&
      !status.needsOnboarding &&
      Number(status.dailyCheckInsToday) >= 1 &&
      !dailyCheckInOpen &&
      !repeatCheckInOpen &&
      !achievementOverlayOpen &&
      !repeatAutoOpenedRef.current &&
      !suppressFollowUpAutoOpenRef.current
    ) {
      setRepeatCheckInOpen(true);
      repeatAutoOpenedRef.current = true;
    }
  }, [status, dailyCheckInOpen, repeatCheckInOpen, achievementOverlayOpen]);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleDailyCheckInSubmit = async (data: { sober: boolean; drinks: number; mood: any }) => {
    if (checkInSubmittedRef.current) return;

    const now = Date.now();
    const entry = {
      date: BigInt(now),
      sober: data.sober,
      drinks: BigInt(data.drinks),
      mood: data.mood,
    };

    checkInSubmittedRef.current = true;

    // Suppress follow-up auto-open immediately after first check-in submission
    suppressFollowUpAutoOpenRef.current = true;

    submitCheckIn(entry, {
      onSuccess: (result) => {
        setFeedbackMessage(result.message);
        setDailyCheckInOpen(false);
        setDataLoggedOpen(true);

        // Track daily check-in event
        if (identity && userProfile) {
          const userId = identity.getPrincipal().toString();
          const dedupeKey = getCheckInDedupeKey(userId, now);

          const currentStreak = progressMetrics?.currentStreak ? Number(progressMetrics.currentStreak) : 0;
          const sobrietyGoal = userProfile.onboardingAnswers?.sobrietyDuration || '30 days';
          const streakTarget = parseSobrietyDurationToDays(sobrietyGoal);
          const streakRatio = streakTarget > 0 ? currentStreak / streakTarget : 0;

          trackEvent('Daily Check-In', {
            sober: data.sober,
            drinks: data.drinks,
            mood: data.mood ? (data.mood as any).__kind__ : 'none',
            repeatCheckIns: Number(status?.dailyCheckInsToday || 0),
            currentStreak,
            streakTarget,
            streakRatio: Math.round(streakRatio * 100) / 100,
          }, dedupeKey);
        }

        // Check if achievement was reached
        if (result.achievedStreakTarget) {
          // Close data logged dialog and show achievement overlay after a brief delay
          setTimeout(() => {
            setDataLoggedOpen(false);
            setAchievementOverlayOpen(true);
          }, 1500);
        }

        setTimeout(() => {
          checkInSubmittedRef.current = false;
        }, 2000);
      },
      onError: (error: any) => {
        console.error('Check-in submission failed:', error);
        toast.error('Failed to submit check-in. Please try again.');
        checkInSubmittedRef.current = false;
        suppressFollowUpAutoOpenRef.current = false;
      },
    });
  };

  const handleRepeatStillSober = () => {
    // User is still sober, just submit a repeat check-in with reflection reason
    submitRepeatCheckIn(RepeatCheckInReason.reflection, {
      onSuccess: () => {
        setFeedbackMessage('Thanks for checking in again. Stay strong!');
        setRepeatCheckInOpen(false);
        setDataLoggedOpen(true);
      },
      onError: (error: any) => {
        console.error('Repeat check-in failed:', error);
        toast.error('Failed to submit repeat check-in. Please try again.');
      },
    });
  };

  const handleRepeatDrank = async (drinks: number) => {
    // User drank, submit follow-up check-in
    submitFollowUpCheckIn(BigInt(drinks), {
      onSuccess: (message) => {
        setFeedbackMessage(message);
        setRepeatCheckInOpen(false);
        setDataLoggedOpen(true);
      },
      onError: (error: any) => {
        console.error('Follow-up check-in failed:', error);
        toast.error('Failed to submit follow-up. Please try again.');
      },
    });
  };

  const handleSelectNewTarget = (targetDays: number) => {
    setStreakTarget(targetDays, {
      onSuccess: () => {
        setAchievementOverlayOpen(false);
        toast.success(`New target set: ${targetDays} days`);
      },
      onError: (error: any) => {
        console.error('Failed to set new target:', error);
        toast.error('Failed to set new target. Please try again.');
      },
    });
  };

  const soberDaysTarget = userProfile?.onboardingAnswers?.sobrietyDuration
    ? parseSobrietyDurationToDays(userProfile.onboardingAnswers.sobrietyDuration)
    : 30;

  const currentStreak = progressMetrics?.currentStreak ? Number(progressMetrics.currentStreak) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={handleLogout} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <UnifiedHeaderSection />

        <SoberDaysSection
          metrics={progressMetrics}
          soberDaysTarget={soberDaysTarget}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => setDailyCheckInOpen(true)}
              className="flex-1 bg-primary text-primary-foreground font-black uppercase tracking-wider border-2 border-primary hover:bg-primary/90 transition-colors px-6 py-6 text-base shadow-brutal"
            >
              Check In
            </Button>
            <Button
              onClick={() => setBeerDialogOpen(true)}
              variant="outline"
              className="flex-1 sm:flex-initial font-black uppercase tracking-wider border-2 hover:bg-accent transition-colors px-6 py-6 text-base shadow-brutal"
            >
              <Beer className="mr-2 h-5 w-5" />
              Buy Me a Beer
            </Button>
          </div>
        </div>

        <ProgressStats />

        <StatusIndicatorsSection chartData={last14Days || []} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChanceOfDrinkingCard />
          <CycleWindowCard />
        </div>

        <DrinksChart data={last14Days || []} />
      </main>

      <DailyCheckInDialog
        open={dailyCheckInOpen}
        onClose={() => setDailyCheckInOpen(false)}
        onSubmit={handleDailyCheckInSubmit}
        isSubmitting={isSubmittingCheckIn}
      />

      <RepeatCheckInDialog
        open={repeatCheckInOpen}
        onClose={() => setRepeatCheckInOpen(false)}
        onStillSober={handleRepeatStillSober}
        onDrank={handleRepeatDrank}
        isSubmitting={isSubmittingFollowUp || isSubmittingRepeat}
      />

      <DataLoggedDialog
        open={dataLoggedOpen}
        onClose={() => setDataLoggedOpen(false)}
        message={feedbackMessage}
        variant="primary"
      />

      <BeerDonationDialog
        open={beerDialogOpen}
        onClose={() => setBeerDialogOpen(false)}
        address="bc1qh8405z7yfvmhph3mfeqpk8yke5qvmuegnzjhx3"
      />

      <StreakAchievementOverlay
        open={achievementOverlayOpen}
        streakDays={currentStreak}
        onSelectNewTarget={handleSelectNewTarget}
        isSubmitting={isSettingTarget}
      />
    </div>
  );
}
