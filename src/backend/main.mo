import List "mo:core/List";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Nat64 "mo:core/Nat64";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Mood = { #happy; #neutral; #sad };

  public type MotivationLens = { #family; #money; #sex; #health; #sport };
  public type DrinkingBaseline = { #low; #medium; #high; #avoidant };

  public type FeedbackMatrixEntry = {
    ageRange : Text;
    motivation : MotivationLens;
    baselineTier : DrinkingBaseline;
    secondarySubstance : ?Text;
    streakRatio : ?Text;
    isWeekend : ?Bool;
    daysUntilFullMoon : ?Nat;
    chanceOfDrinkingTomorrow : ?Text;
    message : Text;
  };

  public type OnboardingAnswers = {
    ageRange : Text;
    drinksPerWeek : Text;
    motivation : MotivationLens;
    secondarySubstance : ?Text;
    sobrietyDuration : Text;
    timeZone : Text;
    baselineTier : DrinkingBaseline;
  };

  type CheckInEntry = {
    date : Nat64;
    sober : Bool;
    drinks : Nat;
    mood : ?Mood;
  };

  type AggregatedEntry = {
    date : Nat64;
    sober : Bool;
    drinks : Nat;
    mood : ?Mood;
    checkInCount : Nat;
  };

  module AggregatedEntry {
    public func compareByDate(a : AggregatedEntry, b : AggregatedEntry) : Order.Order {
      Nat64.compare(a.date, b.date);
    };
  };

  module PersistentUserProfile {
    public type DayCheckinStatus = {
      hasCheckedIn : Bool;
      numberOfChecks : Nat;
      drinks : Nat; // Number of drinks in this case
      _firstCheckTime : ?Nat64; // Mutable - ignored on migration
    };
  };

  public type PersistentUserProfile = {
    onboardingAnswers : OnboardingAnswers;
    hasCompletedOnboarding : Bool;
    lastCheckInDate : ?Nat64;
    currentDayCheckInStatus : ?PersistentUserProfile.DayCheckinStatus;
    aggregatedEntries : List.List<AggregatedEntry>;
    currentDayTotalDrinks : Nat;
    lastBrutalFriendFeedback : Text;
    motivationButtonClicks : Nat;
    lastMotivationClickDay : Nat64;
  };

  public type UserProfile = {
    onboardingAnswers : OnboardingAnswers;
    hasCompletedOnboarding : Bool;
    lastCheckInDate : ?Nat64;
    currentDayCheckInStatus : ?PersistentUserProfile.DayCheckinStatus;
  };

  type DayCheckInResponse = {
    feedbackMatrixEntry : FeedbackMatrixEntry;
    message : Text;
    date : Nat64;
    totalDrinks : Nat;
    isFollowUp : Bool;
  };

  let userProfiles = Map.empty<Principal, PersistentUserProfile>();

  let feedbackMatrix = List.empty<FeedbackMatrixEntry>();

  public shared ({ caller }) func addFeedbackMatrixEntry(entry : FeedbackMatrixEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add feedback matrix entries");
    };
    feedbackMatrix.add(entry);
  };

  func matchesUserState(entry : FeedbackMatrixEntry, userState : {
    ageRange : Text;
    motivation : MotivationLens;
    baselineTier : DrinkingBaseline;
    secondarySubstance : ?Text;
  }) : Bool {
    let ageMatches = entry.ageRange == userState.ageRange or entry.ageRange == "any";
    let motivationMatches = switch (entry.motivation, userState.motivation) {
      case (#family, #family) { true };
      case (#money, #money) { true };
      case (#sex, #sex) { true };
      case (#health, #health) { true };
      case (#sport, #sport) { true };
      case (_) { false };
    };

    let baselineMatches = switch (entry.baselineTier, userState.baselineTier) {
      case (#low, #low) { true };
      case (#medium, #medium) { true };
      case (#high, #high) { true };
      case (#avoidant, #avoidant) { true };
      case (_) { false };
    };
    let substanceMatches = switch (entry.secondarySubstance, userState.secondarySubstance) {
      case (null, null) { true };
      case (null, ?_) { true };
      case (?"any", _) { true };
      case (?sub1, ?sub2) { sub1 == sub2 };
      case (_) { false };
    };

    ageMatches and motivationMatches and baselineMatches and substanceMatches;
  };

  func findBestMatchingEntry(userState : {
    ageRange : Text;
    motivation : MotivationLens;
    baselineTier : DrinkingBaseline;
    secondarySubstance : ?Text;
  }) : ?FeedbackMatrixEntry {
    let candidates = feedbackMatrix.toArray().filter(
      func(entry) { matchesUserState(entry, userState) }
    );

    let strongMatches = candidates.filter(
      func(entry) {
        (entry.ageRange == userState.ageRange or entry.ageRange == "any") and
        matchesUserState(entry, userState)
      }
    );

    if (strongMatches.size() > 0) { return ?strongMatches[0] };
    if (candidates.size() > 0) { return ?candidates[0] };
    null;
  };

  func searchFeedbackMatrix(userState : {
    ageRange : Text;
    motivation : MotivationLens;
    baselineTier : DrinkingBaseline;
    secondarySubstance : ?Text;
  }) : ?FeedbackMatrixEntry {
    findBestMatchingEntry(userState);
  };

  func getStartOfDay(timestamp : Nat64) : Nat64 {
    let adjustedTimestamp = timestamp - 21_600_000;
    let days = adjustedTimestamp / (24 * 60 * 60 * 1000);
    days * 24 * 60 * 60 * 1000;
  };

  func mergeEntriesForDate(entries : List.List<AggregatedEntry>, entry : AggregatedEntry) : List.List<AggregatedEntry> {
    let existingEntries = entries.filter(
      func(e) { e.date != entry.date }
    );

    let mergedEntry = switch (entries.find(func(e) { e.date == entry.date })) {
      case (null) { entry };
      case (?existing) {
        {
          date = entry.date;
          sober = existing.sober and entry.sober;
          drinks = existing.drinks + entry.drinks;
          mood = entry.mood;
          checkInCount = existing.checkInCount + 1;
        };
      };
    };
    existingEntries.add(mergedEntry);
    existingEntries;
  };

  func getOrInitializeUserEntries(caller : Principal) : List.List<AggregatedEntry> {
    switch (userProfiles.get(caller)) {
      case (null) { List.empty<AggregatedEntry>() };
      case (?profile) { profile.aggregatedEntries };
    };
  };

  func getAggregatedEntriesForDate(caller : Principal, date : Nat64) : List.List<AggregatedEntry> {
    switch (userProfiles.get(caller)) {
      case (null) { List.empty<AggregatedEntry>() };
      case (?profile) {
        let filteredEntries = profile.aggregatedEntries.filter(
          func(entry) { entry.date == date }
        );
        filteredEntries;
      };
    };
  };

  public shared ({ caller }) func checkOnboardingAndCheckInStatus() : async {
    needsOnboarding : Bool;
    needsDailyCheckIn : Bool;
    isDailyCheckInCompleted : Bool;
    isFirstLoginOfDay : Bool;
    lastLoginWasSober : Int;
    needsFollowUp : Bool;
    soberDaysTarget : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check onboarding and daily check-in status");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        {
          needsOnboarding = true;
          needsDailyCheckIn = false;
          isDailyCheckInCompleted = false;
          isFirstLoginOfDay = true;
          lastLoginWasSober = 0;
          needsFollowUp = false;
          soberDaysTarget = 30 : Nat;
        };
      };
      case (?profile) {
        let now = Int.abs(Time.now() / 1_000_000);
        let today = getStartOfDay(Nat64.fromNat(now));
        let needsDailyCheckIn = switch (profile.lastCheckInDate) {
          case (null) { true };
          case (?lastCheckInDate) { lastCheckInDate != today };
        };

        let isCompleted = switch (profile.currentDayCheckInStatus) {
          case (null) { false };
          case (?status) { status.hasCheckedIn };
        };

        let needsFollowUp = (not needsDailyCheckIn) and profile.hasCompletedOnboarding;
        let lastLoginWasSober = if (not needsDailyCheckIn and profile.hasCompletedOnboarding) {
          switch (profile.currentDayCheckInStatus) {
            case (?status) {
              if (status.hasCheckedIn and status.drinks == 0) { 1 } else { 0 };
            };
            case (null) { -1 };
          };
        } else { 0 };

        {
          needsOnboarding = not profile.hasCompletedOnboarding;
          needsDailyCheckIn;
          isDailyCheckInCompleted = isCompleted;
          isFirstLoginOfDay = needsDailyCheckIn;
          lastLoginWasSober;
          needsFollowUp;
          soberDaysTarget = mapSoberDaysTarget(profile.onboardingAnswers.sobrietyDuration);
        };
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?persistentProfile) {
        ?persistentProfile;
      };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (userProfiles.get(user)) {
      case (null) { null };
      case (?persistentProfile) {
        ?persistentProfile;
      };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let persistentProfile : PersistentUserProfile = {
      profile with
      aggregatedEntries = List.empty<AggregatedEntry>();
      currentDayTotalDrinks = switch (profile.currentDayCheckInStatus) {
        case (null) { 0 };
        case (_) { 0 };
      };
      lastBrutalFriendFeedback = "";
      motivationButtonClicks = 0;
      lastMotivationClickDay = 0 : Nat64;
    };
    userProfiles.add(caller, persistentProfile);
  };

  public shared ({ caller }) func submitCheckIn(entry : CheckInEntry) : async DayCheckInResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit check-ins");
    };

    let profile = switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile not found - onboarding must be completed first");
      };
      case (?p) { p };
    };

    let startOfDay = getStartOfDay(entry.date);
    let newEntry : AggregatedEntry = {
      date = startOfDay;
      sober = entry.sober;
      drinks = entry.drinks;
      mood = entry.mood;
      checkInCount = 1;
    };

    let currentEntries = profile.aggregatedEntries;
    let mergedEntries = mergeEntriesForDate(currentEntries, newEntry);

    let now = Int.abs(Time.now() / 1_000_000);
    let today = getStartOfDay(Nat64.fromNat(now));

    let newTotalDrinks = if (currentEntries.size() == 0) {
      entry.drinks;
    } else {
      currentEntries.foldLeft(
        entry.drinks,
        func(acc, e) {
          if (e.date == startOfDay) {
            acc + e.drinks;
          } else {
            entry.drinks;
          };
        },
      );
    };

    let persistentProfile : PersistentUserProfile = {
      profile with
      aggregatedEntries = mergedEntries;
      lastCheckInDate = ?today;
      currentDayCheckInStatus = ?{
        hasCheckedIn = true;
        numberOfChecks = 1;
        drinks = newTotalDrinks;
        _firstCheckTime = ?Nat64.fromNat(now);
      };
      currentDayTotalDrinks = newTotalDrinks;
    };

    userProfiles.add(caller, persistentProfile);

    let userState = {
      ageRange = persistentProfile.onboardingAnswers.ageRange;
      motivation = persistentProfile.onboardingAnswers.motivation;
      baselineTier = persistentProfile.onboardingAnswers.baselineTier;
      secondarySubstance = persistentProfile.onboardingAnswers.secondarySubstance;
    };

    let feedbackMatrixEntry = switch (searchFeedbackMatrix(userState)) {
      case (null) {
        {
          ageRange = "default";
          motivation = #health;
          baselineTier = #low;
          secondarySubstance = null;
          streakRatio = null;
          isWeekend = null;
          daysUntilFullMoon = null;
          chanceOfDrinkingTomorrow = null;
          message = "Booyah. Stay motivated.";
        };
      };
      case (?entry) { entry };
    };

    let newPersistentProfile : PersistentUserProfile = {
      persistentProfile with
      lastBrutalFriendFeedback = feedbackMatrixEntry.message;
    };
    userProfiles.add(caller, newPersistentProfile);

    let isFollowUp = switch (persistentProfile.currentDayCheckInStatus) {
      case (null) { false };
      case (?status) { status.hasCheckedIn };
    };

    {
      feedbackMatrixEntry;
      message = feedbackMatrixEntry.message;
      date = startOfDay;
      totalDrinks = persistentProfile.currentDayTotalDrinks;
      isFollowUp;
    };
  };

  public shared ({ caller }) func submitFollowUpCheckIn(drinks : Nat) : async DayCheckInResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit follow-up check-ins");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile not found - cannot submit follow-up check-in");
      };
      case (?profile) {
        let now = Int.abs(Time.now() / 1_000_000);
        let today = getStartOfDay(Nat64.fromNat(now));

        let newEntry : AggregatedEntry = {
          date = today;
          sober = false;
          drinks;
          mood = null;
          checkInCount = 1;
        };

        let currentEntries = getOrInitializeUserEntries(caller);
        let mergedEntries = mergeEntriesForDate(currentEntries, newEntry);

        let persistentProfile : PersistentUserProfile = {
          profile with
          aggregatedEntries = mergedEntries;
          lastCheckInDate = ?today;
          currentDayCheckInStatus = ?{
            hasCheckedIn = true;
            numberOfChecks = 1;
            drinks;
            _firstCheckTime = ?Nat64.fromNat(now);
          };
        };

        userProfiles.add(caller, persistentProfile);

        let persistentProfileAfterUpdate = switch (userProfiles.get(caller)) {
          case (null) {
            Runtime.trap("User profile not found after updating persistent user profile");
          };
          case (?persistentProfileAfterUpdate) { persistentProfileAfterUpdate };
        };

        let userState = {
          ageRange = persistentProfileAfterUpdate.onboardingAnswers.ageRange;
          motivation = persistentProfileAfterUpdate.onboardingAnswers.motivation;
          baselineTier = persistentProfileAfterUpdate.onboardingAnswers.baselineTier;
          secondarySubstance = persistentProfileAfterUpdate.onboardingAnswers.secondarySubstance;
        };

        let (message, feedbackMatrixEntry) = switch (searchFeedbackMatrix(userState)) {
          case (null) {
            (
              "Booyah. Stay motivated.",
              {
                ageRange = "default";
                motivation = #health;
                baselineTier = #low;
                secondarySubstance = null;
                streakRatio = null;
                isWeekend = null;
                daysUntilFullMoon = null;
                chanceOfDrinkingTomorrow = null;
                message = "Booyah. Stay motivated.";
              },
            );
          };
          case (?entry) { (entry.message, entry) };
        };

        let newPersistentProfile : PersistentUserProfile = {
          persistentProfileAfterUpdate with
          lastBrutalFriendFeedback = message;
        };
        userProfiles.add(caller, newPersistentProfile);

        {
          feedbackMatrixEntry;
          message;
          date = today;
          totalDrinks = persistentProfileAfterUpdate.currentDayTotalDrinks;
          isFollowUp = true;
        };
      };
    };
  };

  public query ({ caller }) func getLast14Days() : async [AggregatedEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view check-ins");
    };

    let currentEntries = getOrInitializeUserEntries(caller);

    let now = Time.now();
    let fourteenDaysAgo = (now / 1_000_000) - (14 * 24 * 60 * 60 * 1000);

    currentEntries.filter(
      func(entry) { entry.date >= Nat64.fromNat(Int.abs(fourteenDaysAgo)) },
    ).toArray().sort(AggregatedEntry.compareByDate);
  };

  public query ({ caller }) func getProgressMetrics() : async {
    soberDays : Nat;
    drankDays : Nat;
    currentStreak : Nat;
    totalCheckIns : Nat;
    last14Days : [AggregatedEntry];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view progress metrics");
    };

    let currentEntries = getOrInitializeUserEntries(caller);

    var soberDays = 0;
    var drankDays = 0;
    var currentStreak = 0;
    var totalCheckIns = 0;

    let entriesArray = currentEntries.toArray();

    for (entry in entriesArray.values()) {
      if (entry.sober) {
        soberDays += 1;
      } else {
        drankDays += 1;
      };
      totalCheckIns += entry.checkInCount;
    };

    let reversedEntries = entriesArray.reverse();

    for (entry in reversedEntries.values()) {
      if (entry.sober) {
        currentStreak += 1;
      } else {
        return {
          soberDays;
          drankDays;
          currentStreak;
          totalCheckIns;
          last14Days = entriesArray.sliceToArray(0, Int.abs(entriesArray.size()));
        };
      };
    };

    {
      soberDays;
      drankDays;
      currentStreak;
      totalCheckIns;
      last14Days = entriesArray.sliceToArray(0, Int.abs(entriesArray.size()));
    };
  };

  public query ({ caller }) func getMoodTrend() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view mood trend");
    };

    let currentEntries = getOrInitializeUserEntries(caller);

    var moodSum = 0;
    var moodCount = 0;

    for (entry in currentEntries.toArray().values()) {
      switch (entry.mood) {
        case (null) {};
        case (?mood) {
          moodCount += 1;
          switch (mood) {
            case (#happy) { moodSum += 2 };
            case (#neutral) { moodSum += 1 };
            case (#sad) {};
          };
        };
      };
    };

    if (moodCount == 0) { return 0 };
    moodSum / moodCount;
  };

  public query ({ caller }) func getLatestBrutalFriendFeedback() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view feedback");
    };

    switch (userProfiles.get(caller)) {
      case (null) { "" };
      case (?profile) { profile.lastBrutalFriendFeedback };
    };
  };

  public shared ({ caller }) func getMotivationMessage() : async {
    message : Text;
    remainingClicks : Nat;
    isLimitReached : Bool;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can use the motivation button");
    };

    let now = Int.abs(Time.now() / 1_000_000);
    let today = getStartOfDay(Nat64.fromNat(now));

    let profile = switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile not found - please complete onboarding first");
      };
      case (?existing) { existing };
    };

    let (remainingClicks, isLimitReached) = if (profile.lastMotivationClickDay == today) {
      if (profile.motivationButtonClicks >= 3) {
        (0, true);
      } else {
        (Nat.sub(3, profile.motivationButtonClicks), false);
      };
    } else {
      (3, false);
    };

    if (isLimitReached) {
      return {
        message = "That's enough motivation for today. Come back tomorrow.";
        remainingClicks;
        isLimitReached;
      };
    };

    let newProfile = {
      profile with
      motivationButtonClicks = if (profile.lastMotivationClickDay == today) {
        profile.motivationButtonClicks + 1;
      } else {
        1;
      };
      lastMotivationClickDay = today;
    };

    userProfiles.add(caller, newProfile);

    let userState = {
      ageRange = profile.onboardingAnswers.ageRange;
      motivation = profile.onboardingAnswers.motivation;
      baselineTier = profile.onboardingAnswers.baselineTier;
      secondarySubstance = profile.onboardingAnswers.secondarySubstance;
    };

    {
      message = switch (searchFeedbackMatrix(userState)) {
        case (null) { "Booyah. Stay motivated." };
        case (?entry) { entry.message };
      };
      remainingClicks = Nat.sub(remainingClicks, 1);
      isLimitReached = remainingClicks == 1;
    };
  };

  public query ({ caller }) func getUserTimeZone() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their timezone");
    };

    switch (userProfiles.get(caller)) {
      case (null) { "" };
      case (?profile) { profile.onboardingAnswers.timeZone };
    };
  };

  public query ({ caller }) func getSoberDaysTarget() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get sober days target");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile not found - cannot get sober days target");
      };
      case (?profile) {
        mapSoberDaysTarget(profile.onboardingAnswers.sobrietyDuration);
      };
    };
  };

  func mapSoberDaysTarget(duration : Text) : Nat {
    switch (duration) {
      case ("2 days") { 2 };
      case ("5 days") { 5 };
      case ("1 week") { 7 };
      case ("2 weeks") { 14 };
      case ("1 month") { 30 };
      case (_) { 30 };
    };
  };
};
