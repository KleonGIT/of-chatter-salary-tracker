import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";
import { SettingsProvider } from "@/contexts/settings";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import TrackerPage from "@/pages/tracker";
import AdminPage from "@/pages/admin";
import { Button } from "@/components/ui/button";
import { DollarSign, LogIn, Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function LoginPage() {
  const { login } = useAuth();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <DollarSign className="h-9 w-9 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Chatter Pay Tracker</h1>
            <p className="text-muted-foreground text-sm mt-1">Weekly salary transparency for OF chatters</p>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Track daily net sales per shift</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Auto-calculate base pay + commission</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Your data saved securely to your account</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Share with teammates, each sees only their own</span>
            </div>
          </div>
          <Button
            onClick={login}
            className="w-full gap-2 h-11 text-base font-semibold"
            data-testid="button-login"
          >
            <LogIn className="h-5 w-5" />
            Log in to get started
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Your data is private — only you can see your own records.
        </p>
      </div>
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/new" component={() => <TrackerPage />} />
      <Route path="/edit/:id">
        {(params) => <TrackerPage editId={params.id} />}
      </Route>
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SettingsProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthGate>
              <Router />
            </AuthGate>
          </WouterRouter>
          <Toaster />
        </SettingsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
