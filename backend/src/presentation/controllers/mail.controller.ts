import { Router, Request, Response } from "express";
import { db } from "../../infrastructure/database/index.js";
import { mailTemplates } from "../../domain/schema.js";
import { eq, and } from "drizzle-orm";
import { requireUser, stripDates, isUUID } from "../middleware/auth.js";

export const getAll = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  res.json(await db.select().from(mailTemplates).where(eq(mailTemplates.userId, uid)));
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
        .from(mailTemplates)
        .where(and(eq(mailTemplates.id, safeId), eq(mailTemplates.userId, uid)))
    : [];

  if (existing.length > 0) {
    const [r] = await db
      .update(mailTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mailTemplates.id, safeId!))
      .returning();
    res.json(r);
  } else {
    const [r] = await db
      .insert(mailTemplates)
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
  const result = await db.insert(mailTemplates).values(values).onConflictDoNothing().returning();
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
    .delete(mailTemplates)
    .where(and(eq(mailTemplates.id, req.params.id), eq(mailTemplates.userId, uid)));
  res.json({ ok: true });
};
