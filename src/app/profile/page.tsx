"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, FileText, ChevronDown } from "lucide-react";
import { AnalyzeInsurancePolicyOutput } from "@/ai/flows/analyze-insurance-policy";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from "sonner";

type SavedAnalysis = AnalyzeInsurancePolicyOutput & {
    id: string;
    savedAt: string;
};

export default function ProfilePage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push('/login');
        }
    }, [user, isAuthLoading, router]);

    useEffect(() => {
        if (user) {
            const fetchSavedAnalyses = async () => {
                setIsLoadingData(true);
                try {
                    const analysesCol = collection(db, "users", user.uid, "analyses");
                    const analysesSnapshot = await getDocs(analysesCol);
                    const analysesList = analysesSnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            savedAt: data.savedAt?.toDate ? data.savedAt.toDate().toLocaleDateString() : 'N/A',
                        } as SavedAnalysis;
                    });
                    setSavedAnalyses(analysesList);
                } catch(error) {
                    console.error("Error fetching saved analyses: ", error);
                    toast.error("Could not fetch saved analyses.");
                } finally {
                    setIsLoadingData(false);
                }
            };

            fetchSavedAnalyses();
        }
    }, [user]);

    const handleDelete = async (analysisId: string) => {
        if(!user) return;

        const promise = () => new Promise(async (resolve, reject) => {
             try {
                await deleteDoc(doc(db, "users", user.uid, "analyses", analysisId));
                setSavedAnalyses(prev => prev.filter(a => a.id !== analysisId));
                resolve("Analysis deleted successfully");
            } catch (error) {
                console.error("Error deleting analysis: ", error);
                reject(new Error("Failed to delete analysis."));
            }
        });

        toast.promise(promise(), {
            loading: 'Deleting analysis...',
            success: (message) => `${message}`,
            error: (err) => err.message,
        });
    };

    if (isAuthLoading || !user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto py-12 px-4">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.photoURL || undefined} />
                            <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <CardTitle className="text-2xl">{user.displayName}</CardTitle>
                            <CardDescription>{user.email}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="max-w-4xl mx-auto mt-8">
                <h2 className="text-2xl font-bold mb-4">Saved Analyses</h2>
                {isLoadingData ? (
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto"/>
                        <p>Loading your saved analyses...</p>
                    </div>
                ) : savedAnalyses.length > 0 ? (
                    <Accordion type="multiple" className="w-full space-y-4">
                        {savedAnalyses.map(analysis => (
                             <Card key={analysis.id}>
                                <AccordionItem value={analysis.id} className="border-0">
                                    <AccordionTrigger className="p-6 text-lg hover:no-underline">
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex items-center gap-4">
                                                <FileText className="h-6 w-6 text-primary"/>
                                                <div>
                                                    <p className="font-semibold text-left">{analysis.policyName || `Analysis from ${analysis.savedAt}`}</p>
                                                    <p className="text-sm text-muted-foreground font-normal text-left">Saved on: {analysis.savedAt}</p>
                                                </div>
                                            </div>
                                             <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); handleDelete(analysis.id);}} className="text-red-500 hover:text-red-700">
                                                    <Trash2 className="h-5 w-5"/>
                                                </Button>
                                                <ChevronDown className="h-5 w-5 transition-transform duration-200" />
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-6 pt-0">
                                        <div className="space-y-4">
                                            <p><span className="font-semibold">Overview:</span> {analysis.overview}</p>
                                            <p><span className="font-semibold">Verdict:</span> {analysis.final_verdict}</p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                             </Card>
                        ))}
                    </Accordion>
                ) : (
                    <p className="text-muted-foreground text-center py-8">You have no saved analyses yet.</p>
                )}
            </div>
        </div>
    );
}
