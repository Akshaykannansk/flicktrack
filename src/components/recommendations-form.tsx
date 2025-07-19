'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getRecommendations } from '@/app/recommendations/actions';
import type { GenerateFilmRecommendationsInput } from '@/ai/flows/generate-film-recommendations';
import type { FilmRecommendation } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Loader2, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RecommendationsFormProps {
  viewingHistory: GenerateFilmRecommendationsInput['viewingHistory'];
}

export function RecommendationsForm({ viewingHistory }: RecommendationsFormProps) {
  const [recommendations, setRecommendations] = useState<FilmRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsLoading(true);
    setRecommendations([]);

    try {
      const result = await getRecommendations({ viewingHistory });
      if (result.recommendations && result.recommendations.length > 0) {
        setRecommendations(result.recommendations);
      } else {
         toast({
          variant: "destructive",
          title: "No Recommendations Found",
          description: "Our AI couldn't find any recommendations based on your history.",
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description: "Failed to generate recommendations. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>AI Recommendations</CardTitle>
        <CardDescription>Click the button to generate your personalized film list.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow items-center justify-center text-center space-y-6 p-6">
        {recommendations.length === 0 && !isLoading && (
            <div className="flex flex-col items-center space-y-4">
                <Wand2 className="w-16 h-16 text-primary/50" />
                <Button onClick={handleSubmit} size="lg" disabled={isLoading}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Recommendations
                </Button>
            </div>
        )}
        
        {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <p className="text-muted-foreground">Our AI is searching the archives...</p>
            </div>
        )}
        
        {recommendations.length > 0 && !isLoading && (
          <div className="w-full text-left space-y-4">
            <h3 className="text-xl font-headline font-semibold text-center">Here's what you might like:</h3>
            <ul className="space-y-4">
              {recommendations.map((rec, index) => (
                <li key={index} className="p-4 rounded-lg bg-secondary">
                  <p className="font-bold text-primary-foreground">{rec.filmTitle}</p>
                  <div className="flex items-start space-x-2 mt-1">
                    <Lightbulb className="w-4 h-4 mt-1 text-accent shrink-0"/>
                    <p className="text-sm text-muted-foreground">{rec.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
             <div className="text-center pt-4">
                <Button onClick={handleSubmit} size="lg" disabled={isLoading} variant="outline">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Again
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
