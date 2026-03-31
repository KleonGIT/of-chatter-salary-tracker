import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export interface CommissionTierConfig {
  min: number;
  max: number | null;
  rate: number;
}

export const settingsTable = pgTable("settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  hourlyRate: text("hourly_rate").notNull(),
  hoursPerDay: text("hours_per_day").notNull(),
  commissionTiers: jsonb("commission_tiers").notNull().$type<CommissionTierConfig[]>(),
  phpUsdRate: text("php_usd_rate").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Settings = typeof settingsTable.$inferSelect;
