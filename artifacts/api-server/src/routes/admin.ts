import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, weekRecordsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

function requireAdmin(req: Request, res: Response, next: () => void) {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.user.isAdmin !== true) {
    res.status(403).json({ error: "Forbidden: admin access required" });
    return;
  }
  next();
}

router.get("/admin/users", requireAdmin, async (req: Request, res: Response) => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const weekCounts = await db
    .select({ userId: weekRecordsTable.userId, count: count() })
    .from(weekRecordsTable)
    .groupBy(weekRecordsTable.userId);

  const countMap = new Map(weekCounts.map((r) => [r.userId, Number(r.count)]));

  const result = users.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    isAdmin: u.isAdmin === "true",
    createdAt: u.createdAt.toISOString(),
    weekCount: countMap.get(u.id) ?? 0,
  }));

  res.json({ users: result });
});

router.get("/admin/weeks", requireAdmin, async (req: Request, res: Response) => {
  const weeks = await db
    .select({
      id: weekRecordsTable.id,
      label: weekRecordsTable.label,
      chatterName: weekRecordsTable.chatterName,
      weekStart: weekRecordsTable.weekStart,
      days: weekRecordsTable.days,
      createdAt: weekRecordsTable.createdAt,
      userId: weekRecordsTable.userId,
      userEmail: usersTable.email,
      userFirstName: usersTable.firstName,
      userLastName: usersTable.lastName,
    })
    .from(weekRecordsTable)
    .leftJoin(usersTable, eq(weekRecordsTable.userId, usersTable.id))
    .orderBy(weekRecordsTable.createdAt);

  const result = weeks.map((w) => ({
    ...w,
    createdAt: w.createdAt.toISOString(),
  }));

  res.json({ weeks: result });
});

router.post("/admin/promote/:id", requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  await db
    .update(usersTable)
    .set({ isAdmin: "true" })
    .where(eq(usersTable.id, id));
  res.json({ success: true });
});

router.post("/admin/demote/:id", requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (id === req.user!.id) {
    res.status(400).json({ error: "Cannot demote yourself" });
    return;
  }
  await db
    .update(usersTable)
    .set({ isAdmin: "false" })
    .where(eq(usersTable.id, id));
  res.json({ success: true });
});

export default router;
