import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const weekRecordsTable = pgTable("week_records", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  chatterName: text("chatter_name").notNull(),
  weekStart: text("week_start").notNull().default(""),
  days: jsonb("days").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWeekRecordSchema = createInsertSchema(weekRecordsTable).omit({
  createdAt: true,
});

export type InsertWeekRecord = z.infer<typeof insertWeekRecordSchema>;
export type WeekRecord = typeof weekRecordsTable.$inferSelect;
