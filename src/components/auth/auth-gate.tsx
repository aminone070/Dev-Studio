import { useEffect, useState } from "react";
import { Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

const PUBLIC_ROUTES = ["/auth", "/reset-password"];

export function AuthGate() {
  const { isReady, user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  
  // Handle trailing slashes and nested public routes robustly
  const isPublic = PUBLIC_ROUTES.some(r => 
    pathname === r || pathname.startsWith(r + "/") || (r === "/auth" && pathname === "/auth/")
  );

  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    console.log("[AuthGate] State changed:", { isReady, user: !!user, isPublic, pathname });
    if (isReady && !user && !isPublic) {
      console.log("[AuthGate] User not authenticated on protected route. Redirecting to /auth");
      router.navigate({ to: "/auth", replace: true }).catch(err => {
        console.error("[AuthGate] Navigation to /auth failed:", err);
      });
    }
  }, [isReady, user, isPublic, router, pathname]);

  useEffect(() => {
    if (!isReady) {
      const interval = setInterval(() => {
        setLoadingTime(t => {
          if (t === 2) console.warn("[AuthGate] isReady is still false after 3 seconds!");
          return t + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isReady]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground mb-4" />
        {loadingTime > 2 && (
          <div className="text-center text-sm text-red-500 max-w-md p-4 bg-red-500/10 rounded-md">
            <p className="font-bold mb-2">Authentication is taking longer than expected.</p>
            <p>Please check your browser console for errors.</p>
            <p className="mt-2 text-xs opacity-70">
              Supabase URL configured: {import.meta.env.VITE_SUPABASE_URL ? "Yes" : "No"} <br/>
              Supabase Key configured: {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "Yes" : "No"}
            </p>
            <button 
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
              onClick={() => window.location.reload()}
            >
              Force Reload
            </button>
          </div>
        )}
      </div>
    );
  }

  if (isPublic) {
    return <Outlet />;
  }

  if (!user) {
    // We are currently redirecting to /auth, so we show a loading state
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
