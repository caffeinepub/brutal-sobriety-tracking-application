import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface BeerDonationDialogProps {
  open: boolean;
  onClose: () => void;
  address: string;
}

export default function BeerDonationDialog({ open, onClose, address }: BeerDonationDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied! Now go buy that beer. 🍺');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy. Try selecting and copying manually.');
      console.error('Copy failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-2 border-primary bg-card shadow-neon-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-wider text-primary">
            BEER FUND 🍺
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-mono text-sm">
            If this app helped you stay sober (or at least track your failures), consider buying me a beer.
            Ironic, right?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Donation Address
            </label>
            <div className="flex gap-2">
              <Input
                value={address}
                readOnly
                className="font-mono text-xs border-2 border-border bg-background"
              />
              <Button
                onClick={handleCopy}
                size="icon"
                variant="outline"
                className="shrink-0 border-2 border-primary hover:bg-primary hover:text-primary-foreground"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            <p className="mb-2">
              <strong>How to send:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Copy the address above</li>
              <li>Open your BTC wallet</li>
              <li>Send any amount you want</li>
              <li>Feel good about supporting brutal honesty</li>
            </ol>
          </div>
          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider"
          >
            CLOSE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
