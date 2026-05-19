import { Router, Request, Response } from "express";
import { db } from "../../../infrastructure/database/index.js";
import { userProfiles } from "../../../domain/schema.js";
import { eq } from "drizzle-orm";
import { requireUser } from "../../middleware/auth.js";
import { getAll, create } from "../../controllers/profile.controller.js";

const router = Router();

router.get("/", getAll);

router.post("/", create);

export default router;
