import { Router, Request, Response } from "express";
import { db } from "../../infrastructure/database/index.js";
import { userProfiles } from "../../domain/schema.js";
import { eq } from "drizzle-orm";
import { requireUser } from "../middleware/auth.js";

export const getAll = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, uid));
  res.json(rows[0] ?? null);
};

export const create = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  const { displayName, avatarUrl, location } = req.body;
  const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, uid));

  if (existing.length > 0) {
    const [r] = await db
      .update(userProfiles)
      .set({ displayName, avatarUrl, location, updatedAt: new Date() })
      .where(eq(userProfiles.userId, uid))
      .returning();
    res.json(r);
  } else {
    const [r] = await db
      .insert(userProfiles)
      .values({ userId: uid, displayName, avatarUrl, location })
      .returning();
    res.json(r);
  }
};
