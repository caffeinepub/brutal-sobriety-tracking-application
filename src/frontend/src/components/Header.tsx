import { Button } from '@/components/ui/button';
import { LogOut, Skull } from 'lucide-react';

interface HeaderProps {
  onLogout: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  return (
    <header className="border-b-2 border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skull className="w-8 h-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight neon-glow-pink">
              BRUTAL
            </h1>
          </div>

          <Button
            variant="outline"
            onClick={onLogout}
            className="gap-2 font-bold uppercase tracking-wider border-2 hover:border-primary hover:text-primary transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
