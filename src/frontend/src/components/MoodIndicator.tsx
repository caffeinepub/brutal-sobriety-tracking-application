import { useGetProgressMetrics } from '../hooks/useQueries';

export default function MoodIndicator() {
  const { data: metrics, isLoading } = useGetProgressMetrics();

  if (isLoading) {
    return (
      <div className="brutal-card border-2 border-border p-4 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-sm border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Get the most recent mood from last14Days
  const recentEntry = metrics?.last14Days?.[metrics.last14Days.length - 1];
  const mood = recentEntry?.mood;

  const getMoodDisplay = () => {
    if (!mood) {
      return {
        icon: '😐',
        label: 'No mood data',
        color: 'text-muted-foreground',
      };
    }

    switch (mood) {
      case 'happy':
        return {
          icon: '😊',
          label: 'Happy',
          color: 'text-green-400 neon-glow-green',
        };
      case 'neutral':
        return {
          icon: '😐',
          label: 'Neutral',
          color: 'text-yellow-400 neon-glow-yellow',
        };
      case 'sad':
        return {
          icon: '😢',
          label: 'Sad',
          color: 'text-blue-400 neon-glow-blue',
        };
      default:
        return {
          icon: '😐',
          label: 'Unknown',
          color: 'text-muted-foreground',
        };
    }
  };

  const moodDisplay = getMoodDisplay();

  return (
    <div className="brutal-card border-2 border-border p-4">
      <div className="text-center">
        <div className="text-4xl mb-2">{moodDisplay.icon}</div>
        <p className={`text-sm font-bold uppercase tracking-wider ${moodDisplay.color}`}>
          {moodDisplay.label}
        </p>
      </div>
    </div>
  );
}
