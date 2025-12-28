import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Shield, AlertCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const navigate = useNavigate();
  const { signIn, user, userRole, adminStatus, loading } = useAuth();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (loading || !user) return;

    // If admin is not approved yet, keep them here and show the status card
    if (userRole === "admin" && adminStatus !== "approved") return;

    // Approved admins / super admins go straight to dashboard (or a requested redirect)
    if (userRole === "admin" || userRole === "super_admin") {
      navigate(redirectTo || "/dashboard");
      return;
    }

    // Regular users
    navigate(redirectTo || "/");
  }, [user, userRole, adminStatus, loading, navigate, redirectTo]);


  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password and try again.",
            variant: "destructive",
          });
        } else if (error.message.includes("Email not confirmed")) {
          toast({
            title: "Email not confirmed",
            description: "Please check your email and confirm your account.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show pending admin status
  if (user && userRole === "admin" && adminStatus === "pending") {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md animate-slide-in">
            <CardHeader className="text-center space-y-2 bg-[#0E0E55] rounded-t-lg py-6">
              <div className="mx-auto p-3 rounded-xl bg-warning/20 w-fit">
                <AlertCircle className="h-8 w-8 text-warning" />
              </div>
              <CardTitle className="font-display text-2xl text-white">Account Pending</CardTitle>
              <CardDescription className="text-white/80">
                Your admin account is awaiting approval from a Super Admin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 bg-white rounded-b-lg">
              <Alert className="bg-warning/10 border-warning/30">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-foreground">
                  Your verification ID is being reviewed. You'll be notified once your account is approved.
                </AlertDescription>
              </Alert>
              <Button variant="outline" className="w-full text-foreground" onClick={() => navigate("/")}>
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Show rejected/suspended admin status
  if (user && userRole === "admin" && (adminStatus === "rejected" || adminStatus === "suspended")) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md animate-slide-in">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto p-3 rounded-xl bg-destructive/10 w-fit">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="font-display text-2xl">
                Account {adminStatus === "rejected" ? "Rejected" : "Suspended"}
              </CardTitle>
              <CardDescription>
                {adminStatus === "rejected"
                  ? "Your admin application has been rejected."
                  : "Your admin account has been suspended."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please contact support for more information about your account status.
                </AlertDescription>
              </Alert>
              <Button variant="outline" className="w-full" onClick={() => navigate("/contact")}>
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md animate-slide-in">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto p-3 rounded-xl bg-primary/10 w-fit">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Log in to your PROMETEO account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...form.register("email")}
                  className={form.formState.errors.email ? "border-destructive" : ""}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...form.register("password")}
                    className={form.formState.errors.password ? "border-destructive pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Log In"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register"}
                className="text-primary hover:underline font-medium"
              >
                Register
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
