// Centralized Daily Session Flow Controller
// This module provides a deterministic state machine for managing daily session dialogs

export enum SessionPhase {
  ONBOARDING = 'ONBOARDING',
  FIRST_CHECKIN = 'FIRST_CHECKIN',
  REPEAT_CHECKIN = 'REPEAT_CHECKIN',
  IDLE = 'IDLE',
}

export enum ModalType {
  ONBOARDING = 'ONBOARDING',
  DAILY_CHECKIN = 'DAILY_CHECKIN',
  REPEAT_CHECKIN = 'REPEAT_CHECKIN',
  DATA_LOGGED = 'DATA_LOGGED',
  BRUTAL_FRIEND = 'BRUTAL_FRIEND',
}

export interface SessionStatus {
  needsOnboarding: boolean;
  hasCompletedOnboarding: boolean;
  dailyCheckInsToday: number;
}

/**
 * Resolves the current session phase based on user profile and daily status
 */
export function resolveSessionPhase(status: SessionStatus): SessionPhase {
  // First-ever app use: onboarding required
  if (status.needsOnboarding || !status.hasCompletedOnboarding) {
    return SessionPhase.ONBOARDING;
  }

  // First check-in of the day
  if (status.dailyCheckInsToday === 0) {
    return SessionPhase.FIRST_CHECKIN;
  }

  // Subsequent check-ins same day
  if (status.dailyCheckInsToday >= 1) {
    return SessionPhase.REPEAT_CHECKIN;
  }

  // Default: no action needed
  return SessionPhase.IDLE;
}

/**
 * Generates a deterministic FIFO modal queue based on the session phase
 */
export function generateModalQueue(phase: SessionPhase): ModalType[] {
  switch (phase) {
    case SessionPhase.ONBOARDING:
      // Onboarding → immediately proceed to first daily check-in
      // (Onboarding component handles its own flow, then triggers FIRST_CHECKIN)
      return [ModalType.ONBOARDING];

    case SessionPhase.FIRST_CHECKIN:
      // Daily Check-In → Data Logged (primary) → Brutal Friend
      return [
        ModalType.DAILY_CHECKIN,
        ModalType.DATA_LOGGED,
        ModalType.BRUTAL_FRIEND,
      ];

    case SessionPhase.REPEAT_CHECKIN:
      // Repeat Check-In → Data Logged (secondary) → Brutal Friend
      return [
        ModalType.REPEAT_CHECKIN,
        ModalType.DATA_LOGGED,
        ModalType.BRUTAL_FRIEND,
      ];

    case SessionPhase.IDLE:
    default:
      return [];
  }
}

/**
 * Session flow controller state
 */
export interface SessionFlowState {
  phase: SessionPhase;
  queue: ModalType[];
  currentModal: ModalType | null;
  currentIndex: number;
  isActive: boolean;
  brutalFriendMessage: string;
  dataLoggedMessage: string;
}

/**
 * Creates initial session flow state
 */
export function createInitialFlowState(): SessionFlowState {
  return {
    phase: SessionPhase.IDLE,
    queue: [],
    currentModal: null,
    currentIndex: -1,
    isActive: false,
    brutalFriendMessage: '',
    dataLoggedMessage: '',
  };
}

/**
 * Starts a new session flow with the given phase
 */
export function startSessionFlow(phase: SessionPhase): SessionFlowState {
  const queue = generateModalQueue(phase);
  return {
    phase,
    queue,
    currentModal: queue.length > 0 ? queue[0] : null,
    currentIndex: queue.length > 0 ? 0 : -1,
    isActive: queue.length > 0,
    brutalFriendMessage: '',
    dataLoggedMessage: '',
  };
}

/**
 * Advances to the next modal in the queue
 */
export function advanceToNextModal(state: SessionFlowState): SessionFlowState {
  if (!state.isActive || state.currentIndex >= state.queue.length - 1) {
    // End of queue
    return {
      ...state,
      currentModal: null,
      currentIndex: -1,
      isActive: false,
    };
  }

  const nextIndex = state.currentIndex + 1;
  return {
    ...state,
    currentModal: state.queue[nextIndex],
    currentIndex: nextIndex,
  };
}

/**
 * Updates the brutal friend message in the flow state
 */
export function setBrutalFriendMessage(
  state: SessionFlowState,
  message: string
): SessionFlowState {
  return {
    ...state,
    brutalFriendMessage: message,
  };
}

/**
 * Updates the data logged message in the flow state
 */
export function setDataLoggedMessage(
  state: SessionFlowState,
  message: string
): SessionFlowState {
  return {
    ...state,
    dataLoggedMessage: message,
  };
}

/**
 * Ends the current session flow
 */
export function endSessionFlow(state: SessionFlowState): SessionFlowState {
  return {
    ...state,
    currentModal: null,
    currentIndex: -1,
    isActive: false,
    brutalFriendMessage: '',
    dataLoggedMessage: '',
  };
}
