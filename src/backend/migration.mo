import Map "mo:core/Map";
import Principal "mo:core/Principal";
import List "mo:core/List";

module {
  type Mood = { #happy; #neutral; #sad };

  type OnboardingAnswers = {
    ageRange : Text;
    drinksPerWeek : Text;
    motivation : Text;
    secondarySubstance : Text;
    sobrietyDuration : Text;
    timeZone : Text;
  };

  type AggregatedEntry = {
    date : Nat64;
    sober : Bool;
    drinks : Nat;
    mood : ?Mood;
    checkInCount : Nat;
  };

  type PersistentUserProfile = {
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

  // Migration logic: no changes to the state, just carry over
  type Actor = {
    userProfiles : Map.Map<Principal, PersistentUserProfile>;
  };

  public func run(state : Actor) : Actor {
    state;
  };
};
