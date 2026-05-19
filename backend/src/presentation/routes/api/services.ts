import { Router, Request, Response } from "express";
import { db } from "../../../infrastructure/database/index.js";
import { myServices } from "../../../domain/schema.js";
import { eq, and } from "drizzle-orm";
import { requireUser, stripDates, isUUID } from "../../middleware/auth.js";
import { getAll, create, deleteById } from "../../controllers/services.controller.js";

const router = Router();

router.get("/", getAll);

router.post("/", create);

router.delete("/:id", deleteById);

export default router;
