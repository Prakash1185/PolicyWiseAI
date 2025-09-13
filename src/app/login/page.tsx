"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/profile');
    }
  }, [user, router]);
  
  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      toast.success(`Welcome, ${result.user.displayName}!`);
      router.push('/profile');
    } catch (error: any) {
      console.error("Google login error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error("An error occurred during sign-in.");
      }
      setIsSigningIn(false);
    }
  };
  
  if (isLoading || isSigningIn || user) {
    return (
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center p-4">
            <Loader2 className="h-10 w-10 animate-spin" />
        </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Login</CardTitle>
          <CardDescription>Choose your preferred login method</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            
              <span className="ml-2">Login with Google</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
