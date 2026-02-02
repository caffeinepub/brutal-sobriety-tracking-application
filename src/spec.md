# BRUTAL   Sobriety Tracking Application

## Overview
A web-based sobriety tracking application that helps users monitor their journey through daily check-ins, progress visualization, and personalized feedback with a BRUTAL brand aesthetic featuring dark themes and edgy design. The application uses user-specific time zones for accurate daily tracking and local time-aware features with motivation-based feedback personalization.

## Core Features

### Authentication & Onboarding
- User login system with secure authentication
- **Robust Backend Connection Management**: Implement comprehensive connection initialization logic to ensure backend actor is fully available and authenticated before any canister calls during onboarding and login processes
- **Actor Availability Verification**: Add pre-flight checks to verify backend actor connectivity and authentication status before attempting profile saves or data operations
- **Automatic Retry Logic**: Implement automatic retry mechanisms with exponential backoff for temporary backend unavailability during critical operations like profile saving
- **Graceful Fallback Handling**: Provide user-friendly error messages and recovery options when backend connections fail, with clear retry buttons and status indicators
- **Connection State Management**: Track and display backend connection status to users during authentication and onboarding flows
- **Time Zone Detection**: Frontend automatically detects user's time zone using browser's `Intl.DateTimeFormat().resolvedOptions().timeZone` API and saves it to user profile
- **First-time User Detection**: Backend tracks whether user has completed onboarding to prevent repeat onboarding flows
- New user onboarding flow with 5 questions using clickable answer choices (appears only once on first signup):
  1. "Are you old?" → options: "18–25", "25–35", "35–45", "45+"
  2. "How many drinks per week do you have?" → options: "Less than 5", "5–10", "More than 10", "I just drink, don't count..."
  3. "What drives you / why are you here?" → options: "Family", "Money", "Sex", "Health", "Sport"
  4. "Your favorite drug next to alcohol?" → options: "Weed", "Cocaine", "Porn", "Cigarettes", "Games"
  5. "How long can you go without alcohol?" → options: "2 days", "5 days", "1 week", "2 weeks", "1 month"
- **Motivation-Based Profile Storage**: Store all onboarding answers as structured fields in user profile including `motivation` as `MotivationLens` enum value instead of plain text
- **Secondary Substance Storage**: Store user's secondary substance selection as optional field in user profile with type `"weed" | "cocaine" | "porn" | "cigarettes" | "games"`
- **Baseline Tier Derivation**: Automatically derive and store `baselineTier` from user's `drinksPerWeek` onboarding answer using DrinkingBaseline enum mapping
- **Enhanced Save Functionality**: Ensure reliable saving of user profile data to backend only after actor initialization is complete and authenticated, with comprehensive connection verification before save attempts
- **Data Structure Validation**: Verify that frontend `UserProfile` structure exactly matches backend expectations with correct field mapping including `motivation` as `MotivationLens` enum and `secondarySubstance` as optional field
- **Robust Save Handler**: Frontend uses `saveCallerUserProfile` with correct data format including time zone, baseline tier, motivation lens enum, and secondary substance
- **Enhanced Error Handling**: Implement retry mechanism for failed saves due to temporary backend delays or actor unavailability with clear user feedback and connection status indicators
- **Automatic Flow Transition**: After successful save confirmation, automatically transition user to Daily Check-In screen, then to Dashboard without manual refresh
- **Data Persistence Verification**: Ensure all saved values including motivation lens and secondary substance persist correctly in backend and display properly when dashboard reloads

### Daily Check-in System
- **Time Zone-Aware Daily Check-in Logic**: 
  - Daily check-in popup appears once per day based on user's local time zone midnight
  - For new users who just completed onboarding, daily check-in appears immediately after onboarding completion
  - Backend tracks last check-in date using user's time zone to determine if daily popup should appear
- **Session-Level Dialog Guard**: 
  - Implement session-level or state-based flag (like `isCheckInDialogActive`) in frontend logic to ensure daily check-in dialog opens only once per session
  - Guard condition prevents duplicate dialog openings during login and data refresh events, even if multiple backend queries or triggers fire
  - Flag blocks duplicate openings while preserving existing conditions for onboarding, daily check-in, and follow-up popups
  - Session flag resets appropriately to allow proper dialog flow without interfering with legitimate popup triggers
- **Follow-up Check-in for Multiple Logins**: 
  - For users who log in multiple times on the same local day after completing their first check-in, show follow-up popup asking whether they remained sober or had more drinks
  - Follow-up popup offers quick button choices: "Remained Sober" or "Had More Drinks"
  - If "Remained Sober": confirm status without changing totals
  - If "Had More Drinks": allow user to input additional drink count, which adds to that day's total using existing merge logic
  - Backend tracks whether user has already completed daily check-in for current local day to determine popup type
- Daily popup prompting users to record their status:
  - Whether they drank alcohol that day
  - Number of drinks consumed (if applicable) - required when user indicates they drank
  - Optional mood indicator
- Enhanced feedback popup after submission with encouraging messages that acknowledge progress against user's reported average drinks per week
- **Motivation-Based Brutally Honest Friend Popup**: After every daily check-in submission AND after every follow-up check-in submission, display a new popup with a humorous, sarcastic message from the "BRUTAL friend" character
  - **Age-Based Tone Modulation**: Backend implements age-based tone control that modifies message delivery style based on user's `ageRange`
  - **Baseline-Aware Tone Adjustment**: Backend adjusts message tone and sarcasm level based on user's `baselineTier`
  - **Motivation-Based Contextual Framing**: Backend applies motivation-specific contextual framing based on user's `MotivationLens`:
    - **Family**: Messages reference family relationships, responsibilities, and being present for loved ones
    - **Money**: Messages focus on financial benefits, career performance, and economic advantages of sobriety
    - **Sex**: Messages reference attractiveness, confidence, performance, and relationship appeal
    - **Health**: Messages emphasize physical wellness, energy levels, and body improvement
    - **Sport**: Messages highlight athletic performance, recovery, and competitive advantages
  - **Probabilistic Secondary Substance Integration**: For sober-day feedback messages, apply controlled randomness for secondary substance references using `if (Math.random() < 0.2)` probability check before appending secondary substance reference phrase
  - **Multi-Dimensional Message Generation**: Backend combines age range, baseline tier, motivation lens, and probabilistic secondary substance to create personalized messages that maintain safety and avoid medical advice
  - **Contextual Sober Day Framing**: For sober days, apply positive contextual framing per motivation type with probabilistic secondary substance reference appended
  - **Contextual Drinking Day Framing**: For drinking days, apply witty, context-aware "brutal" phrasing using the same motivation lens
  - **Random Message Selection**: Frontend randomly selects one age, baseline, and motivation-appropriate message from the backend-provided collection after each check-in submission
  - **Backend Storage**: Selected personalized message is passed to backend as `brutalFriendFeedback` parameter and stored in user's profile
  - Dismiss button labeled "Shut up, I'm trying."
  - Styled with brutalist dark-mode aesthetic matching existing neon/glow theme
  - **Message Persistence**: The selected brutal friend message is saved to backend and passed to dashboard state for display in the feedback card
  - **Clean Text Rendering**: Ensure all brutal friend feedback messages render as plain text without HTML encoding issues
- Automatic dashboard refresh after successful check-in submission with proper data refetching
- **Updated Flow Sequence**:
  1. First login → Daily Check-in → Motivation-Based Brutal Friend message → Dashboard
  2. Additional logins (same local day) → Follow-up popup → Motivation-Based Brutal Friend message → Dashboard
- **Smooth Popup Transitions**: Ensure seamless transitions between different popup types without loading delays

### Dashboard
- **Redesigned Dashboard Layout**: All dashboard components arranged in a specific vertical order for optimal user experience:
  1. **Unified Header Section**: Combine Brutal Friend feedback and Motivation button at the top in one unified header section
  2. **Side-by-Side Risk and Cycle Cards Row**: Display Chance of Drinking Tomorrow Card and Dynamic Cycle Window Card side-by-side in the same row with equal column widths, consistent height, and proper spacing between cards. On small screens, stack them vertically for responsive design.
  3. **Sober Days Section**: Show contextual messages about current weekday and moon phase with dynamic logic:
     - **Days Until Friday**: Calculate and display days remaining until Friday based on user's local time zone
     - **Weekend Display**: Show "Friday" when it's Friday, and "Weekend" when it's Saturday or Sunday
     - **Monday Reset**: Restart "Days until Friday" counter starting Monday
     - **Full Moon Countdown**: Calculate and display days until next full moon using 2026 dates (03-01, 01-02, 03-03, 01-04, 01-05, 31-05, 29-06, 29-07, 28-08, 25-10, 24-11, 23-12)
     - **Dynamic BRUTAL Messages**: Display contextual sarcastic messages such as "Weekend incoming — brace yourself", "Full moon in 3 days — better stay grounded", "Friday vibes — your liver is nervous", "Monday blues — at least you're sober"
     - **Daily Updates**: Ensure Cycle Window updates correctly each day with accurate countdown calculations
  4. **Sober Days Section**: Display current "Sober Days Streak" and "Sober Days Target" as bold numbers with dark-neon brutalist styling
  5. **Status Indicators Section**: Horizontal section with three cards showing "Weekly Average," "Yesterday," and "Today" status indicators (values like "Sober," "Few Drinks," "Not Sure," or "Drunk")
  6. **14-Day Chart**: Reposition the `DrinksChart` component at the bottom of the layout
- **Full Mobile Responsiveness**: Ensure all dashboard sections are fully responsive on mobile devices
- **Time Zone-Aware Progress Counters**: Display total sober days and days with alcohol consumption based on normalized daily entries using user's local time zone
- **Days Tracked Counter**: Shows unique calendar days with check-ins based on normalized daily entries using user's time zone
- **Mood Indicator**: Visual smiley face showing current mood trend based on recent entries
- **Latest Motivation-Based Brutal Friend Feedback**: Display the most recent age, baseline, and motivation-appropriate sarcastic comment from the Brutal Friend in the unified header section
- **Fixed Brutal Friend Feedback Display**: Dashboard must properly integrate the `BrutalFriendFeedbackCard` component with correct data binding from the `useGetLatestBrutalFriendFeedback` query
- **Clean Feedback Rendering**: Ensure brutal friend feedback displays as clean text without HTML encoding artifacts
- **Reactive Feedback Updates**: The feedback section updates automatically after each daily or follow-up check-in through proper query invalidation and state management
- **Enhanced Error Handling**: Implement proper loading states and error fallbacks for the feedback card to prevent blank display when data is unavailable
- **Fixed Title Display**: The Brutal Friend feedback section displays the fixed title "YOUR BRUTALLY HONEST FRIEND" without randomization
- **Standard Typography**: Use the original font sizes for both the title and feedback text, reverting any previous size increases
- **Motivation-Based Motivation Button Feature**: 
  - Display a clearly visible brutalist-style button labeled "Need Motivation?" in the unified header section
  - When clicked, fetch a random age, baseline, and motivation-appropriate brutal friend message and display it in a popup or toast with brutal styling
  - Limit button clicks to maximum of 3 per day per user based on local time zone
  - After third click, disable button and show message "That's enough motivation for today. Come back tomorrow."
  - Reset button click counter automatically every new local day using user's time zone
  - Backend tracks daily motivation button click count per user using time zone-aware date logic
- **Time Zone-Aware Bi-weekly Chart**: Graph displaying aggregated total drinks per day over the last 14 days using user's local time zone with real-time updates and proper chronological ordering
- **Motivation-Based Streak Tracking**: Current sober streak counter calculated from normalized daily data using user's local time zone, with streak difficulty adjusted based on baseline tier and motivation-contextual messaging
- **Visual Feedback**: Loading animation and refresh feedback on chart while new data is being fetched, with immediate visual bar updates after new check-in
- **Chart Data Accuracy**: Ensure each day's aggregated total drink count is mapped and displayed correctly using user's time zone
- **Automatic Updates**: Dashboard updates automatically after any check-in input (daily or follow-up), including the latest brutal friend feedback

### Data Management
- Store user profiles with structured onboarding responses including age range, drinks per week, motivation as `MotivationLens` enum, secondary substance, sobriety duration capability, and detected time zone
- **MotivationLens Enum Implementation**: Backend implements `MotivationLens` enum with options: `#family`, `#money`, `#sex`, `#health`, `#sport`
- **DrinkingBaseline Enum Implementation**: Backend implements `DrinkingBaseline` enum with options: `Low`, `Medium`, `High`, and `Avoidant`
- **Secondary Substance Field**: Backend implements optional `secondarySubstance` field in `UserProfile` type with union type `"weed" | "cocaine" | "porn" | "cigarettes" | "games"`
- **Baseline Tier Derivation and Storage**: Backend automatically derives `baselineTier` from user's `drinksPerWeek` onboarding answer
- **Motivation-Based Profile Storage**: Backend stores user's motivation as `MotivationLens` enum value instead of plain text for structured feedback generation
- **Secondary Substance Storage**: Backend stores user's secondary substance selection without invoking feedback logic during onboarding
- **Time Zone Storage**: Backend stores user's time zone (e.g., "Europe/Berlin") as a new field in user profile for time-aware daily logic
- **Onboarding Completion Tracking**: Backend stores flag indicating whether user has completed initial onboarding to prevent repeat flows
- **Time Zone-Aware Daily Check-in State Tracking**: Backend tracks last check-in date and whether user has completed daily check-in for current local day using user's time zone
- **Motivation-Based Brutal Friend Message System**: Implement comprehensive age-based, baseline-aware, and motivation-contextual tone modulation for brutal friend feedback:
  - **Multi-Dimensional Tone Parameter Mapping**: Map `ageRange`, `baselineTier`, and `MotivationLens` values to specific tone parameters controlling message style
  - **Motivation-Contextual Framing**: Apply motivation-specific contextual framing:
    - **Family**: Reference family relationships, responsibilities, being present for loved ones
    - **Money**: Focus on financial benefits, career performance, economic advantages
    - **Sex**: Reference attractiveness, confidence, performance, relationship appeal
    - **Health**: Emphasize physical wellness, energy levels, body improvement
    - **Sport**: Highlight athletic performance, recovery, competitive advantages
  - **Probabilistic Secondary Substance Reference Function**: Implement probabilistic function `secondarySubstanceReference(substance: string)` that returns corresponding phrase with 20% probability:
    - weed → "Weed might be calling too."
    - cocaine → "Your other friend isn't quiet either."
    - porn → "Time to avoid another habit too."
    - cigarettes → "Smokes are still around."
    - games → "The other vice still wins time."
    - default → ""
  - **Controlled Randomness Integration**: For sober-day feedback messages, apply `if (Math.random() < 0.2)` probability check before appending result of `secondarySubstanceReference` function to main message output
  - **Contextual Sober/Drinking Day Messages**: Generate different message types based on check-in status (sober vs drinking) with motivation-appropriate framing
  - **Multi-Dimensional Message Generation**: `getBrutalFriendMessage()` function incorporates user's `ageRange`, `baselineTier`, `MotivationLens`, and probabilistic `secondarySubstance` for fully personalized message selection
  - **Motivation-Categorized Message Collections**: Maintain message collections organized by age group, baseline tier, and motivation lens combinations
  - **Safety-First Message Generation**: Ensure all motivation-based messages maintain safety standards without medical advice or harmful judgment
  - **Extensible Architecture**: Design tone system to support future modifiers without affecting underlying logic
- **Clean Text Storage**: Ensure brutal friend messages are stored and retrieved as plain text without HTML encoding
- **Time Zone-Aware Motivation Button Click Tracking**: Backend tracks daily motivation button click count per user, resetting counter each new local day using user's time zone
- **Motivation-Based Motivation Messages**: Backend provides age, baseline, and motivation-appropriate motivation messages using same multi-dimensional tone modulation system with probabilistic secondary substance integration
- **Motivation-Based Streak Personalization**: Backend adjusts streak messaging and motivational context based on motivation lens while maintaining baseline tier difficulty adjustments
- **Sober Days Target Storage**: Backend stores user's sober days target goal for display in dashboard sober days section
- **Risk Assessment Data**: Backend provides placeholder data for "Chance of Drinking Tomorrow" feature using simple logic or random values - prepared for future time-aware features
- **Dynamic Cycle Window Data**: Backend provides time zone-aware calculations for cycle window data with daily update logic
- **Status Indicators Data**: Backend calculates and provides "Weekly Average," "Yesterday," and "Today" status indicators based on user's drinking patterns using time zone-aware date logic
- **Fixed Profile Storage**: Ensure backend properly receives and persists `UserProfile` with valid `OnboardingAnswers` structure including motivation as `MotivationLens` enum and secondary substance
- **Data Validation**: Backend validates incoming profile data structure including motivation lens enum and secondary substance, providing clear error messages for mismatched fields
- **Time Zone-Aware Date Normalization**: Normalize all check-in timestamps to user's local midnight based on their saved time zone before saving
- **Time Zone-Aware Daily Aggregation**: Aggregate daily check-in entries by normalized calendar date using user's time zone with merging logic
- **Follow-up Check-in Support**: Handle additional drink count submissions for same-local-day entries, adding to existing totals using merge logic
- **Motivation-Based Brutal Friend Feedback Parameter**: Accept `brutalFriendFeedback` parameter in check-in submissions and store as latest age, baseline, and motivation-appropriate feedback message for the user
- **Time Zone-Aware Progress Metrics**: Calculate progress metrics from normalized daily data using user's time zone
- **Time Zone-Aware Data Endpoints**: Provide endpoints for dashboard data retrieval with proper chronological ordering of normalized data using user's time zone including latest motivation-based brutal friend message
- Support comparison logic for feedback based on user's average drinking patterns
- **Time Zone-Aware Data Returns**: Ensure data endpoints return normalized daily totals using user's time zone rather than individual check-in records
- **Motivation Lens Medical Restriction**: Ensure `MotivationLens` is restricted to contextual framing and tone adjustment only — never influences medical advice or behavior phase classification
- Handle migration of existing entries to time zone-aware normalized timestamps

## Backend Requirements
- User authentication and session management
- **Enhanced Actor Initialization**: Implement robust backend actor initialization with comprehensive connection verification and authentication status checks
- **Connection Health Monitoring**: Add backend health check endpoints and connection monitoring to detect and report actor availability status
- **Graceful Error Recovery**: Implement automatic retry mechanisms with exponential backoff for temporary backend unavailability
- **Actor State Management**: Maintain and verify actor authentication state throughout user sessions with proper error handling
- **MotivationLens Enum Implementation**: Implement `MotivationLens` enum with five variants: `#family`, `#money`, `#sex`, `#health`, `#sport`
- **DrinkingBaseline Enum Implementation**: Implement `DrinkingBaseline` enum with four variants: `Low`, `Medium`, `High`, and `Avoidant`
- **Secondary Substance Field Implementation**: Update `UserProfile` type to include optional field `secondarySubstance?: "weed" | "cocaine" | "porn" | "cigarettes" | "games"`
- **Baseline Tier Derivation Logic**: Implement automatic derivation of `baselineTier` from `drinksPerWeek` onboarding answer
- **Motivation-Based Profile Management**: Store and retrieve user's motivation as `MotivationLens` enum and derived baseline tier as part of user profile
- **Secondary Substance Profile Management**: Store and retrieve user's secondary substance selection as part of user profile without invoking feedback logic during onboarding
- **Onboarding State Management**: Track completion status of initial onboarding per user to prevent repeat onboarding flows
- **Time Zone-Aware Daily Check-in State Management**: Store and retrieve last check-in date and daily completion status per user using user's time zone
- **Motivation-Based Brutal Friend Message System**: Implement comprehensive multi-dimensional tone modulation for brutal friend feedback:
  - **Multi-Dimensional Tone Parameter Mapping**: Map `ageRange`, `baselineTier`, and `MotivationLens` values to specific tone parameters
  - **Motivation-Contextual Message Generation**: Apply motivation-specific contextual framing for different motivation types
  - **Probabilistic Secondary Substance Reference Function**: Implement probabilistic function `secondarySubstanceReference(substance: string)` that returns corresponding phrase with 20% probability using `if (Math.random() < 0.2)` check:
    - weed → "Weed might be calling too."
    - cocaine → "Your other friend isn't quiet either."
    - porn → "Time to avoid another habit too."
    - cigarettes → "Smokes are still around."
    - games → "The other vice still wins time."
    - default → ""
  - **Controlled Randomness Integration**: Extend feedback generator function to accept `secondarySubstance` as read-only input and apply probabilistic secondary substance reference appending for sober-day messages
  - **Contextual Sober/Drinking Day Logic**: Generate different message types based on check-in status with motivation-appropriate framing and probabilistic secondary substance references
  - **Multi-Dimensional Message Generation**: Modify `getBrutalFriendMessage()` function to incorporate user's `ageRange`, `baselineTier`, `MotivationLens`, and probabilistic `secondarySubstance`
  - **Motivation-Categorized Message Collections**: Maintain message collections organized by age group, baseline tier, and motivation lens combinations
  - **Safety-First Implementation**: Ensure all motivation-based messages maintain safety standards without medical advice or harmful judgment
  - **Tone-Customized Message Storage**: Store and retrieve age, baseline, and motivation-appropriate brutal friend messages for each user
  - **Extensible Architecture**: Design tone system to support future modifiers without affecting underlying logic
- **Clean Text Handling**: Ensure brutal friend messages are stored and retrieved without HTML encoding issues
- **Time Zone-Aware Motivation Button Click Management**: Store and retrieve daily motivation button click count per user, with automatic reset each new local day
- **Motivation-Based Motivation Message Generation**: Provide age, baseline, and motivation-appropriate motivation messages using same multi-dimensional tone modulation system with probabilistic secondary substance integration
- **Motivation-Based Streak Personalization**: Implement streak messaging and motivational context adjustments based on motivation lens while maintaining baseline tier difficulty adjustments
- **Sober Days Target Management**: Store and retrieve user's sober days target goal for dashboard display
- **Risk Assessment Endpoint**: Provide placeholder "Chance of Drinking Tomorrow" data with statuses "Low," "Moderate," or "High"
- **Dynamic Cycle Window Endpoint**: Provide time zone-aware cycle window data with daily update accuracy
- **Time Zone-Aware Status Indicators Endpoint**: Calculate and provide status indicators based on user's drinking patterns using user's time zone
- **Enhanced Profile Persistence**: Store user profiles with structured onboarding data fields including `motivation` as `MotivationLens` enum and `secondarySubstance` as optional field
- **Robust Save Endpoint**: Ensure `saveCallerUserProfile` endpoint properly handles incoming data format including motivation lens enum and secondary substance
- **Data Structure Validation**: Implement backend validation to ensure incoming profile data including motivation lens and secondary substance matches expected structure
- **Time Zone-Aware Date Utilities**: Update backend utilities to respect user-specific time zone offset
- **Time Zone-Aware Check-in Timestamp Normalization**: Normalize check-in timestamps to user's local midnight based on their saved time zone
- **Time Zone-Aware Daily Aggregation**: Aggregate check-in entries by normalized calendar date using user's time zone with merging logic
- **Follow-up Check-in Support**: Handle additional drink count submissions for same-local-day entries, adding to existing totals
- **Motivation-Based Brutal Friend Feedback Parameter**: Accept `brutalFriendFeedback` parameter in check-in submissions and store as latest age, baseline, and motivation-appropriate feedback message
- **Time Zone-Aware Progress Metrics**: Calculate progress metrics from normalized daily data using user's time zone
- **Time Zone-Aware Data Endpoints**: Provide endpoints for dashboard data retrieval with proper chronological ordering including latest motivation-based brutal friend message
- Support comparison logic for feedback based on user's average drinking patterns
- **Time Zone-Aware Data Returns**: Ensure data endpoints return normalized daily totals using user's time zone
- **Motivation Lens Medical Restriction**: Ensure `MotivationLens` is restricted to contextual framing and tone adjustment only — never influences medical advice or behavior phase classification
- Handle migration of existing entries to time zone-aware normalized timestamps

## Frontend Requirements
- **Time Zone Detection and Storage**: Automatically detect user's time zone using browser's `Intl.DateTimeFormat().resolvedOptions().timeZone` API and include in user profile during onboarding
- **Comprehensive Actor Connection Management**: Implement robust frontend logic to verify backend actor initialization and authentication status before any canister calls
- **Enhanced Authentication Flow Logic**: 
  - Detect if user is first-time (needs onboarding) or returning user only after actor connection is verified
  - For first-time users: Login → Actor Verification → Onboarding (with motivation lens enum and secondary substance) → Daily Check-in → Motivation-Based Brutal Friend → Dashboard
  - For returning users: Login → Actor Verification → Daily Check-in → Motivation-Based Brutal Friend → Dashboard
  - For multiple same-local-day logins: Login → Actor Verification → Follow-up Check-in popup → Motivation-Based Brutal Friend → Dashboard
- **Robust Authentication Flow**: Login screen must render immediately without being blocked by loading states or backend query resolution
- **Session-Level Dialog Guard Implementation**: Add guard condition in frontend logic to ensure daily check-in dialog opens only once per session
- **Enhanced Onboarding Save**: 
  - **Actor Availability Verification**: Ensure backend actor is fully initialized and authenticated before attempting profile save operations
  - **Motivation Lens Data Mapping**: Ensure frontend maps motivation selection to `MotivationLens` enum value instead of plain text
  - **Secondary Substance Data Mapping**: Ensure frontend maps secondary substance selection to proper union type value
  - **Correct Data Mapping**: Ensure frontend maps onboarding form values to exact backend field names including `motivation` as enum and `secondarySubstance` as optional field
  - **Time Zone Integration**: Include detected time zone in user profile data sent to backend during onboarding save
  - **Baseline Tier Integration**: Include derived baseline tier in user profile data sent to backend during onboarding save
  - **Proper Async Handling**: Update save handler to use `saveCallerUserProfile` with proper async/await pattern
  - **Response Validation**: Implement thorough response handling to detect and resolve "save failed" errors
  - **Enhanced Retry Mechanism**: Add retry functionality for failed saves with user-friendly retry button
  - **Success Confirmation**: Display clear success feedback before automatic navigation
  - **Automatic Navigation**: After successful save confirmation, automatically navigate user to Daily Check-In screen, then to Dashboard
- **Time Zone-Aware Follow-up Check-in Popup Logic**: Query backend to determine if user has already completed daily check-in for current local day using user's time zone
- **Time Zone-Aware Smart Daily Check-in Popup Logic**: Query backend to determine user's onboarding status and daily check-in status using user's time zone
- **Progressive Dashboard Loading**: Optimize initial dashboard rendering by lazy-loading secondary data after the main layout appears
- **Full Mobile Responsiveness Implementation**: Ensure all dashboard cards stack properly on mobile without horizontal overflow
- **Redesigned Dashboard Layout Implementation**:
  - **Unified Header Section**: Combine BrutalFriendFeedbackCard and MotivationButton components into one unified header section at the top
  - **Side-by-Side Cards Row**: Create responsive row layout for Chance of Drinking Tomorrow Card and Dynamic Cycle Window Card
  - **Chance of Drinking Tomorrow Card**: Create new component displaying risk assessment with placeholder logic
  - **Dynamic Cycle Window Card**: Create new component with time zone-aware dynamic logic
  - **Sober Days Section**: Create section displaying "Sober Days Streak" and "Sober Days Target" as bold numbers
  - **Status Indicators Section**: Create horizontal section with three cards for status indicators
  - **Chart Repositioning**: Move `DrinksChart` component to bottom of layout
- **Enhanced Motivation-Based Brutally Honest Friend Component**:
  - Create new `BrutalFriendDialog.tsx` component with brutalist dark-mode styling
  - **Motivation-Based Message Display**: Component receives age, baseline, and motivation-customized message from backend based on user's `ageRange`, `baselineTier`, and `MotivationLens`
  - **Probabilistic Secondary Substance Integration**: Display messages with probabilistic secondary substance reference phrases appended for sober-day feedback
  - **Multi-Dimensional Message Selection**: Backend provides age, baseline, and motivation-appropriate message selected from tone-customized collection
  - **Backend Integration**: Pass selected age, baseline, and motivation-customized message to backend as `brutalFriendFeedback` parameter
  - Display the age, baseline, and motivation-appropriate humorous message with contextual framing
  - Include dismiss button labeled "Shut up, I'm trying."
  - **Message State Management**: Pass the selected motivation-based brutal friend message to dashboard state for display in feedback card
  - **Clean Text Rendering**: Ensure all brutal friend messages display as plain text without HTML encoding artifacts
- **Fixed BrutalFriendFeedbackCard Component**:
  - Create new component to display the latest age, baseline, and motivation-customized brutal friend feedback in the unified header section
  - **Proper Data Integration**: Component must internally call `useGetLatestBrutalFriendFeedback` query and handle its own data binding
  - **Query Invalidation**: Implement proper query invalidation triggers after each check-in to ensure fresh data is fetched
  - **Enhanced Error Handling**: Include proper loading states, error fallbacks, and empty state handling
  - **Reactive Updates**: Update automatically after each check-in through proper useEffect triggers and query invalidation
  - Display the most recent age, baseline, and motivation-appropriate sarcastic comment from the Brutal Friend
  - **Clean Text Display**: Ensure feedback text renders cleanly without HTML encoding issues
  - **Fixed Title Display**: Display the fixed title "YOUR BRUTALLY HONEST FRIEND" without randomization
  - **Standard Typography**: Use the original font sizes for both the title and feedback text
- **Time Zone-Aware Motivation-Based Motivation Button Component**:
  - Create brutalist-style button labeled "Need Motivation?" positioned in the unified header section
  - Query backend for current local day's motivation button click count using user's time zone
  - Handle button click by fetching random age, baseline, and motivation-appropriate brutal friend message and displaying in popup
  - Track and enforce 3-click daily limit with proper state management based on user's local day
  - Disable button and show "That's enough motivation for today. Come back tomorrow." message after third click
  - Reset click counter automatically each new local day using user's time zone
- **New Dashboard Components**:
  - **ChanceOfDrinkingCard**: Display risk assessment with placeholder logic showing "Low," "Moderate," or "High" status
  - **Dynamic CycleWindowCard**: Show time zone-aware contextual information with daily update integration
  - **SoberDaysSection**: Display streak and target numbers with bold, dark-neon brutalist styling
  - **StatusIndicatorsSection**: Horizontal layout with three cards for status indicators
- **Enhanced Login Page Typography and Layout**: Updated typography specifications with optimized vertical spacing
- Login interface with redesigned onboarding flow featuring 5 questions with clickable answer choices including motivation selection as enum and secondary substance selection
- **Time Zone-Aware Daily Check-in Popup**: Daily check-in popup with conditional drink count input using user's local time zone
- **Time Zone-Aware Follow-up Check-in Popup**: Follow-up check-in popup with quick button choices using user's local day logic
- **Time Zone-Aware Dashboard**: Dashboard with progress visualization showing normalized daily drink counts using user's time zone
- **Time Zone-Aware Days Tracked Counter**: Days Tracked counter displaying unique normalized calendar days using user's time zone
- Enhanced feedback system with personalized messages based on progress against user's average
- Real-time data refresh system using React Query with proper data refetching after submission
- **Time Zone-Aware Chart Component**: Chart component with accurate mapping of normalized daily drink counts using user's time zone
- **Time Zone-Aware Progress Statistics**: Progress statistics calculated from normalized daily data using user's time zone
- **Automatic Dashboard Updates**: Dashboard refreshes automatically after any check-in input including age, baseline, and motivation-customized brutal friend feedback
- Responsive design for mobile and desktop use
- App content language: English
- **Publishing Preparation**: Configure app metadata, title (BRUTAL), description, and logo for Internet Computer dashboard publishing

## Design System - BRUTAL Brand
- **Color Palette**: 
  - Primary background: black/dark gray (#1a1a1a, #2a2a2a)
  - Accent colors: neon pink (#ff007f) and electric blue (#00eaff)
  - Text: white/light gray with high contrast
- **Typography**: 
  - Bold sans-serif font (Space Grotesk or similar)
  - Sharp uppercase headings
  - Subtle motion transitions and animations
- **Visual Elements**:
  - Minimalist, gritty line icons (monochrome/white)
  - Neon glow effects for highlights and accents
  - Brutalist design with reduced rounded corners
  - High contrast, edgy aesthetic

## Page-Specific Design Requirements

### Login Page
- Deep charcoal background with glowing BRUTAL logo
- **Updated Typography and Layout**: Main headline display, tagline, feature card text, and login button with optimized vertical spacing
- Internet Identity button styled for dark-mode aesthetic
- **Feature Cards Text-Only**: Display only the text content in feature cards, without the numeric labels
- **Layout Balance**: Ensure layout alignment and visual balance remain consistent after typography adjustments
- Minimal soft gradients, focus on stark contrasts
- **Fast Loading**: Must render immediately without waiting for heavy assets or backend queries
- **Connection Status Indicators**: Display backend connection status during authentication process

### Onboarding Flow
- Preserve BRUTAL design style with dark mode, neon accents, and brutalist layout
- Each question displayed with clickable answer choices styled as neon-accented buttons
- Sharp, angular design elements with glow effects
- High contrast text and interactive elements
- Progress indicator showing current question step
- **Time Zone Detection Integration**: Automatically detect and include user's time zone during onboarding process
- **Motivation Lens Integration**: Store motivation selection as `MotivationLens` enum value instead of plain text
- **Secondary Substance Integration**: Store secondary substance selection as optional field without invoking feedback logic
- **Baseline Tier Integration**: Automatically derive and include baseline tier during onboarding process
- **Enhanced Save Experience**: Display clear loading states during save, show success confirmation with retry option for failures
- **Actor Connection Verification**: Show connection status and verify backend actor availability before allowing save operations
- **Enhanced Error Handling UI**: Clear error messages with retry button for failed saves, connection status indicators
- **One-time Display**: Only appears for first-time users who haven't completed onboarding

### Dashboard
- **Redesigned Vertical Layout**: All dashboard components arranged in specific order for optimal user experience with unified header section, side-by-side cards row, sober days section, status indicators section, and 14-day chart
- **Full Mobile Responsiveness**: All cards align properly on mobile devices without horizontal scroll
- **Optimized Screen Fit**: All cards align neatly on standard screens without requiring scroll
- High-contrast dark background
- Neon highlights for progress counters and chart bars
- Mood indicators using existing 64x64 mood icons with faint glowing halos
- Stats cards styled as brutalist neon panels
- **Fixed BrutalFriendFeedbackCard**: Dark card with neon text glow in unified header section, with proper internal data fetching, comprehensive error handling, and automatic updates
- **Clean Feedback Display**: Ensure age, baseline, and motivation-customized brutal friend feedback renders as clean text without HTML encoding artifacts
- **Reactive Feedback Display**: Feedback card updates automatically after check-ins through proper query invalidation triggers
- **Fixed Title Display**: The Brutal Friend feedback section displays the fixed title "YOUR BRUTALLY HONEST FRIEND" without randomization
- **Standard Typography**: Use the original font sizes for both the title and feedback text
- **Time Zone-Aware Motivation-Based Motivation Button**: Brutalist-style button in unified header section with neon accents, disabled state styling after 3 clicks per local day
- Placeholder areas for future sarcastic one-liners under each metric
- **Progressive Loading**: Main layout appears immediately, secondary data loads progressively
- **Automatic Updates**: Visual updates immediately after any check-in submission including age, baseline, and motivation-customized brutal friend feedback

### Check-in Popups
- Minimalist black background
- Bold neon text with simple line separators
- No soft edges or rounded corners
- Feedback message area styled like terminal prompt with monospace subtext
- Sharp, angular design elements
- **Time Zone-Aware Smart Popup Behavior**: Different messaging for first daily check-in vs. follow-up check-ins based on user's local day
- **Follow-up Popup Design**: Quick button choices styled with neon accents for "Remained Sober" and "Had More Drinks"
- **Smooth Transitions**: Seamless transitions between popup types without loading delays
- **Session Guard Integration**: Dialog guard prevents duplicate openings while maintaining proper popup flow

### Motivation-Based Brutally Honest Friend Dialog
- Brutalist dark-mode styling matching existing neon/glow theme
- Minimalist black background with neon accent borders
- Bold, age, baseline, and motivation-appropriate sarcastic text with high contrast displaying multi-dimensional customized message from backend
- **Probabilistic Secondary Substance Integration**: Display sober-day messages with probabilistic secondary substance reference phrases appended
- Sharp, angular design elements without rounded corners
- Dismiss button styled with neon glow effects
- Clean modal overlay with dark backdrop
- **Motivation-Based Consistent Appearance**: Shows after every check-in submission with age, baseline, and motivation-appropriate tone-customized messages from backend
- **Multi-Dimensional Message Display**: Display age, baseline, and motivation-appropriate message with contextual framing based on user's motivation lens
- **State Management**: Pass selected multi-dimensional message to dashboard state for feedback card display and send to backend for storage
- **Clean Text Rendering**: Ensure all age, baseline, and motivation-customized messages display as plain text without HTML encoding issues

### BrutalFriendFeedbackCard
- Dark card background consistent with brutalist aesthetic positioned in unified header section
- Neon text glow effects for the age, baseline, and motivation-customized feedback message
- Sharp, angular design without rounded corners
- High contrast text for readability
- **Fixed Data Integration**: Component internally manages its own data fetching using `useGetLatestBrutalFriendFeedback` query with proper error handling
- **Enhanced Error Handling**: Includes loading indicators, error fallbacks, and empty state messaging
- **Reactive Updates**: Updates automatically with latest age, baseline, and motivation-customized brutal friend message after check-ins
- **Clean Text Display**: Ensure age, baseline, and motivation-customized feedback text renders cleanly without HTML encoding artifacts
- **Fixed Title Display**: Display the fixed title "YOUR BRUTALLY HONEST FRIEND" without randomization
- **Standard Typography**: Use the original font sizes for both the title and feedback text

### Motivation-Based Motivation Button & Popup
- Brutalist-style button with neon accents positioned in unified header section alongside Brutal Friend Feedback
- Button labeled "Need Motivation?" with sharp, angular design
- **Time Zone-Aware Disabled State**: Disabled state styling with dimmed neon effects after 3 daily clicks based on user's local day
- Popup/toast displaying random age, baseline, and motivation-appropriate brutal friend message with same styling as Motivation-Based Brutally Honest Friend Dialog
- **Time Zone-Aware Daily Limit**: Daily limit message styled with brutalist aesthetic, reset based on user's local day
- Consistent dark background and neon text glow effects

### New Dashboard Components
- **ChanceOfDrinkingCard**: Dark brutalist card with neon risk status indicators
- **Dynamic CycleWindowCard**: Dark card with time zone-aware contextual information using neon text highlights with daily update indicators
- **Side-by-Side Card Layout**: Both cards styled with equal heights, equal widths, responsive behavior, consistent spacing, and mobile optimization
- **SoberDaysSection**: Bold, large numbers with prominent neon glow effects for streak and target values
- **StatusIndicatorsSection**: Three uniform cards in horizontal layout with neon status indicators and dark backgrounds

### Animation & Interaction
- Quick fade transitions between sections
- Neon "pulse" glow effects on interactive elements
- Minimal motion with sharp, precise animations
- Focus on readability while maintaining edgy attitude
- **Smooth Flow Transitions**: Seamless transitions between onboarding, check-ins, follow-up popups, motivation-based brutal friend dialog, and dashboard
- **Session Guard Transitions**: Dialog guard ensures smooth popup flow without duplicate openings or interruptions
- **Performance optimization**: Heavy neon effects and animations lazy-loaded post-login to improve initial app loading time
- **Mobile Touch Optimization**: Ensure all interactive elements are touch-friendly with proper sizing and feedback
- **Connection Status Animations**: Visual feedback for backend connection status during critical operations
