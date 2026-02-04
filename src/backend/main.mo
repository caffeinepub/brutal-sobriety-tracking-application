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

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

// Apply migration from persistent state format

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Mood = { #happy; #neutral; #sad };

  type OnboardingAnswers = {
    ageRange : Text;
    drinksPerWeek : Text;
    motivation : Text;
    secondarySubstance : Text;
    sobrietyDuration : Text;
    timeZone : Text;
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

  type RepeatCheckInReason = { #reflection; #urge; #bored; #habit; #curiosity };

  type RepeatCheckIn = {
    timestamp : Nat64;
    reason : RepeatCheckInReason;
  };

  public type PersistentUserProfileView = {
    onboardingAnswers : OnboardingAnswers;
    hasCompletedOnboarding : Bool;
    lastCheckInDate : ?Nat64;
    currentDayCheckInStatus : ?Bool;
    aggregatedEntries : [AggregatedEntry];
    repeatCheckIns : [RepeatCheckIn];
    currentDayTotalDrinks : Nat;
    lastBrutalFriendFeedback : Text;
    motivationButtonClicks : Nat;
    lastMotivationClickDay : Nat64;
  };

  type PersistentUserProfile = {
    onboardingAnswers : OnboardingAnswers;
    hasCompletedOnboarding : Bool;
    lastCheckInDate : ?Nat64;
    currentDayCheckInStatus : ?Bool;
    aggregatedEntries : List.List<AggregatedEntry>;
    repeatCheckIns : List.List<RepeatCheckIn>;
    currentDayTotalDrinks : Nat;
    lastBrutalFriendFeedback : Text;
    motivationButtonClicks : Nat;
    lastMotivationClickDay : Nat64;
  };

  module AggregatedEntry {
    public func compareByDate(a : AggregatedEntry, b : AggregatedEntry) : Order.Order {
      Nat64.compare(a.date, b.date);
    };
  };

  let brutalFriendFeedbackMessages = [
    // ORIGINAL 20 MESSAGES
    "Still sober? Blink twice if you're hostage to your own self-control.",
    "You resisted again? The bar staff are starting to worry.",
    "One day without drinks — your liver just sent a thank you emoji.",
    "You slipped? Don't worry, legends stumble too, just less gracefully.",
    "Another sober day? Your wallet is confused but grateful.",
    "Congrats on not drinking! Your future self owes you a non-alcoholic high-five.",
    "You drank today? Well, at least you're consistent with disappointing yourself.",
    "Sober streak continues! Even your demons are impressed.",
    "You fell off the wagon? Don't worry, it wasn't going that fast anyway.",
    "Another day, another victory over your own worst instincts.",
    "You stayed strong today! Your liver is doing a little happy dance.",
    "Slipped up again? Your willpower called in sick, apparently.",
    "Sober today? Plot twist: you're actually capable of self-control.",
    "You drank? Shocking. Said no one who knows you.",
    "Clean day achieved! Your bank account is slowly recovering.",
    "You resisted temptation! Hell just froze over a little bit.",
    "Another drink day? Your liver is writing its resignation letter.",
    "Sober success! You're like a unicorn, but real and slightly less magical.",
    "You slipped? Don't worry, even superheroes have off days.",
    "Clean streak intact! You're basically a sobriety ninja now.",
    // NEW MESSAGES 21-50
    "If you're over 40 and still binge drinking, congratulations on still being alive. Kind of.",
    "Hangover or just existential dread, aged 35+? Hard to tell these days.",
    "Alcohol isn't a personality type, especially not for the under-25 crowd.",
    "Drinking with kids at home? Just admit you're running from responsibility.",
    "Mixing alcohol with sports — the main reason your gym progress is non-existent.",
    "More wine nights than date nights? That's why you're single, not mysterious.",
    "If your morning routine includes regret and painkillers, you're doing adulthood wrong.",
    "Saved money by not drinking this week? Invest it, don't spend it on vape and takeout.",
    "Still think smoking weed balances out drinking? That's not diplomatic — just stupid.",
    "Playing video games drunk doesn't make you better, just sloppier.",
    "If you're over 30 and bragging about shots taken, you need a new hobby.",
    "Moderation isn't just a myth told to kids — try it sometime.",
    "Your liver isn't a superhero; even it has limits.",
    "If your high school reunion is your only sobering experience, you're doing it wrong.",
    "Thinking alcohol makes you better at sex? Newsflash: It's ruining both.",
    "If you're 18 and can't remember last night, that's a warning sign, not a flex.",
    "Drinking solo isn't self-care, just self-destruction with better marketing.",
    "If \"let's grab a drink\" is your default plan, maybe try water for once.",
    "Alcohol isn't therapy, and you can't \"talk it out\" after 10 beers.",
    "Bragging about handling your liquor? Congrats on achieving absolutely nothing.",
    "If you drink to feel young, maybe just try exercise instead.",
    "Mid-life crisis solved with a six-pack? That's a recipe for more crises.",
    "Party trick: Outdrinking everyone. Reality: Outliving no one.",
    "If your kids know how to mix drinks, it's time to reevaluate your priorities.",
    "Teenage drinking might be cool, but liver transplants definitely aren't.",
    "Drunk texting your ex isn't romantic, it's just proof alcohol lowers standards.",
    "Sobriety isn't boring, your drunk self just has shitty stories.",
    "Alcohol as pain relief is a temporary fix for lifelong problems.",
    "If hangovers last two days, congrats — you're now officially old.",
    "Alcohol and fitness are mutually exclusive, no matter what your influencers say.",
    "Sports performance and alcohol consumption can't coexist. Choose wisely.",
    "If you run better drunk, it's the police, not athletics.",
    "Drinking doesn't improve your looks; beer goggles aren't a mirror.",
    "Social drinking shouldn't be your only social activity.",
    "Your family would prefer your presence, not your drunken absence.",
  ];

  let userProfiles = Map.empty<Principal, PersistentUserProfile>();

  func getBrutalFriendMessage(condition : ?Text) : Text {
    let time = Time.now();
    let timeNs = Int.abs(time);
    let seed = timeNs % 100_000_000;
    let randomIndex = (seed + timeNs) % brutalFriendFeedbackMessages.size();
    switch (condition) {
      case (null) {
        brutalFriendFeedbackMessages[randomIndex];
      };
      case (?_) {
        brutalFriendFeedbackMessages[randomIndex];
      };
    };
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

  func getEntriesCountForDay(profile : PersistentUserProfile, day : Nat64) : Nat {
    let entriesArray = profile.aggregatedEntries.toArray();
    let dayEntries = entriesArray.filter(
      func(entry) { entry.date == day }
    );
    if (dayEntries.size() == 0) { return 0 };
    let firstEntry = dayEntries[0];
    firstEntry.checkInCount;
  };

  func toViewProfile(profile : PersistentUserProfile) : PersistentUserProfileView {
    {
      profile with
      aggregatedEntries = profile.aggregatedEntries.toArray();
      repeatCheckIns = profile.repeatCheckIns.toArray();
    };
  };

  public shared ({ caller }) func checkOnboardingAndCheckInStatus() : async {
    needsOnboarding : Bool;
    needsDailyCheckIn : Bool;
    isDailyCheckInCompleted : Bool;
    isFirstLoginOfDay : Bool;
    lastLoginWasSober : Int;
    needsFollowUp : Bool;
    dailyCheckInsToday : Nat;
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
          dailyCheckInsToday = 0;
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

        let dailyCheckInsToday = getEntriesCountForDay(profile, today);

        {
          needsOnboarding = not profile.hasCompletedOnboarding;
          needsDailyCheckIn;
          isDailyCheckInCompleted = isCompleted;
          isFirstLoginOfDay = needsDailyCheckIn;
          lastLoginWasSober;
          needsFollowUp;
          dailyCheckInsToday;
        };
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?PersistentUserProfileView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?persistentProfile) { ?toViewProfile(persistentProfile) };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?PersistentUserProfileView {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (userProfiles.get(user)) {
      case (null) { null };
      case (?persistentProfile) { ?toViewProfile(persistentProfile) };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : PersistentUserProfileView) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let persistentProfile : PersistentUserProfile = {
      profile with
      aggregatedEntries = List.fromArray(profile.aggregatedEntries);
      repeatCheckIns = List.fromArray(profile.repeatCheckIns);
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
            motivation = "";
            secondarySubstance = "";
            sobrietyDuration = "";
            timeZone = "";
          };
          hasCompletedOnboarding = false;
          lastCheckInDate = ?today;
          currentDayCheckInStatus = ?true;
          aggregatedEntries = mergedEntries;
          repeatCheckIns = List.empty<RepeatCheckIn>();
          currentDayTotalDrinks = entry.drinks;
          lastBrutalFriendFeedback = getBrutalFriendMessage(null);
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
          lastBrutalFriendFeedback = getBrutalFriendMessage(null);
        };
      };
    };

    // Persist profile and return a message
    userProfiles.add(caller, persistentProfile);
    {
      message = persistentProfile.lastBrutalFriendFeedback;
      date = startOfDay;
      totalDrinks = persistentProfile.currentDayTotalDrinks;
    };
  };

  public shared ({ caller }) func submitRepeatCheckIn(reason : RepeatCheckInReason) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit repeat check-ins");
    };

    let now = Int.abs(Time.now() / 1_000_000);
    let repeatCheckIn : RepeatCheckIn = {
      timestamp = Nat64.fromNat(now);
      reason;
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile not found - cannot submit repeat check-in");
      };
      case (?profile) {
        let updatedRepeatCheckIns = profile.repeatCheckIns;
        updatedRepeatCheckIns.add(repeatCheckIn);

        let updatedProfile = {
          profile with
          repeatCheckIns = updatedRepeatCheckIns;
        };

        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func submitFollowUpCheckIn(drinks : Nat) : async Text {
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

        let updatedProfile = {
          profile with
          aggregatedEntries = mergedEntries;
          lastCheckInDate = ?today;
          currentDayCheckInStatus = ?true;
          lastBrutalFriendFeedback = getBrutalFriendMessage(null);
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

    let now = Int.abs(Time.now() / 1_000_000);
    let today = getStartOfDay(Nat64.fromNat(now));

    let profile = switch (userProfiles.get(caller)) {
      case (null) {
        {
          onboardingAnswers = {
            ageRange = "";
            drinksPerWeek = "";
            motivation = "";
            secondarySubstance = "";
            sobrietyDuration = "";
            timeZone = "";
          };
          hasCompletedOnboarding = false;
          lastCheckInDate = ?today;
          currentDayCheckInStatus = ?true;
          aggregatedEntries = List.empty<AggregatedEntry>();
          repeatCheckIns = List.empty<RepeatCheckIn>();
          currentDayTotalDrinks = 0;
          lastBrutalFriendFeedback = getBrutalFriendMessage(null);
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
      message = getBrutalFriendMessage(null);
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

