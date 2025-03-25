import { useState } from "react";
import { usePatient } from "@/context/patient-context";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, AlertTriangle, Save, User, Loader } from "lucide-react";

const emergencyContactSchema = z.object({
  emergencyContact: z
    .string()
    .min(2, "Emergency contact name must be at least 2 characters"),
  emergencyPhone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[0-9-+() ]+$/, "Invalid phone number format"),
});

type EmergencyContactFormData = z.infer<typeof emergencyContactSchema>;

export default function EmergencyContact() {
  const { currentPatient, setCurrentPatient } = usePatient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("emergency-contacts");

  const form = useForm<EmergencyContactFormData>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: {
      emergencyContact: currentPatient?.emergencyContact || "",
      emergencyPhone: currentPatient?.emergencyPhone || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EmergencyContactFormData) => {
      if (!currentPatient) {
        throw new Error("No patient selected");
      }

      const response = await apiRequest(
        "PUT",
        `/api/patients/${currentPatient.id}`,
        data
      );
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });

      if (data) {
        setCurrentPatient(data);
      }

      toast({
        title: "Emergency Contact Updated",
        description: "Emergency contact information has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update emergency contact information. Please try again.",
        variant: "destructive",
      });
      console.error("Mutation error:", error);
    },
  });

  const onSubmit = (data: EmergencyContactFormData) => {
    updateMutation.mutate(data);
  };

  // Reset form when patient changes
  useState(() => {
    if (currentPatient) {
      form.reset({
        emergencyContact: currentPatient.emergencyContact || "",
        emergencyPhone: currentPatient.emergencyPhone || "",
      });
    }
  });

  const emergencyServices = [
    {
      name: "Emergency Services (Police, Fire, Ambulance)",
      phone: "911",
      description: "For life-threatening emergencies requiring immediate assistance"
    },
    {
      name: "Poison Control Center",
      phone: "1-800-222-1222",
      description: "For poisoning emergencies or questions about medications"
    },
    {
      name: "National Suicide Prevention Lifeline",
      phone: "988 or 1-800-273-8255",
      description: "24/7 support for people in distress"
    },
    {
      name: "Disaster Distress Helpline",
      phone: "1-800-985-5990",
      description: "Crisis counseling for people experiencing emotional distress related to disasters"
    }
  ];

  if (!currentPatient) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <User className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Patient Selected</h2>
          <p className="text-muted-foreground mb-6">
            Please select or create a patient profile to manage emergency contacts.
          </p>
          <Button onClick={() => window.location.href = "/patient-profile"}>
            Create Patient Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Emergency Contact</h1>
      <p className="text-neutral-700 mb-6">
        Manage emergency contact information and access important emergency services.
      </p>

      <div className="bg-red-500/10 border border-red-500/20 rounded-lg mb-6 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <div className="ml-3">
            <h3 className="text-red-500 font-medium">Emergency Services</h3>
            <p className="text-sm">For severe emergencies, please call emergency services immediately.</p>
          </div>
        </div>
        <Button variant="destructive" size="sm" className="flex items-center gap-1 whitespace-nowrap">
          <Phone className="h-4 w-4" />
          <a href="tel:911">Call 911</a>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="emergency-contacts">Patient Contacts</TabsTrigger>
          <TabsTrigger value="emergency-services">Emergency Services</TabsTrigger>
        </TabsList>

        <TabsContent value="emergency-contacts">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact Information</CardTitle>
              <CardDescription>
                Add or update emergency contact information for {currentPatient.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="emergencyContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>
                          Name of the person to contact in case of emergency
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>
                          Phone number where the emergency contact can be reached
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Contact Info
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency-services">
          <Card>
            <CardHeader>
              <CardTitle>Important Emergency Services</CardTitle>
              <CardDescription>
                List of important emergency services and contact numbers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emergencyServices.map((service, index) => (
                  <div key={index} className="flex flex-col md:flex-row justify-between p-4 border rounded-lg">
                    <div className="mb-2 md:mb-0">
                      <h3 className="font-medium">{service.name}</h3>
                      <p className="text-sm text-neutral-600">{service.description}</p>
                    </div>
                    <div className="flex items-center">
                      <Button 
                        variant="outline" 
                        className="text-primary"
                        asChild
                      >
                        <a href={`tel:${service.phone.replace(/[^0-9]/g, '')}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          {service.phone}
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
