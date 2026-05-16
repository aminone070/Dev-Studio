import express from "express";
import compression from "compression";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { registerRoutes } from "./server/routes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 5000;

const app = express();
app.use(compression());
app.use(express.json({ limit: "2mb" }));

function getReplitUser(req) {
  const userId = req.headers["x-replit-user-id"];
  const userName = req.headers["x-replit-user-name"];
  if (!userId || !userName) return null;
  return {
    id: String(userId),
    name: String(userName),
    profileImage: `https://replit.com/cdn-cgi/image/width=64,quality=80/https://storage.googleapis.com/replit/profile-images/${userId}`,
  };
}

app.get("/api/auth/user", (req, res) => {
  const user = getReplitUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  res.json(user);
});

app.post("/api/auth/logout", (_req, res) => {
  res.json({ ok: true });
});

registerRoutes(app);

if (isProd) {
  const distPath = join(__dirname, "dist");
  app.use(express.static(distPath, {
    maxAge: "1y",
    etag: true,
    lastModified: true,
    immutable: true,
  }));
  app.get("/{*path}", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(join(distPath, "index.html"));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Dev Studio running on port ${PORT}`);
});
