import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { z } from "zod";
import path from "path";
import { 
  insertPatientSchema, 
  insertMedicalRecordSchema, 
  insertFirstAidGuidanceSchema,
  firstAidRequestSchema
} from "@shared/schema";

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
      let images: string[] = [];
      let text = req.body.text || "";
      let audio = req.body.audio || "";
      let patientId = req.body.patientId ? parseInt(req.body.patientId) : undefined;
      
      // Process any uploaded images
      if (req.files && Array.isArray(req.files)) {
        images = (req.files as Express.Multer.File[]).map(file => {
          // In a real app, we would save these files to a storage service
          // Here, we just encode as Base64 for demonstration
          return Buffer.from(file.buffer).toString('base64');
        });
      }
      
      // Validate the request data
      firstAidRequestSchema.parse({ images, text, audio, patientId });
      
      // For now, we'll return a simple assessment response based on the input
      // In a real application, this would involve more sophisticated analysis
      const assessment = "Based on the provided information, this appears to be a minor injury.";
      const steps = [
        "Clean the area with mild soap and water.",
        "Apply an antiseptic ointment to prevent infection.",
        "Cover with a sterile bandage or dressing.",
        "Monitor for signs of infection or worsening symptoms.",
        "Change the dressing daily or when it becomes wet or dirty."
      ];
      const warnings = [
        "Seek medical attention if the area becomes increasingly red, swollen, or painful.",
        "If fever develops, consult a healthcare provider immediately.",
        "If the wound is deep or has jagged edges, medical stitches may be required."
      ];
      
      // Create a first aid guidance record if a patient ID was provided
      let guidanceRecord = null;
      if (patientId) {
        // Check if patient exists
        const patient = await storage.getPatient(patientId);
        if (patient) {
          guidanceRecord = await storage.createFirstAidGuidance({
            patientId,
            assessment,
            steps,
            warnings
          });
        }
      }
      
      res.json({
        assessment,
        steps,
        warnings,
        savedToRecords: !!guidanceRecord,
        guidanceId: guidanceRecord?.id
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assessment request data", errors: error.errors });
      }
      console.error("Error processing first aid request:", error);
      res.status(500).json({ message: "Error processing first aid request" });
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

  // Mount the API router
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
