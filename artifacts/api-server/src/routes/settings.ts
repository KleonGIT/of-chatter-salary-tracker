import { Router, type IRouter, type Request, type Response } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_SETTINGS = {
  hourlyRate: "2",
  hoursPerDay: "8",
  commissionTiers: [
    { min: 0, max: 499.99, rate: 0.03 },
    { min: 500, max: 999.99, rate: 0.04 },
    { min: 1000, max: null, rate: 0.05 },
  ],
  phpUsdRate: "56",
};

router.get("/settings", async (req: Request, res: Response) => {
  if (!req.user) {
    res.json({
      hourlyRate: parseFloat(DEFAULT_SETTINGS.hourlyRate),
      hoursPerDay: parseFloat(DEFAULT_SETTINGS.hoursPerDay),
      commissionTiers: DEFAULT_SETTINGS.commissionTiers,
      phpUsdRate: parseFloat(DEFAULT_SETTINGS.phpUsdRate),
    });
    return;
  }

  const [existing] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.userId, req.user.id));

  if (existing) {
    res.json({
      hourlyRate: parseFloat(existing.hourlyRate),
      hoursPerDay: parseFloat(existing.hoursPerDay),
      commissionTiers: existing.commissionTiers,
      phpUsdRate: parseFloat(existing.phpUsdRate),
    });
    return;
  }

  res.json({
    hourlyRate: parseFloat(DEFAULT_SETTINGS.hourlyRate),
    hoursPerDay: parseFloat(DEFAULT_SETTINGS.hoursPerDay),
    commissionTiers: DEFAULT_SETTINGS.commissionTiers,
    phpUsdRate: parseFloat(DEFAULT_SETTINGS.phpUsdRate),
  });
});

router.put("/settings", async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { hourlyRate, hoursPerDay, commissionTiers, phpUsdRate } = req.body;

  if (
    typeof hourlyRate !== "number" ||
    typeof hoursPerDay !== "number" ||
    typeof phpUsdRate !== "number" ||
    !Array.isArray(commissionTiers) ||
    commissionTiers.length < 1
  ) {
    res.status(400).json({ error: "Invalid settings payload" });
    return;
  }

  const values = {
    userId: req.user.id,
    hourlyRate: String(hourlyRate),
    hoursPerDay: String(hoursPerDay),
    commissionTiers,
    phpUsdRate: String(phpUsdRate),
    updatedAt: new Date(),
  };

  await db
    .insert(settingsTable)
    .values(values)
    .onConflictDoUpdate({ target: settingsTable.userId, set: values });

  res.json({ hourlyRate, hoursPerDay, commissionTiers, phpUsdRate });
});

export default router;
