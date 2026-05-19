import { Router, Request, Response } from "express";
import { db } from "../../infrastructure/database/index.js";
import { freelanceOffers } from "../../domain/schema.js";
import { eq, and } from "drizzle-orm";
import { requireUser, stripDates, isUUID } from "../middleware/auth.js";

export const getAll = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  res.json(await db.select().from(freelanceOffers).where(eq(freelanceOffers.userId, uid)));
};

export const create = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  const { id, ...raw } = req.body;
  const data = stripDates(raw);
  const safeId = isUUID(id) ? id : undefined;
  if (safeId) {
    const existing = await db
      .select()
      .from(freelanceOffers)
      .where(and(eq(freelanceOffers.id, safeId), eq(freelanceOffers.userId, uid)));
    if (existing.length > 0) {
      const [r] = await db
        .update(freelanceOffers)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(freelanceOffers.id, safeId))
        .returning();
      res.json(r);
      return;
    }
  }
  const [r] = await db
    .insert(freelanceOffers)
    .values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any)
    .returning();
  res.json(r);
};

export const deleteById = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  if (!isUUID(req.params.id)) {
    res.json({ ok: true });
    return;
  }
  await db
    .delete(freelanceOffers)
    .where(and(eq(freelanceOffers.id, req.params.id), eq(freelanceOffers.userId, uid)));
  res.json({ ok: true });
};
