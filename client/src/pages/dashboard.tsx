import { useState } from "react";
import EmergencyBanner from "@/components/dashboard/emergency-banner";
import InputSection from "@/components/dashboard/input-section";
import PatientInfo from "@/components/dashboard/patient-info";
import MedicalRecords from "@/components/dashboard/medical-records";
import FirstAidGuidance from "@/components/dashboard/first-aid-guidance";

export default function Dashboard() {
  const [guidanceData, setGuidanceData] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">First Aid Assessment</h1>
        <p className="mt-1 text-neutral-700">
          Upload images, describe symptoms, or use voice input for immediate first aid guidance.
        </p>
      </div>
      
      <EmergencyBanner />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InputSection onGuidanceReceived={setGuidanceData} />
        
        <div className="space-y-6">
          <PatientInfo />
          <MedicalRecords />
        </div>
      </div>
      
      <FirstAidGuidance guidanceData={guidanceData} />
    </div>
  );
}
