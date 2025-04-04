import { 
  users, type User, type InsertUser,
  patients, type Patient, type InsertPatient,
  medicalRecords, type MedicalRecord, type InsertMedicalRecord,
  firstAidGuidance, type FirstAidGuidance, type InsertFirstAidGuidance 
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private medicalRecords: Map<number, MedicalRecord>;
  private firstAidGuidance: Map<number, FirstAidGuidance>;
  
  private userCurrentId: number;
  private patientCurrentId: number;
  private medicalRecordCurrentId: number;
  private firstAidGuidanceCurrentId: number;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.medicalRecords = new Map();
    this.firstAidGuidance = new Map();
    
    this.userCurrentId = 1;
    this.patientCurrentId = 1;
    this.medicalRecordCurrentId = 1;
    this.firstAidGuidanceCurrentId = 1;

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
    const patient: Patient = { ...insertPatient, id };
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
      date: new Date() 
    };
    this.medicalRecords.set(id, record);
    return record;
  }

  async updateMedicalRecord(id: number, updateRecord: Partial<InsertMedicalRecord>): Promise<MedicalRecord | undefined> {
    const record = this.medicalRecords.get(id);
    if (!record) return undefined;
    
    const updatedRecord = { ...record, ...updateRecord };
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
      date: new Date() 
    };
    this.firstAidGuidance.set(id, guidance);
    return guidance;
  }
}

export const storage = new MemStorage();
