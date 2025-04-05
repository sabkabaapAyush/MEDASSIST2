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

export const medicalProfessionals = pgTable("medical_professionals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialization: text("specialization").notNull(),
  qualifications: text("qualifications").notNull(),
  licenseNumber: text("license_number").notNull().unique(),
  contact: text("contact").notNull(),
  email: text("email").notNull(),
  availability: text("availability").notNull(),
  bio: text("bio"),
  profileImage: text("profile_image"),
  rating: integer("rating"), // 1-5 stars
  verified: boolean("verified").default(false),
});

export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  professionalId: integer("professional_id").notNull(),
  relatedGuidanceId: integer("related_guidance_id"),
  status: text("status").notNull(), // pending, scheduled, completed, cancelled
  scheduledDate: timestamp("scheduled_date"),
  request: text("request").notNull(),
  patientNotes: text("patient_notes"),
  professionalNotes: text("professional_notes"),
  consultationType: text("consultation_type").notNull(), // video, chat, in-person
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

export const insertMedicalProfessionalSchema = createInsertSchema(medicalProfessionals).pick({
  name: true,
  specialization: true,
  qualifications: true,
  licenseNumber: true,
  contact: true,
  email: true,
  availability: true,
  bio: true,
  profileImage: true,
  rating: true,
  verified: true,
});

export const insertConsultationSchema = createInsertSchema(consultations).pick({
  patientId: true,
  professionalId: true,
  relatedGuidanceId: true,
  status: true,
  scheduledDate: true,
  request: true,
  patientNotes: true,
  professionalNotes: true,
  consultationType: true,
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

export type InsertMedicalProfessional = z.infer<typeof insertMedicalProfessionalSchema>;
export type MedicalProfessional = typeof medicalProfessionals.$inferSelect;

export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Consultation = typeof consultations.$inferSelect;

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
