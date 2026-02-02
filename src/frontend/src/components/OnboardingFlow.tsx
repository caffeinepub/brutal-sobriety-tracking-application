import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Skull, CheckCircle2, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import type { UserProfile } from '../backend';
import { DrinkingBaseline, MotivationLens } from '../backend';

const questions = [
  {
    id: 'ageRange',
    title: 'Are you old?',
    description: 'Age matters. Different battles at different stages.',
    options: ['18–25', '25–35', '35–45', '45+'],
  },
  {
    id: 'drinksPerWeek',
    title: 'How many drinks per week do you have?',
    description: 'Honesty required. This is your baseline.',
    options: ['Less than 5', '5–10', 'More than 10', 'I just drink, don\'t count...'],
  },
  {
    id: 'motivation',
    title: 'What drives you / why are you here?',
    description: 'Your "why" keeps you going when it gets hard.',
    options: ['Family', 'Money', 'Sex', 'Health', 'Sport'],
  },
  {
    id: 'secondarySubstance',
    title: 'Your favorite drug next to alcohol?',
    description: 'We all have vices. What\'s yours?',
    options: ['Weed', 'Cocaine', 'Porn', 'Cigarettes', 'Games'],
  },
  {
    id: 'sobrietyDuration',
    title: 'How long can you go without alcohol?',
    description: 'Be realistic. This sets your first target.',
    options: ['2 days', '5 days', '1 week', '2 weeks', '1 month'],
  },
];

// Detect user's time zone using browser API
function detectTimeZone(): string {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timeZone || 'UTC';
  } catch (error) {
    console.error('Failed to detect time zone:', error);
    return 'UTC';
  }
}

// Derive baseline tier from drinks per week answer
function deriveBaselineTier(drinksPerWeek: string): DrinkingBaseline {
  switch (drinksPerWeek) {
    case 'Less than 5':
      return DrinkingBaseline.low;
    case '5–10':
      return DrinkingBaseline.medium;
    case 'More than 10':
      return DrinkingBaseline.high;
    case 'I just drink, don\'t count...':
      return DrinkingBaseline.avoidant;
    default:
      return DrinkingBaseline.low;
  }
}

// Map motivation selection to MotivationLens enum
function mapMotivationToEnum(motivation: string): MotivationLens {
  switch (motivation.toLowerCase()) {
    case 'family':
      return MotivationLens.family;
    case 'money':
      return MotivationLens.money;
    case 'sex':
      return MotivationLens.sex;
    case 'health':
      return MotivationLens.health;
    case 'sport':
      return MotivationLens.sport;
    default:
      return MotivationLens.family;
  }
}

// Map secondary substance to lowercase format expected by backend
function mapSecondarySubstance(substance: string): string | undefined {
  if (!substance || substance.trim() === '') {
    return undefined;
  }
  return substance.toLowerCase();
}

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    ageRange: '',
    drinksPerWeek: '',
    motivation: '',
    secondarySubstance: '',
    sobrietyDuration: '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { actor, isFetching: actorFetching } = useActor();
  const actorInitialized = !!actor && !actorFetching;
  
  const saveProfile = useSaveCallerUserProfile();
  const queryClient = useQueryClient();

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleSelectOption = (option: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: option };
    setAnswers(newAnswers);

    // Auto-advance after selection
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit(newAnswers);
      }
    }, 300);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (finalAnswers: typeof answers) => {
    // Check if backend is ready
    if (!actorInitialized) {
      setSaveError('Backend connection not ready. Please wait a moment and try again.');
      toast.error('Connection not ready. Please retry.');
      return;
    }

    setSaveError(null);
    
    try {
      // Detect user's time zone
      const timeZone = detectTimeZone();
      console.log('Detected time zone:', timeZone);

      // Derive baseline tier from drinks per week answer
      const baselineTier = deriveBaselineTier(finalAnswers.drinksPerWeek);
      console.log('Derived baseline tier:', baselineTier);

      // Map motivation to MotivationLens enum
      const motivationEnum = mapMotivationToEnum(finalAnswers.motivation);
      console.log('Mapped motivation to enum:', motivationEnum);

      // Map secondary substance to lowercase format
      const secondarySubstance = mapSecondarySubstance(finalAnswers.secondarySubstance);
      console.log('Mapped secondary substance:', secondarySubstance);

      // Create UserProfile with correct structure matching backend including timeZone, baselineTier, motivation enum, and optional secondarySubstance
      const userProfile: UserProfile = {
        onboardingAnswers: {
          ageRange: finalAnswers.ageRange,
          drinksPerWeek: finalAnswers.drinksPerWeek,
          motivation: motivationEnum,
          secondarySubstance: secondarySubstance,
          sobrietyDuration: finalAnswers.sobrietyDuration,
          timeZone: timeZone,
          baselineTier: baselineTier,
        },
        hasCompletedOnboarding: true,
      };

      console.log('Saving user profile:', userProfile);

      // Save the profile with proper async/await handling
      await saveProfile.mutateAsync(userProfile);

      console.log('Profile saved successfully');

      // Show success state
      setSaveSuccess(true);
      toast.success('Setup complete. Now the real work begins.');

      // Invalidate status query to trigger app flow update
      await queryClient.invalidateQueries({ queryKey: ['onboardingCheckInStatus'] });

      // The App component will automatically detect the updated status
      // and transition to the Daily Check-In dialog, then Dashboard
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      console.error('Onboarding save error:', error);
      setSaveError(errorMessage);
      toast.error('Save failed. Check your connection and try again.');
    }
  };

  const handleRetry = () => {
    setSaveError(null);
    handleSubmit(answers);
  };

  const selectedAnswer = answers[currentQuestion.id as keyof typeof answers];

  // Show connection status warning if actor is not ready
  const showConnectionWarning = !actorInitialized;

  // Show success screen after save
  if (saveSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center animate-quick-fade">
          <div className="inline-flex items-center justify-center mb-6 w-24 h-24 border-2 border-primary bg-primary/10">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight neon-glow-pink mb-4">
            PROFILE SAVED
          </h1>
          <p className="text-muted-foreground uppercase tracking-wider text-sm mb-6">
            Transitioning to your dashboard...
          </p>
          <div className="h-2 w-full bg-muted overflow-hidden">
            <div className="h-full bg-primary animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error screen if save failed
  if (saveError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center animate-quick-fade">
          <div className="inline-flex items-center justify-center mb-6 w-24 h-24 border-2 border-destructive bg-destructive/10">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-destructive mb-4">
            SAVE FAILED
          </h1>
          <p className="text-muted-foreground uppercase tracking-wider text-sm mb-2">
            Something went wrong
          </p>
          <p className="text-xs text-muted-foreground font-mono mb-6 px-4 py-2 bg-muted/50 border border-border break-words">
            {saveError}
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRetry}
              disabled={saveProfile.isPending || !actorInitialized}
              className="w-full font-bold uppercase tracking-wider border-2"
            >
              {saveProfile.isPending ? 'RETRYING...' : !actorInitialized ? 'CONNECTING...' : 'RETRY'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSaveError(null);
                setCurrentStep(questions.length - 1);
              }}
              className="w-full font-bold uppercase tracking-wider border-2"
            >
              BACK TO QUESTIONS
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-quick-fade">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Skull className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight neon-glow-pink mb-2">
            SETUP
          </h1>
          <p className="text-muted-foreground uppercase tracking-wider text-sm">
            Answer honestly. This is for you.
          </p>
        </div>

        {/* Connection Status Warning */}
        {showConnectionWarning && (
          <div className="mb-6 p-4 border-2 border-yellow-500/50 bg-yellow-500/10 flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-bold uppercase tracking-wider text-yellow-500">
                Connecting to backend...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please wait while we establish a secure connection.
              </p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">
            <span>Question {currentStep + 1}/{questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-muted" />
        </div>

        {/* Question Card */}
        <Card className="brutal-card border-2">
          <CardHeader>
            <CardTitle className="text-2xl font-black uppercase tracking-tight neon-glow-pink">
              {currentQuestion.title}
            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider">
              {currentQuestion.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Answer Options */}
            <div className="grid gap-3">
              {currentQuestion.options.map((option) => (
                <Button
                  key={option}
                  onClick={() => handleSelectOption(option)}
                  disabled={saveProfile.isPending || !actorInitialized}
                  variant={selectedAnswer === option ? 'default' : 'outline'}
                  className={`
                    h-auto py-4 px-6 text-left justify-start font-bold uppercase tracking-wider border-2
                    transition-all duration-200
                    ${selectedAnswer === option 
                      ? 'bg-primary text-primary-foreground border-primary neon-glow-pink scale-[1.02]' 
                      : 'hover:border-primary hover:bg-primary/10'
                    }
                  `}
                >
                  <span className="text-base">{option}</span>
                </Button>
              ))}
            </div>

            {/* Navigation Buttons */}
            {currentStep > 0 && (
              <div className="flex gap-3 pt-4 border-t-2 border-border">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={saveProfile.isPending}
                  className="flex-1 font-bold uppercase tracking-wider border-2"
                >
                  Back
                </Button>
              </div>
            )}

            {/* Saving Indicator */}
            {saveProfile.isPending && (
              <div className="flex items-center justify-center gap-2 text-primary pt-4">
                <div className="h-4 w-4 animate-spin rounded-sm border-2 border-primary border-t-transparent"></div>
                <span className="text-sm font-bold uppercase tracking-wider">SAVING...</span>
              </div>
            )}

            {/* Connection Status */}
            {actorInitialized && !saveProfile.isPending && (
              <div className="flex items-center justify-center gap-2 text-green-500 pt-2">
                <Wifi className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Connected</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
            &gt; Select an option to continue
          </p>
        </div>
      </div>
    </div>
  );
}
