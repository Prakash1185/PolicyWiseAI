'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { analyzeInsurancePolicy, AnalyzeInsurancePolicyOutput, PolicyRecommendationInput } from '@/ai/flows/analyze-insurance-policy';
import { chatWithPolicyBot } from '@/ai/flows/chat-with-policy-bot';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, Bot, FileWarning, BadgeCheck, ListX, ThumbsUp, ThumbsDown, Gavel, Sparkles, MessageSquare, User, Coins, Target, Info, FileBadge, Send, Shield, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
};

type ChatMessage = {
    role: 'user' | 'bot';
    content: string;
};

const VerdictCard = ({ verdict }: { verdict: string }) => {
    const lowerVerdict = verdict.toLowerCase();
    let Icon, colorClass, bgClass, badgeVariant: "default" | "destructive" | "secondary" | "outline";

    if (lowerVerdict.includes('safe')) {
        Icon = BadgeCheck;
        colorClass = 'text-emerald-600';
        bgClass = 'from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950 dark:to-emerald-900 dark:border-emerald-800';
        badgeVariant = 'default';
    } else if (lowerVerdict.includes('risky')) {
        Icon = FileWarning;
        colorClass = 'text-rose-600';
        bgClass = 'from-rose-50 to-rose-100 border-rose-200 dark:from-rose-950 dark:to-rose-900 dark:border-rose-800';
        badgeVariant = 'destructive';
    } else {
        Icon = Gavel;
        colorClass = 'text-amber-600';
        bgClass = 'from-amber-50 to-amber-100 border-amber-200 dark:from-amber-950 dark:to-amber-900 dark:border-amber-800';
        badgeVariant = 'secondary';
    }

    const colonIndex = verdict.indexOf(':');
    const verdictTitle = colonIndex !== -1 ? verdict.substring(0, colonIndex) : verdict;
    const reasoning = colonIndex !== -1 ? verdict.substring(colonIndex + 1) : '';

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${bgClass} p-6 shadow-lg`}
        >
            <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-white/80 shadow-sm dark:bg-gray-900/80`}>
                    <Icon className={`h-7 w-7 ${colorClass}`} />
                </div>
                <div className="flex-1 space-y-3">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Final Verdict</h3>
                        <Badge variant={badgeVariant} className="text-sm font-medium">{verdictTitle}</Badge>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{reasoning.trim()}</p>
                </div>
            </div>
        </motion.div>
    );
};

export default function AnalyseInsurancePage() {
    const [documentText, setDocumentText] = useState('');
    const [fileName, setFileName] = useState('');
    const [analysis, setAnalysis] = useState<AnalyzeInsurancePolicyOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);

    const [userContext, setUserContext] = useState({ age: '', salary: '', goal: '' });
    const [recommendation, setRecommendation] = useState<string | null>(null);
    const [isRecoLoading, setIsRecoLoading] = useState(false);

    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isLoading) {
            setProgress(0);
            const duration = 30000;
            const interval = duration / 100;
            timer = setInterval(() => {
                setProgress(prev => Math.min(prev + 1, 95));
            }, interval);
        }
        return () => clearInterval(timer);
    }, [isLoading]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type === 'application/pdf') {
                setFile(selectedFile);
                setFileName(selectedFile.name);
                setDocumentText('');
            } else {
                toast.error('Invalid file type', { description: 'Please upload a PDF file.' });
                setFile(null);
                setFileName('');
            }
        }
    };
    
    const handleAnalyze = async () => {
        setIsLoading(true);
        setAnalysis(null);
        setRecommendation(null);
        setChatHistory([]);
        
        const analysisPromise = () => new Promise<AnalyzeInsurancePolicyOutput>(async (resolve, reject) => {
             try {
                let result;
                if (file) {
                    const documentDataUri = await fileToDataUri(file);
                    result = await analyzeInsurancePolicy({ documentDataUri });
                } else if (documentText.trim()) {
                    result = await analyzeInsurancePolicy({ documentText });
                } else {
                    return reject(new Error('Please provide a document to analyze.'));
                }
                resolve(result);
            } catch (err) {
                console.error('Error analyzing document:', err);
                reject(err instanceof Error ? err : new Error('An unknown error occurred.'));
            }
        });

        toast.promise(analysisPromise(), {
            loading: 'Analyzing your document... This may take a moment.',
            success: (data) => {
                setAnalysis(data);
                setIsLoading(false);
                setProgress(100);
                if(data?.overview) {
                    setChatHistory([{ role: 'bot', content: "Hello! I've analyzed your policy. Feel free to ask me any questions about it." }]);
                }
                return 'Analysis complete! See the results below.';
            },
            error: (err) => {
                setIsLoading(false);
                setProgress(0);
                return err.message || 'An error occurred during analysis.';
            },
        });
    };

    const handleGetRecommendation = async () => {
        if (!analysis || !userContext.age || !userContext.salary || !userContext.goal) {
            toast.error("Please fill in all personal details for a recommendation.");
            return;
        }
        setIsRecoLoading(true);
        setRecommendation(null);

        const recoPromise = () => new Promise<any>(async (resolve, reject) => {
            try {
                const input: PolicyRecommendationInput = {
                    analysis,
                    userContext: {
                        age: parseInt(userContext.age, 10),
                        annualSalary: parseInt(userContext.salary, 10),
                        investmentGoal: userContext.goal,
                    }
                };
                const result = await analyzeInsurancePolicy(input);
                resolve(result.recommendation);
            } catch(err) {
                console.error('Error getting recommendation:', err);
                reject(err);
            }
        });

        toast.promise(recoPromise(), {
            loading: "Generating your personalized recommendation...",
            success: (data) => {
                setRecommendation(data);
                setIsRecoLoading(false);
                return "Recommendation ready!";
            },
            error: (err) => {
                setIsRecoLoading(false);
                return err.message || "Couldn't generate a recommendation.";
            }
        })
    };
    
    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || isChatLoading || !analysis) return;
        
        const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: chatInput }];
        setChatHistory(newHistory);
        setChatInput('');
        setIsChatLoading(true);

        try {
            const botResponse = await chatWithPolicyBot({
                analysis: analysis,
                chatHistory: newHistory
            });
            setChatHistory(prev => [...prev, { role: 'bot', content: botResponse.response }]);
        } catch (err) {
            console.error(err);
            toast.error("The chatbot is having trouble responding. Please try again.");
            setChatHistory(prev => prev.slice(0, -1));
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="container mx-auto p-6">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8"
                >
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
                            <Bot className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                                AI Insurance Co-Pilot
                            </h1>
                            <p className="text-lg text-muted-foreground mt-1">
                                Your expert partner for understanding complex insurance policies
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Main Layout */}
                <div className="flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto">
                    {/* Left Side - Upload & Analysis */}
                    <div className="flex-1 xl:w-2/3 space-y-8">
                        {/* Upload Section */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                                <CardHeader className="pb-6">
                                    <CardTitle className="text-2xl flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        Upload Document
                                    </CardTitle>
                                    <CardDescription>
                                        Upload your insurance policy or paste the text to get started
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <Tabs defaultValue="text" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 h-12 rounded-xl">
                                            <TabsTrigger value="text" className="text-base font-medium rounded-lg">
                                                <FileText className="h-5 w-5 mr-2" />
                                                Paste Text
                                            </TabsTrigger>
                                            <TabsTrigger value="pdf" className="text-base font-medium rounded-lg">
                                                <UploadCloud className="h-5 w-5 mr-2" />
                                                Upload PDF
                                            </TabsTrigger>
                                        </TabsList>
                                        
                                        <TabsContent value="text">
                                            <Textarea
                                                placeholder="Paste your document text here..."
                                                className="min-h-[280px] text-base border-border/30 focus:ring-primary/20 bg-background/50 backdrop-blur-sm resize-none rounded-xl"
                                                value={documentText}
                                                onChange={(e) => {
                                                    setDocumentText(e.target.value);
                                                    setFile(null);
                                                    setFileName('');
                                                }}
                                                disabled={isLoading}
                                            />
                                        </TabsContent>
                                        
                                        <TabsContent value="pdf">
                                            <div 
                                                className={`relative border-2 border-dashed border-border/50 rounded-xl p-12 text-center transition-all duration-300 bg-background/30 backdrop-blur-sm ${
                                                    isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5'
                                                }`}
                                                onClick={() => !isLoading && fileInputRef.current?.click()}
                                            >
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    accept="application/pdf"
                                                    disabled={isLoading}
                                                />
                                                <UploadCloud className="mx-auto h-14 w-14 text-muted-foreground/60 mb-4" />
                                                <p className="text-lg font-medium text-foreground mb-2">
                                                    {fileName ? `Selected: ${fileName}` : "Click to upload a PDF file"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    PDF files only, up to 10MB
                                                </p>
                                            </div>
                                        </TabsContent>
                                    </Tabs>

                                    <div className="flex justify-center pt-4">
                                        <Button 
                                            onClick={handleAnalyze} 
                                            disabled={isLoading || (!documentText.trim() && !file)} 
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
                                                    Analyze Document
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
                                                AI is reading the fine print... please wait
                                            </p>
                                        </motion.div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Analysis Results */}
                        <AnimatePresence>
                            {analysis && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    className="space-y-8"
                                >
                                    {/* Policy Details */}
                                    <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                                        <CardHeader className="flex flex-row justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                    <FileBadge className="h-5 w-5 text-primary" />
                                                </div>
                                                <CardTitle className="text-2xl">Policy Details</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid sm:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <span className="text-sm font-medium text-muted-foreground">Policy Name</span>
                                                    <p className="text-lg font-semibold text-foreground bg-muted/30 rounded-lg px-4 py-2">
                                                        {analysis.policyName || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-sm font-medium text-muted-foreground">Policy Number</span>
                                                    <p className="text-lg font-semibold text-foreground bg-muted/30 rounded-lg px-4 py-2">
                                                        {analysis.policyNumber || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* AI Analysis Results */}
                                    <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                    <Sparkles className="h-5 w-5 text-primary" />
                                                </div>
                                                <CardTitle className="text-2xl">AI Analysis Results</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-8">
                                            {/* Final Verdict */}
                                            <VerdictCard verdict={analysis.final_verdict} />
                                            
                                            {/* Policy Overview */}
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                                    <Info className="h-5 w-5 text-primary" />
                                                    Policy Overview
                                                </h3>
                                                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 p-6 border border-blue-100 dark:border-blue-900">
                                                    <p className="text-foreground/90 leading-relaxed">{analysis.overview}</p>
                                                </div>
                                            </div>

                                            {/* Detailed Analysis */}
                                            <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="pros-cons">
                                                <AccordionItem value="pros-cons" className="border-0 rounded-xl bg-gradient-to-r from-green-50 to-red-50 dark:from-green-950/30 dark:to-red-950/30 px-6 shadow-sm">
                                                    <AccordionTrigger className="text-lg font-semibold hover:no-underline py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 dark:bg-slate-800/80">
                                                                <Shield className="h-4 w-4 text-primary" />
                                                            </div>
                                                            Pros & Cons Analysis
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pb-6">
                                                        <div className="grid md:grid-cols-2 gap-8">
                                                            <div className="space-y-4">
                                                                <h4 className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                                                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                                                                        <ThumbsUp className="h-3 w-3"/>
                                                                    </div>
                                                                    Advantages
                                                                </h4>
                                                                <ul className="space-y-3">
                                                                    {analysis.pros_cons.pros.map((pro, i) => (
                                                                        <motion.li 
                                                                            key={i}
                                                                            initial={{ opacity: 0, x: -10 }}
                                                                            animate={{ opacity: 1, x: 0 }}
                                                                            transition={{ delay: i * 0.1 }}
                                                                            className="flex items-start gap-3 bg-white/60 dark:bg-slate-800/60 rounded-lg p-3"
                                                                        >
                                                                            <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                                                                            <span className="text-foreground/80">{pro}</span>
                                                                        </motion.li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <h4 className="flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-400">
                                                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900">
                                                                        <ThumbsDown className="h-3 w-3"/>
                                                                    </div>
                                                                    Disadvantages
                                                                </h4>
                                                                <ul className="space-y-3">
                                                                    {analysis.pros_cons.cons.map((con, i) => (
                                                                        <motion.li 
                                                                            key={i}
                                                                            initial={{ opacity: 0, x: -10 }}
                                                                            animate={{ opacity: 1, x: 0 }}
                                                                            transition={{ delay: i * 0.1 }}
                                                                            className="flex items-start gap-3 bg-white/60 dark:bg-slate-800/60 rounded-lg p-3"
                                                                        >
                                                                            <div className="h-2 w-2 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                                                                            <span className="text-foreground/80">{con}</span>
                                                                        </motion.li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                                
                                                <AccordionItem value="benefits" className="border-0 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 px-6 shadow-sm">
                                                    <AccordionTrigger className="text-lg font-semibold hover:no-underline py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 dark:bg-slate-800/80">
                                                                <BadgeCheck className="h-4 w-4 text-blue-600" />
                                                            </div>
                                                            Key Benefits
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pb-6">
                                                        <ul className="space-y-3">
                                                            {analysis.benefits.map((benefit, i) => (
                                                                <motion.li 
                                                                    key={i}
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: i * 0.1 }}
                                                                    className="flex items-start gap-3 bg-white/60 dark:bg-slate-800/60 rounded-lg p-3"
                                                                >
                                                                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                                                    <span className="text-foreground/80">{benefit}</span>
                                                                </motion.li>
                                                            ))}
                                                        </ul>
                                                    </AccordionContent>
                                                </AccordionItem>
                                                
                                                <AccordionItem value="risks" className="border-0 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 px-6 shadow-sm">
                                                    <AccordionTrigger className="text-lg font-semibold hover:no-underline py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 dark:bg-slate-800/80">
                                                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                                            </div>
                                                            Risks & Exclusions
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pb-6">
                                                        <ul className="space-y-3">
                                                            {analysis.risks.map((risk, i) => (
                                                                <motion.li 
                                                                    key={i}
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: i * 0.1 }}
                                                                    className="flex items-start gap-3 bg-white/60 dark:bg-slate-800/60 rounded-lg p-3"
                                                                >
                                                                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                                                                    <span className="text-foreground/80">{risk}</span>
                                                                </motion.li>
                                                            ))}
                                                        </ul>
                                                    </AccordionContent>
                                                </AccordionItem>
                                                
                                                <AccordionItem value="future_problems" className="border-0 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 px-6 shadow-sm">
                                                    <AccordionTrigger className="text-lg font-semibold hover:no-underline py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 dark:bg-slate-800/80">
                                                                <FileWarning className="h-4 w-4 text-purple-600" />
                                                            </div>
                                                            Potential Future Problems
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pb-6">
                                                        <ul className="space-y-3">
                                                            {analysis.future_problems.map((problem, i) => (
                                                                <motion.li 
                                                                    key={i}
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: i * 0.1 }}
                                                                    className="flex items-start gap-3 bg-white/60 dark:bg-slate-800/60 rounded-lg p-3"
                                                                >
                                                                    <div className="h-2 w-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                                                                    <span className="text-foreground/80">{problem}</span>
                                                                </motion.li>
                                                            ))}
                                                        </ul>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Side - Chat & Recommendation */}
                    <div className="xl:w-1/3 space-y-8">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="sticky top-6 space-y-8"
                        >
                            {/* Personalized Recommendation */}
                            {analysis && (
                                <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">Personal Recommendation</CardTitle>
                                                <CardDescription>Get tailored advice based on your profile</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="age" className="flex items-center gap-2 text-sm font-medium">
                                                    <User className="h-4 w-4"/>
                                                    Age
                                                </Label>
                                                <Input 
                                                    id="age" 
                                                    type="number" 
                                                    placeholder="e.g., 35" 
                                                    value={userContext.age} 
                                                    onChange={e => setUserContext({...userContext, age: e.target.value})}
                                                    className="rounded-lg bg-background/50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="salary" className="flex items-center gap-2 text-sm font-medium">
                                                    <Coins className="h-4 w-4"/>
                                                    Annual Salary (USD)
                                                </Label>
                                                <Input 
                                                    id="salary" 
                                                    type="number" 
                                                    placeholder="e.g., 75000" 
                                                    value={userContext.salary} 
                                                    onChange={e => setUserContext({...userContext, salary: e.target.value})}
                                                    className="rounded-lg bg-background/50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="goal" className="flex items-center gap-2 text-sm font-medium">
                                                    <Target className="h-4 w-4"/>
                                                    Investment Goal
                                                </Label>
                                                <Input 
                                                    id="goal" 
                                                    placeholder="e.g., Retirement, Education" 
                                                    value={userContext.goal} 
                                                    onChange={e => setUserContext({...userContext, goal: e.target.value})}
                                                    className="rounded-lg bg-background/50"
                                                />
                                            </div>
                                        </div>
                                        
                                        <Button 
                                            onClick={handleGetRecommendation} 
                                            disabled={isRecoLoading}
                                            className="w-full rounded-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                                        >
                                            {isRecoLoading ? (
                                                <>
                                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    Get Recommendation
                                                </>
                                            )}
                                        </Button>
                                        
                                        {isRecoLoading && <Progress value={progress} className="w-full h-2 rounded-full" />}
                                        
                                        {recommendation && (
                                            <motion.div 
                                                initial={{opacity: 0, y: 10}} 
                                                animate={{opacity: 1, y: 0}}
                                                className="rounded-xl bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 p-4 border border-green-100 dark:border-green-900/30"
                                            >
                                                <h4 className="font-semibold flex items-center gap-2 mb-3 text-foreground">
                                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                                        <Info className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    Your Recommendation
                                                </h4>
                                                <p className="text-foreground/80 leading-relaxed text-sm">{recommendation}</p>
                                            </motion.div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Chat Section */}
                            {analysis && (
                                <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                <MessageSquare className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">Chat with AI</CardTitle>
                                                <CardDescription>Ask questions about your policy</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="h-80 overflow-y-auto rounded-xl bg-gradient-to-b from-muted/20 to-muted/40 p-4 space-y-4">
                                            {chatHistory.map((msg, i) => (
                                                <motion.div 
                                                    key={i} 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                                                >
                                                    {msg.role === 'bot' && (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                                                            <Bot className="h-4 w-4 text-primary"/>
                                                        </div>
                                                    )}
                                                    <div className={`rounded-xl px-4 py-3 max-w-[85%] ${
                                                        msg.role === 'user' 
                                                            ? 'bg-gradient-to-r from-primary to-accent text-white shadow-md' 
                                                            : 'bg-white dark:bg-slate-800 shadow-sm border border-border/50'
                                                    }`}>
                                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                                    </div>
                                                    {msg.role === 'user' && (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0">
                                                            <User className="h-4 w-4 text-muted-foreground"/>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                            {isChatLoading && (
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                                                        <Bot className="h-4 w-4 text-primary"/>
                                                    </div>
                                                    <div className="rounded-xl px-4 py-3 bg-white dark:bg-slate-800 shadow-sm border border-border/50">
                                                        <div className="flex space-x-2">
                                                            <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce"></div>
                                                            <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                            <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <form onSubmit={handleChatSubmit} className="flex gap-2">
                                            <Input 
                                                value={chatInput}
                                                onChange={e => setChatInput(e.target.value)}
                                                placeholder="Ask about your policy..."
                                                disabled={isChatLoading}
                                                className="flex-1 rounded-xl bg-background/50"
                                            />
                                            <Button 
                                                type="submit" 
                                                disabled={isChatLoading || !chatInput.trim()}
                                                className="rounded-xl px-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                                            >
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
