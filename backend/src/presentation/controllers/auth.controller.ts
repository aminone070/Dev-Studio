import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../infrastructure/database/index.js";
import { authUsers } from "../../domain/schema.js";
import { eq } from "drizzle-orm";

const JWT_SECRET =
  process.env.JWT_SECRET || "supersecretjwtkey_devstudio_2026_secure_random_string";
const COOKIE_NAME = "ds_token";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function sendToken(res: Response, userId: string, user: Record<string, unknown>) {
  const token = signToken(userId);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  res.json({ user });
}

export function safeUser(u: typeof authUsers.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    name: u.displayName ?? u.email ?? "User",
    profileImage: u.avatarUrl ?? null,
    isVerified: u.isVerified,
  };
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const existing = await db
      .select()
      .from(authUsers)
      .where(eq(authUsers.email, email.toLowerCase()));
    if (existing.length > 0)
      return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [user] = await db
      .insert(authUsers)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        displayName: displayName || email.split("@")[0],
        isVerified: false,
        verificationToken,
        verificationTokenExpires,
      })
      .returning();

    console.log(`[auth] Dev Verification Code for ${user.email}: ${verificationToken}`);

    res.json({
      requireVerification: true,
      email: user.email,
      devVerificationCode: verificationToken,
      message: "Registration successful. Please verify your email.",
    });
  } catch (err) {
    console.error("[auth] register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const [user] = await db
      .select()
      .from(authUsers)
      .where(eq(authUsers.email, email.toLowerCase()));
    if (!user || !user.passwordHash)
      return res.status(401).json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    if (!user.isVerified) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await db
        .update(authUsers)
        .set({
          verificationToken: code,
          verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        })
        .where(eq(authUsers.id, user.id));

      console.log(`[auth] New Dev Verification Code for ${user.email}: ${code}`);
      return res.status(403).json({
        error: "Please verify your email first",
        requireVerification: true,
        email: user.email,
        devVerificationCode: code,
      });
    }

    sendToken(res, user.id, safeUser(user));
  } catch (err) {
    console.error("[auth] login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code)
      return res.status(400).json({ error: "Email and verification code are required" });

    const [user] = await db
      .select()
      .from(authUsers)
      .where(eq(authUsers.email, email.toLowerCase()));
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isVerified) {
      return sendToken(res, user.id, safeUser(user));
    }

    if (user.verificationToken !== code) {
      return res.status(400).json({ error: "Invalid verification code" });
    }
    if (user.verificationTokenExpires && new Date() > user.verificationTokenExpires) {
      return res
        .status(400)
        .json({ error: "Verification code has expired. Please request a new one." });
    }

    const [updated] = await db
      .update(authUsers)
      .set({
        isVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(authUsers.id, user.id))
      .returning();

    sendToken(res, updated.id, safeUser(updated));
  } catch (err) {
    console.error("[auth] verify-email error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const [user] = await db
      .select()
      .from(authUsers)
      .where(eq(authUsers.email, email.toLowerCase()));
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isVerified) return res.json({ message: "Email is already verified" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await db
      .update(authUsers)
      .set({
        verificationToken: code,
        verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
      .where(eq(authUsers.id, user.id));

    console.log(`[auth] Resent Dev Verification Code for ${email}: ${code}`);
    res.json({ requireVerification: true, email: user.email, devVerificationCode: code });
  } catch (err) {
    console.error("[auth] resend-verification error:", err);
    res.status(500).json({ error: "Failed to resend verification code" });
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
};

export const getUser = (req: Request, res: Response) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    db.select()
      .from(authUsers)
      .where(eq(authUsers.id, payload.sub))
      .then(([user]) => {
        if (!user) return res.status(401).json({ error: "User not found" });
        res.json(safeUser(user));
      });
  } catch {
    res.status(401).json({ error: "Invalid session" });
  }
};

export const getConfig = (_req: Request, res: Response) => {
  res.json({
    googleEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });
};

export const googleCallback = (req: Request, res: Response) => {
  const user = req.user as typeof authUsers.$inferSelect;
  if (!user) return res.redirect("/auth?error=google_failed");
  const token = signToken(user.id);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  res.redirect("/");
};
