import { useEffect, useState } from 'react';
import { loadFeedbackMatrix } from '../lib/feedbackMatrixLoader';
import type { FeedbackMatrixEntry, MotivationLens, DrinkingBaseline } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface GroupKey {
  ageRange: string;
  motivation: MotivationLens;
  baselineTier: DrinkingBaseline;
  secondarySubstance: string | null;
}

interface GroupStats {
  key: GroupKey;
  messages: Array<{ text: string; sentenceCount: number }>;
  totalMessages: number;
  totalSentences: number;
}

/**
 * Counts sentences in a message by splitting on sentence-ending punctuation.
 * Deterministic algorithm: splits on '.', '!', '?' and filters out empty results.
 */
function countSentences(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  
  // Split on sentence-ending punctuation
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  return sentences.length;
}

function groupKeyToString(key: GroupKey): string {
  const substance = key.secondarySubstance || 'none';
  return `${key.ageRange} | ${key.motivation} | ${key.baselineTier} | ${substance}`;
}

export default function FeedbackMatrixInspector() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<GroupStats[]>([]);

  useEffect(() => {
    async function loadAndAnalyze() {
      try {
        setLoading(true);
        setError(null);
        
        const matrix = await loadFeedbackMatrix();
        
        if (matrix.length === 0) {
          setError('Feedback matrix is empty or failed to load.');
          setLoading(false);
          return;
        }

        // Group entries by (ageRange, motivation, baselineTier, secondarySubstance)
        const groupMap = new Map<string, GroupStats>();

        matrix.forEach((entry: FeedbackMatrixEntry) => {
          const key: GroupKey = {
            ageRange: entry.ageRange,
            motivation: entry.motivation,
            baselineTier: entry.baselineTier,
            secondarySubstance: entry.secondarySubstance || null,
          };

          const keyString = groupKeyToString(key);
          
          if (!groupMap.has(keyString)) {
            groupMap.set(keyString, {
              key,
              messages: [],
              totalMessages: 0,
              totalSentences: 0,
            });
          }

          const group = groupMap.get(keyString)!;
          const sentenceCount = countSentences(entry.message);
          
          group.messages.push({
            text: entry.message,
            sentenceCount,
          });
          group.totalMessages += 1;
          group.totalSentences += sentenceCount;
        });

        // Convert map to sorted array
        const groupsArray = Array.from(groupMap.values()).sort((a, b) => {
          // Sort by age range, then motivation, then baseline
          if (a.key.ageRange !== b.key.ageRange) {
            return a.key.ageRange.localeCompare(b.key.ageRange);
          }
          if (a.key.motivation !== b.key.motivation) {
            return a.key.motivation.localeCompare(b.key.motivation);
          }
          return a.key.baselineTier.localeCompare(b.key.baselineTier);
        });

        setGroups(groupsArray);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load feedback matrix:', err);
        setError('Failed to load feedback matrix. Please check the console for details.');
        setLoading(false);
      }
    }

    loadAndAnalyze();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-black uppercase tracking-tight mb-6 text-primary">
            Feedback Matrix Inspector
          </h1>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-black uppercase tracking-tight mb-6 text-primary">
            Feedback Matrix Inspector
          </h1>
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-bold text-destructive mb-1">Error Loading Matrix</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalMessages = groups.reduce((sum, g) => sum + g.totalMessages, 0);
  const totalSentences = groups.reduce((sum, g) => sum + g.totalSentences, 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2 text-primary">
            Feedback Matrix Inspector
          </h1>
          <p className="text-muted-foreground text-sm">
            Analyzing message and sentence counts grouped by user input fields
          </p>
          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Total Groups:</span>{' '}
              <span className="font-bold text-foreground">{groups.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Messages:</span>{' '}
              <span className="font-bold text-foreground">{totalMessages}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Sentences:</span>{' '}
              <span className="font-bold text-foreground">{totalSentences}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {groups.map((group, idx) => (
            <Card key={idx} className="border-2">
              <CardHeader>
                <CardTitle className="text-lg font-bold uppercase tracking-tight">
                  {groupKeyToString(group.key)}
                </CardTitle>
                <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                  <div>
                    <span className="font-semibold">Messages:</span> {group.totalMessages}
                  </div>
                  <div>
                    <span className="font-semibold">Total Sentences:</span> {group.totalSentences}
                  </div>
                  <div>
                    <span className="font-semibold">Avg Sentences/Message:</span>{' '}
                    {(group.totalSentences / group.totalMessages).toFixed(1)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.messages.map((msg, msgIdx) => (
                    <div
                      key={msgIdx}
                      className="p-3 bg-muted/30 border border-border rounded"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm flex-1">{msg.text}</p>
                        <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded shrink-0">
                          {msg.sentenceCount} {msg.sentenceCount === 1 ? 'sentence' : 'sentences'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
