import List "mo:core/List";
import Map "mo:core/Map";
import Nat64 "mo:core/Nat64";
import Principal "mo:core/Principal";

module {
  type Mood = { #happy; #neutral; #sad };
  type MotivationLens = { #family; #money; #sex; #health; #sport };
  type DrinkingBaseline = { #low; #medium; #high; #avoidant };

  type AggregatedEntry = {
    date : Nat64;
    sober : Bool;
    drinks : Nat;
    mood : ?Mood;
    checkInCount : Nat;
  };

  type OnboardingAnswers = {
    ageRange : Text;
    drinksPerWeek : Text;
    motivation : MotivationLens;
    secondarySubstance : ?Text;
    sobrietyDuration : Text;
    timeZone : Text;
    baselineTier : DrinkingBaseline;
  };

  type OldPersistentUserProfile = {
    onboardingAnswers : OnboardingAnswers;
    hasCompletedOnboarding : Bool;
    lastCheckInDate : ?Nat64;
    currentDayCheckInStatus : ?Bool;
    aggregatedEntries : List.List<AggregatedEntry>;
    currentDayTotalDrinks : Nat;
    lastBrutalFriendFeedback : Text;
    motivationButtonClicks : Nat;
    lastMotivationClickDay : Nat64;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, OldPersistentUserProfile>;
  };

  type NewPersistentUserProfile = OldPersistentUserProfile;
  type NewActor = {
    userProfiles : Map.Map<Principal, NewPersistentUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
