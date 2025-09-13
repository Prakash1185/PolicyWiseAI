'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { analyzeInsurancePolicy, AnalyzeInsurancePolicyOutput } from '@/ai/flows/analyze-insurance-policy';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, FileText, Bot, AlertTriangle, BadgeCheck, List, ListX, Scale, ThumbsUp, ThumbsDown, Gavel } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
};

export default function AnalyseInsurancePage() {
    const [documentText, setDocumentText] = useState('');
    const [fileName, setFileName] = useState('');
    const [analysis, setAnalysis] = useState<AnalyzeInsurancePolicyOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type === 'application/pdf') {
                setFile(selectedFile);
                setFileName(selectedFile.name);
                setDocumentText('');
                setError(null);
            } else {
                setError('Invalid file type. Please upload a PDF file.');
                setFile(null);
                setFileName('');
            }
        }
    };

    const handleAnalyze = async () => {
        setIsLoading(true);
        setAnalysis(null);
        setError(null);

        try {
            let result;
            if (file) {
                const documentDataUri = await fileToDataUri(file);
                result = await analyzeInsurancePolicy({ documentDataUri });
            } else if (documentText) {
                result = await analyzeInsurancePolicy({ documentText });
            } else {
                setError('Please provide a document to analyze.');
                setIsLoading(false);
                return;
            }
            setAnalysis(result);
        } catch (err) {
            console.error('Error analyzing document:', err);
            setError('An error occurred during analysis. Please try again.');
        }
        setIsLoading(false);
    };

    const renderList = (items: string[], icon: React.ReactNode, title: string) => (
        <div className="space-y-2">
             <h4 className="flex items-center text-lg font-semibold text-foreground/90">
                {icon}
                <span className="ml-2">{title}</span>
            </h4>
            <ul className="list-disc list-inside pl-2 space-y-1 text-muted-foreground">
                {items.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    );

    const getVerdictIcon = () => {
        if (!analysis?.final_verdict) return <Gavel className="h-5 w-5" />;
        const verdict = analysis.final_verdict.toLowerCase();
        if (verdict.includes('safe')) return <BadgeCheck className="h-5 w-5 text-green-500" />;
        if (verdict.includes('risky')) return <AlertTriangle className="h-5 w-5 text-red-500" />;
        return <Gavel className="h-5 w-5 text-yellow-500" />;
    };

    return (
        <div className="bg-muted/20 min-h-screen">
            <div className="container mx-auto py-12 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="max-w-4xl mx-auto shadow-lg border-border/20 overflow-hidden">
                        <CardHeader className="bg-card-foreground/5 border-b border-border/20 p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <Bot className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-3xl font-bold text-foreground">AI Insurance Analyzer</CardTitle>
                                    <CardDescription className="text-muted-foreground mt-1">
                                        Paste your policy text or upload a PDF to get an expert, AI-powered analysis.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Tabs defaultValue="text" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                                    <TabsTrigger value="text"><FileText className="h-4 w-4 mr-2" />Paste Text</TabsTrigger>
                                    <TabsTrigger value="pdf"><UploadCloud className="h-4 w-4 mr-2" />Upload PDF</TabsTrigger>
                                </TabsList>
                                <TabsContent value="text">
                                    <Textarea
                                        placeholder="Paste your document text here..."
                                        className="min-h-[250px] text-base border-border/30 focus:ring-primary/50"
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
                                        className="border-2 border-dashed border-border/50 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
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

                            {error && (
                                <Alert variant="destructive" className="mt-6">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="mt-6 flex justify-end">
                                <Button onClick={handleAnalyze} disabled={isLoading || (!documentText && !file)} size="lg">
                                    {isLoading ? 'Analyzing...' : 'Analyze Document'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <AnimatePresence>
                        {analysis && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="mt-8"
                            >
                                <Card className="max-w-4xl mx-auto shadow-lg border-border/20">
                                    <CardHeader className="bg-card-foreground/5 p-6 border-b border-border/20">
                                        <CardTitle className="text-2xl font-semibold">Analysis Result</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-8">
                                        <div>
                                            <h3 className="text-xl font-semibold mb-3">Overview</h3>
                                            <p className="text-muted-foreground bg-muted/30 p-4 rounded-md border border-border/20">{analysis.overview}</p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-8">
                                            {renderList(analysis.benefits, <BadgeCheck className="h-5 w-5 text-green-500"/>, "Key Benefits")}
                                            {renderList(analysis.risks, <ListX className="h-5 w-5 text-red-500"/>, "Risks & Exclusions")}
                                        </div>
                                        
                                        <div>
                                            {renderList(analysis.future_problems, <AlertTriangle className="h-5 w-5 text-yellow-500"/>, "Potential Future Problems")}
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-8">
                                            {renderList(analysis.pros_cons.pros, <ThumbsUp className="h-5 w-5 text-green-500"/>, "Pros")}
                                            {renderList(analysis.pros_cons.cons, <ThumbsDown className="h-5 w-5 text-red-500"/>, "Cons")}
                                        </div>
                                        
                                        <div>
                                            <h3 className="flex items-center text-xl font-semibold mb-3">
                                                {getVerdictIcon()}
                                                <span className="ml-2">Final Verdict</span>
                                            </h3>
                                            <p className="text-muted-foreground bg-muted/30 p-4 rounded-md border border-border/20">{analysis.final_verdict}</p>
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
