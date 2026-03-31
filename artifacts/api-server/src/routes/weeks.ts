import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { weekRecordsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/weeks", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const weeks = await db
    .select()
    .from(weekRecordsTable)
    .where(eq(weekRecordsTable.userId, userId))
    .orderBy(weekRecordsTable.createdAt);

  const result = weeks.map((w) => ({
    id: w.id,
    label: w.label,
    chatterName: w.chatterName,
    weekStart: w.weekStart,
    days: w.days,
    createdAt: w.createdAt.toISOString(),
  }));

  res.json({ weeks: result.reverse() });
});

router.post("/weeks", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { label, chatterName, weekStart, days } = req.body;

  const [created] = await db
    .insert(weekRecordsTable)
    .values({
      id: randomUUID(),
      userId,
      label,
      chatterName,
      weekStart: weekStart ?? "",
      days,
    })
    .returning();

  res.status(201).json({
    id: created.id,
    label: created.label,
    chatterName: created.chatterName,
    weekStart: created.weekStart,
    days: created.days,
    createdAt: created.createdAt.toISOString(),
  });
});

router.put("/weeks/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { id } = req.params;
  const { label, chatterName, weekStart, days } = req.body;

  const [updated] = await db
    .update(weekRecordsTable)
    .set({ label, chatterName, weekStart: weekStart ?? "", days })
    .where(and(eq(weekRecordsTable.id, id), eq(weekRecordsTable.userId, userId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Week not found" });
    return;
  }

  res.json({
    id: updated.id,
    label: updated.label,
    chatterName: updated.chatterName,
    weekStart: updated.weekStart,
    days: updated.days,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/weeks/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { id } = req.params;

  const [deleted] = await db
    .delete(weekRecordsTable)
    .where(and(eq(weekRecordsTable.id, id), eq(weekRecordsTable.userId, userId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Week not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
