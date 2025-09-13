'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {summarizeTermsAndConditions, SummarizeTermsAndConditionsOutput} from '@/ai/flows/summarize-terms-and-conditions';

export default function SummarizeTermsPage() {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState<SummarizeTermsAndConditionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSummarize = async () => {
    setIsLoading(true);
    setSummary(null);
    try {
      const result = await summarizeTermsAndConditions({termsAndConditionsUrl: url});
      setSummary(result);
    } catch (error) {
      console.error('Error summarizing terms:', error);
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Summarize Terms & Conditions</CardTitle>
          <CardDescription>
            Enter the URL of a terms and conditions page to get a concise summary.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
             <div className="flex gap-2">
                <Input
                placeholder="https://example.com/terms"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                />
                <Button onClick={handleSummarize} disabled={isLoading || !url}>
                {isLoading ? 'Summarizing...' : 'Summarize'}
                </Button>
            </div>
            {summary && (
              <div className="pt-6">
                <h3 className="text-2xl font-semibold mb-4">Summary</h3>
                <div className="p-4 border rounded-md bg-secondary/50">
                  <p className="text-muted-foreground whitespace-pre-wrap">{summary.summary}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
