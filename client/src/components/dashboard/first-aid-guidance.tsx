import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePatient } from "@/context/patient-context";
import { 
  AlertCircle, 
  FileText, 
  Save, 
  Printer,
  AlertTriangle,
  AlertOctagon,
  Activity,
  Ambulance,
  PhoneCall,
  MapPin
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface GuidanceData {
  assessment: string;
  steps: string[];
  warnings: string[];
  savedToRecords?: boolean;
  guidanceId?: number;
  severity?: {
    level: "minor" | "requires_attention" | "emergency";
    description: string;
  };
}

export default function FirstAidGuidance({ guidanceData }: { guidanceData?: GuidanceData }) {
  const { currentPatient } = usePatient();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(guidanceData?.savedToRecords || false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  
  // Check for emergency cases and show dialog
  useEffect(() => {
    if (guidanceData?.severity?.level === "emergency") {
      setShowEmergencyDialog(true);
    }
  }, [guidanceData]);
  
  // Redirect to nearby hospitals section
  const redirectToNearbyHospitals = () => {
    window.location.href = "/emergency-contact?tab=nearby-hospitals";
  };
  
  const saveToRecordsMutation = useMutation({
    mutationFn: async () => {
      if (!currentPatient || !guidanceData) {
        throw new Error("Cannot save: missing patient or guidance data");
      }
      
      // Create a medical record from the guidance
      const response = await apiRequest("POST", "/api/medical-records", {
        patientId: currentPatient.id,
        title: "First Aid Guidance",
        description: guidanceData.assessment,
        type: "First Aid",
        status: "New",
        images: []
      });
      
      return response.json();
    },
    onSuccess: () => {
      setIsSaved(true);
      toast({
        title: "Saved to Records",
        description: "This first aid guidance has been saved to the patient's medical records."
      });
      
      // Invalidate medical records cache
      if (currentPatient) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/medical-records/patient/${currentPatient.id}`] 
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save to records. Please try again.",
        variant: "destructive"
      });
      console.error("Save error:", error);
    }
  });
  
  const handlePrintInstructions = () => {
    if (!guidanceData) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Could not open print window. Please check your popup blocker settings.",
        variant: "destructive"
      });
      return;
    }
    
    // Create the print content
    printWindow.document.write(`
      <html>
        <head>
          <title>First Aid Instructions</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            h1 { color: #2563EB; }
            h2 { color: #4B5563; margin-top: 20px; }
            ol, ul { margin-bottom: 20px; }
            .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 10px; }
            .assessment { background-color: #DBEAFE; border-left: 4px solid #2563EB; padding: 10px; margin-bottom: 20px; }
            
            .severity-box { 
              padding: 15px; 
              margin-bottom: 25px; 
              border-radius: 8px;
              border-width: 2px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .severity-minor { 
              background-color: #ECFDF5; 
              border: 2px solid #10B981; 
            }
            .severity-attention { 
              background-color: #FEF3C7; 
              border: 2px solid #D97706;  
            }
            .severity-emergency { 
              background-color: #FEE2E2; 
              border: 2px solid #EF4444; 
            }
            
            .severity-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .severity-minor .severity-title { color: #10B981; }
            .severity-attention .severity-title { color: #D97706; }
            .severity-emergency .severity-title { color: #EF4444; }
            
            .severity-description {
              padding: 10px;
              border-radius: 5px;
            }
            .severity-minor .severity-description { background-color: #D1FAE5; color: #065F46; }
            .severity-attention .severity-description { background-color: #FEF3C7; color: #92400E; }
            .severity-emergency .severity-description { background-color: #FEE2E2; color: #B91C1C; }
            
            .emergency-badge {
              background-color: #EF4444;
              color: white;
              padding: 5px 10px;
              border-radius: 20px;
              font-weight: bold;
              display: inline-block;
              margin-bottom: 10px;
            }
            
            footer { margin-top: 30px; font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>First Aid Instructions</h1>
          <div class="assessment">
            <h2>Assessment</h2>
            <p>${guidanceData.assessment}</p>
          </div>
          
          ${guidanceData.severity ? `
          <div class="severity-box ${
            guidanceData.severity.level === "minor" 
              ? "severity-minor" 
              : guidanceData.severity.level === "requires_attention" 
                ? "severity-attention" 
                : "severity-emergency"
          }">
            ${guidanceData.severity.level === "emergency" ? '<div class="emergency-badge">SEEK MEDICAL HELP NOW</div>' : ''}
            <div class="severity-title">Severity: ${
              guidanceData.severity.level === "minor" 
                ? "Minor" 
                : guidanceData.severity.level === "requires_attention" 
                  ? "Requires Medical Attention" 
                  : "EMERGENCY"
            }</div>
            <div class="severity-description">${guidanceData.severity.description}</div>
          </div>
          ` : ''}
          
          <h2>Recommended First Aid Steps:</h2>
          <ol>
            ${guidanceData.steps.map(step => `<li>${step}</li>`).join('')}
          </ol>
          
          <div class="warning">
            <h2>When to Seek Medical Attention</h2>
            <ul>
              ${guidanceData.warnings.map(warning => `<li>${warning}</li>`).join('')}
            </ul>
          </div>
          
          <footer>
            <p>Generated by MedAssist on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            ${currentPatient ? `<p>Patient: ${currentPatient.name} (ID: ${currentPatient.patientId})</p>` : ''}
          </footer>
        </body>
      </html>
    `);
    
    // Trigger print
    printWindow.document.close();
    printWindow.focus();
    
    // Short delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <>
      {/* Emergency Alert Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="bg-white border-2 border-red-500 max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-red-600 text-xl flex items-center">
              <AlertOctagon className="h-6 w-6 mr-2" />
              Emergency Medical Situation
            </DialogTitle>
            <DialogDescription className="text-gray-700 pt-2">
              This condition requires immediate medical attention. Would you like to find nearby hospitals?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <Ambulance className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-700">
                For serious emergencies, please call emergency services immediately at <strong>911</strong>
              </p>
            </div>
            
            {guidanceData?.severity?.description && (
              <div className="text-sm text-gray-700 mb-2">
                <p className="font-medium mb-1">Emergency details:</p>
                <p>{guidanceData.severity.description}</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowEmergencyDialog(false)} 
              className="sm:w-auto w-full"
            >
              Continue to First Aid
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white sm:w-auto w-full flex items-center" 
              onClick={redirectToNearbyHospitals}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Find Nearby Hospitals
            </Button>
            <Button
              variant="outline"
              className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300 sm:w-auto w-full flex items-center"
              asChild
            >
              <a href="tel:911">
                <PhoneCall className="h-4 w-4 mr-2" />
                Call 911
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">First Aid Guidance</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Placeholder before assessment */}
          {!guidanceData && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-neutral-400" />
            <h3 className="mt-4 text-neutral-700 font-medium">Waiting for your input</h3>
            <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto">
              Upload an image, describe your symptoms, or use voice recording to receive first aid guidance.
            </p>
            <div className="mt-6 bg-blue-50 p-4 rounded-md inline-block mx-auto text-left">
              <h4 className="text-sm font-medium text-blue-700">Multi-AI Provider Support</h4>
              <p className="text-xs text-blue-600 mt-1">
                This application will automatically switch between OpenAI, DeepSeek, and Gemini AI to ensure reliable service.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  OpenAI
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  DeepSeek
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Gemini
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* First aid guidance after assessment */}
        {guidanceData && (
          <div>
            <div className="bg-blue-50 border-l-4 border-primary p-4 rounded mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-primary">Assessment</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>{guidanceData.assessment}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Severity indicator - More Prominent */}
            {guidanceData.severity && (
              <div className={`mb-6 p-5 rounded-lg shadow-md ${
                guidanceData.severity.level === "minor" 
                  ? "bg-green-100 border-2 border-green-500" 
                  : guidanceData.severity.level === "requires_attention"
                    ? "bg-amber-100 border-2 border-amber-500"
                    : "bg-red-100 border-2 border-red-500"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`rounded-full p-2 mr-3 ${
                      guidanceData.severity.level === "minor" 
                        ? "bg-green-200" 
                        : guidanceData.severity.level === "requires_attention"
                          ? "bg-amber-200"
                          : "bg-red-200"
                    }`}>
                      {guidanceData.severity.level === "minor" && (
                        <Activity className="h-7 w-7 text-green-600" />
                      )}
                      {guidanceData.severity.level === "requires_attention" && (
                        <AlertTriangle className="h-7 w-7 text-amber-600" />
                      )}
                      {guidanceData.severity.level === "emergency" && (
                        <AlertOctagon className="h-7 w-7 text-red-600" />
                      )}
                    </div>
                    <h3 className={`text-lg font-bold ${
                      guidanceData.severity.level === "minor" 
                        ? "text-green-700" 
                        : guidanceData.severity.level === "requires_attention"
                          ? "text-amber-700"
                          : "text-red-700"
                    }`}>
                      Severity: {guidanceData.severity.level === "minor" 
                        ? "Minor" 
                        : guidanceData.severity.level === "requires_attention"
                          ? "Requires Medical Attention"
                          : "EMERGENCY"}
                    </h3>
                  </div>
                  
                  {/* Emergency action badge */}
                  {guidanceData.severity.level === "emergency" && (
                    <span className="animate-pulse bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      Seek Medical Help Now
                    </span>
                  )}
                </div>
                
                <div className={`mt-2 p-3 rounded-md ${
                  guidanceData.severity.level === "minor" 
                    ? "bg-green-50 text-green-800" 
                    : guidanceData.severity.level === "requires_attention"
                      ? "bg-amber-50 text-amber-800"
                      : "bg-red-50 text-red-800"
                }`}>
                  <p className="text-sm font-medium">{guidanceData.severity.description}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <h3 className="font-medium text-neutral-900">Recommended First Aid Steps:</h3>
              <ol className="list-decimal pl-5 space-y-3 text-neutral-700">
                {guidanceData.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">When to Seek Medical Attention</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Seek medical attention if:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {guidanceData.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                className="text-primary bg-primary/10 hover:bg-primary/20"
                onClick={() => saveToRecordsMutation.mutate()}
                disabled={saveToRecordsMutation.isPending || isSaved || !currentPatient}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaved ? "Saved to Records" : "Save to Records"}
              </Button>
              
              <Button onClick={handlePrintInstructions}>
                <Printer className="h-4 w-4 mr-2" />
                Print Instructions
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
