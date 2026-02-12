import { useState } from 'react';
import { useCompleteOnboarding } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import type { OnboardingAnswers } from '../backend';
import { trackEvent, getOnboardingDedupeKey } from '../utils/usergeek';
import { STREAK_TARGET_OPTIONS } from '../utils/streakTargets';

export default function OnboardingFlow() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { mutate: completeOnboarding, isPending: isSaving } = useCompleteOnboarding();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    ageRange: '',
    drinksPerWeek: '',
    motivation: '',
    secondarySubstance: '',
    sobrietyDuration: '',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  });

  const actorInitialized = !!actor && !actorFetching;

  const handleNext = () => {
    if (step === 1 && !formData.ageRange) {
      toast.error('Please select an option');
      return;
    }
    if (step === 2 && !formData.drinksPerWeek) {
      toast.error('Please select an option');
      return;
    }
    if (step === 3 && !formData.motivation) {
      toast.error('Please select an option');
      return;
    }
    if (step === 4 && !formData.secondarySubstance) {
      toast.error('Please select an option');
      return;
    }
    if (step === 5 && !formData.sobrietyDuration) {
      toast.error('Please select an option');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    if (!actorInitialized) {
      toast.error('Backend connection not ready. Please wait a moment and try again.');
      return;
    }

    const answers: OnboardingAnswers = formData;

    completeOnboarding(answers, {
      onSuccess: () => {
        toast.success('Profile saved! Welcome to BRUTAL.');

        // Track onboarding completion event
        if (identity) {
          const userId = identity.getPrincipal().toString();
          const dedupeKey = getOnboardingDedupeKey(userId);

          trackEvent('Onboarding Completed', {
            ageRange: formData.ageRange,
            drinksPerWeek: formData.drinksPerWeek,
            motivation: formData.motivation,
            secondarySubstance: formData.secondarySubstance,
            sobrietyGoal: formData.sobrietyDuration,
            timezone: formData.timeZone,
          }, dedupeKey);
        }
      },
      onError: (error: any) => {
        console.error('Failed to complete onboarding:', error);
        toast.error('Failed to save profile. Please try again.');
      },
    });
  };

  const selectOption = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  if (!actorInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-sm border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground font-bold uppercase tracking-wider mb-2">
            Connecting to backend...
          </p>
          <p className="text-xs text-muted-foreground">
            Establishing secure connection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="brutal-card border-2 border-border p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black uppercase tracking-tight text-primary neon-glow-pink mb-2">
              BRUTAL ONBOARDING
            </h1>
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              Step {step} of 5
            </p>
            <div className="mt-4 h-2 bg-muted rounded-sm overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
                ARE YOU OLD?
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {['18-25', '25-35', '35-45', '45+'].map((option) => (
                  <Button
                    key={option}
                    onClick={() => selectOption('ageRange', option)}
                    variant={formData.ageRange === option ? 'default' : 'outline'}
                    className="h-14 text-lg font-bold uppercase tracking-wider justify-start"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
                HOW MANY DRINK PER WEEK DO YOU HAVE?
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {['less than 5', '5-10', 'more than 10', "I just drink, don't count"].map((option) => (
                  <Button
                    key={option}
                    onClick={() => selectOption('drinksPerWeek', option)}
                    variant={formData.drinksPerWeek === option ? 'default' : 'outline'}
                    className="h-14 text-lg font-bold uppercase tracking-wider justify-start"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
                WHAT DRIVES YOU?
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {['family', 'money', 'sex', 'health'].map((option) => (
                  <Button
                    key={option}
                    onClick={() => selectOption('motivation', option)}
                    variant={formData.motivation === option ? 'default' : 'outline'}
                    className="h-14 text-lg font-bold uppercase tracking-wider justify-start"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
                YOUR FAVORITE DRUG NEXT TO ALCOHOL?
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {['weed', 'cocaine', 'porn', 'video games'].map((option) => (
                  <Button
                    key={option}
                    onClick={() => selectOption('secondarySubstance', option)}
                    variant={formData.secondarySubstance === option ? 'default' : 'outline'}
                    className="h-14 text-lg font-bold uppercase tracking-wider justify-start"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
                HOW LONG CAN YOU GO WITHOUT ALCOHOL?
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {STREAK_TARGET_OPTIONS.map((option) => (
                  <Button
                    key={option}
                    onClick={() => selectOption('sobrietyDuration', option)}
                    variant={formData.sobrietyDuration === option ? 'default' : 'outline'}
                    className="h-14 text-lg font-bold uppercase tracking-wider justify-start"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1 h-12 font-bold uppercase tracking-wider"
                disabled={isSaving}
              >
                Back
              </Button>
            )}
            {step < 5 ? (
              <Button
                onClick={handleNext}
                className="flex-1 h-12 font-bold uppercase tracking-wider"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSaving || !actorInitialized}
                className="flex-1 h-12 font-bold uppercase tracking-wider"
              >
                {isSaving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-sm border-2 border-primary-foreground border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Complete
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
