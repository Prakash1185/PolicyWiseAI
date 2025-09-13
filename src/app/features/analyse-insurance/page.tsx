'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { analyzeInsurancePolicy, AnalyzeInsurancePolicyOutput } from '@/ai/flows/analyze-insurance-policy';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, FileText, Bot, AlertTriangle, BadgeCheck, ListX, ThumbsUp, ThumbsDown, Gavel, FileWarning } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
};

const AnalysisCard = ({ icon, title, content, colorClass }: { icon: React.ReactNode, title: string, content: React.ReactNode, colorClass?: string }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <Card className="h-full shadow-md hover:shadow-xl transition-shadow duration-300 border-border/20">
            <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <div className={`p-2 bg-opacity-10 rounded-full ${colorClass}`}>
                    {icon}
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {content}
            </CardContent>
        </Card>
    </motion.div>
);

const BulletList = ({ items }: { items: string[] }) => (
    <ul className="space-y-2 text-muted-foreground">
        {items.map((item, index) => (
            <li key={index} className="flex items-start">
                <span className="text-primary mr-2 mt-1">&#8226;</span>
                <span>{item}</span>
            </li>
        ))}
    </ul>
);

export default function AnalyseInsurancePage() {
    const [documentText, setDocumentText] = useState('');
    const [fileName, setFileName] = useState('');
    const [analysis, setAnalysis] = useState<AnalyzeInsurancePolicyOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isLoading) {
            setProgress(0);
            const duration = 30000; // Simulate a 30s analysis
            const interval = duration / 100;
            timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) {
                        clearInterval(timer);
                        return 95;
                    }
                    return prev + 1;
                });
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
                toast.error('Invalid file type', {
                    description: 'Please upload a PDF file.',
                });
                setFile(null);
                setFileName('');
            }
        }
    };

    const handleAnalyze = async () => {
        setIsLoading(true);
        setAnalysis(null);
        
        const promise = () => new Promise<AnalyzeInsurancePolicyOutput>(async (resolve, reject) => {
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

        toast.promise(promise(), {
            loading: 'Analyzing your document... This may take a moment.',
            success: (data) => {
                setAnalysis(data);
                setIsLoading(false);
                setProgress(100);
                return 'Analysis complete! See the results below.';
            },
            error: (err) => {
                setIsLoading(false);
                setProgress(0);
                return err.message || 'An error occurred during analysis.';
            },
        });
    };

    const getVerdictIcon = (verdict: string) => {
        const lowerVerdict = verdict.toLowerCase();
        if (lowerVerdict.includes('safe')) return <BadgeCheck className="h-8 w-8 text-green-500" />;
        if (lowerVerdict.includes('risky')) return <FileWarning className="h-8 w-8 text-red-500" />;
        return <Gavel className="h-8 w-8 text-yellow-500" />;
    };
    
    const getVerdictColor = (verdict: string) => {
        const lowerVerdict = verdict.toLowerCase();
        if (lowerVerdict.includes('safe')) return 'text-green-500 bg-green-500';
        if (lowerVerdict.includes('risky')) return 'text-red-500 bg-red-500';
        return 'text-yellow-500 bg-yellow-500';
    };

    return (
        <div className="bg-muted/30 min-h-screen">
            <div className="container mx-auto py-12 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="max-w-4xl mx-auto shadow-xl border-border/20 overflow-hidden bg-card">
                        <CardHeader className="bg-card-foreground/5 border-b border-border/20 p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <Bot className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-3xl font-bold text-foreground">AI Insurance Analyzer</CardTitle>
                                    <CardDescription className="text-muted-foreground mt-1 text-base">
                                        Paste your policy or upload a PDF for an expert, AI-powered analysis.
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
                                    />
                                </TabsContent>
                                <TabsContent value="pdf">
                                    <div 
                                        className="border-2 border-dashed border-border/50 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors bg-background"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept="application/pdf"
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
                                    <p className="text-sm text-muted-foreground text-center">AI is thinking... please wait.</p>
                                </div>
                            )}

                        </CardContent>
                    </Card>

                    <AnimatePresence>
                        {analysis && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="mt-12"
                            >
                                <div className="space-y-8">
                                    <AnalysisCard
                                        icon={<Gavel className={`h-8 w-8 ${getVerdictColor(analysis.final_verdict)}`} />}
                                        title="Final Verdict"
                                        colorClass={getVerdictColor(analysis.final_verdict)}
                                        content={<p className="text-muted-foreground text-base">{analysis.final_verdict}</p>}
                                    />
                                    
                                     <AnalysisCard
                                        icon={<FileText className="h-8 w-8 text-primary" />}
                                        title="Policy Overview"
                                        colorClass="text-primary bg-primary"
                                        content={<p className="text-muted-foreground text-base">{analysis.overview}</p>}
                                    />

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <AnalysisCard
                                            icon={<ThumbsUp className="h-8 w-8 text-green-500" />}
                                            title="Pros"
                                            colorClass="text-green-500 bg-green-500"
                                            content={<BulletList items={analysis.pros_cons.pros} />}
                                        />
                                        <AnalysisCard
                                            icon={<ThumbsDown className="h-8 w-8 text-red-500" />}
                                            title="Cons"
                                            colorClass="text-red-500 bg-red-500"
                                            content={<BulletList items={analysis.pros_cons.cons} />}
                                        />
                                    </div>
                                    
                                    <AnalysisCard
                                        icon={<BadgeCheck className="h-8 w-8 text-blue-500" />}
                                        title="Key Benefits"
                                        colorClass="text-blue-500 bg-blue-500"
                                        content={<BulletList items={analysis.benefits} />}
                                    />

                                    <AnalysisCard
                                        icon={<ListX className="h-8 w-8 text-orange-500" />}
                                        title="Risks & Exclusions"
                                        colorClass="text-orange-500 bg-orange-500"
                                        content={<BulletList items={analysis.risks} />}
                                    />

                                    <AnalysisCard
                                        icon={<AlertTriangle className="h-8 w-8 text-yellow-500" />}
                                        title="Potential Future Problems"
                                        colorClass="text-yellow-500 bg-yellow-500"
                                        content={<BulletList items={analysis.future_problems} />}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
