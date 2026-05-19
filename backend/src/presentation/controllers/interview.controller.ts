import { Router, Request, Response } from "express";
import { db } from "../../infrastructure/database/index.js";
import { interviewQuestions, userProgress } from "../../domain/schema.js";
import { eq, and, or } from "drizzle-orm";
import { requireUser, stripDates, isUUID } from "../middleware/auth.js";

export const getQuestions = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  res.json(
    await db
      .select()
      .from(interviewQuestions)
      .where(or(eq(interviewQuestions.isGlobal, true), eq(interviewQuestions.userId, uid))),
  );
};

export const postQuestions = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  const { id, ...raw } = req.body;
  const data = stripDates(raw);
  const safeId = isUUID(id) ? id : undefined;
  const existing = safeId
    ? await db.select().from(interviewQuestions).where(eq(interviewQuestions.id, safeId))
    : [];

  if (existing.length > 0 && existing[0].userId === uid) {
    const [r] = await db
      .update(interviewQuestions)
      .set(data)
      .where(eq(interviewQuestions.id, safeId!))
      .returning();
    res.json(r);
  } else {
    const [r] = await db
      .insert(interviewQuestions)
      .values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any)
      .returning();
    res.json(r);
  }
};

export const postQuestionsBulk = async (req: Request, res: Response) => {
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
  const result = await db
    .insert(interviewQuestions)
    .values(values)
    .onConflictDoNothing()
    .returning();
  res.json(result);
};

export const deleteQuestionsById = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  if (!isUUID(req.params.id)) {
    res.json({ ok: true });
    return;
  }
  await db
    .delete(interviewQuestions)
    .where(and(eq(interviewQuestions.id, req.params.id), eq(interviewQuestions.userId, uid)));
  res.json({ ok: true });
};

export const getProgress = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  res.json(await db.select().from(userProgress).where(eq(userProgress.userId, uid)));
};

export const postProgressToggle = async (req: Request, res: Response) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  const { itemId, areaId, completed } = req.body;
  const existing = await db
    .select()
    .from(userProgress)
    .where(and(eq(userProgress.userId, uid), eq(userProgress.itemId, itemId)));

  if (existing.length > 0) {
    const [r] = await db
      .update(userProgress)
      .set({ completed, updatedAt: new Date() })
      .where(and(eq(userProgress.userId, uid), eq(userProgress.itemId, itemId)))
      .returning();
    res.json(r);
  } else {
    const [r] = await db
      .insert(userProgress)
      .values({ userId: uid, itemId, areaId, completed })
      .returning();
    res.json(r);
  }
};
