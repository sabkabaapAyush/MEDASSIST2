import { Phone, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function EmergencyBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <Alert className="bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
      <AlertTriangle className="h-6 w-6 text-red-500" />
      <div className="flex items-center justify-between w-full">
        <div>
          <AlertTitle className="text-red-500 font-medium">Emergency Services</AlertTitle>
          <AlertDescription className="text-sm">
            For severe emergencies, please call emergency services immediately.
          </AlertDescription>
        </div>
        <Button variant="destructive" size="sm" className="flex items-center gap-1 whitespace-nowrap">
          <Phone className="h-4 w-4" />
          <span>Call 911</span>
        </Button>
      </div>
    </Alert>
  );
}
