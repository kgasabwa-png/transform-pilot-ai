import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { trackPageview } from "@/lib/track";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Nothing here to remember
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Back to Nyvlo
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nyvlo | What you forgot, found" },
      { name: "description", content: "Nyvlo finds missed follow-ups, promises, and next steps from your workweek, then drafts the reply before anything slips." },
      { property: "og:title", content: "Nyvlo | What you forgot, found" },
      { property: "og:description", content: "Missed follow-ups, promises, and next steps found before they slip." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Nyvlo" },
      { property: "og:image", content: "https://transform-pilot-ai.lovable.app/nyvlo-og.jpg" },
      { property: "og:image:width", content: "1216" },
      { property: "og:image:height", content: "640" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Nyvlo | What you forgot, found" },
      { name: "twitter:description", content: "Missed follow-ups, promises, and next steps found before they slip" },
      { name: "twitter:image", content: "https://transform-pilot-ai.lovable.app/nyvlo-og.jpg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/__l5e/assets-v1/6211f021-75b1-484a-8d96-f59fda81e71b/nyvlo-logo-transparent.png" },
      { rel: "apple-touch-icon", href: "/__l5e/assets-v1/6211f021-75b1-484a-8d96-f59fda81e71b/nyvlo-logo-transparent.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    // Mirror the Supabase access token into a same-origin cookie so the
    // Nyvlo browser extension can pick it up via chrome.cookies — no
    // copy-paste, no UI. The token is identical to what's in localStorage,
    // so this doesn't widen the threat model.
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const writeCookie = (token: string | null) => {
          const isHttps = window.location.protocol === "https:";
          const base = `path=/; SameSite=Lax${isHttps ? "; Secure" : ""}`;
          if (token) {
            document.cookie = `nyvlo-at=${token}; ${base}; max-age=3600`;
          } else {
            document.cookie = `nyvlo-at=; ${base}; max-age=0`;
          }
        };
        const { data } = await supabase.auth.getSession();
        writeCookie(data.session?.access_token ?? null);
        const sub = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_OUT") return writeCookie(null);
          if (session?.access_token) writeCookie(session.access_token);
        });
        unsub = () => sub.data.subscription.unsubscribe();
      } catch {
        // best effort
      }
    })();
    return () => unsub?.();
  }, []);

  // Pageview tracking on every route change.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    trackPageview();
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
