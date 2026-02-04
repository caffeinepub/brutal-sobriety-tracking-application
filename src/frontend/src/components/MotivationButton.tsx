import { useState } from 'react';
import { useGetMotivationMessage } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import BrutalFriendDialog from './BrutalFriendDialog';

export default function MotivationButton() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [remainingClicks, setRemainingClicks] = useState(3);

  const { mutate: getMotivation, isPending } = useGetMotivationMessage();

  const handleClick = () => {
    getMotivation(undefined, {
      onSuccess: (data) => {
        setCurrentMessage(data.message);
        setRemainingClicks(Number(data.remainingClicks));
        setDialogOpen(true);
      },
      onError: (error) => {
        console.error('Failed to get motivation:', error);
        setCurrentMessage('Failed to load motivation. Try again later.');
        setDialogOpen(true);
      },
    });
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isPending || remainingClicks === 0}
        className="w-full bg-primary text-primary-foreground font-black uppercase tracking-wider border-2 border-primary hover:bg-primary/90 transition-colors px-6 py-6 text-base shadow-brutal disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Loading...' : remainingClicks === 0 ? 'Limit Reached' : `Motivate Me (${remainingClicks} left)`}
      </Button>

      <BrutalFriendDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        message={currentMessage}
      />
    </>
  );
}
