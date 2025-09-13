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
import { UploadCloud, FileText, Bot, AlertTriangle, BadgeCheck, ListX, ThumbsUp, ThumbsDown, Gavel, FileWarning, Sparkles, MessageSquare, User, Coins, Target } from 'lucide-react';
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
        colorClass = 'text-green-500';
        badgeVariant = 'default';
    } else if (lowerVerdict.includes('risky')) {
        Icon = FileWarning;
        colorClass = 'text-red-500';
        badgeVariant = 'destructive';
    } else {
        Icon = Gavel;
        colorClass = 'text-yellow-500';
        badgeVariant = 'secondary';
    }

    const colonIndex = verdict.indexOf(':');
    const verdictTitle = colonIndex !== -1 ? verdict.substring(0, colonIndex) : verdict;
    const reasoning = colonIndex !== -1 ? verdict.substring(colonIndex + 1) : '';

    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center gap-4">
                <Icon className={`h-8 w-8 ${colorClass}`} />
                <div>
                    <CardTitle className="text-xl">Final Verdict</CardTitle>
                    <Badge variant={badgeVariant} className="mt-1">{verdictTitle}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{reasoning.trim()}</p>
            </CardContent>
        </Card>
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
                reject(err);
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
            setChatHistory(prev => prev.slice(0, -1)); // remove user message on error
        } finally {
            setIsChatLoading(false);
        }
    };


    return (
        <div className="bg-muted/30 min-h-screen">
            <div className="container mx-auto py-12 px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <Card className="max-w-4xl mx-auto shadow-xl border-border/20 overflow-hidden bg-card">
                        <CardHeader className="bg-card-foreground/5 border-b border-border/20 p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <Bot className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-3xl font-bold text-foreground">AI Insurance Co-Pilot</CardTitle>
                                    <CardDescription className="text-muted-foreground mt-1 text-base">
                                        Your expert partner for understanding complex insurance policies.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                             <Tabs defaultValue="text" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 h-12">
                                    <TabsTrigger value="text" className="text-base"><FileText className="h-5 w-5 mr-2" />Paste Text</TabsTrigger>
                                    <TabsTrigger value="pdf" className="text-base"><UploadCloud className="h-5 w-5 mr-2" />Upload PDF</TabsTrigger>
                                </TabsList>
                                <TabsContent value="text">
                                    <Textarea
                                        placeholder="Paste your document text here..."
                                        className="min-h-[250px] text-base border-border/30 focus:ring-primary/50 bg-background"
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
                                        className={`border-2 border-dashed border-border/50 rounded-lg p-12 text-center transition-colors bg-background ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
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
                                        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <p className="mt-4 text-sm text-muted-foreground">
                                            {fileName ? `Selected: ${fileName}` : "Click to upload a PDF file."}
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="mt-6 flex justify-end">
                                <Button onClick={handleAnalyze} disabled={isLoading || (!documentText.trim() && !file)} size="lg">
                                    {isLoading ? 'Analyzing...' : 'Analyze Document'}
                                </Button>
                            </div>
                            
                            {isLoading && (
                                <div className="mt-6 space-y-2">
                                    <Progress value={progress} className="w-full h-2" />
                                    <p className="text-sm text-muted-foreground text-center">AI is reading the fine print... please wait.</p>
                                </div>
                            )}

                        </CardContent>
                    </Card>

                    <AnimatePresence>
                        {analysis && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-12 space-y-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-2xl"><Sparkles className="text-primary"/>Policy Analysis</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <VerdictCard verdict={analysis.final_verdict} />
                                        
                                        <div>
                                            <h3 className="font-semibold text-lg">Policy Overview</h3>
                                            <p className="text-muted-foreground mt-2">{analysis.overview}</p>
                                        </div>

                                        <Accordion type="single" collapsible className="w-full">
                                            <AccordionItem value="pros-cons">
                                                <AccordionTrigger className="text-lg font-semibold">Pros & Cons</AccordionTrigger>
                                                <AccordionContent className="grid md:grid-cols-2 gap-6 pt-4">
                                                    <div className="space-y-2">
                                                        <h4 className="flex items-center gap-2 font-semibold text-green-600"><ThumbsUp/> Pros</h4>
                                                        <ul className="list-disc list-inside text-muted-foreground">
                                                            {analysis.pros_cons.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                                                        </ul>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h4 className="flex items-center gap-2 font-semibold text-red-600"><ThumbsDown/> Cons</h4>
                                                        <ul className="list-disc list-inside text-muted-foreground">
                                                            {analysis.pros_cons.cons.map((con, i) => <li key={i}>{con}</li>)}
                                                        </ul>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="benefits">
                                                <AccordionTrigger className="text-lg font-semibold">Key Benefits</AccordionTrigger>
                                                <AccordionContent className="pt-4">
                                                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                                        {analysis.benefits.map((benefit, i) => <li key={i}>{benefit}</li>)}
                                                    </ul>
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="risks">
                                                <AccordionTrigger className="text-lg font-semibold">Risks & Exclusions</AccordionTrigger>
                                                <AccordionContent className="pt-4">
                                                     <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                                        {analysis.risks.map((risk, i) => <li key={i}>{risk}</li>)}
                                                    </ul>
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="future_problems">
                                                <AccordionTrigger className="text-lg font-semibold">Potential Future Problems</AccordionTrigger>
                                                <AccordionContent className="pt-4">
                                                     <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                                        {analysis.future_problems.map((problem, i) => <li key={i}>{problem}</li>)}
                                                    </ul>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-2xl"><User className="text-primary" />Personalized Recommendation</CardTitle>
                                        <CardDescription>Tell us about yourself to get a tailored recommendation.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid sm:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="age"><User className="inline-block mr-1 h-4 w-4"/>Age</Label>
                                                <Input id="age" type="number" placeholder="e.g., 35" value={userContext.age} onChange={e => setUserContext({...userContext, age: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="salary"><Coins className="inline-block mr-1 h-4 w-4"/>Annual Salary (USD)</Label>
                                                <Input id="salary" type="number" placeholder="e.g., 75000" value={userContext.salary} onChange={e => setUserContext({...userContext, salary: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="goal"><Target className="inline-block mr-1 h-4 w-4"/>Investment Goal</Label>
                                                <Input id="goal" placeholder="e.g., Retirement, Education" value={userContext.goal} onChange={e => setUserContext({...userContext, goal: e.target.value})} />
                                            </div>
                                        </div>
                                        <Button onClick={handleGetRecommendation} disabled={isRecoLoading}>
                                            {isRecoLoading ? "Generating..." : "Get My Recommendation"}
                                        </Button>
                                        {recommendation && (
                                            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="border-l-4 border-primary bg-primary/5 p-4 mt-4 rounded-r-lg">
                                                <p className="text-muted-foreground">{recommendation}</p>
                                            </motion.div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-2xl"><MessageSquare className="text-primary"/>Chat with Your Policy</CardTitle>
                                        <CardDescription>Ask follow-up questions about your policy analysis.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-80 overflow-y-auto pr-4 space-y-4 bg-muted/30 p-4 rounded-md">
                                            {chatHistory.map((msg, i) => (
                                                <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                                    {msg.role === 'bot' && <Bot className="h-6 w-6 text-primary flex-shrink-0"/>}
                                                    <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                                                        <p className="text-sm">{msg.content}</p>
                                                    </div>
                                                    {msg.role === 'user' && <User className="h-6 w-6 text-muted-foreground flex-shrink-0"/>}
                                                </div>
                                            ))}
                                            {isChatLoading && (
                                                <div className="flex items-start gap-3">
                                                    <Bot className="h-6 w-6 text-primary flex-shrink-0"/>
                                                    <div className="rounded-lg px-4 py-2 bg-background animate-pulse">
                                                        <div className="h-2.5 bg-gray-300 rounded-full w-24"></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <form onSubmit={handleChatSubmit} className="mt-4 flex gap-2">
                                            <Input 
                                                value={chatInput}
                                                onChange={e => setChatInput(e.target.value)}
                                                placeholder="e.g., Explain the 'pre-existing conditions' clause..."
                                                disabled={isChatLoading}
                                            />
                                            <Button type="submit" disabled={isChatLoading || !chatInput.trim()}>Send</Button>
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
