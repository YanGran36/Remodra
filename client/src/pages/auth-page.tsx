import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, BuildingIcon } from "lucide-react";

type AuthScreenType = "login" | "signup";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

const signupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  terms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreenType>("login");

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const handleLogin = (data: LoginFormValues) => {
    loginMutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

  const handleSignup = (data: SignupFormValues) => {
    registerMutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      companyName: data.companyName,
      email: data.email,
      password: data.password,
    });
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 pb-8 px-8">
          {authScreen === "login" ? (
            <div>
              <div className="text-center mb-6">
                <div className="flex justify-center">
                  <div className="bg-primary rounded-full p-3">
                    <BuildingIcon className="text-white h-6 w-6" />
                  </div>
                </div>
                <h2 className="mt-4 text-3xl font-bold text-gray-900">ContractorHub</h2>
                <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
              </div>
              
              <form className="space-y-6" onSubmit={loginForm.handleSubmit(handleLogin)}>
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    {...loginForm.register("email")} 
                    className="mt-1"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    {...loginForm.register("password")} 
                    className="mt-1"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Checkbox 
                      id="rememberMe" 
                      {...loginForm.register("rememberMe")} 
                    />
                    <Label htmlFor="rememberMe" className="ml-2 text-sm">Remember me</Label>
                  </div>
                  
                  <div>
                    <a href="#forgot-password" className="text-sm font-medium text-primary hover:text-primary/80">
                      Forgot password?
                    </a>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button 
                    type="button"
                    className="font-medium text-primary hover:text-primary/80"
                    onClick={() => setAuthScreen("signup")}
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-center mb-6">
                <div className="flex justify-center">
                  <div className="bg-primary rounded-full p-3">
                    <BuildingIcon className="text-white h-6 w-6" />
                  </div>
                </div>
                <h2 className="mt-4 text-3xl font-bold text-gray-900">ContractorHub</h2>
                <p className="mt-2 text-sm text-gray-600">Create your contractor account</p>
              </div>
              
              <form className="space-y-6" onSubmit={signupForm.handleSubmit(handleSignup)}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First name</Label>
                    <Input 
                      id="firstName" 
                      {...signupForm.register("firstName")} 
                      className="mt-1"
                    />
                    {signupForm.formState.errors.firstName && (
                      <p className="text-sm text-destructive mt-1">{signupForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last name</Label>
                    <Input 
                      id="lastName" 
                      {...signupForm.register("lastName")} 
                      className="mt-1"
                    />
                    {signupForm.formState.errors.lastName && (
                      <p className="text-sm text-destructive mt-1">{signupForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="companyName">Company name</Label>
                  <Input 
                    id="companyName" 
                    {...signupForm.register("companyName")} 
                    className="mt-1"
                  />
                  {signupForm.formState.errors.companyName && (
                    <p className="text-sm text-destructive mt-1">{signupForm.formState.errors.companyName.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="signup-email">Email address</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    {...signupForm.register("email")} 
                    className="mt-1"
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    {...signupForm.register("password")} 
                    className="mt-1"
                  />
                  {signupForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    {...signupForm.register("confirmPassword")} 
                    className="mt-1"
                  />
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{signupForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                
                <div className="flex items-center">
                  <Checkbox 
                    id="terms" 
                    checked={signupForm.watch("terms")}
                    onCheckedChange={(checked) => {
                      signupForm.setValue("terms", checked === true);
                    }}
                  />
                  <Label htmlFor="terms" className="ml-2 text-sm">
                    I agree to the <a href="#" className="text-primary hover:text-primary/80">Terms of Service</a> and <a href="#" className="text-primary hover:text-primary/80">Privacy Policy</a>
                  </Label>
                </div>
                {signupForm.formState.errors.terms && (
                  <p className="text-sm text-destructive mt-1">{signupForm.formState.errors.terms.message}</p>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button 
                    type="button"
                    className="font-medium text-primary hover:text-primary/80"
                    onClick={() => setAuthScreen("login")}
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
