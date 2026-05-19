import { Router, Request, Response } from "express";
import { db } from "../../infrastructure/database/index.js";
import { components } from "../../domain/schema.js";
import { eq, and } from "drizzle-orm";
import { requireUser, stripDates, isUUID } from "../middleware/auth.js";

export const getAll = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  res.json(await db.select().from(components).where(eq(components.userId, uid)));
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
        .from(components)
        .where(and(eq(components.id, safeId), eq(components.userId, uid)))
    : [];

  if (existing.length > 0) {
    const [r] = await db
      .update(components)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(components.id, safeId!))
      .returning();
    res.json(r);
  } else {
    const [r] = await db
      .insert(components)
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
  const result = await db.insert(components).values(values).onConflictDoNothing().returning();
  res.json(result);
};

export const deleteById = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  if (!isUUID(req.params.id)) {
    res.json({ ok: true });
    return;
  }
  await db
    .delete(components)
    .where(and(eq(components.id, req.params.id), eq(components.userId, uid)));
  res.json({ ok: true });
};
