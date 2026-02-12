import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type AggregatedEntry = {
    date : Nat64;
    sober : Bool;
    drinks : Nat;
    mood : ?{ #happy; #neutral; #sad };
    checkInCount : Nat;
  };

  type RepeatCheckIn = {
    timestamp : Nat64;
    reason : { #reflection; #urge; #bored; #habit; #curiosity };
  };

  type OnboardingAnswers = {
    ageRange : Text;
    drinksPerWeek : Text;
    motivation : Text;
    secondarySubstance : Text;
    sobrietyDuration : Text;
    timeZone : Text;
  };

  type OldPersistentUserProfile = {
    onboardingAnswers : ?OnboardingAnswers;
    hasCompletedOnboarding : Bool;
    lastCheckInDate : ?Nat64;
    currentDayCheckInStatus : ?Bool;
    aggregatedEntries : List.List<AggregatedEntry>;
    repeatCheckIns : List.List<RepeatCheckIn>;
    currentDayTotalDrinks : Nat;
    lastBrutalFriendFeedback : Text;
    motivationButtonClicks : Nat;
    lastMotivationClickDay : Nat64;
    initialSyncCompleted : Bool;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, OldPersistentUserProfile>;
  };

  type NewPersistentUserProfile = {
    onboardingAnswers : ?OnboardingAnswers;
    hasCompletedOnboarding : Bool;
    lastCheckInDate : ?Nat64;
    currentDayCheckInStatus : ?Bool;
    aggregatedEntries : List.List<AggregatedEntry>;
    repeatCheckIns : List.List<RepeatCheckIn>;
    currentDayTotalDrinks : Nat;
    lastBrutalFriendFeedback : Text;
    motivationButtonClicks : Nat;
    lastMotivationClickDay : Nat64;
    initialSyncCompleted : Bool;
    streakTarget : Nat;
    achievementShownForThisTarget : Bool;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, NewPersistentUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserProfiles = old.userProfiles.map<Principal, OldPersistentUserProfile, NewPersistentUserProfile>(
      func(_principal, oldProfile) {
        {
          oldProfile with
          streakTarget = 7;
          achievementShownForThisTarget = false;
        };
      }
    );
    { userProfiles = newUserProfiles };
  };
};
