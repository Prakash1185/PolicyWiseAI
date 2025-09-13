'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { summarizeTermsAndConditions, SummarizeTermsAndConditionsOutput } from '@/ai/flows/summarize-terms-and-conditions';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Link as LinkIcon, 
  FileText, 
  Sparkles,
  Globe,
  CheckCircle,
  AlertTriangle,
  Info,
  BookOpen
} from 'lucide-react';

export default function SummarizeTermsPage() {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState<SummarizeTermsAndConditionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSummarize = async () => {
    if (!url.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsLoading(true);
    setSummary(null);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 15, 90));
    }, 300);

    const summarizePromise = async () => {
      try {
        const result = await summarizeTermsAndConditions({ termsAndConditionsUrl: url });
        return result;
      } catch (error) {
        console.error('Error summarizing terms:', error);
        throw error;
      } finally {
        clearInterval(progressInterval);
        setProgress(100);
        setIsLoading(false);
      }
    };

    toast.promise(summarizePromise(), {
      loading: 'AI is reading and summarizing the terms...',
      success: (data) => {
        setSummary(data);
        return 'Summary generated successfully!';
      },
      error: 'Failed to summarize terms. Please check the URL and try again.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                  Terms & Conditions Summarizer
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  Get clear, concise summaries of complex legal documents
                </p>
              </div>
            </div>
          </div>

          {/* Input Section */}
          <Card className="mb-8 border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                Enter Terms & Conditions URL
              </CardTitle>
              <CardDescription>
                Paste the link to any terms & conditions page for an AI-powered summary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="https://example.com/terms-and-conditions"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-12 h-14 text-base rounded-xl bg-background/50 backdrop-blur-sm border-border/30 focus:ring-primary/20"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    onClick={handleSummarize} 
                    disabled={isLoading || !url.trim()}
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
                        Summarize Terms
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
                      AI is reading through the legal document...
                    </p>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Results */}
          <AnimatePresence>
            {summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      Summary Results
                    </CardTitle>
                    <CardDescription>
                      AI-generated summary of the terms and conditions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 p-8 border border-blue-100 dark:border-blue-900">
                        {/* Summary Header */}
                        <div className="flex items-center gap-3 mb-6">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                            <CheckCircle className="h-4 w-4 text-primary" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground">
                            Key Points Summary
                          </h3>
                        </div>

                        {/* Summary Content */}
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-6 shadow-sm">
                            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-base mb-0">
                              {summary.summary}
                            </p>
                          </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-blue-200/50 dark:border-blue-800/50">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            This summary was generated by AI. Please review the original document for complete details.
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips Card */}
          {!summary && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="border-0 shadow-lg bg-amber-50/80 dark:bg-amber-950/20 backdrop-blur-sm border-amber-200/50 dark:border-amber-800/30">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                        Pro Tips
                      </h3>
                      <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-300">
                        <li>• Make sure the URL is publicly accessible</li>
                        <li>• Works best with standard terms & conditions pages</li>
                        <li>• The AI will highlight key clauses and important points</li>
                        <li>• Review the original document for legal accuracy</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}