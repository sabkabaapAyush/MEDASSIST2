import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  conditions: text("conditions"),
  medications: text("medications"),
  patientId: text("patient_id").notNull().unique(),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
});

export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  images: text("images").array(),
});

export const firstAidGuidance = pgTable("first_aid_guidance", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  assessment: text("assessment").notNull(),
  steps: text("steps").array(),
  warnings: text("warnings").array(),
  date: timestamp("date").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPatientSchema = createInsertSchema(patients).pick({
  name: true,
  age: true,
  gender: true,
  bloodType: true,
  allergies: true,
  conditions: true,
  medications: true,
  patientId: true,
  emergencyContact: true,
  emergencyPhone: true,
});

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).pick({
  patientId: true,
  title: true,
  description: true,
  type: true,
  status: true,
  images: true,
});

export const insertFirstAidGuidanceSchema = createInsertSchema(firstAidGuidance).pick({
  patientId: true,
  assessment: true,
  steps: true,
  warnings: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type MedicalRecord = typeof medicalRecords.$inferSelect;

export type InsertFirstAidGuidance = z.infer<typeof insertFirstAidGuidanceSchema>;
export type FirstAidGuidance = typeof firstAidGuidance.$inferSelect;

// Extended input types for API routes
export const imageUploadSchema = z.object({
  image: z.string(),
  patientId: z.number().optional(),
});

export const textInputSchema = z.object({
  text: z.string(),
  patientId: z.number().optional(),
});

export const audioInputSchema = z.object({
  audio: z.string(),
  patientId: z.number().optional(),
});

export const firstAidRequestSchema = z.object({
  images: z.array(z.string()).optional(),
  text: z.string().optional(),
  audio: z.string().optional(),
  patientId: z.number().optional(),
});
