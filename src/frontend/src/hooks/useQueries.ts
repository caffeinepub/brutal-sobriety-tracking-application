import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { PersistentUserProfileView, CheckInEntry, AggregatedEntry, RepeatCheckInReason, OnboardingAnswers } from '../backend';

const RETRY_CONFIG = {
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
};

export function useCheckOnboardingAndCheckInStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  const actorInitialized = !!actor && !actorFetching;

  return useQuery<{
    needsOnboarding: boolean;
    needsDailyCheckIn: boolean;
    isDailyCheckInCompleted: boolean;
    isFirstLoginOfDay: boolean;
    lastLoginWasSober: bigint;
    needsFollowUp: boolean;
    dailyCheckInsToday: bigint;
  }>({
    queryKey: ['onboardingCheckInStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        console.log('Checking onboarding and check-in status...');
        const result = await actor.checkOnboardingAndCheckInStatus();
        console.log('Status check result:', result);
        return result;
      } catch (error) {
        console.error('Failed to check onboarding and check-in status:', error);
        throw error;
      }
    },
    enabled: actorInitialized,
    ...RETRY_CONFIG,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const actorInitialized = !!actor && !actorFetching;

  const query = useQuery<PersistentUserProfileView | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        console.log('Fetching user profile...');
        const result = await actor.getCallerUserProfile();
        console.log('User profile fetched:', result);
        return result;
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        throw error;
      }
    },
    enabled: actorInitialized,
    ...RETRY_CONFIG,
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: actorInitialized && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: PersistentUserProfileView) => {
      if (!actor) {
        throw new Error('Backend connection not ready. Please wait and try again.');
      }
      
      console.log('Saving user profile...', profile);
      
      // Retry logic for save operation
      let lastError: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await actor.saveCallerUserProfile(profile);
          console.log('Profile saved successfully');
          return;
        } catch (error) {
          lastError = error;
          console.error(`Save attempt ${attempt + 1} failed:`, error);
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
      }
      
      throw lastError || new Error('Failed to save profile after multiple attempts');
    },
    onSuccess: () => {
      console.log('Profile save successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['onboardingCheckInStatus'] });
    },
    onError: (error) => {
      console.error('Profile save mutation error:', error);
    },
  });
}

export function useCompleteOnboarding() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (answers: OnboardingAnswers) => {
      if (!actor) {
        throw new Error('Backend connection not ready. Please wait and try again.');
      }
      
      console.log('Completing onboarding...', answers);
      const result = await actor.completeOnboarding(answers);
      console.log('Onboarding completed successfully:', result);
      return result;
    },
    onSuccess: () => {
      console.log('Onboarding successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['onboardingCheckInStatus'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error) => {
      console.error('Onboarding completion error:', error);
    },
  });
}

export function useSubmitCheckIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { date: bigint; sober: boolean; drinks: bigint; mood: any }) => {
      if (!actor) {
        throw new Error('Backend connection not ready. Please wait and try again.');
      }
      
      const entry: CheckInEntry = {
        date: params.date,
        sober: params.sober,
        drinks: params.drinks,
        mood: params.mood,
      };
      
      console.log('Submitting check-in...', entry);
      const result = await actor.submitCheckIn(entry);
      console.log('Check-in submitted successfully:', result);
      return result;
    },
    onSuccess: () => {
      console.log('Check-in successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['last14Days'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['progressMetrics'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['moodTrend'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['onboardingCheckInStatus'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['latestBrutalFriendFeedback'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'], refetchType: 'active' });
    },
  });
}

export function useSubmitRepeatCheckIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reason: RepeatCheckInReason) => {
      if (!actor) {
        throw new Error('Backend connection not ready. Please wait and try again.');
      }
      
      console.log('Submitting repeat check-in...', reason);
      await actor.submitRepeatCheckIn(reason);
      console.log('Repeat check-in submitted successfully');
      
      // Fetch the latest brutal friend feedback after submission
      const feedback = await actor.getLatestBrutalFriendFeedback();
      return feedback;
    },
    onSuccess: () => {
      console.log('Repeat check-in successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['onboardingCheckInStatus'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['latestBrutalFriendFeedback'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'], refetchType: 'active' });
    },
  });
}

export function useSubmitFollowUpCheckIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (drinks: bigint) => {
      if (!actor) {
        throw new Error('Backend connection not ready. Please wait and try again.');
      }
      
      console.log('Submitting follow-up check-in...', drinks);
      const result = await actor.submitFollowUpCheckIn(drinks);
      console.log('Follow-up check-in submitted successfully:', result);
      return result;
    },
    onSuccess: () => {
      console.log('Follow-up check-in successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['last14Days'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['progressMetrics'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['moodTrend'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['onboardingCheckInStatus'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['latestBrutalFriendFeedback'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'], refetchType: 'active' });
    },
  });
}

export function useGetLast14Days() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AggregatedEntry[]>({
    queryKey: ['last14Days'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLast14Days();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetProgressMetrics() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<{
    soberDays: bigint;
    drankDays: bigint;
    currentStreak: bigint;
    totalCheckIns: bigint;
    last14Days: AggregatedEntry[];
  }>({
    queryKey: ['progressMetrics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getProgressMetrics();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetMoodTrend() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['moodTrend'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getMoodTrend();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetLatestBrutalFriendFeedback() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string>({
    queryKey: ['latestBrutalFriendFeedback'],
    queryFn: async () => {
      if (!actor) return '';
      return actor.getLatestBrutalFriendFeedback();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetMotivationMessage() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) {
        throw new Error('Backend connection not ready. Please wait and try again.');
      }
      
      console.log('Getting motivation message...');
      const result = await actor.getMotivationMessage();
      console.log('Motivation message received:', result);
      return result;
    },
  });
}

export function useSetStreakTarget() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTarget: number) => {
      if (!actor) {
        throw new Error('Backend connection not ready. Please wait and try again.');
      }
      
      console.log('Setting new streak target...', newTarget);
      await actor.setStreakTarget(BigInt(newTarget));
      console.log('Streak target set successfully');
    },
    onSuccess: () => {
      console.log('Streak target update successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['onboardingCheckInStatus'], refetchType: 'active' });
    },
  });
}

export function useMarkAchievementAsShown() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) {
        throw new Error('Backend connection not ready. Please wait and try again.');
      }
      
      console.log('Marking achievement as shown...');
      await actor.markAchievementAsShown();
      console.log('Achievement marked as shown successfully');
    },
    onSuccess: () => {
      console.log('Achievement marked, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'], refetchType: 'active' });
    },
  });
}
