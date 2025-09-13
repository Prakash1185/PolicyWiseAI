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
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // Redirect if the user is already authenticated when the page loads
    if (!isAuthLoading && user) {
      router.push('/profile');
    }
  }, [user, isAuthLoading, router]);

  const handleGoogleLogin = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      // The sign-in process
      const result = await signInWithPopup(auth, googleProvider);
      toast.success(`Welcome, ${result.user.displayName}!`);
      // Redirect ONLY after the promise has resolved
      router.push('/profile');
    } catch (error: any) {
      console.error("Google login error:", error);
      // Only show a toast if it's an actual error, not the user closing the popup.
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error("An error occurred during sign-in.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };
  
  // Show a loader while checking auth state or if user exists (and is about to be redirected)
  if (isAuthLoading || user) {
    return (
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center p-4">
            <Loader2 className="h-10 w-10 animate-spin" />
        </div>
    )
  }

  // Render the login form
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Login</CardTitle>
          <CardDescription>Choose your preferred login method</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isSigningIn}>
              {isSigningIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="ml-2">Login with Google</span>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
