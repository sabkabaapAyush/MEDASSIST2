import { useState, useEffect, useRef } from "react";
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
  CardFooter,
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
import { Phone, AlertTriangle, Save, User, Loader, MapPin, Navigation, Search, Hospital } from "lucide-react";

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

// Define hospital interface
interface Hospital {
  name: string;
  address: string;
  distance: string;
  phone?: string;
  emergency: boolean;
}

export default function EmergencyContact() {
  const { currentPatient, setCurrentPatient } = usePatient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("emergency-contacts");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const [isSearchingHospitals, setIsSearchingHospitals] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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
  
  // Handle map initialization when user location is available
  useEffect(() => {
    if (userLocation && mapContainerRef.current) {
      // In a real implementation, this would initialize a map library like Google Maps, Mapbox, or Leaflet
      console.log("Map would be initialized with location:", userLocation);
      
      // Add markers for user location and nearby hospitals
      if (nearbyHospitals.length > 0) {
        console.log("Adding markers for", nearbyHospitals.length, "hospitals");
      }
    }
  }, [userLocation, nearbyHospitals]);

  // Function to get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser does not support geolocation services.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLoadingLocation(false);
        searchNearbyHospitals(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setIsLoadingLocation(false);
        toast({
          title: "Location Error",
          description: `Failed to get your location: ${error.message}`,
          variant: "destructive"
        });
      }
    );
  };

  // Function to search for nearby hospitals (simulated)
  const searchNearbyHospitals = (lat: number, lng: number) => {
    setIsSearchingHospitals(true);

    // Simulated hospital data based on the user's location
    // In a real app, this would be an API call to a service like Google Maps
    setTimeout(() => {
      const mockHospitals: Hospital[] = [
        {
          name: "City General Hospital",
          address: "123 Medical Center Dr",
          distance: "0.8 miles",
          phone: "555-123-4567",
          emergency: true
        },
        {
          name: "St. Mary's Medical Center",
          address: "456 Health Blvd",
          distance: "1.2 miles",
          phone: "555-987-6543",
          emergency: true
        },
        {
          name: "University Hospital",
          address: "789 Campus Way",
          distance: "2.5 miles",
          phone: "555-456-7890",
          emergency: true
        },
        {
          name: "Community Urgent Care",
          address: "101 Quick Lane",
          distance: "0.5 miles",
          phone: "555-222-3333",
          emergency: false
        },
        {
          name: "Children's Hospital",
          address: "202 Pediatric Ave",
          distance: "3.1 miles",
          phone: "555-789-0123",
          emergency: true
        }
      ];

      setNearbyHospitals(mockHospitals);
      setIsSearchingHospitals(false);
      
      toast({
        title: "Hospitals Found",
        description: `Found ${mockHospitals.length} medical facilities near your location.`
      });
    }, 1500);
  };

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
          <TabsTrigger value="nearby-hospitals">Nearby Hospitals</TabsTrigger>
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

        <TabsContent value="nearby-hospitals">
          <Card>
            <CardHeader>
              <CardTitle>Nearby Hospitals and Medical Facilities</CardTitle>
              <CardDescription>
                Find emergency medical facilities near your current location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                {!userLocation ? (
                  <div className="text-center py-6">
                    <MapPin className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Find Nearby Hospitals</h3>
                    <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                      Enable location services to find emergency medical facilities near you
                    </p>
                    <Button 
                      onClick={getUserLocation} 
                      disabled={isLoadingLocation}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isLoadingLocation ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <Navigation className="mr-2 h-4 w-4" />
                          Use My Location
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Map placeholder - in a real app this would be a map component */}
                    <div 
                      ref={mapContainerRef}
                      className="w-full h-[250px] bg-neutral-100 border rounded-lg mb-6 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <div className="flex justify-center mb-2">
                          <div className="h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <p className="text-sm text-neutral-600">
                          Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                        </p>
                        <p className="text-xs mt-1">
                          (Interactive map would display here in a full implementation)
                        </p>
                      </div>
                    </div>
                    
                    {/* Hospital List */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Medical Facilities Near You</h3>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={getUserLocation}
                          disabled={isLoadingLocation || isSearchingHospitals}
                        >
                          <Search className="h-4 w-4 mr-1" />
                          Refresh
                        </Button>
                      </div>
                      
                      {isSearchingHospitals ? (
                        <div className="text-center py-12">
                          <Loader className="h-8 w-8 mx-auto text-primary animate-spin mb-4" />
                          <p>Searching for nearby hospitals...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {nearbyHospitals.map((hospital, idx) => (
                            <div 
                              key={idx} 
                              className={`p-4 border rounded-lg ${
                                hospital.emergency 
                                  ? "border-l-4 border-l-red-500" 
                                  : "border-l-4 border-l-amber-500"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center">
                                    <Hospital className={`h-5 w-5 mr-2 ${
                                      hospital.emergency ? "text-red-500" : "text-amber-500"
                                    }`} />
                                    <h4 className="font-medium">{hospital.name}</h4>
                                  </div>
                                  <p className="text-sm mt-1">{hospital.address}</p>
                                  <div className="flex items-center mt-2">
                                    <MapPin className="h-4 w-4 text-neutral-500 mr-1" />
                                    <span className="text-sm text-neutral-600">{hospital.distance}</span>
                                    {hospital.emergency && (
                                      <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                                        Emergency Services
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {hospital.phone && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex items-center whitespace-nowrap"
                                    asChild
                                  >
                                    <a href={`tel:${hospital.phone.replace(/[^0-9]/g, '')}`}>
                                      <Phone className="h-4 w-4 mr-1" />
                                      Call
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-neutral-50 border-t text-sm px-6 py-3">
              <p className="text-neutral-600">
                <AlertTriangle className="h-4 w-4 inline-block mr-1 text-amber-500" />
                In a real emergency, always call emergency services directly at <strong>911</strong>.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
