'use client';

import {useState, useRef} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {compareInsurancePolicies, CompareInsurancePoliciesOutput} from '@/ai/flows/compare-insurance-policies';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function ComparePoliciesPage() {
  const [policy1, setPolicy1] = useState<File | null>(null);
  const [policy2, setPolicy2] = useState<File | null>(null);
  const [comparison, setComparison] = useState<CompareInsurancePoliciesOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const policy1Ref = useRef<HTMLInputElement>(null);
  const policy2Ref = useRef<HTMLInputElement>(null);

  const handleCompare = async () => {
    if (!policy1 || !policy2) return;
    setIsLoading(true);
    setComparison(null);
    try {
      const policy1DataUri = await fileToDataUri(policy1);
      const policy2DataUri = await fileToDataUri(policy2);
      const result = await compareInsurancePolicies({policy1DataUri, policy2DataUri});
      setComparison(result);
    } catch (error) {
      console.error('Error comparing policies:', error);
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Compare Insurance Policies</CardTitle>
          <CardDescription>
            Upload two insurance policy documents to compare their key differences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="policy1" className="font-medium">Policy 1</label>
                <Input id="policy1" type="file" ref={policy1Ref} onChange={(e) => setPolicy1(e.target.files?.[0] || null)} />
              </div>
              <div className="space-y-2">
                <label htmlFor="policy2" className="font-medium">Policy 2</label>
                <Input id="policy2" type="file" ref={policy2Ref} onChange={(e) => setPolicy2(e.target.files?.[0] || null)} />
              </div>
            </div>
            <Button onClick={handleCompare} disabled={isLoading || !policy1 || !policy2}>
              {isLoading ? 'Comparing...' : 'Compare Policies'}
            </Button>
            {comparison && (
              <div className="pt-6">
                <h3 className="text-2xl font-semibold mb-4">Comparison Result</h3>
                 <div className="p-4 border rounded-md bg-secondary/50">
                    <h4 className="font-semibold text-lg mb-2">Comparison Summary</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{comparison.comparisonSummary}</p>
                 </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
