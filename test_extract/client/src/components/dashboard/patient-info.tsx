import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { usePatient } from "@/context/patient-context";
import { useQuery } from "@tanstack/react-query";
import { Patient } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientInfo() {
  const { currentPatient, setCurrentPatient } = usePatient();
  
  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });
  
  if (isLoading) {
    return <PatientInfoSkeleton />;
  }

  if (!patients || patients.length === 0 || !currentPatient) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="text-center py-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No Patient Profile</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Create a patient profile to track medical records and receive personalized first aid guidance.
            </p>
            <Link href="/patient-profile">
              <Button>Create Patient Profile</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {currentPatient.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <h2 className="text-lg font-semibold text-neutral-900">{currentPatient.name}</h2>
            <div className="mt-1 flex items-center flex-wrap">
              <span className="text-sm text-neutral-500">
                {currentPatient.age} years • {currentPatient.gender}
              </span>
              <span className="mx-2 text-neutral-300 hidden sm:inline">|</span>
              <span className="text-sm text-neutral-500">
                Patient ID: {currentPatient.patientId}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-neutral-200 rounded-md p-3">
            <h3 className="text-xs font-medium text-neutral-500 uppercase">Blood Type</h3>
            <p className="mt-1 font-medium text-neutral-900">{currentPatient.bloodType || "Not specified"}</p>
          </div>
          
          <div className="border border-neutral-200 rounded-md p-3">
            <h3 className="text-xs font-medium text-neutral-500 uppercase">Allergies</h3>
            <p className="mt-1 font-medium text-neutral-900">{currentPatient.allergies || "None"}</p>
          </div>
          
          <div className="border border-neutral-200 rounded-md p-3">
            <h3 className="text-xs font-medium text-neutral-500 uppercase">Conditions</h3>
            <p className="mt-1 font-medium text-neutral-900">{currentPatient.conditions || "None"}</p>
          </div>
          
          <div className="border border-neutral-200 rounded-md p-3">
            <h3 className="text-xs font-medium text-neutral-500 uppercase">Current Medications</h3>
            <p className="mt-1 font-medium text-neutral-900">{currentPatient.medications || "None"}</p>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Link href="/patient-profile">
            <Button variant="link" className="text-primary hover:text-primary/80 font-medium text-sm flex items-center">
              Edit Profile
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function PatientInfoSkeleton() {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="ml-4 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border border-neutral-200 rounded-md p-3">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
