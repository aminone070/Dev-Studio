import { Router, Request, Response } from "express";
import { db } from "../../infrastructure/database/index.js";
import { prompts } from "../../domain/schema.js";
import { eq, and } from "drizzle-orm";
import { requireUser, stripDates, isUUID } from "../middleware/auth.js";

export const getAll = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  res.json(await db.select().from(prompts).where(eq(prompts.userId, uid)));
};

export const create = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  const { id, ...raw } = req.body;
  const data = stripDates(raw);
  const safeId = isUUID(id) ? id : undefined;
  const existing = safeId
    ? await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.id, safeId), eq(prompts.userId, uid)))
    : [];

  if (existing.length > 0) {
    const [r] = await db
      .update(prompts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(prompts.id, safeId!))
      .returning();
    res.json(r);
  } else {
    const [r] = await db
      .insert(prompts)
      .values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any)
      .returning();
    res.json(r);
  }
};

export const createBulk = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  const items = req.body as any[];
  if (!items.length) {
    res.json([]);
    return;
  }
  const values = items.map(({ id, ...raw }) => {
    const data = stripDates(raw);
    const safeId = isUUID(id) ? id : undefined;
    return { ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any;
  });
  const result = await db.insert(prompts).values(values).onConflictDoNothing().returning();
  res.json(result);
};

export const deleteById = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  if (!isUUID(req.params.id)) {
    res.json({ ok: true });
    return;
  }
  await db.delete(prompts).where(and(eq(prompts.id, req.params.id), eq(prompts.userId, uid)));
  res.json({ ok: true });
};
