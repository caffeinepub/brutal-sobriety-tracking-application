import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useCheckOnboardingAndCheckInStatus } from './hooks/useQueries';
import { useActor } from './hooks/useActor';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import OnboardingFlow from './components/OnboardingFlow';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { WifiOff } from 'lucide-react';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const [showLogin, setShowLogin] = useState(false);
  const [statusTimeout, setStatusTimeout] = useState(false);
  const [connectionRetries, setConnectionRetries] = useState(0);

  const isAuthenticated = !!identity;
  const actorInitialized = !!actor && !actorFetching;

  // Status query with error handling
  const { 
    data: status, 
    isLoading: statusLoading, 
    isFetched: statusFetched,
    error: statusError 
  } = useCheckOnboardingAndCheckInStatus();

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

  // Status loading timeout: proceed after 3 seconds even if status query hasn't resolved
  useEffect(() => {
    if (!isAuthenticated || !statusLoading) return;

    const timeout = setTimeout(() => {
      setStatusTimeout(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, statusLoading]);

  // Handle status fetch errors
  useEffect(() => {
    if (statusError) {
      console.error('Status fetch error:', statusError);
      toast.error('Failed to load status. Please try refreshing.');
      setStatusTimeout(true);
    }
  }, [statusError]);

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
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-sm border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="text-muted-foreground font-bold uppercase tracking-wider">Loading...</p>
              </div>
            </div>
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

  // After actor initialization, check status with timeout fail-safe
  const shouldShowLoading = !statusFetched && statusLoading && !statusTimeout;

  if (shouldShowLoading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <GlobalErrorBoundary>
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-sm border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="text-muted-foreground font-bold uppercase tracking-wider">Loading...</p>
            </div>
          </div>
        </GlobalErrorBoundary>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Determine flow based on status
  // If timeout occurred or error, assume needs onboarding
  const needsOnboarding = status?.needsOnboarding ?? true;

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
