import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DayCheckInResponse {
    date: bigint;
    message: string;
    totalDrinks: bigint;
    feedbackMatrixEntry: FeedbackMatrixEntry;
    isFollowUp: boolean;
}
export interface DayCheckinStatus {
    _firstCheckTime?: bigint;
    hasCheckedIn: boolean;
    numberOfChecks: bigint;
    drinks: bigint;
}
export interface OnboardingAnswers {
    drinksPerWeek: string;
    secondarySubstance?: string;
    baselineTier: DrinkingBaseline;
    sobrietyDuration: string;
    ageRange: string;
    motivation: MotivationLens;
    timeZone: string;
}
export interface CheckInEntry {
    date: bigint;
    mood?: Mood;
    sober: boolean;
    drinks: bigint;
}
export interface AggregatedEntry {
    date: bigint;
    mood?: Mood;
    sober: boolean;
    checkInCount: bigint;
    drinks: bigint;
}
export interface FeedbackMatrixEntry {
    secondarySubstance?: string;
    baselineTier: DrinkingBaseline;
    isWeekend?: boolean;
    ageRange: string;
    daysUntilFullMoon?: bigint;
    streakRatio?: string;
    message: string;
    motivation: MotivationLens;
    chanceOfDrinkingTomorrow?: string;
}
export interface UserProfile {
    lastCheckInDate?: bigint;
    onboardingAnswers: OnboardingAnswers;
    currentDayCheckInStatus?: DayCheckinStatus;
    hasCompletedOnboarding: boolean;
}
export enum DrinkingBaseline {
    low = "low",
    high = "high",
    avoidant = "avoidant",
    medium = "medium"
}
export enum Mood {
    sad = "sad",
    happy = "happy",
    neutral = "neutral"
}
export enum MotivationLens {
    sex = "sex",
    money = "money",
    sport = "sport",
    family = "family",
    health = "health"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addFeedbackMatrixEntry(entry: FeedbackMatrixEntry): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkOnboardingAndCheckInStatus(): Promise<{
        needsDailyCheckIn: boolean;
        isFirstLoginOfDay: boolean;
        isDailyCheckInCompleted: boolean;
        needsOnboarding: boolean;
        lastLoginWasSober: bigint;
        soberDaysTarget: bigint;
        needsFollowUp: boolean;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
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
    getSoberDaysTarget(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserTimeZone(): Promise<string>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitCheckIn(entry: CheckInEntry): Promise<DayCheckInResponse>;
    submitFollowUpCheckIn(drinks: bigint): Promise<DayCheckInResponse>;
}
