import { createContext, useContext, ReactNode } from "react";
import { useGetCurrentUser, useLogout, useLogin, useRegister } from "@workspace/api-client-react";
import { PublicUser, LoginInput, RegisterInput } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: PublicUser | null;
  isLoading: boolean;
  login: (data: LoginInput) => void;
  register: (data: RegisterInput) => void;
  logout: () => void;
  isLoggingIn: boolean;
  isRegistering: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: authData, isLoading: isUserLoading, refetch } = useGetCurrentUser({
    query: {
      retry: false,
    }
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: () => {
        refetch();
        setLocation("/dashboard");
        toast({ title: "Welcome back!" });
      },
      onError: (error: any) => {
        toast({ 
          title: "Login failed", 
          description: error?.message || "Invalid credentials",
          variant: "destructive"
        });
      }
    }
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: () => {
        refetch();
        setLocation("/dashboard");
        toast({ title: "Account created successfully!" });
      },
      onError: (error: any) => {
        toast({ 
          title: "Registration failed", 
          description: error?.message || "Something went wrong",
          variant: "destructive"
        });
      }
    }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        refetch();
        setLocation("/");
        toast({ title: "Logged out successfully" });
      }
    }
  });

  return (
    <AuthContext.Provider
      value={{
        user: authData?.user || null,
        isLoading: isUserLoading,
        login: (data) => loginMutation.mutate({ data }),
        register: (data) => registerMutation.mutate({ data }),
        logout: () => logoutMutation.mutate(),
        isLoggingIn: loginMutation.isPending,
        isRegistering: registerMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}