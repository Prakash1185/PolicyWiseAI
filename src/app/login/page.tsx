import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const GoogleIcon = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
    <title>Google</title>
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-4.73 1.9-5.78 0-10.47-4.88-10.47-10.92s4.7-10.92 10.47-10.92c2.8 0 4.92.98 6.48 2.44l-2.72 2.72c-.7-.68-1.77-1.3-3.76-1.3-4.1 0-7.47 3.4-7.47 7.92s3.37 7.92 7.47 7.92c2.43 0 3.82-.98 4.48-1.62.58-.58 1.02-1.62 1.23-2.8h-5.7z" />
  </svg>
);

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Login</CardTitle>
          <CardDescription>Choose your preferred login method</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button variant="outline" className="w-full">
              <GoogleIcon />
              <span className="ml-2">Login with Google</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
