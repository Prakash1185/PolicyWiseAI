"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, getRedirectResult } from "firebase/auth";
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
  
  useEffect(() => {
    const handleRedirectResult = async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                toast.success(`Welcome, ${result.user.displayName}!`);
                router.push('/profile');
            }
        } catch (error) {
            console.error("Error handling redirect result:", error);
            toast.error("Failed to sign in. Please try again.");
        }
    };
    handleRedirectResult();
  }, [router]);


  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Signed in successfully!");
      router.push('/profile');
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("An error occurred during sign-in.");
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
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 261.8S109.8 11.6 244 11.6C308.1 11.6 364.5 35.8 408.7 79.9L354.3 128.8C326.9 104.4 288.7 89 244 89c-64.2 0-116.8 43.2-133.5 101.4H4.1v66.3h109.3c5.5 39.5 39.5 69.8 80.5 69.8 22.1 0 41.8-9.4 56.2-24.3l56.5 56.5c-37.1 34.2-86.4 54.7-142.7 54.7-104.5 0-192-80.1-192-184.2s87.5-184.2 192-184.2c91.9 0 168.3 56.9 187.3 133.1H244v66.3h244z"></path>
              </svg>
              <span className="ml-2">Login with Google</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
