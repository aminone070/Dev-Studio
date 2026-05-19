import { Router, Request, Response } from "express";
import { db } from "../../../infrastructure/database/index.js";
import { cvProfiles } from "../../../domain/schema.js";
import { eq, and } from "drizzle-orm";
import { requireUser, stripDates, isUUID } from "../../middleware/auth.js";
import { getOpenAI } from "../../../infrastructure/lib/openai.js";
import {
  getAll,
  create,
  deleteById,
  postAtsCheck,
  postParsePdf,
} from "../../controllers/cv.controller.js";

const router = Router();

function parseCVRow(row: any) {
  const parse = (val: string, fallback: any) => {
    try {
      return JSON.parse(val || "null") ?? fallback;
    } catch {
      return fallback;
    }
  };
  return {
    id: row.id,
    title: row.title,
    focus: row.focus,
    personalInfo: parse(row.personalInfo, {}),
    summary: row.summary || "",
    experience: parse(row.experience, []),
    skills: parse(row.skills, { technical: [], soft: [], tools: [], languages: [] }),
    education: parse(row.education, []),
    projects: parse(row.projects, []),
    languages: parse(row.languages, []),
    createdAt: new Date(row.createdAt).getTime(),
    updatedAt: new Date(row.updatedAt).getTime(),
  };
}

router.get("/", getAll);

router.post("/", create);

router.delete("/:id", deleteById);

router.post("/ats-check", postAtsCheck);

router.post("/parse-pdf", postParsePdf);

export default router;
