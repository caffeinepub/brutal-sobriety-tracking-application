import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CheckInEntry {
    date: bigint;
    mood?: Mood;
    sober: boolean;
    drinks: bigint;
}
export interface OnboardingAnswers {
    drinksPerWeek: string;
    secondarySubstance: string;
    sobrietyDuration: string;
    ageRange: string;
    motivation: string;
    timeZone: string;
}
export interface PersistentUserProfileView {
    lastCheckInDate?: bigint;
    aggregatedEntries: Array<AggregatedEntry>;
    lastMotivationClickDay: bigint;
    motivationButtonClicks: bigint;
    onboardingAnswers: OnboardingAnswers;
    lastBrutalFriendFeedback: string;
    repeatCheckIns: Array<RepeatCheckIn>;
    currentDayCheckInStatus?: boolean;
    hasCompletedOnboarding: boolean;
    currentDayTotalDrinks: bigint;
}
export interface RepeatCheckIn {
    timestamp: bigint;
    reason: RepeatCheckInReason;
}
export interface AggregatedEntry {
    date: bigint;
    mood?: Mood;
    sober: boolean;
    checkInCount: bigint;
    drinks: bigint;
}
export enum Mood {
    sad = "sad",
    happy = "happy",
    neutral = "neutral"
}
export enum RepeatCheckInReason {
    habit = "habit",
    urge = "urge",
    curiosity = "curiosity",
    bored = "bored",
    reflection = "reflection"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkOnboardingAndCheckInStatus(): Promise<{
        needsDailyCheckIn: boolean;
        isFirstLoginOfDay: boolean;
        isDailyCheckInCompleted: boolean;
        needsOnboarding: boolean;
        dailyCheckInsToday: bigint;
        lastLoginWasSober: bigint;
        needsFollowUp: boolean;
    }>;
    getCallerUserProfile(): Promise<PersistentUserProfileView | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLast14Days(): Promise<Array<AggregatedEntry>>;
    getLatestBrutalFriendFeedback(): Promise<string>;
    getMoodTrend(): Promise<bigint>;
    getMotivationMessage(): Promise<{
        remainingClicks: bigint;
        message: string;
        isLimitReached: boolean;
    }>;
    getProgressMetrics(): Promise<{
        last14Days: Array<AggregatedEntry>;
        drankDays: bigint;
        soberDays: bigint;
        totalCheckIns: bigint;
        currentStreak: bigint;
    }>;
    getUserProfile(user: Principal): Promise<PersistentUserProfileView | null>;
    getUserTimeZone(): Promise<string>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: PersistentUserProfileView): Promise<void>;
    submitCheckIn(entry: CheckInEntry): Promise<{
        date: bigint;
        message: string;
        totalDrinks: bigint;
    }>;
    submitFollowUpCheckIn(drinks: bigint): Promise<string>;
    submitRepeatCheckIn(reason: RepeatCheckInReason): Promise<void>;
}
