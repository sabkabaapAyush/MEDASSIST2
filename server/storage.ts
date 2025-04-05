import { 
  users, type User, type InsertUser,
  patients, type Patient, type InsertPatient,
  medicalRecords, type MedicalRecord, type InsertMedicalRecord,
  firstAidGuidance, type FirstAidGuidance, type InsertFirstAidGuidance,
  medicalProfessionals, type MedicalProfessional, type InsertMedicalProfessional,
  consultations, type Consultation, type InsertConsultation
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Patient operations
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientByPatientId(patientId: string): Promise<Patient | undefined>;
  getPatients(): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<boolean>;
  
  // Medical Record operations
  getMedicalRecord(id: number): Promise<MedicalRecord | undefined>;
  getMedicalRecordsByPatientId(patientId: number): Promise<MedicalRecord[]>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  updateMedicalRecord(id: number, record: Partial<InsertMedicalRecord>): Promise<MedicalRecord | undefined>;
  deleteMedicalRecord(id: number): Promise<boolean>;
  
  // First Aid Guidance operations
  getFirstAidGuidance(id: number): Promise<FirstAidGuidance | undefined>;
  getFirstAidGuidanceByPatientId(patientId: number): Promise<FirstAidGuidance[]>;
  createFirstAidGuidance(guidance: InsertFirstAidGuidance): Promise<FirstAidGuidance>;
  
  // Medical Professional operations
  getMedicalProfessional(id: number): Promise<MedicalProfessional | undefined>;
  getMedicalProfessionalByLicenseNumber(licenseNumber: string): Promise<MedicalProfessional | undefined>;
  getMedicalProfessionals(): Promise<MedicalProfessional[]>;
  getMedicalProfessionalsBySpecialization(specialization: string): Promise<MedicalProfessional[]>;
  createMedicalProfessional(professional: InsertMedicalProfessional): Promise<MedicalProfessional>;
  updateMedicalProfessional(id: number, professional: Partial<InsertMedicalProfessional>): Promise<MedicalProfessional | undefined>;
  deleteMedicalProfessional(id: number): Promise<boolean>;
  
  // Consultation operations
  getConsultation(id: number): Promise<Consultation | undefined>;
  getConsultationsByPatientId(patientId: number): Promise<Consultation[]>;
  getConsultationsByProfessionalId(professionalId: number): Promise<Consultation[]>;
  getConsultationsByStatus(status: string): Promise<Consultation[]>;
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  updateConsultation(id: number, consultation: Partial<InsertConsultation>): Promise<Consultation | undefined>;
  deleteConsultation(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private medicalRecords: Map<number, MedicalRecord>;
  private firstAidGuidance: Map<number, FirstAidGuidance>;
  private medicalProfessionals: Map<number, MedicalProfessional>;
  private consultations: Map<number, Consultation>;
  
  private userCurrentId: number;
  private patientCurrentId: number;
  private medicalRecordCurrentId: number;
  private firstAidGuidanceCurrentId: number;
  private medicalProfessionalCurrentId: number;
  private consultationCurrentId: number;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.medicalRecords = new Map();
    this.firstAidGuidance = new Map();
    this.medicalProfessionals = new Map();
    this.consultations = new Map();
    
    this.userCurrentId = 1;
    this.patientCurrentId = 1;
    this.medicalRecordCurrentId = 1;
    this.firstAidGuidanceCurrentId = 1;
    this.medicalProfessionalCurrentId = 1;
    this.consultationCurrentId = 1;

    // Create some initial data
    this.createPatient({
      name: "Emily Wilson",
      age: 32,
      gender: "Female",
      bloodType: "A+",
      allergies: "Penicillin",
      conditions: "Asthma",
      medications: "Albuterol",
      patientId: "P102938",
      emergencyContact: "John Wilson",
      emergencyPhone: "555-123-4567"
    });

    // Add some medical records for the patient
    this.createMedicalRecord({
      patientId: 1,
      title: "Minor Burn on Right Hand",
      description: "First degree burn from hot water. Treated with cold water immersion and aloe vera gel.",
      type: "Burn",
      status: "Resolved",
      images: []
    });

    this.createMedicalRecord({
      patientId: 1,
      title: "Sprained Ankle",
      description: "Left ankle sprain while running. Applied RICE protocol, elastic bandage, and pain management.",
      type: "Sprain",
      status: "Recovered",
      images: []
    });

    this.createMedicalRecord({
      patientId: 1,
      title: "Allergic Reaction - Mild",
      description: "Skin rash after exposure to new soap. Applied hydrocortisone cream and took antihistamine.",
      type: "Allergy",
      status: "Resolved",
      images: []
    });
    
    // Add some sample medical professionals
    this.createMedicalProfessional({
      name: "Dr. Sarah Johnson",
      specialization: "Emergency Medicine",
      qualifications: "MD, ABEM Board Certified",
      licenseNumber: "EM12345",
      contact: "(555) 123-4567",
      email: "sjohnson@medassist.example",
      availability: "Mon-Fri: 9am-5pm",
      bio: "Dr. Johnson has over 15 years of experience in emergency medicine, specializing in trauma care and acute medical conditions.",
      profileImage: null,
      rating: 5,
      verified: true
    });
    
    this.createMedicalProfessional({
      name: "Dr. Michael Chen",
      specialization: "Family Medicine",
      qualifications: "MD, ABFM Board Certified",
      licenseNumber: "FM67890",
      contact: "(555) 987-6543",
      email: "mchen@medassist.example",
      availability: "Mon-Wed, Fri: 8am-4pm",
      bio: "Dr. Chen provides comprehensive primary care for patients of all ages, with special interest in preventive medicine and chronic disease management.",
      profileImage: null,
      rating: 4,
      verified: true
    });
    
    this.createMedicalProfessional({
      name: "Dr. Alicia Rodriguez",
      specialization: "Pediatrics",
      qualifications: "MD, ABP Board Certified",
      licenseNumber: "PD23456",
      contact: "(555) 456-7890",
      email: "arodriguez@medassist.example",
      availability: "Tue-Sat: 10am-6pm",
      bio: "Dr. Rodriguez specializes in pediatric care with a focus on childhood development and adolescent health issues.",
      profileImage: null,
      rating: 5,
      verified: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Patient methods
  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(
      (patient) => patient.patientId === patientId,
    );
  }

  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.patientCurrentId++;
    const patient: Patient = { 
      ...insertPatient, 
      id,
      bloodType: insertPatient.bloodType || null,
      allergies: insertPatient.allergies || null,
      conditions: insertPatient.conditions || null,
      medications: insertPatient.medications || null,
      emergencyContact: insertPatient.emergencyContact || null,
      emergencyPhone: insertPatient.emergencyPhone || null
    };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: number, updatePatient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    
    const updatedPatient = { ...patient, ...updatePatient };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }

  async deletePatient(id: number): Promise<boolean> {
    return this.patients.delete(id);
  }

  // Medical Record methods
  async getMedicalRecord(id: number): Promise<MedicalRecord | undefined> {
    return this.medicalRecords.get(id);
  }

  async getMedicalRecordsByPatientId(patientId: number): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecords.values())
      .filter(record => record.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createMedicalRecord(insertRecord: InsertMedicalRecord): Promise<MedicalRecord> {
    const id = this.medicalRecordCurrentId++;
    const record: MedicalRecord = { 
      ...insertRecord, 
      id, 
      date: new Date(),
      updatedAt: new Date(),
      images: insertRecord.images || [],
      allergies: insertRecord.allergies || [],
      currentMedications: insertRecord.currentMedications || [],
      medicalConditions: insertRecord.medicalConditions || [],
      bloodType: insertRecord.bloodType || null,
      notes: insertRecord.notes || null
    };
    this.medicalRecords.set(id, record);
    return record;
  }

  async updateMedicalRecord(id: number, updateRecord: Partial<InsertMedicalRecord>): Promise<MedicalRecord | undefined> {
    const record = this.medicalRecords.get(id);
    if (!record) return undefined;
    
    const updatedRecord = { 
      ...record, 
      ...updateRecord,
      updatedAt: new Date()
    };
    this.medicalRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  async deleteMedicalRecord(id: number): Promise<boolean> {
    return this.medicalRecords.delete(id);
  }

  // First Aid Guidance methods
  async getFirstAidGuidance(id: number): Promise<FirstAidGuidance | undefined> {
    return this.firstAidGuidance.get(id);
  }

  async getFirstAidGuidanceByPatientId(patientId: number): Promise<FirstAidGuidance[]> {
    return Array.from(this.firstAidGuidance.values())
      .filter(guidance => guidance.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createFirstAidGuidance(insertGuidance: InsertFirstAidGuidance): Promise<FirstAidGuidance> {
    const id = this.firstAidGuidanceCurrentId++;
    const guidance: FirstAidGuidance = { 
      ...insertGuidance, 
      id, 
      date: new Date(),
      steps: insertGuidance.steps || [],
      warnings: insertGuidance.warnings || []
    };
    this.firstAidGuidance.set(id, guidance);
    return guidance;
  }

  // Medical Professional methods
  async getMedicalProfessional(id: number): Promise<MedicalProfessional | undefined> {
    return this.medicalProfessionals.get(id);
  }

  async getMedicalProfessionalByLicenseNumber(licenseNumber: string): Promise<MedicalProfessional | undefined> {
    return Array.from(this.medicalProfessionals.values()).find(
      (professional) => professional.licenseNumber === licenseNumber
    );
  }

  async getMedicalProfessionals(): Promise<MedicalProfessional[]> {
    return Array.from(this.medicalProfessionals.values());
  }

  async getMedicalProfessionalsBySpecialization(specialization: string): Promise<MedicalProfessional[]> {
    return Array.from(this.medicalProfessionals.values())
      .filter(professional => professional.specialization === specialization);
  }

  async createMedicalProfessional(insertProfessional: InsertMedicalProfessional): Promise<MedicalProfessional> {
    const id = this.medicalProfessionalCurrentId++;
    const professional: MedicalProfessional = {
      ...insertProfessional,
      id,
      profileImage: insertProfessional.profileImage || null,
      bio: insertProfessional.bio || null,
      rating: insertProfessional.rating || null,
      verified: insertProfessional.verified ?? false
    };
    this.medicalProfessionals.set(id, professional);
    return professional;
  }

  async updateMedicalProfessional(id: number, updateProfessional: Partial<InsertMedicalProfessional>): Promise<MedicalProfessional | undefined> {
    const professional = this.medicalProfessionals.get(id);
    if (!professional) return undefined;
    
    const updatedProfessional = { ...professional, ...updateProfessional };
    this.medicalProfessionals.set(id, updatedProfessional);
    return updatedProfessional;
  }

  async deleteMedicalProfessional(id: number): Promise<boolean> {
    return this.medicalProfessionals.delete(id);
  }

  // Consultation methods
  async getConsultation(id: number): Promise<Consultation | undefined> {
    return this.consultations.get(id);
  }

  async getConsultationsByPatientId(patientId: number): Promise<Consultation[]> {
    return Array.from(this.consultations.values())
      .filter(consultation => consultation.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getConsultationsByProfessionalId(professionalId: number): Promise<Consultation[]> {
    return Array.from(this.consultations.values())
      .filter(consultation => consultation.professionalId === professionalId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getConsultationsByStatus(status: string): Promise<Consultation[]> {
    return Array.from(this.consultations.values())
      .filter(consultation => consultation.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createConsultation(insertConsultation: InsertConsultation): Promise<Consultation> {
    const id = this.consultationCurrentId++;
    const now = new Date();
    const consultation: Consultation = {
      ...insertConsultation,
      id,
      relatedGuidanceId: insertConsultation.relatedGuidanceId || null,
      scheduledDate: insertConsultation.scheduledDate || null,
      patientNotes: insertConsultation.patientNotes || null,
      professionalNotes: insertConsultation.professionalNotes || null,
      createdAt: now,
      updatedAt: now
    };
    this.consultations.set(id, consultation);
    return consultation;
  }

  async updateConsultation(id: number, updateConsultation: Partial<InsertConsultation>): Promise<Consultation | undefined> {
    const consultation = this.consultations.get(id);
    if (!consultation) return undefined;
    
    const updatedConsultation = { 
      ...consultation, 
      ...updateConsultation,
      updatedAt: new Date()
    };
    this.consultations.set(id, updatedConsultation);
    return updatedConsultation;
  }

  async deleteConsultation(id: number): Promise<boolean> {
    return this.consultations.delete(id);
  }
}

export const storage = new MemStorage();
