import { Router, Request, Response } from "express";
import { db } from "../../infrastructure/database/index.js";
import { myServices } from "../../domain/schema.js";
import { eq, and } from "drizzle-orm";
import { requireUser, stripDates, isUUID } from "../middleware/auth.js";

export const getAll = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  res.json(await db.select().from(myServices).where(eq(myServices.userId, uid)));
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
      .from(myServices)
      .where(and(eq(myServices.id, safeId), eq(myServices.userId, uid)));
    if (existing.length > 0) {
      const [r] = await db
        .update(myServices)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(myServices.id, safeId))
        .returning();
      res.json(r);
      return;
    }
  }
  const [r] = await db
    .insert(myServices)
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
    .delete(myServices)
    .where(and(eq(myServices.id, req.params.id), eq(myServices.userId, uid)));
  res.json({ ok: true });
};
