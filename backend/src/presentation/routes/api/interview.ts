import { Router, Request, Response } from "express";
import { db } from "../../../infrastructure/database/index.js";
import { interviewQuestions, userProgress } from "../../../domain/schema.js";
import { eq, and, or } from "drizzle-orm";
import { requireUser, stripDates, isUUID } from "../../middleware/auth.js";
import {
  getQuestions,
  postQuestions,
  postQuestionsBulk,
  deleteQuestionsById,
  getProgress,
  postProgressToggle,
} from "../../controllers/interview.controller.js";

const router = Router();

// --- INTERVIEW QUESTIONS ---
router.get("/questions", getQuestions);

router.post("/questions", postQuestions);

router.post("/questions/bulk", postQuestionsBulk);

router.delete("/questions/:id", deleteQuestionsById);

// --- USER PROGRESS ---
router.get("/progress", getProgress);

router.post("/progress/toggle", postProgressToggle);

export default router;
