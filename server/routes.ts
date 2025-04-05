import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { z } from "zod";
import path from "path";
import fs from "fs";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import { 
  insertPatientSchema, 
  insertMedicalRecordSchema, 
  insertFirstAidGuidanceSchema,
  insertMedicalProfessionalSchema,
  insertConsultationSchema,
  firstAidRequestSchema
} from "@shared/schema";
import { generateFirstAidGuidanceUnified } from "./services/ai-service";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // Patient routes
  apiRouter.get("/patients", async (req: Request, res: Response) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching patients" });
    }
  });

  apiRouter.get("/patients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getPatient(id);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Error fetching patient" });
    }
  });

  apiRouter.post("/patients", async (req: Request, res: Response) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating patient" });
    }
  });

  apiRouter.put("/patients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPatientSchema.partial().parse(req.body);
      const updatedPatient = await storage.updatePatient(id, validatedData);
      
      if (!updatedPatient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.json(updatedPatient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating patient" });
    }
  });

  apiRouter.delete("/patients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePatient(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting patient" });
    }
  });

  // Medical Records routes
  apiRouter.get("/medical-records/patient/:patientId", async (req: Request, res: Response) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const records = await storage.getMedicalRecordsByPatientId(patientId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Error fetching medical records" });
    }
  });

  apiRouter.get("/medical-records/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const record = await storage.getMedicalRecord(id);
      
      if (!record) {
        return res.status(404).json({ message: "Medical record not found" });
      }
      
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Error fetching medical record" });
    }
  });

  apiRouter.post("/medical-records", async (req: Request, res: Response) => {
    try {
      const validatedData = insertMedicalRecordSchema.parse(req.body);
      const record = await storage.createMedicalRecord(validatedData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid medical record data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating medical record" });
    }
  });

  apiRouter.put("/medical-records/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMedicalRecordSchema.partial().parse(req.body);
      const updatedRecord = await storage.updateMedicalRecord(id, validatedData);
      
      if (!updatedRecord) {
        return res.status(404).json({ message: "Medical record not found" });
      }
      
      res.json(updatedRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid medical record data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating medical record" });
    }
  });

  apiRouter.delete("/medical-records/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMedicalRecord(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Medical record not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting medical record" });
    }
  });

  // First Aid Assessment and Guidance routes
  apiRouter.post("/first-aid/assess", upload.array("images", 5), async (req: Request, res: Response) => {
    try {
      let text = req.body.text || "";
      let patientId = req.body.patientId ? parseInt(req.body.patientId) : undefined;
      let audioFilePath: string | undefined = undefined;
      let imageFiles: string[] = [];
      
      // Create a temporary directory for uploaded files
      const tmpDir = path.join(os.tmpdir(), `first-aid-${uuidv4()}`);
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      
      // Process uploaded images
      if (req.files && Array.isArray(req.files)) {
        // Using any type to work around TypeScript limitations with multer
        const uploadedFiles = req.files as any[];
        imageFiles = await Promise.all(uploadedFiles.map(async (file, index) => {
          const imagePath = path.join(tmpDir, `image-${index}.jpg`);
          fs.writeFileSync(imagePath, file.buffer);
          return imagePath;
        }));
      }
      
      // Process audio if provided
      if (req.body.audio) {
        // Handle base64 audio data
        if (typeof req.body.audio === 'string' && req.body.audio.startsWith('data:audio')) {
          // Extract base64 data from data URL
          const base64Data = req.body.audio.split(',')[1];
          const audioBuffer = Buffer.from(base64Data, 'base64');
          
          // Save to temporary file
          audioFilePath = path.join(tmpDir, `audio-${Date.now()}.webm`);
          fs.writeFileSync(audioFilePath, audioBuffer);
        }
      }
      
      // Validate basic request data
      firstAidRequestSchema.parse({ 
        images: imageFiles, 
        text, 
        audio: audioFilePath ? 'audio-recorded' : undefined, 
        patientId 
      });
      
      // Get patient medical history if patientId is provided
      let medicalHistory;
      if (patientId) {
        const patient = await storage.getPatient(patientId);
        if (patient) {
          // Get the latest medical record for the patient
          const medicalRecords = await storage.getMedicalRecordsByPatientId(patientId);
          if (medicalRecords.length > 0) {
            // Sort by date to get the most recent medical record
            const sortedRecords = medicalRecords.sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            const latestRecord = sortedRecords[0];
            
            medicalHistory = {
              allergies: latestRecord.allergies || [],
              medications: latestRecord.currentMedications || [],
              conditions: latestRecord.medicalConditions || [],
              bloodType: latestRecord.bloodType || undefined,
              notes: latestRecord.notes || undefined
            };
          }
        }
      }
      
      // Use AI service to analyze the input and generate guidance
      const aiResult = await generateFirstAidGuidanceUnified(
        imageFiles,
        text,
        audioFilePath,
        medicalHistory
      );
      
      // Create a first aid guidance record if a patient ID was provided
      let guidanceRecord = null;
      if (patientId) {
        // Check if patient exists
        const patient = await storage.getPatient(patientId);
        if (patient) {
          guidanceRecord = await storage.createFirstAidGuidance({
            patientId,
            assessment: aiResult.assessment,
            steps: aiResult.steps,
            warnings: aiResult.warnings
          });
        }
      }
      
      // Clean up temporary files
      try {
        for (const file of [...imageFiles, audioFilePath].filter(Boolean)) {
          if (file && fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        }
        if (fs.existsSync(tmpDir)) {
          fs.rmdirSync(tmpDir, { recursive: true });
        }
      } catch (cleanupError) {
        console.error("Error cleaning up temporary files:", cleanupError);
      }
      
      res.json({
        assessment: aiResult.assessment,
        steps: aiResult.steps,
        warnings: aiResult.warnings,
        savedToRecords: !!guidanceRecord,
        guidanceId: guidanceRecord?.id,
        severity: aiResult.severity
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assessment request data", errors: error.errors });
      }
      
      console.error("Error processing first aid request:", error);
      
      // Check if it's an AI service API error
      if (error?.message && typeof error.message === 'string' && 
          (error.message.includes('API service unavailable') || 
           error.message.includes('All AI services are currently unavailable'))) {
        return res.status(503).json({ 
          message: "All AI services are temporarily unavailable. The system tried OpenAI, DeepSeek, and Gemini APIs. Please try again later.",
          apiUnavailable: true 
        });
      }
      
      res.status(500).json({ message: "Error processing first aid request: " + (error?.message || 'Unknown error') });
    }
  });

  apiRouter.get("/first-aid/guidance/patient/:patientId", async (req: Request, res: Response) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const guidanceRecords = await storage.getFirstAidGuidanceByPatientId(patientId);
      res.json(guidanceRecords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching first aid guidance records" });
    }
  });

  apiRouter.get("/first-aid/guidance/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const guidance = await storage.getFirstAidGuidance(id);
      
      if (!guidance) {
        return res.status(404).json({ message: "First aid guidance record not found" });
      }
      
      res.json(guidance);
    } catch (error) {
      res.status(500).json({ message: "Error fetching first aid guidance" });
    }
  });

  // Medical Professionals routes
  apiRouter.get("/medical-professionals", async (req: Request, res: Response) => {
    try {
      // Check for specialization query param
      const specialization = req.query.specialization as string | undefined;
      
      let professionals;
      if (specialization) {
        professionals = await storage.getMedicalProfessionalsBySpecialization(specialization);
      } else {
        professionals = await storage.getMedicalProfessionals();
      }
      
      res.json(professionals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching medical professionals" });
    }
  });

  apiRouter.get("/medical-professionals/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const professional = await storage.getMedicalProfessional(id);
      
      if (!professional) {
        return res.status(404).json({ message: "Medical professional not found" });
      }
      
      res.json(professional);
    } catch (error) {
      res.status(500).json({ message: "Error fetching medical professional" });
    }
  });

  apiRouter.post("/medical-professionals", async (req: Request, res: Response) => {
    try {
      const validatedData = insertMedicalProfessionalSchema.parse(req.body);
      const professional = await storage.createMedicalProfessional(validatedData);
      res.status(201).json(professional);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid medical professional data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating medical professional" });
    }
  });

  apiRouter.put("/medical-professionals/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMedicalProfessionalSchema.partial().parse(req.body);
      const updatedProfessional = await storage.updateMedicalProfessional(id, validatedData);
      
      if (!updatedProfessional) {
        return res.status(404).json({ message: "Medical professional not found" });
      }
      
      res.json(updatedProfessional);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid medical professional data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating medical professional" });
    }
  });

  apiRouter.delete("/medical-professionals/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMedicalProfessional(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Medical professional not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting medical professional" });
    }
  });

  // Consultation routes
  apiRouter.get("/consultations", async (req: Request, res: Response) => {
    try {
      // Check for filter query params
      const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : undefined;
      const professionalId = req.query.professionalId ? parseInt(req.query.professionalId as string) : undefined;
      const status = req.query.status as string | undefined;
      
      let consultations;
      if (patientId) {
        consultations = await storage.getConsultationsByPatientId(patientId);
      } else if (professionalId) {
        consultations = await storage.getConsultationsByProfessionalId(professionalId);
      } else if (status) {
        consultations = await storage.getConsultationsByStatus(status);
      } else {
        // Return a sample of recent consultations if no filter is provided
        const allConsultationsByDate = Array.from(new Set([
          ...(await storage.getConsultationsByStatus('scheduled')),
          ...(await storage.getConsultationsByStatus('requested')),
          ...(await storage.getConsultationsByStatus('completed')).slice(0, 10)
        ]));
        consultations = allConsultationsByDate;
      }
      
      res.json(consultations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching consultations" });
    }
  });

  apiRouter.get("/consultations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const consultation = await storage.getConsultation(id);
      
      if (!consultation) {
        return res.status(404).json({ message: "Consultation not found" });
      }
      
      res.json(consultation);
    } catch (error) {
      res.status(500).json({ message: "Error fetching consultation" });
    }
  });

  apiRouter.post("/consultations", async (req: Request, res: Response) => {
    try {
      const validatedData = insertConsultationSchema.parse(req.body);
      
      // Verify that patient and professional exist
      const patient = await storage.getPatient(validatedData.patientId);
      const professional = await storage.getMedicalProfessional(validatedData.professionalId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      if (!professional) {
        return res.status(404).json({ message: "Medical professional not found" });
      }
      
      const consultation = await storage.createConsultation(validatedData);
      res.status(201).json(consultation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid consultation data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating consultation" });
    }
  });

  apiRouter.put("/consultations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertConsultationSchema.partial().parse(req.body);
      const updatedConsultation = await storage.updateConsultation(id, validatedData);
      
      if (!updatedConsultation) {
        return res.status(404).json({ message: "Consultation not found" });
      }
      
      res.json(updatedConsultation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid consultation data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating consultation" });
    }
  });

  apiRouter.delete("/consultations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteConsultation(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Consultation not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting consultation" });
    }
  });

  // Mount the API router
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
