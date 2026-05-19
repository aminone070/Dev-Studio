import { Router, Request, Response } from "express";
import { db } from "../../../infrastructure/database/index.js";
import { connectors } from "../../../domain/schema.js";
import { eq, and } from "drizzle-orm";
import { requireUser, stripDates, isUUID } from "../../middleware/auth.js";
import { getAll, create, createBulk, deleteById } from "../../controllers/connectors.controller.js";

const router = Router();

router.get("/", getAll);

router.post("/", create);

router.post("/bulk", createBulk);

router.delete("/:id", deleteById);

export default router;
