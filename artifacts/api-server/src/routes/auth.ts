import { Router, type IRouter, type Request, type Response } from "express";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { eq, isNotNull } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  createSession,
  clearSession,
  getSessionId,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.post("/auth/register", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (
    typeof username !== "string" ||
    username.trim().length < 3 ||
    typeof password !== "string" ||
    password.length < 6
  ) {
    res.status(400).json({
      error: "Username must be at least 3 characters and password at least 6 characters.",
    });
    return;
  }

  const cleanUsername = username.trim().toLowerCase();

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, cleanUsername))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken." });
    return;
  }

  const usersWithPassword = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(isNotNull(usersTable.passwordHash))
    .limit(1);

  const isFirstUser = usersWithPassword.length === 0;

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(usersTable)
    .values({
      username: cleanUsername,
      passwordHash,
      isAdmin: isFirstUser ? "true" : "false",
    })
    .returning();

  const sessionData: SessionData = {
    user: {
      id: user.id,
      username: user.username!,
      isAdmin: user.isAdmin === "true",
    },
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.status(201).json({ user: sessionData.user });
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username.trim().toLowerCase()))
    .limit(1);

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  const sessionData: SessionData = {
    user: {
      id: user.id,
      username: user.username!,
      isAdmin: user.isAdmin === "true",
    },
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.json({ user: sessionData.user });
});

router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

export default router;
