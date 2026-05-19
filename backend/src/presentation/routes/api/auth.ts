import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "../../../infrastructure/database/index.js";
import { authUsers } from "../../../domain/schema.js";
import { eq, or } from "drizzle-orm";
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  logout,
  getUser,
  getConfig,
  googleCallback,
} from "../../controllers/auth.controller.js";

const router = Router();

// --- Email / Password ---
router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/logout", logout);
router.get("/user", getUser);
router.get("/config", getConfig);

// --- Google OAuth ---

export function setupGooglePassport() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.warn("[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google login disabled");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: "/api/auth/google/callback",
        scope: ["profile", "email"],
        proxy: true,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase() ?? null;
          const googleId = profile.id;
          const displayName = profile.displayName;
          const avatarUrl = profile.photos?.[0]?.value ?? null;

          const [existing] = await db
            .select()
            .from(authUsers)
            .where(
              or(eq(authUsers.googleId, googleId), ...(email ? [eq(authUsers.email, email)] : [])),
            );

          if (existing) {
            const [updated] = await db
              .update(authUsers)
              .set({
                googleId,
                displayName: existing.displayName ?? displayName,
                avatarUrl: existing.avatarUrl ?? avatarUrl,
                isVerified: true,
                updatedAt: new Date(),
              })
              .where(eq(authUsers.id, existing.id))
              .returning();
            return done(null, updated);
          }

          const [created] = await db
            .insert(authUsers)
            .values({ email, googleId, displayName, avatarUrl, isVerified: true })
            .returning();
          return done(null, created);
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const [user] = await db.select().from(authUsers).where(eq(authUsers.id, id));
    done(null, user ?? null);
  });
}

router.get("/google", (req: Request, res: Response, next: NextFunction) => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientID || !clientSecret) {
    return res.redirect("/auth?error=google_not_configured");
  }
  passport.authenticate("google", { session: false, scope: ["profile", "email"] })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/auth?error=google_failed" }),
  googleCallback,
);

export default router;
