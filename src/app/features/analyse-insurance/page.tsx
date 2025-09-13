'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Textarea} from '@/components/ui/textarea';
import {analyzeLegalJargon, AnalyzeLegalJargonOutput} from '@/ai/flows/analyze-legal-jargon';

export default function AnalyseInsurancePage() {
  const [documentText, setDocumentText] = useState('');
  const [analysis, setAnalysis] = useState<AnalyzeLegalJargonOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeLegalJargon({documentText});
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing document:', error);
      // You can add user-facing error handling here
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Analyze Insurance/Policy Document</CardTitle>
          <CardDescription>
            Paste the text of your insurance policy or any legal document below to get a simplified explanation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Textarea
              placeholder="Paste your document text here..."
              className="min-h-[200px] text-base"
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
            />
            <Button onClick={handleAnalyze} disabled={isLoading || !documentText}>
              {isLoading ? 'Analyzing...' : 'Analyze Document'}
            </Button>
            {analysis && (
              <div className="pt-6">
                <h3 className="text-2xl font-semibold mb-4">Analysis Result</h3>
                <div className="p-4 border rounded-md bg-secondary/50">
                  <h4 className="font-semibold text-lg mb-2">Simplified Explanation</h4>
                  <p className="text-muted-foreground">{analysis.simplifiedExplanation}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
