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
import { UploadCloud, FileText, Bot, FileWarning, BadgeCheck, ListX, ThumbsUp, ThumbsDown, Gavel, Sparkles, MessageSquare, User, Coins, Target, Info, FileBadge, Save, Send } from 'lucide-react';
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
    let Icon, colorClass, badgeVariant: "default" | "destructive" | "secondary" | "outline";

    if (lowerVerdict.includes('safe')) {
        Icon = BadgeCheck;
        colorClass = 'text-emerald-500';
        badgeVariant = 'default';
    } else if (lowerVerdict.includes('risky')) {
        Icon = FileWarning;
        colorClass = 'text-rose-500';
        badgeVariant = 'destructive';
    } else {
        Icon = Gavel;
        colorClass = 'text-amber-500';
        badgeVariant = 'secondary';
    }

    const colonIndex = verdict.indexOf(':');
    const verdictTitle = colonIndex !== -1 ? verdict.substring(0, colonIndex) : verdict;
    const reasoning = colonIndex !== -1 ? verdict.substring(colonIndex + 1) : '';

    return (
        <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
            <div className="relative p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/80 shadow-sm">
                        <Icon className={`h-6 w-6 ${colorClass}`} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Final Verdict</h3>
                        <Badge variant={badgeVariant} className="mb-3">{verdictTitle}</Badge>
                        <p className="text-muted-foreground leading-relaxed">{reasoning.trim()}</p>
                    </div>
                </div>
            </div>
        </div>
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
        <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
            <div className="container mx-auto py-8 px-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.6 }}
                    className="max-w-5xl mx-auto"
                >
                    {/* Header Card */}
                    <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-card via-card to-card/95 backdrop-blur-sm overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
                        <CardHeader className="relative p-8">
                            <div className="flex items-center gap-6">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm shadow-lg">
                                    <Bot className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                        AI Insurance Co-Pilot
                                    </CardTitle>
                                    <CardDescription className="text-lg text-muted-foreground mt-2">
                                        Your expert partner for understanding complex insurance policies
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Main Analysis Card */}
                    <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm mb-8">
                        <CardContent className="p-8">
                            <Tabs defaultValue="text" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/30 h-14 rounded-xl">
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
                                    <div className="relative">
                                        <Textarea
                                            placeholder="Paste your document text here..."
                                            className="min-h-[300px] text-base border-border/30 focus:ring-primary/20 bg-background/50 backdrop-blur-sm resize-none rounded-xl"
                                            value={documentText}
                                            onChange={(e) => {
                                                setDocumentText(e.target.value);
                                                setFile(null);
                                                setFileName('');
                                            }}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="pdf">
                                    <div 
                                        className={`relative border-2 border-dashed border-border/50 rounded-xl p-16 text-center transition-all duration-300 bg-background/30 backdrop-blur-sm ${
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
                                        <UploadCloud className="mx-auto h-16 w-16 text-muted-foreground/60" />
                                        <p className="mt-6 text-lg font-medium text-foreground">
                                            {fileName ? `Selected: ${fileName}` : "Click to upload a PDF file"}
                                        </p>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            PDF files only, up to 10MB
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="mt-8 flex justify-center">
                                <Button 
                                    onClick={handleAnalyze} 
                                    disabled={isLoading || (!documentText.trim() && !file)} 
                                    size="lg"
                                    className="px-8 py-3 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
                                    className="mt-8 space-y-4"
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

                    {/* Results Section */}
                    <AnimatePresence>
                        {analysis && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="space-y-8"
                            >
                                {/* Policy Details */}
                                <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
                                    <CardHeader className="flex flex-row justify-between items-center p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                <FileBadge className="h-5 w-5 text-primary" />
                                            </div>
                                            <CardTitle className="text-2xl">Policy Details</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0">
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <span className="text-sm font-medium text-muted-foreground">Policy Name</span>
                                                <p className="text-lg font-medium text-foreground">{analysis.policyName || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-sm font-medium text-muted-foreground">Policy Number</span>
                                                <p className="text-lg font-medium text-foreground">{analysis.policyNumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* AI Analysis */}
                                <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
                                    <CardHeader className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                <Sparkles className="h-5 w-5 text-primary" />
                                            </div>
                                            <CardTitle className="text-2xl">AI Analysis</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0 space-y-8">
                                        <VerdictCard verdict={analysis.final_verdict} />
                                        
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-semibold text-foreground">Policy Overview</h3>
                                            <div className="rounded-xl bg-muted/30 p-6">
                                                <p className="text-muted-foreground leading-relaxed">{analysis.overview}</p>
                                            </div>
                                        </div>

                                        <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="pros-cons">
                                            <AccordionItem value="pros-cons" className="border rounded-xl bg-background/30 px-6">
                                                <AccordionTrigger className="text-lg font-semibold hover:no-underline py-6">
                                                    Pros & Cons Analysis
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-6">
                                                    <div className="grid md:grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <h4 className="flex items-center gap-2 font-semibold text-emerald-600">
                                                                <ThumbsUp className="h-5 w-5"/>
                                                                Pros
                                                            </h4>
                                                            <ul className="space-y-3">
                                                                {analysis.pros_cons.pros.map((pro, i) => (
                                                                    <li key={i} className="flex items-start gap-3">
                                                                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                                                                        <span className="text-muted-foreground">{pro}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <h4 className="flex items-center gap-2 font-semibold text-rose-600">
                                                                <ThumbsDown className="h-5 w-5"/>
                                                                Cons
                                                            </h4>
                                                            <ul className="space-y-3">
                                                                {analysis.pros_cons.cons.map((con, i) => (
                                                                    <li key={i} className="flex items-start gap-3">
                                                                        <div className="h-2 w-2 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                                                                        <span className="text-muted-foreground">{con}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                            
                                            <AccordionItem value="benefits" className="border rounded-xl bg-background/30 px-6">
                                                <AccordionTrigger className="text-lg font-semibold hover:no-underline py-6">
                                                    Key Benefits
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-6">
                                                    <ul className="space-y-3">
                                                        {analysis.benefits.map((benefit, i) => (
                                                            <li key={i} className="flex items-start gap-3">
                                                                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                                                <span className="text-muted-foreground">{benefit}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </AccordionContent>
                                            </AccordionItem>
                                            
                                            <AccordionItem value="risks" className="border rounded-xl bg-background/30 px-6">
                                                <AccordionTrigger className="text-lg font-semibold hover:no-underline py-6">
                                                    Risks & Exclusions
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-6">
                                                    <ul className="space-y-3">
                                                        {analysis.risks.map((risk, i) => (
                                                            <li key={i} className="flex items-start gap-3">
                                                                <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                                                                <span className="text-muted-foreground">{risk}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </AccordionContent>
                                            </AccordionItem>
                                            
                                            <AccordionItem value="future_problems" className="border rounded-xl bg-background/30 px-6">
                                                <AccordionTrigger className="text-lg font-semibold hover:no-underline py-6">
                                                    Potential Future Problems
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-6">
                                                    <ul className="space-y-3">
                                                        {analysis.future_problems.map((problem, i) => (
                                                            <li key={i} className="flex items-start gap-3">
                                                                <div className="h-2 w-2 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                                                                <span className="text-muted-foreground">{problem}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </CardContent>
                                </Card>

                                {/* Personalized Recommendation */}
                                <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
                                    <CardHeader className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl">Personalized Recommendation</CardTitle>
                                                <CardDescription className="mt-1">Tell us about yourself to get a tailored recommendation</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0 space-y-6">
                                        <div className="grid sm:grid-cols-3 gap-6">
                                            <div className="space-y-3">
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
                                                    className="rounded-lg"
                                                />
                                            </div>
                                            <div className="space-y-3">
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
                                                    className="rounded-lg"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label htmlFor="goal" className="flex items-center gap-2 text-sm font-medium">
                                                    <Target className="h-4 w-4"/>
                                                    Investment Goal
                                                </Label>
                                                <Input 
                                                    id="goal" 
                                                    placeholder="e.g., Retirement, Education" 
                                                    value={userContext.goal} 
                                                    onChange={e => setUserContext({...userContext, goal: e.target.value})}
                                                    className="rounded-lg"
                                                />
                                            </div>
                                        </div>
                                        
                                        <Button 
                                            onClick={handleGetRecommendation} 
                                            disabled={isRecoLoading}
                                            className="rounded-lg"
                                        >
                                            {isRecoLoading ? "Generating..." : "Get My Recommendation"}
                                        </Button>
                                        
                                        {isRecoLoading && <Progress value={progress} className="w-full h-2 rounded-full" />}
                                        
                                        {recommendation && (
                                            <motion.div 
                                                initial={{opacity: 0, y: 10}} 
                                                animate={{opacity: 1, y: 0}}
                                                className="rounded-xl border-l-4 border-primary bg-primary/5 p-6"
                                            >
                                                <h4 className="font-semibold flex items-center gap-2 mb-3 text-foreground">
                                                    <Info className="h-5 w-5" /> 
                                                    Your Recommendation
                                                </h4>
                                                <p className="text-muted-foreground leading-relaxed">{recommendation}</p>
                                            </motion.div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Chat Section */}
                                <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
                                    <CardHeader className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                <MessageSquare className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl">Chat with Your Policy</CardTitle>
                                                <CardDescription className="mt-1">Ask follow-up questions about your policy analysis</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0">
                                        <div className="h-96 overflow-y-auto rounded-xl bg-muted/20 p-6 space-y-4 mb-4">
                                            {chatHistory.map((msg, i) => (
                                                <div key={i} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                                    {msg.role === 'bot' && (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                                                            <Bot className="h-4 w-4 text-primary"/>
                                                        </div>
                                                    )}
                                                    <div className={`rounded-xl px-4 py-3 max-w-[80%] ${
                                                        msg.role === 'user' 
                                                            ? 'bg-primary text-primary-foreground shadow-sm' 
                                                            : 'bg-background shadow-sm border border-border/50'
                                                    }`}>
                                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                                    </div>
                                                    {msg.role === 'user' && (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0">
                                                            <User className="h-4 w-4 text-muted-foreground"/>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {isChatLoading && (
                                                <div className="flex items-start gap-4">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                                                        <Bot className="h-4 w-4 text-primary"/>
                                                    </div>
                                                    <div className="rounded-xl px-4 py-3 bg-background shadow-sm border border-border/50 animate-pulse">
                                                        <div className="flex space-x-2">
                                                            <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                                                            <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                            <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <form onSubmit={handleChatSubmit} className="flex gap-3">
                                            <Input 
                                                value={chatInput}
                                                onChange={e => setChatInput(e.target.value)}
                                                placeholder="e.g., Explain the 'pre-existing conditions' clause..."
                                                disabled={isChatLoading}
                                                className="flex-1 rounded-xl bg-background/50"
                                            />
                                            <Button 
                                                type="submit" 
                                                disabled={isChatLoading || !chatInput.trim()}
                                                className="rounded-xl px-6"
                                            >
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </form>
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
