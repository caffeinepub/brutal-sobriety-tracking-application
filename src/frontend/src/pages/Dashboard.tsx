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
} from '../hooks/useQueries';
import Header from '../components/Header';
import DailyCheckInDialog from '../components/DailyCheckInDialog';
import RepeatCheckInDialog from '../components/RepeatCheckInDialog';
import DataLoggedDialog from '../components/DataLoggedDialog';
import BrutalFriendDialog from '../components/BrutalFriendDialog';
import FollowUpCheckInDialog from '../components/FollowUpCheckInDialog';
import BeerDonationDialog from '../components/BeerDonationDialog';
import UnifiedHeaderSection from '../components/UnifiedHeaderSection';
import ChanceOfDrinkingCard from '../components/ChanceOfDrinkingCard';
import CycleWindowCard from '../components/CycleWindowCard';
import SoberDaysSection from '../components/SoberDaysSection';
import StatusIndicatorsSection from '../components/StatusIndicatorsSection';
import { SiX, SiFacebook, SiInstagram } from 'react-icons/si';
import { Heart, Plus, Beer } from 'lucide-react';
import { parseSobrietyDurationToDays } from '../utils/sobrietyDuration';
import { Mood } from '../backend';
import {
  SessionPhase,
  ModalType,
  SessionFlowState,
  resolveSessionPhase,
  createInitialFlowState,
  startSessionFlow,
  advanceToNextModal,
  setBrutalFriendMessage,
  setDataLoggedMessage,
  endSessionFlow,
} from '../session/dailySessionFlow';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// Convert onboarding answer to numeric average drinks per week
function getAverageDrinksPerWeek(drinksPerWeek: string): number {
  switch (drinksPerWeek) {
    case 'Less than 5':
      return 3;
    case '5–10':
      return 7;
    case 'More than 10':
      return 15;
    case "I just drink, don't count...":
      return 20;
    default:
      return 0;
  }
}

const DONATION_ADDRESS = 'wzq6l-62ys7-tvqe5-5wvtd-d256x-knbsv-c7vvd-cj4n6-rqztu-3guce-mqe';

export default function Dashboard() {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: chartData = [] } = useGetLast14Days();
  const { data: metrics } = useGetProgressMetrics();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: status, isLoading: statusLoading, isFetched: statusFetched } = useCheckOnboardingAndCheckInStatus();

  const submitCheckIn = useSubmitCheckIn();
  const submitFollowUpCheckIn = useSubmitFollowUpCheckIn();

  // Centralized session flow state
  const [flowState, setFlowState] = useState<SessionFlowState>(createInitialFlowState());
  
  // Track if we've already auto-started a flow this session to prevent loops
  const hasAutoStartedRef = useRef(false);

  // Beer donation dialog state
  const [showBeerDonation, setShowBeerDonation] = useState(false);

  // Parse sobriety duration from user profile, fallback to 30
  const soberDaysTarget = parseSobrietyDurationToDays(
    userProfile?.onboardingAnswers?.sobrietyDuration
  );

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  // Initialize session flow on load - only auto-start FIRST_CHECKIN
  useEffect(() => {
    // Wait for all required data to be available
    if (!identity || !status || !profileFetched || !statusFetched) {
      console.log('Waiting for data:', { identity: !!identity, status: !!status, profileFetched, statusFetched });
      return;
    }

    // Don't restart if a flow is already active
    if (flowState.isActive) {
      console.log('Flow already active, skipping initialization');
      return;
    }

    // Don't auto-start if we've already done so this session
    if (hasAutoStartedRef.current) {
      console.log('Already auto-started a flow this session, skipping');
      return;
    }

    console.log('Resolving session phase with status:', status, 'profile:', userProfile);

    const phase = resolveSessionPhase({
      needsOnboarding: status.needsOnboarding,
      hasCompletedOnboarding: userProfile?.hasCompletedOnboarding ?? false,
      dailyCheckInsToday: Number(status.dailyCheckInsToday),
    });

    console.log('Resolved session phase:', phase);

    // Only auto-start FIRST_CHECKIN flow
    // REPEAT_CHECKIN must be triggered manually by the user
    if (phase === SessionPhase.FIRST_CHECKIN) {
      const newFlowState = startSessionFlow(phase);
      console.log('Starting session flow:', newFlowState);
      
      // Mark that we've auto-started
      hasAutoStartedRef.current = true;
      
      // Delay modal opening slightly to avoid flash
      setTimeout(() => {
        setFlowState(newFlowState);
      }, 300);
    }
  }, [identity, status, userProfile, profileFetched, statusFetched, flowState.isActive]);

  // Manual check-in trigger
  const handleManualCheckIn = () => {
    if (!status || !profileFetched) return;

    const phase = resolveSessionPhase({
      needsOnboarding: status.needsOnboarding,
      hasCompletedOnboarding: userProfile?.hasCompletedOnboarding ?? false,
      dailyCheckInsToday: Number(status.dailyCheckInsToday),
    });

    // Start the appropriate flow (FIRST_CHECKIN or REPEAT_CHECKIN)
    if (phase === SessionPhase.FIRST_CHECKIN || phase === SessionPhase.REPEAT_CHECKIN) {
      const newFlowState = startSessionFlow(phase);
      setFlowState(newFlowState);
    }
  };

  // Beer donation button handler
  const handleBeerDonation = async () => {
    try {
      await navigator.clipboard.writeText(DONATION_ADDRESS);
      toast.success('Address copied! Now go buy that beer. 🍺', {
        description: 'Thanks for supporting brutal honesty.',
      });
    } catch (error) {
      // Fallback: show dialog if clipboard fails
      setShowBeerDonation(true);
    }
  };

  // Daily Check-In handlers
  const handleDailyCheckInSubmit = async (data: { sober: boolean; drinks: number; mood: Mood }) => {
    try {
      const result = await submitCheckIn.mutateAsync({
        date: BigInt(Date.now()),
        sober: data.sober,
        drinks: BigInt(data.drinks),
        mood: data.mood,
      });

      // Generate feedback message
      let feedbackMsg = '';
      if (data.sober) {
        const messages = [
          'Not bad. Keep it up.',
          "Another day. Don't get cocky.",
          'Good. Now do it again tomorrow.',
          'Solid. But streaks can break.',
          'Nice. Stay sharp.',
        ];
        feedbackMsg = messages[Math.floor(Math.random() * messages.length)];
      } else {
        // Get average drinks per week from onboarding answers
        if (userProfile?.onboardingAnswers?.drinksPerWeek) {
          const avgPerWeek = getAverageDrinksPerWeek(userProfile.onboardingAnswers.drinksPerWeek);
          const avgPerDay = avgPerWeek / 7;

          if (data.drinks < avgPerDay) {
            const messages = [
              'Less than usual. Progress is progress.',
              "Below average. That's something.",
              'Fewer drinks. Small wins count.',
              'Reducing. Keep that trend going.',
            ];
            feedbackMsg = messages[Math.floor(Math.random() * messages.length)];
          } else {
            const messages = [
              'Honesty noted. Try harder tomorrow.',
              "At least you're tracking it.",
              'Not great. But you showed up.',
              "Tomorrow's a new chance. Use it.",
            ];
            feedbackMsg = messages[Math.floor(Math.random() * messages.length)];
          }
        } else {
          const messages = [
            'Honesty noted. Try harder tomorrow.',
            "At least you're tracking it.",
            'Not great. But you showed up.',
            "Tomorrow's a new chance. Use it.",
            'One day at a time. Keep going.',
          ];
          feedbackMsg = messages[Math.floor(Math.random() * messages.length)];
        }
      }

      // Update flow state with messages and advance
      let updatedState = setDataLoggedMessage(flowState, feedbackMsg);
      updatedState = setBrutalFriendMessage(updatedState, result.message);
      updatedState = advanceToNextModal(updatedState);
      setFlowState(updatedState);
    } catch (error) {
      toast.error('Submission failed. Try again.');
      console.error(error);
    }
  };

  // Repeat Check-In handlers - now handles sobriety follow-up
  const handleRepeatCheckInStillSober = () => {
    // User is still sober, just close the modal
    toast.success('Good. Staying consistent.');
    const nextState = endSessionFlow(flowState);
    setFlowState(nextState);
  };

  const handleRepeatCheckInDrank = async (drinks: number) => {
    try {
      const feedbackMessage = await submitFollowUpCheckIn.mutateAsync(BigInt(drinks));

      const messages = [
        'Noted. Keep tracking.',
        'Logged. Stay aware.',
        'Recorded. One step at a time.',
        'Updated. Keep going.',
      ];
      const feedbackMsg = messages[Math.floor(Math.random() * messages.length)];

      // Update flow state with messages and advance
      let updatedState = setDataLoggedMessage(flowState, feedbackMsg);
      updatedState = setBrutalFriendMessage(updatedState, feedbackMessage);
      updatedState = advanceToNextModal(updatedState);
      setFlowState(updatedState);
    } catch (error) {
      toast.error('Submission failed. Try again.');
      console.error(error);
    }
  };

  // Follow-Up Check-In handlers (outside main flow)
  const [showFollowUp, setShowFollowUp] = useState(false);

  const handleFollowUpRemainedSober = () => {
    toast.success('Good. Staying consistent.');
    setShowFollowUp(false);
  };

  const handleFollowUpHadMoreDrinks = async (drinks: number) => {
    try {
      await submitFollowUpCheckIn.mutateAsync(BigInt(drinks));
      toast.success("Added to today's total. At least you're honest.");
      setShowFollowUp(false);
    } catch (error) {
      toast.error('Submission failed. Try again.');
      console.error(error);
    }
  };

  // Modal close handlers
  const handleModalClose = () => {
    // Advance to next modal in queue
    const nextState = advanceToNextModal(flowState);
    setFlowState(nextState);
  };

  const handleDataLoggedClose = () => {
    // Advance to next modal (Brutal Friend)
    const nextState = advanceToNextModal(flowState);
    setFlowState(nextState);
  };

  const handleBrutalFriendClose = () => {
    // End session flow
    const nextState = endSessionFlow(flowState);
    setFlowState(nextState);
  };

  // Determine if manual check-in button should be shown
  const showManualCheckIn = !flowState.isActive && profileFetched && statusFetched && !profileLoading && !statusLoading;

  // Always render a valid UI, even if identity is temporarily unavailable
  if (!identity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-sm border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground font-bold uppercase tracking-wider">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header onLogout={handleLogout} />

      {/* Centralized Session Flow Modals */}
      <DailyCheckInDialog
        open={flowState.currentModal === ModalType.DAILY_CHECKIN}
        onClose={handleModalClose}
        onSubmit={handleDailyCheckInSubmit}
        isSubmitting={submitCheckIn.isPending}
      />

      <RepeatCheckInDialog
        open={flowState.currentModal === ModalType.REPEAT_CHECKIN}
        onClose={handleModalClose}
        onStillSober={handleRepeatCheckInStillSober}
        onDrank={handleRepeatCheckInDrank}
        isSubmitting={submitFollowUpCheckIn.isPending}
      />

      <DataLoggedDialog
        open={flowState.currentModal === ModalType.DATA_LOGGED}
        onClose={handleDataLoggedClose}
        message={flowState.dataLoggedMessage}
        variant={flowState.phase === SessionPhase.FIRST_CHECKIN ? 'primary' : 'secondary'}
      />

      <BrutalFriendDialog
        open={flowState.currentModal === ModalType.BRUTAL_FRIEND}
        onClose={handleBrutalFriendClose}
        message={flowState.brutalFriendMessage}
      />

      {/* Follow-up Check-in Dialog (outside main flow, not currently triggered) */}
      <FollowUpCheckInDialog
        open={showFollowUp}
        onClose={() => setShowFollowUp(false)}
        onRemainedSober={handleFollowUpRemainedSober}
        onHadMoreDrinks={handleFollowUpHadMoreDrinks}
        isSubmitting={submitFollowUpCheckIn.isPending}
      />

      {/* Beer Donation Dialog */}
      <BeerDonationDialog
        open={showBeerDonation}
        onClose={() => setShowBeerDonation(false)}
        address={DONATION_ADDRESS}
      />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-1 max-w-7xl">
        {/* Manual Check-In and Beer Donation Buttons */}
        {showManualCheckIn && (
          <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 sm:gap-3">
            <Button
              onClick={handleManualCheckIn}
              size="lg"
              className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider shadow-neon-sm"
            >
              <Plus className="w-5 h-5 mr-2" />
              CHECK IN
            </Button>
            <Button
              onClick={handleBeerDonation}
              size="lg"
              variant="outline"
              className="flex-1 sm:flex-initial border-2 border-primary hover:bg-primary hover:text-primary-foreground font-bold uppercase tracking-wider shadow-neon-sm"
            >
              <Beer className="w-5 h-5 mr-2" />
              BUY ME A BEER
            </Button>
          </div>
        )}

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
          <SoberDaysSection metrics={metrics} soberDaysTarget={soberDaysTarget} />

          {/* 4. Status Indicators Section - Weekly Average, Yesterday, Today */}
          <StatusIndicatorsSection chartData={chartData} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border py-4 sm:py-6 bg-card mt-auto">
        <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            {/* Copyright */}
            <div className="text-xs sm:text-sm text-muted-foreground font-mono text-center sm:text-left">
              © 2026. Built with <Heart className="inline w-3 h-3 sm:w-4 sm:h-4 text-primary" /> using{' '}
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
