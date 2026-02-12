import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useCheckOnboardingAndCheckInStatus, useGetCallerUserProfile, useSaveCallerUserProfile } from './hooks/useQueries';
import { useActor } from './hooks/useActor';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import OnboardingFlow from './components/OnboardingFlow';
import FullScreenLoading from './components/FullScreenLoading';
import FullScreenStatusError from './components/FullScreenStatusError';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { WifiOff } from 'lucide-react';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { identifyUser, trackEvent, trackPageView, getInitialSyncDedupeKey } from './utils/usergeek';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const [showLogin, setShowLogin] = useState(false);
  const [connectionRetries, setConnectionRetries] = useState(0);

  const isAuthenticated = !!identity;
  const actorInitialized = !!actor && !actorFetching;

  // Status query with error handling
  const { 
    data: status, 
    isLoading: statusLoading, 
    isFetched: statusFetched,
    error: statusError,
    refetch: refetchStatus
  } = useCheckOnboardingAndCheckInStatus();

  // User profile query
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  // Save profile mutation
  const { mutate: saveProfile } = useSaveCallerUserProfile();

  // Track identification and initial sync
  const identifiedRef = useRef(false);
  const initialSyncAttemptedRef = useRef(false);

  // Identify user after authentication and profile load
  useEffect(() => {
    if (!isAuthenticated || !identity || identifiedRef.current) return;
    if (!actorInitialized || profileLoading || !profileFetched) return;

    const userId = identity.getPrincipal().toString();

    // Identify user with profile properties
    const profileProperties: Record<string, any> = {};
    if (userProfile?.onboardingAnswers) {
      const answers = userProfile.onboardingAnswers;
      if (answers.ageRange) profileProperties.ageRange = answers.ageRange;
      if (answers.drinksPerWeek) profileProperties.drinksPerWeek = answers.drinksPerWeek;
      if (answers.motivation) profileProperties.motivation = answers.motivation;
      if (answers.secondarySubstance) profileProperties.secondarySubstance = answers.secondarySubstance;
      if (answers.sobrietyDuration) profileProperties.sobrietyGoal = answers.sobrietyDuration;
      if (answers.timeZone) profileProperties.timezone = answers.timeZone;
    }

    identifyUser(userId, profileProperties);
    identifiedRef.current = true;
  }, [isAuthenticated, identity, actorInitialized, profileLoading, profileFetched, userProfile]);

  // Handle initial sync for returning users
  useEffect(() => {
    if (!isAuthenticated || !identity || initialSyncAttemptedRef.current) return;
    if (!actorInitialized || profileLoading || !profileFetched || !userProfile) return;

    const userId = identity.getPrincipal().toString();

    // Check if user has completed onboarding and initial sync not yet done
    if (userProfile.hasCompletedOnboarding && !userProfile.initialSyncCompleted) {
      const dedupeKey = getInitialSyncDedupeKey(userId);

      // Fire initial sync event
      trackEvent('Initial Sync', {
        hasOnboarding: true,
        hasStreak: userProfile.aggregatedEntries && userProfile.aggregatedEntries.length > 0,
      }, dedupeKey);

      // Update profile to mark initial sync as completed
      const updatedProfile = {
        ...userProfile,
        initialSyncCompleted: true,
      };

      saveProfile(updatedProfile, {
        onSuccess: () => {
          console.log('Initial sync flag persisted successfully');
        },
        onError: (error) => {
          console.error('Failed to persist initial sync flag:', error);
        },
      });

      initialSyncAttemptedRef.current = true;
    } else {
      // No initial sync needed
      initialSyncAttemptedRef.current = true;
    }
  }, [isAuthenticated, identity, actorInitialized, profileLoading, profileFetched, userProfile, saveProfile]);

  // Track page view for onboarding
  useEffect(() => {
    if (isAuthenticated && status?.needsOnboarding) {
      trackPageView('Onboarding', '/onboarding');
    }
  }, [isAuthenticated, status?.needsOnboarding]);

  // Track page view for dashboard
  useEffect(() => {
    if (isAuthenticated && status && !status.needsOnboarding) {
      trackPageView('Dashboard', '/dashboard');
    }
  }, [isAuthenticated, status]);

  // Fallback timeout: show login after 3 seconds max, even if still initializing
  useEffect(() => {
    if (isAuthenticated) return;

    const timeout = setTimeout(() => {
      setShowLogin(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isAuthenticated]);

  // Show login immediately if initialization completes quickly
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      setShowLogin(true);
    }
  }, [isInitializing, isAuthenticated]);

  // Monitor actor connection attempts
  useEffect(() => {
    if (isAuthenticated && !actor && !actorFetching) {
      setConnectionRetries(prev => prev + 1);
      if (connectionRetries >= 3) {
        console.error('Actor connection failed after multiple attempts');
        toast.error('Connection failed. Please refresh the page.');
      }
    }
  }, [isAuthenticated, actor, actorFetching, connectionRetries]);

  // Show login page if not authenticated (with fallback timeout)
  if (!isAuthenticated) {
    if (!showLogin && isInitializing) {
      // Brief loading state with timeout fallback
      return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <GlobalErrorBoundary>
            <FullScreenLoading />
          </GlobalErrorBoundary>
          <Toaster />
        </ThemeProvider>
      );
    }

    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <GlobalErrorBoundary>
          <LoginPage />
        </GlobalErrorBoundary>
        <Toaster />
      </ThemeProvider>
    );
  }

  // After authentication, check actor initialization
  if (!actorInitialized) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <GlobalErrorBoundary>
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-sm border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="text-muted-foreground font-bold uppercase tracking-wider mb-2">
                Connecting to backend...
              </p>
              <p className="text-xs text-muted-foreground">
                Establishing secure connection
              </p>
            </div>
          </div>
        </GlobalErrorBoundary>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show error state if connection failed after retries
  if (connectionRetries >= 3 && !actor) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <GlobalErrorBoundary>
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <WifiOff className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-black uppercase tracking-tight text-destructive mb-2">
                CONNECTION FAILED
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                Unable to connect to the backend after multiple attempts.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-wider border-2 border-primary hover:bg-primary/90 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </GlobalErrorBoundary>
        <Toaster />
      </ThemeProvider>
    );
  }

  // After actor initialization, wait for status to resolve
  // Show loading spinner while status is loading (no timeout fallback)
  if (!statusFetched || statusLoading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <GlobalErrorBoundary>
          <FullScreenLoading />
        </GlobalErrorBoundary>
        <Toaster />
      </ThemeProvider>
    );
  }

  // If status query errored, show error UI with retry
  if (statusError) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <GlobalErrorBoundary>
          <FullScreenStatusError onRetry={() => refetchStatus()} />
        </GlobalErrorBoundary>
        <Toaster />
      </ThemeProvider>
    );
  }

  // At this point, status is successfully fetched
  // Determine flow based on status - no fallback, we have the real value
  const needsOnboarding = status?.needsOnboarding ?? false;

  if (needsOnboarding) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <GlobalErrorBoundary>
          <OnboardingFlow />
        </GlobalErrorBoundary>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show dashboard - check-in dialogs are now only rendered in Dashboard component
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <GlobalErrorBoundary>
        <Dashboard />
      </GlobalErrorBoundary>
      <Toaster />
    </ThemeProvider>
  );
}
