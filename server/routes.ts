import type { Express, Request, Response } from "express";
import { db } from "./db.js";
import {
  prompts, agents, components, templates, snippets,
  connectors, socialDrafts, mailTemplates, interviewQuestions, userProgress, userProfiles,
  savedJobs, freelanceOffers, myServices
} from "../shared/schema.js";
import { eq, and, or } from "drizzle-orm";

function getUserId(req: Request): string | null {
  const id = req.headers["x-replit-user-id"];
  return id ? String(id) : null;
}

function requireUser(req: Request, res: Response): string | null {
  const id = getUserId(req);
  if (!id) { res.status(401).json({ error: "Not authenticated" }); return null; }
  return id;
}

function stripDates(data: Record<string, unknown>): Record<string, unknown> {
  const { createdAt, updatedAt, created_at, updated_at, ...rest } = data;
  void createdAt; void updatedAt; void created_at; void updated_at;
  return rest;
}

/** Only accept proper UUID v4 strings — rejects prefixed IDs like soc_xxx */
function isUUID(id: unknown): id is string {
  return (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

// ─── Job Scraper Helpers ────────────────────────────────────────────────────

function extractXmlField(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`));
  return m?.[1]?.trim() ?? "";
}

async function scrapeIndeedRSS(query: string, location: string, days: number): Promise<any[]> {
  const url = `https://www.indeed.com/rss?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&sort=date&fromage=${days}`;
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)", "Accept": "text/xml,application/xml" },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Indeed ${r.status}`);
  const xml = await r.text();
  const jobs: any[] = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const title = extractXmlField(block, "title").replace(/ - [^-]+$/, "").trim();
    const link  = extractXmlField(block, "link");
    const company = extractXmlField(block, "source");
    const pubDate = extractXmlField(block, "pubDate");
    const guid  = extractXmlField(block, "guid") || link;
    const desc  = extractXmlField(block, "description");
    const locM  = desc.replace(/<[^>]+>/g, " ").match(/([A-Za-z ]+,\s*[A-Z]{2}(?:\s+\d{5})?)/);
    if (title && link) {
      jobs.push({
        id: `indeed_${Buffer.from(guid).toString("base64").replace(/\W/g, "").slice(0, 20)}`,
        title, company, source: "indeed",
        location: locM?.[1]?.trim() || location || "Not specified",
        url: link,
        postedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        tags: [],
      });
    }
  }
  return jobs;
}

async function scrapeWuzzuf(query: string, location: string, days: number): Promise<any[]> {
  const locParam = location ? `&filters[city][]=${encodeURIComponent(location)}` : "";
  const url = `https://wuzzuf.net/search/jobs/?q=${encodeURIComponent(query)}${locParam}&a=hpb`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`Wuzzuf ${r.status}`);
  const html = await r.text();
  const nd = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!nd) throw new Error("Wuzzuf: no __NEXT_DATA__");
  const data = JSON.parse(nd[1]);
  const raw: any[] = data?.props?.pageProps?.jobs ?? [];
  const cutoff = Date.now() - days * 86400000;
  return raw
    .filter((j: any) => !j.created_at || new Date(j.created_at).getTime() >= cutoff)
    .slice(0, 20)
    .map((j: any) => ({
      id: `wuzzuf_${j.id ?? j.slug}`,
      title: j.title ?? "",
      company: j.company?.name ?? "",
      location: [j.city?.name, j.country?.name].filter(Boolean).join(", ") || "Egypt",
      url: `https://wuzzuf.net/jobs/p/${j.slug ?? j.id}`,
      source: "wuzzuf",
      postedAt: j.created_at ?? new Date().toISOString(),
      tags: (j.required_skills ?? []).map((s: any) => s.name ?? s),
    }));
}

async function scrapeBayt(query: string, location: string, days: number): Promise<any[]> {
  const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const url = `https://www.bayt.com/en/international/jobs/${slug}-jobs/`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`Bayt ${r.status}`);
  const html = await r.text();
  const jobs: any[] = [];
  const ldRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m: RegExpExecArray | null;
  const cutoff = Date.now() - days * 86400000;
  while ((m = ldRe.exec(html)) !== null && jobs.length < 20) {
    try {
      const obj = JSON.parse(m[1]);
      if (obj["@type"] === "JobPosting" && obj.title) {
        const posted = obj.datePosted ? new Date(obj.datePosted).getTime() : Date.now();
        if (posted >= cutoff) {
          jobs.push({
            id: `bayt_${Buffer.from(obj.url ?? obj.title).toString("base64").replace(/\W/g, "").slice(0, 16)}`,
            title: obj.title,
            company: obj.hiringOrganization?.name ?? "",
            location: [
              obj.jobLocation?.address?.addressLocality,
              obj.jobLocation?.address?.addressCountry,
            ].filter(Boolean).join(", ") || location || "Middle East",
            url: obj.url ?? url,
            source: "bayt",
            postedAt: obj.datePosted ?? new Date().toISOString(),
            tags: [],
          });
        }
      }
    } catch {}
  }
  return jobs;
}

async function scrapeRemoteOKTagged(query: string): Promise<any[]> {
  const words = query.toLowerCase().split(/\s+/);
  const skip = new Set(["developer", "engineer", "senior", "junior", "full", "stack", "and", "the"]);
  const tag = words.find((w) => w.length > 3 && !skip.has(w)) ?? words[0];
  const r = await fetch(`https://remoteok.com/api?tag=${encodeURIComponent(tag)}`, {
    headers: { "User-Agent": "Mozilla/5.0 DevStudio/1.0", "Accept": "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`RemoteOK ${r.status}`);
  const data = await r.json() as any[];
  return data.slice(1)
    .filter((j: any) => j.id && j.title)
    .slice(0, 15)
    .map((j: any) => ({
      id: `remoteok_${j.id}`,
      title: j.title ?? "",
      company: j.company ?? "",
      location: j.location || "Remote",
      url: j.url ?? "",
      source: "remoteok",
      postedAt: j.date ?? new Date().toISOString(),
      tags: j.tags ?? [],
      salary: j.salary_min
        ? `$${Number(j.salary_min).toLocaleString()} – $${Number(j.salary_max ?? j.salary_min).toLocaleString()}`
        : "",
      logo: j.company_logo ?? "",
    }));
}

// ────────────────────────────────────────────────────────────────────────────

export function registerRoutes(app: Express) {

  // --- PROMPTS ---
  app.get("/api/prompts", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    res.json(await db.select().from(prompts).where(eq(prompts.userId, uid)));
  });

  app.post("/api/prompts", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const { id, ...raw } = req.body;
    const data = stripDates(raw);
    const safeId = isUUID(id) ? id : undefined;
    const existing = safeId ? await db.select().from(prompts).where(and(eq(prompts.id, safeId), eq(prompts.userId, uid))) : [];
    if (existing.length > 0) {
      const [r] = await db.update(prompts).set({ ...data, updatedAt: new Date() }).where(eq(prompts.id, safeId!)).returning();
      res.json(r);
    } else {
      const [r] = await db.insert(prompts).values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any).returning();
      res.json(r);
    }
  });

  app.post("/api/prompts/bulk", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const items = req.body as any[];
    if (!items.length) { res.json([]); return; }
    const values = items.map(({ id, ...raw }) => {
      const data = stripDates(raw);
      const safeId = isUUID(id) ? id : undefined;
      return { ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any;
    });
    const result = await db.insert(prompts).values(values).onConflictDoNothing().returning();
    res.json(result);
  });

  app.delete("/api/prompts/:id", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    if (!isUUID(req.params.id)) { res.json({ ok: true }); return; }
    await db.delete(prompts).where(and(eq(prompts.id, req.params.id), eq(prompts.userId, uid)));
    res.json({ ok: true });
  });

  // --- AGENTS ---
  app.get("/api/agents", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    res.json(await db.select().from(agents).where(eq(agents.userId, uid)));
  });

  app.post("/api/agents", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const { id, ...raw } = req.body;
    const data = stripDates(raw);
    const safeId = isUUID(id) ? id : undefined;
    const existing = safeId ? await db.select().from(agents).where(and(eq(agents.id, safeId), eq(agents.userId, uid))) : [];
    if (existing.length > 0) {
      const [r] = await db.update(agents).set({ ...data, updatedAt: new Date() }).where(eq(agents.id, safeId!)).returning();
      res.json(r);
    } else {
      const [r] = await db.insert(agents).values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any).returning();
      res.json(r);
    }
  });

  app.post("/api/agents/bulk", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const items = req.body as any[];
    if (!items.length) { res.json([]); return; }
    const values = items.map(({ id, ...raw }) => {
      const data = stripDates(raw);
      const safeId = isUUID(id) ? id : undefined;
      return { ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any;
    });
    const result = await db.insert(agents).values(values).onConflictDoNothing().returning();
    res.json(result);
  });

  app.delete("/api/agents/:id", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    if (!isUUID(req.params.id)) { res.json({ ok: true }); return; }
    await db.delete(agents).where(and(eq(agents.id, req.params.id), eq(agents.userId, uid)));
    res.json({ ok: true });
  });

  // --- COMPONENTS ---
  app.get("/api/components", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    res.json(await db.select().from(components).where(eq(components.userId, uid)));
  });

  app.post("/api/components", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const { id, ...raw } = req.body;
    const data = stripDates(raw);
    const safeId = isUUID(id) ? id : undefined;
    const existing = safeId ? await db.select().from(components).where(and(eq(components.id, safeId), eq(components.userId, uid))) : [];
    if (existing.length > 0) {
      const [r] = await db.update(components).set({ ...data, updatedAt: new Date() }).where(eq(components.id, safeId!)).returning();
      res.json(r);
    } else {
      const [r] = await db.insert(components).values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any).returning();
      res.json(r);
    }
  });

  app.post("/api/components/bulk", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const items = req.body as any[];
    if (!items.length) { res.json([]); return; }
    const values = items.map(({ id, ...raw }) => {
      const data = stripDates(raw);
      const safeId = isUUID(id) ? id : undefined;
      return { ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any;
    });
    const result = await db.insert(components).values(values).onConflictDoNothing().returning();
    res.json(result);
  });

  app.delete("/api/components/:id", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    if (!isUUID(req.params.id)) { res.json({ ok: true }); return; }
    await db.delete(components).where(and(eq(components.id, req.params.id), eq(components.userId, uid)));
    res.json({ ok: true });
  });

  // --- TEMPLATES ---
  app.get("/api/templates", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    res.json(await db.select().from(templates).where(eq(templates.userId, uid)));
  });

  app.post("/api/templates", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const { id, ...raw } = req.body;
    const data = stripDates(raw);
    const safeId = isUUID(id) ? id : undefined;
    const existing = safeId ? await db.select().from(templates).where(and(eq(templates.id, safeId), eq(templates.userId, uid))) : [];
    if (existing.length > 0) {
      const [r] = await db.update(templates).set({ ...data, updatedAt: new Date() }).where(eq(templates.id, safeId!)).returning();
      res.json(r);
    } else {
      const [r] = await db.insert(templates).values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any).returning();
      res.json(r);
    }
  });

  app.post("/api/templates/bulk", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const items = req.body as any[];
    if (!items.length) { res.json([]); return; }
    const values = items.map(({ id, ...raw }) => {
      const data = stripDates(raw);
      const safeId = isUUID(id) ? id : undefined;
      return { ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any;
    });
    const result = await db.insert(templates).values(values).onConflictDoNothing().returning();
    res.json(result);
  });

  app.delete("/api/templates/:id", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    if (!isUUID(req.params.id)) { res.json({ ok: true }); return; }
    await db.delete(templates).where(and(eq(templates.id, req.params.id), eq(templates.userId, uid)));
    res.json({ ok: true });
  });

  // --- SNIPPETS ---
  app.get("/api/snippets", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    res.json(await db.select().from(snippets).where(eq(snippets.userId, uid)));
  });

  app.post("/api/snippets", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const { id, ...raw } = req.body;
    const data = stripDates(raw);
    const safeId = isUUID(id) ? id : undefined;
    const existing = safeId ? await db.select().from(snippets).where(and(eq(snippets.id, safeId), eq(snippets.userId, uid))) : [];
    if (existing.length > 0) {
      const [r] = await db.update(snippets).set({ ...data, updatedAt: new Date() }).where(eq(snippets.id, safeId!)).returning();
      res.json(r);
    } else {
      const [r] = await db.insert(snippets).values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any).returning();
      res.json(r);
    }
  });

  app.post("/api/snippets/bulk", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const items = req.body as any[];
    if (!items.length) { res.json([]); return; }
    const values = items.map(({ id, ...raw }) => {
      const data = stripDates(raw);
      const safeId = isUUID(id) ? id : undefined;
      return { ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any;
    });
    const result = await db.insert(snippets).values(values).onConflictDoNothing().returning();
    res.json(result);
  });

  app.delete("/api/snippets/:id", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    if (!isUUID(req.params.id)) { res.json({ ok: true }); return; }
    await db.delete(snippets).where(and(eq(snippets.id, req.params.id), eq(snippets.userId, uid)));
    res.json({ ok: true });
  });

  // --- CONNECTORS ---
  app.get("/api/connectors", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    res.json(await db.select().from(connectors).where(eq(connectors.userId, uid)));
  });

  app.post("/api/connectors", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const { id, ...raw } = req.body;
    const data = stripDates(raw);
    const safeId = isUUID(id) ? id : undefined;
    const existing = safeId ? await db.select().from(connectors).where(and(eq(connectors.id, safeId), eq(connectors.userId, uid))) : [];
    if (existing.length > 0) {
      const [r] = await db.update(connectors).set({ ...data, updatedAt: new Date() }).where(eq(connectors.id, safeId!)).returning();
      res.json(r);
    } else {
      const [r] = await db.insert(connectors).values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any).returning();
      res.json(r);
    }
  });

  app.post("/api/connectors/bulk", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const items = req.body as any[];
    if (!items.length) { res.json([]); return; }
    const values = items.map(({ id, ...raw }) => {
      const data = stripDates(raw);
      const safeId = isUUID(id) ? id : undefined;
      return { ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any;
    });
    const result = await db.insert(connectors).values(values).onConflictDoNothing().returning();
    res.json(result);
  });

  app.delete("/api/connectors/:id", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    if (!isUUID(req.params.id)) { res.json({ ok: true }); return; }
    await db.delete(connectors).where(and(eq(connectors.id, req.params.id), eq(connectors.userId, uid)));
    res.json({ ok: true });
  });

  // --- SOCIAL DRAFTS ---
  app.get("/api/social-drafts", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    res.json(await db.select().from(socialDrafts).where(eq(socialDrafts.userId, uid)));
  });

  app.post("/api/social-drafts", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const { id, ...raw } = req.body;
    const data = stripDates(raw);
    const safeId = isUUID(id) ? id : undefined;
    const existing = safeId ? await db.select().from(socialDrafts).where(and(eq(socialDrafts.id, safeId), eq(socialDrafts.userId, uid))) : [];
    if (existing.length > 0) {
      const [r] = await db.update(socialDrafts).set({ ...data, updatedAt: new Date() }).where(eq(socialDrafts.id, safeId!)).returning();
      res.json(r);
    } else {
      const [r] = await db.insert(socialDrafts).values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any).returning();
      res.json(r);
    }
  });

  app.post("/api/social-drafts/bulk", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const items = req.body as any[];
    if (!items.length) { res.json([]); return; }
    const values = items.map(({ id, ...raw }) => {
      const data = stripDates(raw);
      const safeId = isUUID(id) ? id : undefined;
      return { ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any;
    });
    const result = await db.insert(socialDrafts).values(values).onConflictDoNothing().returning();
    res.json(result);
  });

  app.delete("/api/social-drafts/:id", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    if (!isUUID(req.params.id)) { res.json({ ok: true }); return; }
    await db.delete(socialDrafts).where(and(eq(socialDrafts.id, req.params.id), eq(socialDrafts.userId, uid)));
    res.json({ ok: true });
  });

  // --- MAIL TEMPLATES ---
  app.get("/api/mail-templates", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    res.json(await db.select().from(mailTemplates).where(eq(mailTemplates.userId, uid)));
  });

  app.post("/api/mail-templates", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const { id, ...raw } = req.body;
    const data = stripDates(raw);
    const safeId = isUUID(id) ? id : undefined;
    const existing = safeId ? await db.select().from(mailTemplates).where(and(eq(mailTemplates.id, safeId), eq(mailTemplates.userId, uid))) : [];
    if (existing.length > 0) {
      const [r] = await db.update(mailTemplates).set({ ...data, updatedAt: new Date() }).where(eq(mailTemplates.id, safeId!)).returning();
      res.json(r);
    } else {
      const [r] = await db.insert(mailTemplates).values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any).returning();
      res.json(r);
    }
  });

  app.post("/api/mail-templates/bulk", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const items = req.body as any[];
    if (!items.length) { res.json([]); return; }
    const values = items.map(({ id, ...raw }) => {
      const data = stripDates(raw);
      const safeId = isUUID(id) ? id : undefined;
      return { ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any;
    });
    const result = await db.insert(mailTemplates).values(values).onConflictDoNothing().returning();
    res.json(result);
  });

  app.delete("/api/mail-templates/:id", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    if (!isUUID(req.params.id)) { res.json({ ok: true }); return; }
    await db.delete(mailTemplates).where(and(eq(mailTemplates.id, req.params.id), eq(mailTemplates.userId, uid)));
    res.json({ ok: true });
  });

  // --- INTERVIEW QUESTIONS ---
  app.get("/api/interview-questions", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    res.json(await db.select().from(interviewQuestions).where(
      or(eq(interviewQuestions.isGlobal, true), eq(interviewQuestions.userId, uid))
    ));
  });

  app.post("/api/interview-questions", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const { id, ...raw } = req.body;
    const data = stripDates(raw);
    const safeId = isUUID(id) ? id : undefined;
    const existing = safeId ? await db.select().from(interviewQuestions).where(eq(interviewQuestions.id, safeId)) : [];
    if (existing.length > 0 && existing[0].userId === uid) {
      const [r] = await db.update(interviewQuestions).set(data).where(eq(interviewQuestions.id, safeId!)).returning();
      res.json(r);
    } else {
      const [r] = await db.insert(interviewQuestions).values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any).returning();
      res.json(r);
    }
  });

  app.post("/api/interview-questions/bulk", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const items = req.body as any[];
    if (!items.length) { res.json([]); return; }
    const values = items.map(({ id, ...raw }) => {
      const data = stripDates(raw);
      const safeId = isUUID(id) ? id : undefined;
      return { ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any;
    });
    const result = await db.insert(interviewQuestions).values(values).onConflictDoNothing().returning();
    res.json(result);
  });

  app.delete("/api/interview-questions/:id", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    if (!isUUID(req.params.id)) { res.json({ ok: true }); return; }
    await db.delete(interviewQuestions).where(and(eq(interviewQuestions.id, req.params.id), eq(interviewQuestions.userId, uid)));
    res.json({ ok: true });
  });

  // --- USER PROGRESS ---
  app.get("/api/progress", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    res.json(await db.select().from(userProgress).where(eq(userProgress.userId, uid)));
  });

  app.post("/api/progress/toggle", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const { itemId, areaId, completed } = req.body;
    const existing = await db.select().from(userProgress).where(
      and(eq(userProgress.userId, uid), eq(userProgress.itemId, itemId))
    );
    if (existing.length > 0) {
      const [r] = await db.update(userProgress).set({ completed, updatedAt: new Date() })
        .where(and(eq(userProgress.userId, uid), eq(userProgress.itemId, itemId))).returning();
      res.json(r);
    } else {
      const [r] = await db.insert(userProgress).values({ userId: uid, itemId, areaId, completed }).returning();
      res.json(r);
    }
  });

  // --- SAVED JOBS ---
  app.get("/api/jobs/saved", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    res.json(await db.select().from(savedJobs).where(eq(savedJobs.userId, uid)));
  });

  app.post("/api/jobs/saved", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const { id, ...raw } = req.body;
    const data = stripDates(raw);
    const safeId = isUUID(id) ? id : undefined;
    if (safeId) {
      const existing = await db.select().from(savedJobs).where(and(eq(savedJobs.id, safeId), eq(savedJobs.userId, uid)));
      if (existing.length > 0) {
        const [r] = await db.update(savedJobs).set({ ...data, updatedAt: new Date() }).where(eq(savedJobs.id, safeId)).returning();
        res.json(r); return;
      }
    }
    const [r] = await db.insert(savedJobs).values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any).returning();
    res.json(r);
  });

  app.delete("/api/jobs/saved/:id", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    if (!isUUID(req.params.id)) { res.json({ ok: true }); return; }
    await db.delete(savedJobs).where(and(eq(savedJobs.id, req.params.id), eq(savedJobs.userId, uid)));
    res.json({ ok: true });
  });

  app.get("/api/jobs/remote", async (req, res) => {
    try {
      const tag = req.query.tag ? `?tag=${encodeURIComponent(String(req.query.tag))}` : "";
      const r = await fetch(`https://remoteok.com/api${tag}`, {
        headers: { "User-Agent": "Mozilla/5.0 DevStudio/1.0", "Accept": "application/json" },
      });
      if (!r.ok) throw new Error(`RemoteOK ${r.status}`);
      const data = await r.json() as any[];
      res.json(data.slice(1).filter((j: any) => j.id && j.title).slice(0, 30));
    } catch {
      res.status(502).json({ error: "Failed to fetch remote jobs" });
    }
  });

  app.get("/api/jobs/scrape", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const query   = String(req.query.q || "full stack developer");
    const location = String(req.query.location || "");
    const days    = Math.max(1, Math.min(Number(req.query.days || 1), 30));
    const sources = String(req.query.sources || "indeed,wuzzuf,bayt,remoteok")
      .split(",").map((s) => s.trim()).filter(Boolean);

    const results: any[] = [];
    const errors: string[] = [];
    const tasks: Promise<void>[] = [];

    if (sources.includes("indeed"))
      tasks.push(scrapeIndeedRSS(query, location, days).then((j) => results.push(...j)).catch(() => errors.push("indeed")));
    if (sources.includes("wuzzuf"))
      tasks.push(scrapeWuzzuf(query, location, days).then((j) => results.push(...j)).catch(() => errors.push("wuzzuf")));
    if (sources.includes("bayt"))
      tasks.push(scrapeBayt(query, location, days).then((j) => results.push(...j)).catch(() => errors.push("bayt")));
    if (sources.includes("remoteok"))
      tasks.push(scrapeRemoteOKTagged(query).then((j) => results.push(...j)).catch(() => errors.push("remoteok")));

    await Promise.allSettled(tasks);
    results.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    res.json({ jobs: results.slice(0, 60), errors });
  });

  // --- FREELANCE OFFERS ---
  app.get("/api/jobs/offers", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    res.json(await db.select().from(freelanceOffers).where(eq(freelanceOffers.userId, uid)));
  });

  app.post("/api/jobs/offers", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const { id, ...raw } = req.body;
    const data = stripDates(raw);
    const safeId = isUUID(id) ? id : undefined;
    if (safeId) {
      const existing = await db.select().from(freelanceOffers).where(and(eq(freelanceOffers.id, safeId), eq(freelanceOffers.userId, uid)));
      if (existing.length > 0) {
        const [r] = await db.update(freelanceOffers).set({ ...data, updatedAt: new Date() }).where(eq(freelanceOffers.id, safeId)).returning();
        res.json(r); return;
      }
    }
    const [r] = await db.insert(freelanceOffers).values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any).returning();
    res.json(r);
  });

  app.delete("/api/jobs/offers/:id", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    if (!isUUID(req.params.id)) { res.json({ ok: true }); return; }
    await db.delete(freelanceOffers).where(and(eq(freelanceOffers.id, req.params.id), eq(freelanceOffers.userId, uid)));
    res.json({ ok: true });
  });

  // --- MY SERVICES ---
  app.get("/api/jobs/services", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    res.json(await db.select().from(myServices).where(eq(myServices.userId, uid)));
  });

  app.post("/api/jobs/services", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const { id, ...raw } = req.body;
    const data = stripDates(raw);
    const safeId = isUUID(id) ? id : undefined;
    if (safeId) {
      const existing = await db.select().from(myServices).where(and(eq(myServices.id, safeId), eq(myServices.userId, uid)));
      if (existing.length > 0) {
        const [r] = await db.update(myServices).set({ ...data, updatedAt: new Date() }).where(eq(myServices.id, safeId)).returning();
        res.json(r); return;
      }
    }
    const [r] = await db.insert(myServices).values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any).returning();
    res.json(r);
  });

  app.delete("/api/jobs/services/:id", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    if (!isUUID(req.params.id)) { res.json({ ok: true }); return; }
    await db.delete(myServices).where(and(eq(myServices.id, req.params.id), eq(myServices.userId, uid)));
    res.json({ ok: true });
  });

  // --- USER PROFILE ---
  app.get("/api/profile", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, uid));
    res.json(rows[0] ?? null);
  });

  app.post("/api/profile", async (req, res) => {
    const uid = requireUser(req, res); if (!uid) return;
    const { displayName, avatarUrl, location } = req.body;
    const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, uid));
    if (existing.length > 0) {
      const [r] = await db.update(userProfiles)
        .set({ displayName, avatarUrl, location, updatedAt: new Date() })
        .where(eq(userProfiles.userId, uid))
        .returning();
      res.json(r);
    } else {
      const [r] = await db.insert(userProfiles)
        .values({ userId: uid, displayName, avatarUrl, location })
        .returning();
      res.json(r);
    }
  });
}
