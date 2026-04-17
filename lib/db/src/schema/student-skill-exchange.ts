import { sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const studentsTable = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    college: text("college").notNull(),
    branch: text("branch").notNull(),
    profilePicture: text("profile_picture"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("students_email_unique").on(sql`lower(${table.email})`)],
);

export const skillsTable = pgTable("skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => studentsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  direction: text("direction").notNull(),
});

export const connectionsTable = pgTable("connections", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .notNull()
    .references(() => studentsTable.id, { onDelete: "cascade" }),
  receiverId: integer("receiver_id")
    .notNull()
    .references(() => studentsTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .notNull()
    .references(() => studentsTable.id, { onDelete: "cascade" }),
  receiverId: integer("receiver_id")
    .notNull()
    .references(() => studentsTable.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export type Student = typeof studentsTable.$inferSelect;
export type Skill = typeof skillsTable.$inferSelect;
export type Connection = typeof connectionsTable.$inferSelect;
export type Message = typeof messagesTable.$inferSelect;