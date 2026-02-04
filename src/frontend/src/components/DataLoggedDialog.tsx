import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface DataLoggedDialogProps {
  open: boolean;
  onClose: () => void;
  message: string;
  variant?: 'primary' | 'secondary';
}

export default function DataLoggedDialog({
  open,
  onClose,
  message,
  variant = 'primary',
}: DataLoggedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md text-center bg-popover border-2 border-primary z-[100]">
        <div className="py-6 space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 border-2 border-primary bg-primary/10">
            <Zap className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight neon-glow-pink">
            {message}
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
            {variant === 'primary'
              ? '> Data logged. Keep moving.'
              : '> Updated. Keep tracking.'}
          </p>
        </div>
        <Button
          onClick={onClose}
          className="w-full bg-primary hover:bg-primary/90 font-bold uppercase tracking-wider border-2 border-primary"
        >
          CONTINUE
        </Button>
      </DialogContent>
    </Dialog>
  );
}
