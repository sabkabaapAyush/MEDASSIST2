import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePatient } from "@/context/patient-context";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { MedicalRecord } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/utils";

export default function MedicalRecords() {
  const { currentPatient } = usePatient();
  const [expanded, setExpanded] = useState<number | null>(null);
  
  const { data: records, isLoading } = useQuery<MedicalRecord[]>({
    queryKey: currentPatient 
      ? [`/api/medical-records/patient/${currentPatient.id}`] 
      : ["medical-records-empty"],
    enabled: !!currentPatient,
  });
  
  if (isLoading) {
    return <MedicalRecordsSkeleton />;
  }
  
  if (!currentPatient) {
    return null;
  }

  if (!records || records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-neutral-900">Recent Medical Records</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-neutral-500 mb-4">
              No medical records found for this patient.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Display at most 3 most recent records
  const recentRecords = records.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-neutral-900">Recent Medical Records</CardTitle>
          <Link href="/medical-records">
            <Button variant="link" className="text-primary hover:text-primary/80 font-medium text-sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="timeline-container pl-8 space-y-6">
          {recentRecords.map((record) => (
            <div key={record.id} className="timeline-item relative">
              <div className="flex items-start mb-1">
                <h3 className="font-medium text-neutral-900">{record.title}</h3>
                <span className="ml-auto text-sm text-neutral-500">
                  {formatRelativeTime(record.date)}
                </span>
              </div>
              <p className="text-sm text-neutral-700 mb-2">
                {expanded === record.id 
                  ? record.description 
                  : record.description.length > 100 
                    ? `${record.description.slice(0, 100)}...` 
                    : record.description}
              </p>
              {record.description.length > 100 && (
                <Button 
                  variant="link" 
                  className="text-sm p-0 h-auto mb-2" 
                  onClick={() => setExpanded(expanded === record.id ? null : record.id)}
                >
                  {expanded === record.id ? "Show less" : "Read more"}
                </Button>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                  {record.type}
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                  {record.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MedicalRecordsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 pl-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="relative">
              <div className="flex items-start mb-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24 ml-auto" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
