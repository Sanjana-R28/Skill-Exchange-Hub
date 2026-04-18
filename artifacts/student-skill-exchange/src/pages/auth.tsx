import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  college: z.string().min(2, "College name is required"),
  branch: z.string().min(2, "Branch/Major is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, login, register, isLoggingIn, isRegistering } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const [registerValues, setRegisterValues] = useState<RegisterFormValues>({
    name: "",
    email: "",
    password: "",
    college: "",
    branch: "",
  });
  const [registerErrors, setRegisterErrors] = useState<Partial<Record<keyof RegisterFormValues, string>>>({});

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  const onLoginSubmit = (data: LoginFormValues) => {
    login(data);
  };

  const updateRegisterValue = (field: keyof RegisterFormValues, value: string) => {
    setRegisterValues((current) => ({ ...current, [field]: value }));
    setRegisterErrors((current) => ({ ...current, [field]: undefined }));
  };

  const onRegisterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = registerSchema.safeParse(registerValues);
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      setRegisterErrors({
        name: flattened.name?.[0],
        email: flattened.email?.[0],
        password: flattened.password?.[0],
        college: flattened.college?.[0],
        branch: flattened.branch?.[0],
      });
      return;
    }
    register(parsed.data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-primary">
          <GraduationCap className="h-12 w-12 mb-2" />
          <h1 className="text-3xl font-bold tracking-tight">SkillX</h1>
          <p className="text-muted-foreground mt-2 text-center">
            Your campus skill exchange network
          </p>
        </div>

        <Card className="border-border shadow-xl shadow-primary/5">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {isLoginView ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription>
              {isLoginView 
                ? "Enter your credentials to access your account" 
                : "Enter your details to join your campus network"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoginView ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="student@university.edu" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input placeholder="••••••••" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-11 text-base font-medium mt-2" disabled={isLoggingIn}>
                    {isLoggingIn ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Sign In
                  </Button>
                </form>
              </Form>
            ) : (
              <form onSubmit={onRegisterSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="register-name">Full Name</label>
                  <Input
                    id="register-name"
                    name="name"
                    placeholder="Alex Johnson"
                    value={registerValues.name}
                    onChange={(event) => updateRegisterValue("name", event.target.value)}
                    autoComplete="name"
                  />
                  {registerErrors.name ? <p className="text-[0.8rem] font-medium text-destructive">{registerErrors.name}</p> : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="register-email">Email</label>
                  <Input
                    id="register-email"
                    name="email"
                    placeholder="student@university.edu"
                    type="email"
                    value={registerValues.email}
                    onChange={(event) => updateRegisterValue("email", event.target.value)}
                    autoComplete="email"
                  />
                  {registerErrors.email ? <p className="text-[0.8rem] font-medium text-destructive">{registerErrors.email}</p> : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="register-password">Password</label>
                  <Input
                    id="register-password"
                    name="password"
                    placeholder="••••••••"
                    type="password"
                    value={registerValues.password}
                    onChange={(event) => updateRegisterValue("password", event.target.value)}
                    autoComplete="new-password"
                  />
                  {registerErrors.password ? <p className="text-[0.8rem] font-medium text-destructive">{registerErrors.password}</p> : null}
                </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="register-college">College / University</label>
                      <Input
                        id="register-college"
                        name="college"
                        placeholder="State University"
                        value={registerValues.college}
                        onChange={(event) => updateRegisterValue("college", event.target.value)}
                        autoComplete="organization"
                      />
                      {registerErrors.college ? <p className="text-[0.8rem] font-medium text-destructive">{registerErrors.college}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="register-branch">Branch / Major</label>
                      <Input
                        id="register-branch"
                        name="branch"
                        placeholder="Computer Science"
                        value={registerValues.branch}
                        onChange={(event) => updateRegisterValue("branch", event.target.value)}
                        autoComplete="organization-title"
                      />
                      {registerErrors.branch ? <p className="text-[0.8rem] font-medium text-destructive">{registerErrors.branch}</p> : null}
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-medium mt-2" disabled={isRegistering}>
                    {isRegistering ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Create Account
                  </Button>
                </form>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isLoginView ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={() => setIsLoginView(!isLoginView)}
                className="text-primary font-medium hover:underline focus:outline-none"
              >
                {isLoginView ? "Sign up" : "Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}