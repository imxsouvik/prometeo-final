import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Shield, Upload, User, Building2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().regex(/^\+?[\d\s-]{10,15}$/, "Invalid phone number format"),
  email: z.string().email("Invalid email address").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  department: z.enum(["hospital", "fire_station", "police"]).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>(undefined);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      department: undefined,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);

    if (!file) {
      setVerificationFile(null);
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Please upload a JPG, PNG, WebP, or PDF file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be less than 5MB");
      return;
    }

    setVerificationFile(file);
  };

  const uploadVerificationId = async (userId: string): Promise<string | null> => {
    if (!verificationFile) return null;

    const fileExt = verificationFile.name.split(".").pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("verification-ids")
      .upload(filePath, verificationFile);

    if (uploadError) {
      throw new Error("Failed to upload verification ID");
    }

    const { data } = supabase.storage
      .from("verification-ids")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      // Validate admin-specific fields
      if (isAdmin) {
        if (!verificationFile) {
          setUploadError("Verification ID is required for admin registration");
          setIsLoading(false);
          return;
        }
        if (!selectedDepartment) {
          toast({
            title: "Department required",
            description: "Please select a department for admin registration.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please log in instead.",
            variant: "destructive",
          });
        } else {
          throw authError;
        }
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        throw new Error("User creation failed");
      }

      const userId = authData.user.id;

      // Upload verification ID if admin
      let verificationIdUrl = "";
      if (isAdmin && verificationFile) {
        const url = await uploadVerificationId(userId);
        if (!url) throw new Error("Failed to upload verification ID");
        verificationIdUrl = url;
      }

      // Create profile and role
      if (isAdmin) {
        const { error: profileError } = await supabase
          .from("admin_profiles")
          .insert({
            user_id: userId,
            name: data.name,
            phone: data.phone,
            email: data.email,
            department: selectedDepartment as "hospital" | "fire_station" | "police",
            verification_id_url: verificationIdUrl,
            status: "pending",
          });

        if (profileError) throw profileError;

        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: "admin",
          });

        if (roleError) throw roleError;

        toast({
          title: "Registration submitted",
          description: "Your admin account is pending approval. You'll be notified once approved.",
        });
      } else {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            user_id: userId,
            name: data.name,
            phone: data.phone,
            email: data.email,
          });

        if (profileError) throw profileError;

        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: "user",
          });

        if (roleError) throw roleError;

        toast({
          title: "Registration successful",
          description: "Your account has been created. You can now log in.",
        });
      }

      // Navigate to login or redirect
      if (redirectTo) {
        navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-lg animate-slide-in">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto p-3 rounded-xl bg-primary/10 w-fit">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">Create Account</CardTitle>
            <CardDescription>
              Join PROMETEO to report and respond to emergencies
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsAdmin(false)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  !isAdmin
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <User className={cn("h-6 w-6", !isAdmin ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("font-medium text-sm", !isAdmin ? "text-primary" : "text-muted-foreground")}>
                  User
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsAdmin(true)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  isAdmin
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <Building2 className={cn("h-6 w-6", isAdmin ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("font-medium text-sm", isAdmin ? "text-primary" : "text-muted-foreground")}>
                  Admin
                </span>
              </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...form.register("name")}
                  className={form.formState.errors.name ? "border-destructive" : ""}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 234 567 8900"
                  {...form.register("phone")}
                  className={form.formState.errors.phone ? "border-destructive" : ""}
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>

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

              {/* Department (Admin only) */}
              {isAdmin && (
                <div className="space-y-3">
                  <Label>Department *</Label>
                  <RadioGroup
                    value={selectedDepartment}
                    onValueChange={setSelectedDepartment}
                    className="grid grid-cols-3 gap-3"
                  >
                    <div>
                      <RadioGroupItem value="hospital" id="hospital" className="peer sr-only" />
                      <Label
                        htmlFor="hospital"
                        className={cn(
                          "flex flex-col items-center justify-center rounded-lg border-2 bg-popover p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                          selectedDepartment === "hospital" ? "border-primary bg-primary/5" : "border-muted"
                        )}
                      >
                        <span className="text-xs font-medium">Hospital</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="fire_station" id="fire_station" className="peer sr-only" />
                      <Label
                        htmlFor="fire_station"
                        className={cn(
                          "flex flex-col items-center justify-center rounded-lg border-2 bg-popover p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                          selectedDepartment === "fire_station" ? "border-primary bg-primary/5" : "border-muted"
                        )}
                      >
                        <span className="text-xs font-medium">Fire Station</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="police" id="police" className="peer sr-only" />
                      <Label
                        htmlFor="police"
                        className={cn(
                          "flex flex-col items-center justify-center rounded-lg border-2 bg-popover p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                          selectedDepartment === "police" ? "border-primary bg-primary/5" : "border-muted"
                        )}
                      >
                        <span className="text-xs font-medium">Police</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Verification ID Upload (Admin only) */}
              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="verification">Verification ID *</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    <input
                      id="verification"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="verification" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      {verificationFile ? (
                        <p className="text-sm font-medium text-primary">{verificationFile.name}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Upload official ID (JPG, PNG, WebP, or PDF, max 5MB)
                        </p>
                      )}
                    </label>
                  </div>
                  {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
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
                <p className="text-xs text-muted-foreground">
                  Must be 8+ characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...form.register("confirmPassword")}
                    className={form.formState.errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : isAdmin ? "Submit for Approval" : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
                className="text-primary hover:underline font-medium"
              >
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
