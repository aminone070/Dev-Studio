import type { SkillAreaData } from "../../types/skills";
import { Server } from "lucide-react";

export const backendArea: SkillAreaData = {
  id: "backend",
  label: "Backend",
  icon: Server,
  description: "APIs, databases, authentication, and scalable architecture — choose your stack.",
  concepts: [],
  resources: [],
  checklist: [
    { id: "auth", label: "Authentication & authorization (JWT/session, RBAC)" },
    { id: "valid", label: "Input validation & sanitization on every endpoint" },
    { id: "sql", label: "Parameterized queries — no string concatenation" },
    { id: "rate", label: "Rate limiting on auth and sensitive endpoints" },
    { id: "https", label: "HTTPS enforced; security headers set" },
    { id: "logs", label: "Structured logging with correlation IDs" },
    { id: "health", label: "Health check endpoint configured" },
    { id: "migrations", label: "DB migrations versioned and reversible" },
    { id: "secrets", label: "Secrets in env vars / vault — never hardcoded" },
    { id: "timeout", label: "Request timeouts & circuit breakers on external calls" },
  ],
  subAreas: [
    {
      id: "node",
      label: "Node.js",
      color: "border-primary/40 bg-primary/10 text-primary",
      accent: "border-primary/30",
      tags: ["nodejs", "node", "express"],
      concepts: [
        {
          title: "Event Loop & Non-Blocking I/O",
          body: "Node.js is single-threaded but handles concurrency via the event loop. I/O operations (DB queries, HTTP calls) are offloaded to libuv. Never block the event loop with CPU-heavy synchronous code.",
        },
        {
          title: "Express Middleware Chain",
          body: "Middleware functions have access to (req, res, next). They execute in order — authentication, validation, business logic, error handling. Error middleware takes four args (err, req, res, next) and must be registered last.",
        },
        {
          title: "Async/Await & Error Handling",
          body: "Always await async operations and wrap in try/catch, or use an async wrapper that calls next(err). Unhandled Promise rejections will crash the process in Node.js 15+.",
        },
        {
          title: "Streams",
          body: "Node.js streams process data in chunks — essential for large files and real-time data. Readable, Writable, Transform, and Duplex streams. Use pipe() or pipeline() to chain them safely.",
        },
        {
          title: "Cluster & Worker Threads",
          body: "Node runs on a single CPU core by default. Cluster module forks worker processes to use all cores. Worker Threads handle CPU-intensive tasks without blocking the event loop.",
        },
        {
          title: "Module System (CommonJS vs ESM)",
          body: "CommonJS (require/module.exports) is the Node legacy. ESM (import/export) is the standard. Use 'type': 'module' in package.json for ESM. Mixing requires careful .cjs/.mjs extensions.",
        },
      ],
      resources: [
        {
          label: "Node.js Docs",
          url: "https://nodejs.org/en/docs",
          desc: "Official Node.js API documentation and guides.",
        },
        {
          label: "Express.js Guide",
          url: "https://expressjs.com/en/guide/routing.html",
          desc: "Official Express routing, middleware, and error handling guide.",
        },
        {
          label: "Node Best Practices",
          url: "https://github.com/goldbergyoni/nodebestpractices",
          desc: "Comprehensive Node.js production best practices repository.",
        },
        {
          label: "Fastify Docs",
          url: "https://fastify.dev/docs/latest",
          desc: "High-performance Node.js framework — alternative to Express.",
        },
      ],
      checklist: [
        { id: "nd-helmet", label: "helmet() middleware for security headers" },
        { id: "nd-cors", label: "CORS configured with explicit allowed origins" },
        { id: "nd-ratelimit", label: "Rate limiting on /auth and public endpoints" },
        { id: "nd-validate", label: "Body validation with Zod/Joi before business logic" },
        { id: "nd-errors", label: "Centralized error handler (err, req, res, next)" },
        { id: "nd-async", label: "All async route handlers wrapped in try/catch or asyncWrapper" },
        { id: "nd-env", label: "dotenv loaded at app entry; secrets never in code" },
        { id: "nd-logs", label: "Structured logging with pino/winston + request IDs" },
        { id: "nd-pool", label: "Database connection pooling (not new connection per request)" },
        { id: "nd-graceful", label: "Graceful shutdown: drain connections on SIGTERM" },
      ],
    },
    {
      id: "aspnet",
      label: "ASP.NET Core",
      color: "border-primary/40 bg-primary/10 text-primary",
      accent: "border-primary/30",
      tags: ["aspnet", "dotnet", "csharp"],
      concepts: [
        {
          title: "Middleware Pipeline",
          body: "ASP.NET Core processes requests through an ordered middleware pipeline configured in Program.cs. Order matters — authentication before authorization, routing before endpoints. Use Use/Run/Map to compose the pipeline.",
        },
        {
          title: "Dependency Injection (Built-in)",
          body: "ASP.NET Core has a built-in IoC container. Register services as Transient (new per request), Scoped (once per HTTP request), or Singleton (once per app lifetime). Inject via constructor parameters.",
        },
        {
          title: "Minimal APIs vs Controllers",
          body: "Minimal APIs (.NET 6+): map routes as lambda functions directly in Program.cs — great for microservices. Controllers: class-based approach with [ApiController], better for larger APIs with more structure.",
        },
        {
          title: "Entity Framework Core",
          body: "EF Core is the recommended ORM. DbContext manages the connection and tracks entities. Use migrations for schema changes. Avoid N+1 queries with Include()/ThenInclude() eager loading.",
        },
        {
          title: "Authentication & Authorization",
          body: "ASP.NET Core uses scheme-based authentication (JWT Bearer, Cookie, OAuth). [Authorize] attribute protects endpoints. Policy-based authorization decouples complex rules from controllers.",
        },
        {
          title: "Async All the Way Down",
          body: "ASP.NET Core is fully async-capable. Use async/await for all I/O-bound work. Never use .Result or .Wait() on async operations — this causes deadlocks. Use ConfigureAwait(false) in libraries.",
        },
      ],
      resources: [
        {
          label: "ASP.NET Core Docs",
          url: "https://learn.microsoft.com/en-us/aspnet/core",
          desc: "Official Microsoft documentation for ASP.NET Core.",
        },
        {
          label: "EF Core Docs",
          url: "https://learn.microsoft.com/en-us/ef/core",
          desc: "Entity Framework Core — official documentation.",
        },
        {
          label: ".NET Architecture Guides",
          url: "https://dotnet.microsoft.com/en-us/learn/dotnet/architecture-guides",
          desc: "Free e-books on microservices, DDD, and clean architecture with .NET.",
        },
        {
          label: "Andrew Lock's Blog",
          url: "https://andrewlock.net",
          desc: "Deep technical posts on ASP.NET Core internals and patterns.",
        },
      ],
      checklist: [
        { id: "as-https", label: "UseHttpsRedirection() and HSTS configured" },
        { id: "as-auth", label: "JWT Bearer or Cookie auth scheme configured correctly" },
        { id: "as-policy", label: "Authorization policies defined — no magic strings in [Authorize]" },
        { id: "as-validate", label: "Model validation with Data Annotations or FluentValidation" },
        { id: "as-ef", label: "EF Core queries use async methods (ToListAsync, FirstOrDefaultAsync)" },
        { id: "as-migrate", label: "EF Core migrations checked in and applied on startup (dev only)" },
        { id: "as-config", label: "Secrets in User Secrets (dev) / Azure Key Vault (prod)" },
        { id: "as-health", label: "MapHealthChecks() endpoint for liveness probes" },
        { id: "as-cors", label: "CORS policy explicitly configured — no AllowAnyOrigin in prod" },
        { id: "as-problem", label: "Returns RFC 7807 ProblemDetails for errors (UseExceptionHandler)" },
      ],
    },
    {
      id: "php",
      label: "PHP",
      color: "border-primary/40 bg-primary/10 text-primary",
      accent: "border-primary/30",
      tags: ["php", "laravel"],
      concepts: [
        {
          title: "PHP Execution Model",
          body: "PHP is traditionally synchronous and share-nothing — each request starts a fresh process/thread. No in-memory state between requests by default. Persistent connections require FPM tuning or tools like Swoole/RoadRunner.",
        },
        {
          title: "Laravel's Service Container",
          body: "Laravel's IoC container automatically resolves class dependencies via type-hinting. Bind interfaces to implementations in AppServiceProvider. Use singleton() for shared instances, bind() for fresh instances per resolve.",
        },
        {
          title: "Eloquent ORM",
          body: "Eloquent maps database tables to Model classes. Relationships are defined as methods (hasMany, belongsTo, belongsToMany). Use eager loading (with()) to avoid N+1 queries.",
        },
        {
          title: "Artisan CLI & Migrations",
          body: "Artisan is Laravel's command-line tool for generating code, running migrations, managing queues. Migrations version-control your database schema — always prefer migrations over manual SQL changes.",
        },
        {
          title: "Queues & Jobs",
          body: "Laravel queues defer time-consuming tasks (emails, notifications, API calls) to background workers. Drivers: database, Redis, SQS. Use Horizon to monitor Redis queues in production.",
        },
        {
          title: "PHP 8+ Features",
          body: "Modern PHP includes: named arguments, match expressions, enums, fibers (coroutines), readonly properties, union types, nullsafe operator (?->). Use strict_types=1 for type safety.",
        },
      ],
      resources: [
        {
          label: "PHP Official Docs",
          url: "https://www.php.net/docs.php",
          desc: "Official PHP language reference and function documentation.",
        },
        {
          label: "Laravel Docs",
          url: "https://laravel.com/docs",
          desc: "Official Laravel documentation — the leading PHP framework.",
        },
        {
          label: "PHP: The Right Way",
          url: "https://phptherightway.com",
          desc: "Best practices, coding standards, and modern PHP patterns.",
        },
        {
          label: "Laracasts",
          url: "https://laracasts.com",
          desc: "Video tutorials on Laravel, Vue, and modern PHP development.",
        },
      ],
      checklist: [
        { id: "ph-version", label: "PHP 8.2+ with strict_types=1 in all files" },
        { id: "ph-composer", label: "Dependencies managed via Composer; composer.lock committed" },
        { id: "ph-env", label: "Secrets in .env (never committed); .env.example committed" },
        { id: "ph-prepared", label: "All DB queries use prepared statements or Eloquent ORM" },
        { id: "ph-xss", label: "User output escaped with htmlspecialchars() or Blade {{ }}" },
        { id: "ph-csrf", label: "CSRF token on all state-changing forms (@csrf in Blade)" },
        { id: "ph-validate", label: "Request validation before processing (Form Requests in Laravel)" },
        { id: "ph-queues", label: "Long-running tasks dispatched to queue (not in request cycle)" },
        { id: "ph-cache", label: "Route and config cached in production (php artisan optimize)" },
        { id: "ph-logs", label: "Structured logging via Monolog (Laravel Log facade)" },
      ],
    },
    {
      id: "python",
      label: "Python/FastAPI",
      color: "border-primary/40 bg-primary/10 text-primary",
      accent: "border-primary/30",
      tags: ["python", "fastapi"],
    },
    {
      id: "go",
      label: "Go",
      color: "border-primary/40 bg-primary/10 text-primary",
      accent: "border-primary/30",
      tags: ["go"],
    },
  ],
};
