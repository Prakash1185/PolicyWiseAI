'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { compareInsurancePolicies, CompareInsurancePoliciesOutput } from '@/ai/flows/compare-insurance-policies';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  GitCompareArrows, 
  FileCheck,
  Sparkles,
  Info
} from 'lucide-react';

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
  const [progress, setProgress] = useState(0);
  const policy1Ref = useRef<HTMLInputElement>(null);
  const policy2Ref = useRef<HTMLInputElement>(null);

  const handleCompare = async () => {
    if (!policy1 || !policy2) {
      toast.error("Please upload both policy documents to compare");
      return;
    }

    setIsLoading(true);
    setComparison(null);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    const comparePromise = async () => {
      try {
        const policy1DataUri = await fileToDataUri(policy1);
        const policy2DataUri = await fileToDataUri(policy2);
        const result = await compareInsurancePolicies({ policy1DataUri, policy2DataUri });
        return result;
      } catch (error) {
        console.error('Error comparing policies:', error);
        throw error;
      } finally {
        clearInterval(progressInterval);
        setProgress(100);
        setIsLoading(false);
      }
    };

    toast.promise(comparePromise(), {
      loading: 'AI is comparing your policies...',
      success: (data) => {
        setComparison(data);
        return 'Comparison complete! See the results below.';
      },
      error: 'Failed to compare policies. Please try again.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <GitCompareArrows className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                  Policy Comparison Tool
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  Upload two insurance policies to see key differences side-by-side
                </p>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <Card className="mb-8 border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                Upload Policy Documents
              </CardTitle>
              <CardDescription>
                Choose two PDF files to compare their coverage, costs, and terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Policy 1 Upload */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    First Policy Document
                  </label>
                  <div 
                    className="relative border-2 border-dashed border-border/50 rounded-xl p-8 text-center transition-all duration-300 bg-background/30 backdrop-blur-sm cursor-pointer hover:border-primary/50 hover:bg-primary/5"
                    onClick={() => policy1Ref.current?.click()}
                  >
                    <Input 
                      ref={policy1Ref}
                      type="file" 
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => setPolicy1(e.target.files?.[0] || null)} 
                    />
                    {policy1 ? (
                      <div className="flex items-center gap-3 text-primary">
                        <FileCheck className="h-8 w-8" />
                        <div>
                          <p className="font-medium">{policy1.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(policy1.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="mx-auto h-10 w-10 text-muted-foreground/60" />
                        <p className="font-medium">Click to upload Policy 1</p>
                        <p className="text-sm text-muted-foreground">PDF files only</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Policy 2 Upload */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Second Policy Document
                  </label>
                  <div 
                    className="relative border-2 border-dashed border-border/50 rounded-xl p-8 text-center transition-all duration-300 bg-background/30 backdrop-blur-sm cursor-pointer hover:border-primary/50 hover:bg-primary/5"
                    onClick={() => policy2Ref.current?.click()}
                  >
                    <Input 
                      ref={policy2Ref}
                      type="file" 
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => setPolicy2(e.target.files?.[0] || null)} 
                    />
                    {policy2 ? (
                      <div className="flex items-center gap-3 text-primary">
                        <FileCheck className="h-8 w-8" />
                        <div>
                          <p className="font-medium">{policy2.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(policy2.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="mx-auto h-10 w-10 text-muted-foreground/60" />
                        <p className="font-medium">Click to upload Policy 2</p>
                        <p className="text-sm text-muted-foreground">PDF files only</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={handleCompare} 
                  disabled={isLoading || !policy1 || !policy2}
                  size="lg"
                  className="px-10 py-3 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Compare Policies
                    </>
                  )}
                </Button>
              </div>

              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <Progress value={progress} className="w-full h-3 rounded-full" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-sm" />
                  </div>
                  <p className="text-center text-muted-foreground font-medium">
                    AI is analyzing differences between your policies...
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Comparison Results - Only shows REAL API response */}
          <AnimatePresence>
            {comparison && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Info className="h-5 w-5 text-primary" />
                      </div>
                      Comparison Results
                    </CardTitle>
                    <CardDescription>
                      AI analysis of the key differences between your policies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 p-6 border border-blue-100 dark:border-blue-900">
                      <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-base">
                          {comparison.comparisonSummary}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}