import List "mo:core/List";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Nat64 "mo:core/Nat64";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";

import Iter "mo:core/Iter";
import Migration "migration";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Mood = { #happy; #neutral; #sad };
  public type MotivationLens = { #family; #money; #sex; #health; #sport };
  public type DrinkingBaseline = { #low; #medium; #high; #avoidant };

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

  public type PersistentUserProfile = {
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

  public type UserProfile = {
    onboardingAnswers : OnboardingAnswers;
    hasCompletedOnboarding : Bool;
    lastCheckInDate : ?Nat64;
    currentDayCheckInStatus : ?Bool;
  };

  module AggregatedEntry {
    public func compareByDate(a : AggregatedEntry, b : AggregatedEntry) : Order.Order {
      Nat64.compare(a.date, b.date);
    };
  };

  let userProfiles = Map.empty<Principal, PersistentUserProfile>();

  let brutalFriendFeedbackMessages = [
    // Family lens messages
    "Still sober? Your kids probably have no idea who you are.",
    "One day without drinks — your family almost recognizes your voice again.",
    "You slipped? Don't worry, your kids will get used to disappointment.",
    "Another sober day? Your partner might start believing in miracles.",
    "Congrats on not drinking! Your future self owes you a family game night.",

    // Money lens messages
    "You resisted again? Your wallet is starting to notice.",
    "Sober streak continues! Even your bank account is impressed.",
    "You fell off the wagon? Financial responsibility wasn't your strong suit anyway.",
    "Clean day achieved! Your budget is slowly recovering.",
    "Another drink day? Your financial advisor is shaking their head.",

    // Sex lens messages
    "You stayed strong today! Your attractiveness just increased by 0.5%",
    "Slipped up again? Your dating profile photo just lost a swipe right.",
    "Sober today? Plot twist: You might remember Tinder conversations now.",
    "You drank? And here we thought you wanted a dating life.",
    "Clean streak intact! You're basically relationship material now.",

    // Health lens messages
    "You resisted temptation! Hell just froze over a little bit.",
    "Another drink day? Your liver is writing its resignation letter.",
    "Sober success! You're like a unicorn, but with fewer toxins.",
    "You slipped? Don't worry, even wellness podcasts relapse, too.",
    "Still sober? Blink twice if your organs are grateful.",

    // Sport lens messages
    "Another day, another victory over your worst athletic performance.",
    "You stayed strong today! Your body just leveled up in recovery.",
    "Slipped up again? Your coach called — they're not angry, just disappointed.",
    "Sober today? Plot twist: You might actually break a sweat now.",
    "You drank? And here we thought you wanted to win a championship.",
  ];

  func getBrutalFriendMessage(motivation : MotivationLens, isSoberDay : Bool, secondarySubstance : ?Text, randomSeed : Nat) : Text {
    let time = Time.now();
    let timeNs = Int.abs(time);
    let seed = timeNs % 100_000_000;
    let combinedSeed = (seed + randomSeed).toInt() % 100_000_000;
    let randomIndex = (combinedSeed + timeNs).toNat() % brutalFriendFeedbackMessages.size();

    let mainMessage = switch (motivation) {
      case (#family) {
        let familyMessages = brutalFriendFeedbackMessages.sliceToArray(0, 5);
        familyMessages[randomIndex % familyMessages.size()];
      };
      case (#money) {
        let moneyMessages = brutalFriendFeedbackMessages.sliceToArray(5, 10);
        moneyMessages[randomIndex % moneyMessages.size()];
      };
      case (#sex) {
        let sexMessages = brutalFriendFeedbackMessages.sliceToArray(10, 15);
        sexMessages[randomIndex % sexMessages.size()];
      };
      case (#health) {
        let healthMessages = brutalFriendFeedbackMessages.sliceToArray(15, 20);
        healthMessages[randomIndex % healthMessages.size()];
      };
      case (#sport) {
        let sportMessages = brutalFriendFeedbackMessages.sliceToArray(20, 25);
        sportMessages[randomIndex % sportMessages.size()];
      };
    };

    if (isSoberDay) {
      mainMessage # getSecondarySubstanceReference(secondarySubstance, randomSeed);
    } else {
      mainMessage;
    };
  };

  func getSecondarySubstanceReference(substance : ?Text, randomSeed : Nat) : Text {
    // Use randomSeed to determine if reference should be included
    if (randomSeed % 100 < 20) {
      switch (substance) {
        case (null) { "" };
        case (?"weed") { "Weed might be calling too." };
        case (?"cocaine") { "Your other friend isn't quiet either." };
        case (?"porn") { "Time to avoid another habit too." };
        case (?"cigarettes") { "Smokes are still around." };
        case (?"games") { "The other vice still wins time." };
        case (_) { "" };
      };
    } else { "" };
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
          case (?status) { status };
        };

        let needsFollowUp = (not needsDailyCheckIn) and profile.hasCompletedOnboarding;

        let lastLoginWasSober = if (not needsDailyCheckIn and profile.hasCompletedOnboarding) {
          switch (profile.currentDayCheckInStatus) {
            case (?false) { 0 };
            case (?true) { 1 };
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
      lastBrutalFriendFeedback = getBrutalFriendMessage(#family, true, null, 0);
      motivationButtonClicks = 0;
      lastMotivationClickDay = 0;
    };
    userProfiles.add(caller, persistentProfile);
  };

  public shared ({ caller }) func submitCheckIn(entry : CheckInEntry) : async {
    message : Text;
    date : Nat64;
    totalDrinks : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit check-ins");
    };

    // Use deterministic time-based seed for controlled randomness
    let randomSeed = Int.abs(Time.now()) % 100_000_000;

    let startOfDay = getStartOfDay(entry.date);

    let newEntry : AggregatedEntry = {
      date = startOfDay;
      sober = entry.sober;
      drinks = entry.drinks;
      mood = entry.mood;
      checkInCount = 1;
    };

    let currentEntries = getOrInitializeUserEntries(caller);
    let mergedEntries = mergeEntriesForDate(currentEntries, newEntry);

    let now = Int.abs(Time.now() / 1_000_000);
    let today = getStartOfDay(Nat64.fromNat(now));

    let persistentProfile : PersistentUserProfile = switch (userProfiles.get(caller)) {
      case (null) {
        {
          onboardingAnswers = {
            ageRange = "";
            drinksPerWeek = "";
            motivation = #family;
            secondarySubstance = null;
            sobrietyDuration = "";
            timeZone = "";
            baselineTier = #low;
          };
          hasCompletedOnboarding = false;
          lastCheckInDate = ?today;
          currentDayCheckInStatus = ?true;
          aggregatedEntries = mergedEntries;
          currentDayTotalDrinks = entry.drinks;
          lastBrutalFriendFeedback = getBrutalFriendMessage(#family, true, null, randomSeed);
          motivationButtonClicks = 0;
          lastMotivationClickDay = 0;
        };
      };
      case (?profile) {
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
        {
          profile with
          aggregatedEntries = mergedEntries;
          lastCheckInDate = ?today;
          currentDayCheckInStatus = ?true;
          currentDayTotalDrinks = newTotalDrinks;
          lastBrutalFriendFeedback = getBrutalFriendMessage(profile.onboardingAnswers.motivation, entry.sober, profile.onboardingAnswers.secondarySubstance, randomSeed);
        };
      };
    };

    userProfiles.add(caller, persistentProfile);
    {
      message = persistentProfile.lastBrutalFriendFeedback;
      date = startOfDay;
      totalDrinks = persistentProfile.currentDayTotalDrinks;
    };
  };

  public shared ({ caller }) func submitFollowUpCheckIn(drinks : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit follow-up check-ins");
    };

    // Use deterministic time-based seed for controlled randomness
    let randomSeed = Int.abs(Time.now()) % 100_000_000;

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

        let updatedProfile = {
          profile with
          aggregatedEntries = mergedEntries;
          lastCheckInDate = ?today;
          currentDayCheckInStatus = ?true;
          lastBrutalFriendFeedback = getBrutalFriendMessage(profile.onboardingAnswers.motivation, false, profile.onboardingAnswers.secondarySubstance, randomSeed);
        };

        userProfiles.add(caller, updatedProfile);
        updatedProfile.lastBrutalFriendFeedback;
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

    // Use deterministic time-based seed for controlled randomness
    let randomSeed = Int.abs(Time.now()) % 100_000_000;

    let now = Int.abs(Time.now() / 1_000_000);
    let today = getStartOfDay(Nat64.fromNat(now));

    let profile = switch (userProfiles.get(caller)) {
      case (null) {
        {
          onboardingAnswers = {
            ageRange = "";
            drinksPerWeek = "";
            motivation = #family;
            secondarySubstance = null;
            sobrietyDuration = "";
            timeZone = "";
            baselineTier = #low;
          };
          hasCompletedOnboarding = false;
          lastCheckInDate = ?today;
          currentDayCheckInStatus = ?true;
          aggregatedEntries = List.empty<AggregatedEntry>();
          currentDayTotalDrinks = 0;
          lastBrutalFriendFeedback = getBrutalFriendMessage(#family, true, null, randomSeed);
          motivationButtonClicks = 0;
          lastMotivationClickDay = today;
        };
      };
      case (?existing) { existing };
    };

    let (remainingClicks, isLimitReached) = if (profile.lastMotivationClickDay == today) {
      if (profile.motivationButtonClicks >= 3) {
        (0, true);
      } else {
        (3 - profile.motivationButtonClicks, false);
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

    {
      message = getBrutalFriendMessage(profile.onboardingAnswers.motivation, true, profile.onboardingAnswers.secondarySubstance, randomSeed);
      remainingClicks = remainingClicks - 1;
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
};
