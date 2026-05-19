import { Router, Request, Response } from "express";
import { db } from "../../../infrastructure/database/index.js";
import { plannerTasks } from "../../../domain/schema.js";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireUser, stripDates, isUUID } from "../../middleware/auth.js";
import { getOpenAI } from "../../../infrastructure/lib/openai.js";
import {
  getAll,
  create,
  deleteById,
  postSuggest,
  postSeed,
} from "../../controllers/planner.controller.js";

const router = Router();

function parseRow(row: any) {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    description: row.description || undefined,
    priority: row.priority || "medium",
    status: row.status || "todo",
    category: row.category || "general",
    order: row.order ?? 0,
    estimatedMinutes: row.estimatedMinutes ?? undefined,
    createdAt: new Date(row.createdAt).getTime(),
    updatedAt: new Date(row.updatedAt).getTime(),
  };
}

router.get("/", getAll);

router.post("/", create);

router.delete("/:id", deleteById);

router.post("/suggest", postSuggest);

/* ── Seed endpoint ── */
router.post("/seed", postSeed);

export default router;
