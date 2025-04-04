import { useParams } from "wouter";
import PatientForm from "@/components/patient/patient-form";

export default function PatientProfile() {
  const params = useParams<{ id?: string }>();
  const patientId = params.id ? parseInt(params.id) : undefined;
  
  return (
    <div className="container mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">
        {patientId ? "Edit Patient Profile" : "Create New Patient"}
      </h1>
      <PatientForm patientId={patientId} />
    </div>
  );
}
