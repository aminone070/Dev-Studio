import type { SkillAreaData } from "../../types/skills";
import { Globe } from "lucide-react";

export const frontendArea: SkillAreaData = {
  id: "frontend",
  label: "Frontend",
  icon: Globe,
  description: "HTML, CSS, JavaScript and modern frameworks — choose a framework to dive deep.",
  concepts: [],
  resources: [],
  checklist: [
    { id: "perf", label: "Core Web Vitals (LCP < 2.5s, CLS < 0.1, INP < 200ms)" },
    { id: "a11y", label: "Semantic HTML & ARIA — screen reader accessible" },
    { id: "resp", label: "Responsive layout (mobile-first, fluid typography)" },
    { id: "seo", label: "Meta tags, OG, structured data (schema.org)" },
    { id: "bundle", label: "Bundle analysis — no unnecessary dependencies" },
    { id: "lazy", label: "Lazy load routes & heavy components" },
    { id: "error", label: "Error boundaries & graceful fallbacks" },
    { id: "csp", label: "Content Security Policy headers set" },
    { id: "fonts", label: "Font optimization (preload, font-display: swap)" },
    { id: "img", label: "Images: WebP/AVIF, srcset, lazy loading" },
  ],
  subAreas: [
    {
      id: "react",
      label: "React",
      color: "border-primary/40 bg-primary/10 text-primary",
      accent: "border-primary/30",
      tags: ["react"],
      concepts: [
        {
          title: "Composition over Inheritance",
          body: "Build complex UIs by nesting specialized components. Use children prop for layouts and render props for behavior injection.",
        },
        {
          title: "Immutability & State",
          body: "Never mutate state directly. Use setState/dispatch with new references. Enables fast shallow comparisons and predictable re-renders.",
        },
        {
          title: "Hooks Pattern",
          body: "Custom hooks extract and reuse stateful logic across components. Rules: only call at top level, only from React functions.",
        },
        {
          title: "Reconciliation & Keys",
          body: "React diffs the virtual DOM using keys to identify list items. Stable keys prevent unnecessary unmounts; index keys cause bugs on reorder.",
        },
        {
          title: "Server Components (RSC)",
          body: "RSCs render on the server only — zero JS bundle cost. They can access databases directly. Client Components need 'use client' for hooks/events.",
        },
        {
          title: "Context vs External State",
          body: "Context is for low-frequency global values (theme, auth). Use Zustand/Redux for high-frequency updates to avoid widespread re-renders.",
        },
      ],
      resources: [
        {
          label: "React Official Docs",
          url: "https://react.dev",
          desc: "New official React documentation with interactive examples.",
        },
        {
          label: "React Hooks Reference",
          url: "https://react.dev/reference/react",
          desc: "Full API reference for all built-in hooks.",
        },
        {
          label: "React Patterns",
          url: "https://reactpatterns.com",
          desc: "Common component patterns with code examples.",
        },
        {
          label: "Josh Comeau's Blog",
          url: "https://www.joshwcomeau.com",
          desc: "Deep visual explanations of React internals and CSS.",
        },
      ],
      checklist: [
        { id: "r-keys", label: "Use stable unique keys in lists (never index for reorderable lists)" },
        { id: "r-memo", label: "Wrap expensive child components with React.memo" },
        { id: "r-cb", label: "Stabilize callbacks with useCallback when passed to memoized children" },
        { id: "r-usememo", label: "useMemo only for genuinely expensive computations" },
        { id: "r-effect", label: "No fetch calls inside useEffect without cleanup / AbortController" },
        { id: "r-suspense", label: "Wrap async boundaries with Suspense + meaningful fallback" },
        { id: "r-error", label: "ErrorBoundary around feature trees" },
        { id: "r-a11y", label: "Interactive elements are buttons/links with ARIA labels" },
        { id: "r-devtools", label: "React DevTools profiler used to identify slow renders" },
        { id: "r-strict", label: "StrictMode enabled in development" },
      ],
    },
    {
      id: "angular",
      label: "Angular",
      color: "border-primary/40 bg-primary/10 text-primary",
      accent: "border-primary/30",
      tags: ["angular"],
      concepts: [
        {
          title: "Component Architecture",
          body: "Angular components are the building blocks of the UI. Each component has a template, styles, and a class with lifecycle hooks. Use @Input/@Output for parent-child communication.",
        },
        {
          title: "Dependency Injection (DI)",
          body: "Angular's hierarchical DI system creates injectors at module, component, and directive levels. Use providedIn: 'root' for app-wide singletons, component-level providers for scoped instances.",
        },
        {
          title: "Change Detection",
          body: "Default strategy checks all components on every async event. OnPush limits checks to when @Input references change or events fire inside the component — critical for performance at scale.",
        },
        {
          title: "Signals (Angular 16+)",
          body: "Signals are reactive primitives that trigger surgical change detection without zones. Use signal(), computed(), and effect() for fine-grained reactivity without RxJS overhead.",
        },
        {
          title: "RxJS & Observables",
          body: "Angular uses RxJS for async data streams (HTTP, forms, router). Key operators: switchMap, mergeMap, takeUntilDestroyed. Always unsubscribe to prevent memory leaks.",
        },
        {
          title: "Modules & Standalone Components",
          body: "NgModules group related components/directives/pipes. Standalone components (Angular 15+) skip NgModule declarations — the recommended approach for new Angular apps.",
        },
      ],
      resources: [
        {
          label: "Angular Official Docs",
          url: "https://angular.dev",
          desc: "Official Angular documentation with interactive tutorials.",
        },
        {
          label: "Angular University Blog",
          url: "https://blog.angular-university.io",
          desc: "In-depth articles on Signals, RxJS, and Angular patterns.",
        },
        {
          label: "RxJS Docs",
          url: "https://rxjs.dev",
          desc: "Full RxJS operator reference — essential for Angular async.",
        },
        {
          label: "Angular Style Guide",
          url: "https://angular.dev/style-guide",
          desc: "Official naming conventions, folder structure, and best practices.",
        },
      ],
      checklist: [
        { id: "a-onpush", label: "Use OnPush change detection on all non-root components" },
        { id: "a-signals", label: "Prefer Signals over manual RxJS for local component state" },
        { id: "a-track", label: "Use trackBy / @for track in all *ngFor / @for loops" },
        { id: "a-takeuntil", label: "Unsubscribe observables with takeUntilDestroyed or async pipe" },
        { id: "a-standalone", label: "New components use standalone: true (skip NgModules)" },
        { id: "a-lazy", label: "Lazy load feature routes with loadComponent / loadChildren" },
        { id: "a-guards", label: "Route guards for authentication and authorization" },
        { id: "a-resolvers", label: "Resolve critical data before route activation" },
        { id: "a-httperror", label: "Global HTTP error interceptor for auth and error handling" },
        { id: "a-reactive", label: "Use Reactive Forms (not template-driven) for complex forms" },
      ],
    },
    {
      id: "vue",
      label: "Vue.js",
      color: "border-primary/40 bg-primary/10 text-primary",
      accent: "border-primary/30",
      tags: ["vue"],
    },
    {
      id: "svelte",
      label: "Svelte",
      color: "border-primary/40 bg-primary/10 text-primary",
      accent: "border-primary/30",
      tags: ["svelte"],
    },
    {
      id: "nextjs",
      label: "Next.js",
      color: "border-primary/40 bg-primary/10 text-primary",
      accent: "border-primary/30",
      tags: ["nextjs"],
      concepts: [
        {
          title: "App Router vs Pages Router",
          body: "App Router (/app directory, Next.js 13+): React Server Components by default, co-located layouts/loading/error, Server Actions. Pages Router (/pages): legacy model, all client-side. Use App Router for all new projects.",
        },
        {
          title: "React Server Components (RSC)",
          body: "Server Components render exclusively on the server — no JS bundle shipped. They can query databases and call APIs directly. Add 'use client' directive only when hooks or browser APIs are needed.",
        },
        {
          title: "Data Fetching Strategies",
          body: "SSR: fetch per request (no-store). SSG: fetch at build time (force-cache). ISR: static with revalidation interval. On-demand revalidation via revalidatePath() or revalidateTag().",
        },
        {
          title: "Server Actions",
          body: "Async functions marked 'use server' that run on the server, callable from Client Components. Replace API routes for form mutations and simple writes. Support progressive enhancement.",
        },
        {
          title: "Caching Model",
          body: "Next.js has multiple cache layers: Request Memoization (per render), Data Cache (persistent across requests), Full Route Cache (static HTML/RSC payload), Router Cache (client-side).",
        },
        {
          title: "Middleware",
          body: "Runs on the Edge before requests hit pages. Use for auth redirects, A/B testing, geolocation, and custom headers. Matches routes via matcher config in next.config.",
        },
      ],
      resources: [
        {
          label: "Next.js Docs",
          url: "https://nextjs.org/docs",
          desc: "Official documentation with full App Router guide.",
        },
        {
          label: "Next.js Learn",
          url: "https://nextjs.org/learn",
          desc: "Official interactive course — dashboard app from scratch.",
        },
        {
          label: "Vercel Blog",
          url: "https://vercel.com/blog",
          desc: "Deep dives on caching, RSC, and Next.js internals.",
        },
        {
          label: "Next.js Examples",
          url: "https://github.com/vercel/next.js/tree/canary/examples",
          desc: "Official example repos for auth, i18n, databases, and more.",
        },
      ],
      checklist: [
        { id: "n-rsc", label: "Default to Server Components; add 'use client' only where needed" },
        { id: "n-cache", label: "Set explicit fetch cache behavior (no-store vs force-cache)" },
        { id: "n-revalidate", label: "ISR pages use revalidate for time-based invalidation" },
        { id: "n-actions", label: "Server Actions used for mutations (no API route boilerplate)" },
        { id: "n-suspense", label: "Streaming with Suspense boundaries for slow data" },
        { id: "n-meta", label: "generateMetadata() function per page for SEO" },
        { id: "n-image", label: "All images use next/image (lazy load, responsive, WebP)" },
        { id: "n-link", label: "Navigation uses next/link (prefetching enabled)" },
        { id: "n-env", label: "Sensitive secrets in NEXT_PUBLIC_ only when intentional" },
        { id: "n-middleware", label: "Auth checks in middleware — not duplicated in every layout" },
      ],
    },
  ],
};
