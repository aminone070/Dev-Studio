import { Router, Request, Response } from "express";
import { db } from "../../infrastructure/database/index.js";
import { savedJobs } from "../../domain/schema.js";
import { eq, and } from "drizzle-orm";
import { requireUser, stripDates, isUUID } from "../middleware/auth.js";
import { scrapeIndeedRSS } from "../../infrastructure/lib/scrapers/indeed.js";
import { scrapeWuzzuf } from "../../infrastructure/lib/scrapers/wuzzuf.js";
import { scrapeBayt } from "../../infrastructure/lib/scrapers/bayt.js";
import { scrapeRemoteOKTagged } from "../../infrastructure/lib/scrapers/remoteok.js";

export const getSaved = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  res.json(await db.select().from(savedJobs).where(eq(savedJobs.userId, uid)));
};

export const postSaved = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  const { id, ...raw } = req.body;
  const data = stripDates(raw);
  const safeId = isUUID(id) ? id : undefined;
  if (safeId) {
    const existing = await db
      .select()
      .from(savedJobs)
      .where(and(eq(savedJobs.id, safeId), eq(savedJobs.userId, uid)));
    if (existing.length > 0) {
      const [r] = await db
        .update(savedJobs)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(savedJobs.id, safeId))
        .returning();
      res.json(r);
      return;
    }
  }
  const [r] = await db
    .insert(savedJobs)
    .values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any)
    .returning();
  res.json(r);
};

export const deleteSavedById = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  if (!isUUID(req.params.id)) {
    res.json({ ok: true });
    return;
  }
  await db.delete(savedJobs).where(and(eq(savedJobs.id, req.params.id), eq(savedJobs.userId, uid)));
  res.json({ ok: true });
};

export const getRemote = async (req: Request, res: Response) => {
  try {
    const tag = req.query.tag ? `?tag=${encodeURIComponent(String(req.query.tag))}` : "";
    const r = await fetch(`https://remoteok.com/api${tag}`, {
      headers: { "User-Agent": "Mozilla/5.0 DevStudio/1.0", Accept: "application/json" },
    });
    if (!r.ok) throw new Error(`RemoteOK ${r.status}`);
    const data = (await r.json()) as any[];
    res.json(
      data
        .slice(1)
        .filter((j: any) => j.id && j.title)
        .slice(0, 30),
    );
  } catch {
    res.status(502).json({ error: "Failed to fetch remote jobs" });
  }
};

export const getScrape = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  const query = String(req.query.q || "full stack developer");
  const location = String(req.query.location || "");
  const days = Math.max(1, Math.min(Number(req.query.days || 1), 30));
  const sources = String(req.query.sources || "indeed,wuzzuf,bayt,remoteok")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const results: any[] = [];
  const errors: string[] = [];
  const tasks: Promise<void>[] = [];

  const runTask = async (name: string, fn: () => Promise<any[]>) => {
    try {
      const j = await fn();
      results.push(...j);
    } catch (err) {
      console.error(`Scraper error (${name}):`, err);
      errors.push(name);
    }
  };

  if (sources.includes("indeed"))
    tasks.push(runTask("indeed", () => scrapeIndeedRSS(query, location, days)));
  if (sources.includes("wuzzuf"))
    tasks.push(runTask("wuzzuf", () => scrapeWuzzuf(query, location, days)));
  if (sources.includes("bayt"))
    tasks.push(runTask("bayt", () => scrapeBayt(query, location, days)));
  if (sources.includes("remoteok"))
    tasks.push(runTask("remoteok", () => scrapeRemoteOKTagged(query)));

  await Promise.allSettled(tasks);
  results.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  res.json({ jobs: results.slice(0, 60), errors });
};
