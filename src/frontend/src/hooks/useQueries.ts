import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, CheckInEntry, AggregatedEntry } from '../backend';

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
    soberDaysTarget: bigint;
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

  const query = useQuery<UserProfile | null>({
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
    mutationFn: async (profile: UserProfile) => {
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
      queryClient.invalidateQueries({ queryKey: ['soberDaysTarget'] });
    },
    onError: (error) => {
      console.error('Profile save mutation error:', error);
    },
  });
}

export function useSubmitCheckIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { 
      date: bigint; 
      sober: boolean; 
      drinks: bigint; 
      mood: any;
    }) => {
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
      
      // Submit to backend
      const result = await actor.submitCheckIn(entry);
      console.log('Check-in submitted successfully:', result);
      
      // Cache the message from backend response if available
      if (result.message && result.message.trim() !== '') {
        queryClient.setQueryData(['latestBrutalFriendFeedback'], result.message);
        console.log('Cached backend message:', result.message);
      }
      
      return result;
    },
    onSuccess: () => {
      console.log('Check-in successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['last14Days'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['progressMetrics'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['moodTrend'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['onboardingCheckInStatus'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['latestBrutalFriendFeedback'], refetchType: 'active' });
    },
  });
}

export function useSubmitFollowUpCheckIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { 
      drinks: bigint;
    }) => {
      if (!actor) {
        throw new Error('Backend connection not ready. Please wait and try again.');
      }
      
      console.log('Submitting follow-up check-in...', params.drinks);
      const result = await actor.submitFollowUpCheckIn(params.drinks);
      console.log('Follow-up check-in submitted successfully:', result);
      
      // Cache the message from backend response if available
      if (result.message && result.message.trim() !== '') {
        queryClient.setQueryData(['latestBrutalFriendFeedback'], result.message);
        console.log('Cached backend message:', result.message);
      }
      
      return result;
    },
    onSuccess: () => {
      console.log('Follow-up check-in successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['last14Days'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['progressMetrics'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['moodTrend'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['onboardingCheckInStatus'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['latestBrutalFriendFeedback'], refetchType: 'active' });
    },
  });
}

export function useGetLast14Days() {
  const { actor, isFetching: actorFetching } = useActor();
  const actorInitialized = !!actor && !actorFetching;

  return useQuery<AggregatedEntry[]>({
    queryKey: ['last14Days'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const result = await actor.getLast14Days();
        return result;
      } catch (error) {
        console.error('Failed to fetch last 14 days:', error);
        return [];
      }
    },
    enabled: actorInitialized,
    refetchOnMount: 'always',
    staleTime: 0,
    ...RETRY_CONFIG,
  });
}

export function useGetProgressMetrics() {
  const { actor, isFetching: actorFetching } = useActor();
  const actorInitialized = !!actor && !actorFetching;

  return useQuery<{
    soberDays: bigint;
    drankDays: bigint;
    currentStreak: bigint;
    totalCheckIns: bigint;
  }>({
    queryKey: ['progressMetrics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getProgressMetrics();
      } catch (error) {
        console.error('Failed to fetch progress metrics:', error);
        throw error;
      }
    },
    enabled: actorInitialized,
    refetchOnMount: 'always',
    ...RETRY_CONFIG,
  });
}

export function useGetMoodTrend() {
  const { actor, isFetching: actorFetching } = useActor();
  const actorInitialized = !!actor && !actorFetching;

  return useQuery<bigint>({
    queryKey: ['moodTrend'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      try {
        return await actor.getMoodTrend();
      } catch (error) {
        console.error('Failed to fetch mood trend:', error);
        return BigInt(0);
      }
    },
    enabled: actorInitialized,
    refetchOnMount: 'always',
    ...RETRY_CONFIG,
  });
}

export function useGetLatestBrutalFriendFeedback() {
  const { actor, isFetching: actorFetching } = useActor();
  const actorInitialized = !!actor && !actorFetching;

  return useQuery<string>({
    queryKey: ['latestBrutalFriendFeedback'],
    queryFn: async () => {
      if (!actor) return '';
      try {
        // Fetch the latest feedback from backend
        const result = await actor.getLatestBrutalFriendFeedback();
        console.log('Fetched latest brutal friend feedback from backend:', result);
        return result || '';
      } catch (error) {
        console.error('Failed to fetch latest brutal friend feedback:', error);
        return '';
      }
    },
    enabled: actorInitialized,
    staleTime: 0,
    refetchOnMount: 'always',
    ...RETRY_CONFIG,
  });
}

export function useGetMotivationMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) {
        throw new Error('Backend connection not ready. Please wait and try again.');
      }
      try {
        const result = await actor.getMotivationMessage();
        
        // Cache the message from backend in React Query cache if not limit reached
        if (!result.isLimitReached && result.message && result.message.trim() !== '') {
          queryClient.setQueryData(['cachedMotivationMessage'], result.message);
        }
        
        return result;
      } catch (error) {
        console.error('Failed to fetch motivation message:', error);
        throw error;
      }
    },
  });
}

export function useGetSoberDaysTarget() {
  const { actor, isFetching: actorFetching } = useActor();
  const actorInitialized = !!actor && !actorFetching;

  return useQuery<bigint>({
    queryKey: ['soberDaysTarget'],
    queryFn: async () => {
      if (!actor) return BigInt(30);
      try {
        const result = await actor.getSoberDaysTarget();
        console.log('Sober days target fetched:', result);
        return result;
      } catch (error) {
        console.error('Failed to fetch sober days target:', error);
        return BigInt(30);
      }
    },
    enabled: actorInitialized,
    refetchOnMount: 'always',
    staleTime: 5 * 60 * 1000,
    ...RETRY_CONFIG,
  });
}
