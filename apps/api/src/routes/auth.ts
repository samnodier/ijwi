import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { signAccessToken } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  AuthError,
  getUserById,
  loginUser,
  registerUser,
  toUserDTO,
  upsertGoogleUser,
} from "../services/users.js";

export const authRouter = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const googleClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(GOOGLE_CLIENT_ID)
  : null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

authRouter.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "name, email and password are required" });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    if (String(password).length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const user = await registerUser({ name, email, password });
    res
      .status(201)
      .json({ token: signAccessToken(user.id), user: toUserDTO(user) });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await loginUser({ email, password });
    res.json({ token: signAccessToken(user.id), user: toUserDTO(user) });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

authRouter.post("/google", async (req, res, next) => {
  try {
    if (!googleClient) {
      return res
        .status(503)
        .json({ error: "Google sign-in is not configured (set GOOGLE_CLIENT_ID)" });
    }

    const { idToken } = req.body ?? {};
    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(401).json({ error: "Invalid Google token" });
    }

    const user = await upsertGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    });

    res.json({ token: signAccessToken(user.id), user: toUserDTO(user) });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await getUserById(req.userId!);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(toUserDTO(user));
  } catch (err) {
    next(err);
  }
});
