import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Skull } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const [logoLoaded, setLogoLoaded] = useState(false);

  const isLoggingIn = loginStatus === 'logging-in';

  // Preload logo for faster display
  useEffect(() => {
    const img = new Image();
    img.src = '/assets/generated/brutal-logo.dim_200x200.png';
    img.onload = () => setLogoLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full text-center space-y-8 animate-quick-fade">
          {/* Logo - Slightly enlarged for central dominance */}
          <div className="flex justify-center mb-4">
            {logoLoaded ? (
              <img 
                src="/assets/generated/brutal-logo.dim_200x200.png" 
                alt="BRUTAL Logo" 
                className="w-64 h-64 md:w-72 md:h-72 animate-neon-pulse"
              />
            ) : (
              <div className="w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
                <Skull className="w-32 h-32 md:w-36 md:h-36 text-primary animate-pulse" />
              </div>
            )}
          </div>

          {/* Title - Two lines with text-4xl (~28px) */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight neon-glow-pink leading-tight">
              <div>Alcohol Reduction</div>
              <div>Without Bullshit</div>
            </h1>
            {/* Tagline - text-xl (~20px), positioned closer to headline */}
            <p className="text-base md:text-xl font-bold text-secondary neon-glow-blue uppercase tracking-wide pt-1">
              Drink less. Or don't. Just stop lying to yourself.
            </p>
          </div>

          {/* Login Button - text-lg (~18px), label changed to "CONTINUE" */}
          <div className="space-y-4 pt-3">
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full max-w-md h-14 text-lg font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary neon-border-pink transition-all duration-200 hover:scale-105"
            >
              {isLoggingIn ? (
                <>
                  <div className="mr-2 h-5 w-5 animate-spin rounded-sm border-2 border-white border-t-transparent"></div>
                  CONNECTING...
                </>
              ) : (
                <>
                  <Skull className="w-5 h-5 mr-2" />
                  CONTINUE
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Secure Internet Identity Authentication
            </p>
          </div>

          {/* Features - Text Only, No Numbers, text-base (~22px) for card text */}
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-4">
            <div className="brutal-card p-5 hover:brutal-card-neon transition-all duration-300">
              <h3 className="font-bold uppercase text-base mb-2 tracking-wider">Daily Check-ins</h3>
              <p className="text-base text-muted-foreground">
                Track every day. No excuses.
              </p>
            </div>

            <div className="brutal-card p-5 hover:brutal-card-neon transition-all duration-300">
              <h3 className="font-bold uppercase text-base mb-2 tracking-wider">Brutal Honesty</h3>
              <p className="text-base text-muted-foreground">
                Real progress. Real data.
              </p>
            </div>

            <div className="brutal-card p-5 hover:brutal-card-neon transition-all duration-300">
              <h3 className="font-bold uppercase text-base mb-2 tracking-wider">No BS</h3>
              <p className="text-base text-muted-foreground">
                Just you vs. your goals.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-muted-foreground border-t border-border">
        <p className="uppercase tracking-wider">
          © 2025. Built with <span className="text-primary">●</span> using{' '}
          <a 
            href="https://caffeine.ai" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-secondary hover:text-secondary/80 transition-colors font-bold"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
