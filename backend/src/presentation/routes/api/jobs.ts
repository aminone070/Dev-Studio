import { Router, Request, Response } from "express";
import { db } from "../../../infrastructure/database/index.js";
import { savedJobs } from "../../../domain/schema.js";
import { eq, and } from "drizzle-orm";
import { requireUser, stripDates, isUUID } from "../../middleware/auth.js";

// Import scrapers
import { scrapeIndeedRSS } from "../../../infrastructure/lib/scrapers/indeed.js";
import { scrapeWuzzuf } from "../../../infrastructure/lib/scrapers/wuzzuf.js";
import { scrapeBayt } from "../../../infrastructure/lib/scrapers/bayt.js";
import { scrapeRemoteOKTagged } from "../../../infrastructure/lib/scrapers/remoteok.js";
import {
  getSaved,
  postSaved,
  deleteSavedById,
  getRemote,
  getScrape,
} from "../../controllers/jobs.controller.js";

const router = Router();

// --- ROUTES ---

// SAVED JOBS
router.get("/saved", getSaved);

router.post("/saved", postSaved);

router.delete("/saved/:id", deleteSavedById);

// REMOTE JOBS
router.get("/remote", getRemote);

// SCRAPE JOBS
router.get("/scrape", getScrape);

export default router;
