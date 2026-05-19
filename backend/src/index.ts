import express, { Request, Response } from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
// Removed Vite import
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import passport from "passport";
import "dotenv/config";
import { registerRoutes } from "./presentation/routes.js";
import { setupGooglePassport } from "./presentation/routes/api/auth.js";
import { setupSwagger } from "./presentation/swagger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT || 5000);

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));

// Enhanced CORS configuration for robust full-stack integration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, postman, curl)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      if (allowedOrigins.includes(origin) || !isProd) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  }),
);

app.use(morgan("dev"));

if (!isProd) {
  app.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });
}
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(passport.initialize());

setupGooglePassport();
setupSwagger(app);
registerRoutes(app);

if (isProd) {
  // In production, the backend might still serve static files if desired,
  // or it could just be an API. We'll leave it as an API.
  app.get("/", (_req: Request, res: Response) => {
    res.json({ message: "Dev Studio API is running" });
  });
} else {
  app.get("/", (_req: Request, res: Response) => {
    res.json({ message: "Dev Studio API is running (Dev)" });
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Dev Studio running on port ${PORT}`);
});
