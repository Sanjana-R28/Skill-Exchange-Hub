import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Discover from "@/pages/discover";
import Matches from "@/pages/matches";
import Connections from "@/pages/connections";
import Messages from "@/pages/messages";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// A wrapper to enforce authentication
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    // Return a dummy component that redirects to login or just auth page directly
    // Ideally we should redirect, but for simplicity we can just render AuthPage
    return <AuthPage />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={AuthPage} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>
      <Route path="/discover">
        {() => <ProtectedRoute component={Discover} />}
      </Route>
      <Route path="/matches">
        {() => <ProtectedRoute component={Matches} />}
      </Route>
      <Route path="/connections">
        {() => <ProtectedRoute component={Connections} />}
      </Route>
      <Route path="/messages/:userId">
        {() => <ProtectedRoute component={Messages} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;