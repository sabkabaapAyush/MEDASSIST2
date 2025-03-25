import { createContext, useState, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Patient } from "@shared/schema";

interface PatientContextType {
  currentPatient: Patient | null;
  setCurrentPatient: (patient: Patient | null) => void;
  isLoading: boolean;
  error: Error | null;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);

  const { isLoading, error } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    onSuccess: (data) => {
      // Set the first patient as the current patient if none is selected
      if (data.length > 0 && !currentPatient) {
        setCurrentPatient(data[0]);
      }
    },
  });

  return (
    <PatientContext.Provider value={{ currentPatient, setCurrentPatient, isLoading, error: error as Error | null }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error("usePatient must be used within a PatientProvider");
  }
  return context;
}
