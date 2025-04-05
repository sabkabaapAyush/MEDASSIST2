import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { type Patient, type MedicalProfessional, type Consultation } from "@shared/schema";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, CalendarCheck, User, Clock, MessageCircle, FileText, Phone, Mail, Star, Video, X, Check, Calendar as CalendarIcon2 } from "lucide-react";

// Consultation request form schema
const consultationFormSchema = z.object({
  patientId: z.number(),
  professionalId: z.number(),
  topic: z.string().min(5, "Topic must be at least 5 characters"),
  status: z.string().default("requested"),
  type: z.string(),
  patientNotes: z.string().optional(),
  scheduledDate: z.date().optional(),
  relatedGuidanceId: z.number().optional(),
});

type ConsultationFormValues = z.infer<typeof consultationFormSchema>;

export default function ConsultationsPage() {
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  
  // Fetch patients
  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });
  
  // Fetch medical professionals
  const { data: professionals } = useQuery<MedicalProfessional[]>({
    queryKey: ['/api/medical-professionals'],
  });
  
  // Fetch consultations filtered by active tab
  const { data: consultations, isLoading: isLoadingConsultations } = useQuery<Consultation[]>({
    queryKey: ['/api/consultations', activeTab],
    queryFn: async () => {
      let endpoint = '/api/consultations';
      
      if (activeTab === 'upcoming') {
        endpoint += '?status=scheduled';
      } else if (activeTab === 'requested') {
        endpoint += '?status=requested';
      } else if (activeTab === 'completed') {
        endpoint += '?status=completed';
      } else if (selectedPatientId) {
        endpoint += `?patientId=${selectedPatientId}`;
      }
      
      return await apiRequest<Consultation[]>(endpoint, {
        method: 'GET'
      });
    },
    enabled: !!activeTab
  });
  
  // Consultation creation mutation
  const createConsultation = useMutation({
    mutationFn: (data: ConsultationFormValues) => {
      return apiRequest<Consultation>('/api/consultations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Consultation request submitted",
        description: "Your request has been sent to the medical professional."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/consultations'] });
    },
    onError: (error) => {
      toast({
        title: "Error submitting request",
        description: "There was a problem with your request. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Update consultation status mutation
  const updateConsultation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<ConsultationFormValues> }) => {
      return apiRequest<Consultation>(`/api/consultations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Consultation updated",
        description: "The consultation status has been updated."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/consultations'] });
    },
    onError: (error) => {
      toast({
        title: "Error updating consultation",
        description: "There was a problem updating the consultation. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Form setup for creating a new consultation
  const form = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationFormSchema),
    defaultValues: {
      patientId: selectedPatientId || 0,
      professionalId: 0,
      topic: "",
      status: "requested",
      type: "video",
      patientNotes: "",
    }
  });
  
  // Update form when selectedPatientId changes
  React.useEffect(() => {
    if (selectedPatientId) {
      form.setValue('patientId', selectedPatientId);
    }
  }, [selectedPatientId, form]);
  
  function onSubmit(data: ConsultationFormValues) {
    createConsultation.mutate(data);
  }
  
  // Find patient name by ID
  const getPatientName = (id: number): string => {
    const patient = patients?.find(p => p.id === id);
    return patient ? patient.name : 'Unknown Patient';
  };
  
  // Find professional by ID
  const getProfessional = (id: number): MedicalProfessional | undefined => {
    return professionals?.find(p => p.id === id);
  };
  
  // Status badge colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Requested</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medical Consultations</h1>
          <p className="text-muted-foreground">
            Schedule and manage consultations with medical professionals
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>Request Consultation</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Request a Medical Consultation</DialogTitle>
              <DialogDescription>
                Fill out the form below to request a consultation with a medical professional.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patients?.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id.toString()}>
                              {patient.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="professionalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Professional</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select medical professional" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {professionals?.map((prof) => (
                            <SelectItem key={prof.id} value={prof.id.toString()}>
                              {prof.name} - {prof.specialization}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultation Topic</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Follow-up on recent injury" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultation Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="video">Video Call</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="chat">Text Chat</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Preferred Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="patientNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide any additional information that might be relevant for the consultation"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={createConsultation.isPending}>
                    {createConsultation.isPending ? "Submitting..." : "Request Consultation"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="requested">Requested</TabsTrigger>
          <TabsTrigger value="completed">Past Consultations</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          {isLoadingConsultations ? (
            <div className="text-center py-8">Loading consultations...</div>
          ) : consultations?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No consultations found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {consultations?.map((consultation) => {
                const professional = getProfessional(consultation.professionalId);
                return (
                  <Card key={consultation.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="font-medium text-lg">{consultation.request}</CardTitle>
                          <CardDescription className="mt-1">
                            Patient: {getPatientName(consultation.patientId)}
                          </CardDescription>
                        </div>
                        {getStatusBadge(consultation.status)}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{professional?.name} ({professional?.specialization})</span>
                      </div>
                      
                      {consultation.scheduledDate && (
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{format(new Date(consultation.scheduledDate), "PPP 'at' p")}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mb-2">
                        {consultation.consultationType === 'video' && <Video className="h-4 w-4 text-muted-foreground" />}
                        {consultation.consultationType === 'phone' && <Phone className="h-4 w-4 text-muted-foreground" />}
                        {consultation.consultationType === 'chat' && <MessageCircle className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-sm capitalize">{consultation.consultationType} consultation</span>
                      </div>
                      
                      {consultation.patientNotes && (
                        <>
                          <Separator className="my-2" />
                          <div className="mt-2">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Patient Notes</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {consultation.patientNotes}
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                    
                    <CardFooter className="flex justify-between pt-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">View Details</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Consultation Details</DialogTitle>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(consultation.status)}
                              <span className="text-sm text-muted-foreground">
                                {consultation.createdAt && `Requested on ${format(new Date(consultation.createdAt), "PPP")}`}
                              </span>
                            </div>
                          </DialogHeader>
                          
                          <div className="py-4 space-y-4">
                            <div>
                              <h3 className="font-medium text-lg">{consultation.request}</h3>
                              <p className="text-muted-foreground">
                                {consultation.consultationType === 'video' && <Video className="inline h-4 w-4 mr-1" />}
                                {consultation.consultationType === 'phone' && <Phone className="inline h-4 w-4 mr-1" />}
                                {consultation.consultationType === 'chat' && <MessageCircle className="inline h-4 w-4 mr-1" />}
                                <span className="capitalize">{consultation.consultationType} consultation</span>
                              </p>
                            </div>
                            
                            <Separator />
                            
                            <div className="flex flex-col sm:flex-row gap-6">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium mb-2">Patient</h4>
                                <p className="text-base mb-1">{getPatientName(consultation.patientId)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {patients?.find(p => p.id === consultation.patientId)?.patientId}
                                </p>
                              </div>
                              
                              <div className="flex-1">
                                <h4 className="text-sm font-medium mb-2">Medical Professional</h4>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-base">{professional?.name}</p>
                                  {professional?.verified && (
                                    <Badge variant="outline" className="bg-green-50 text-green-600 h-5">Verified</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{professional?.specialization}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  {professional?.rating && [...Array(professional.rating)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  ))}
                                </div>
                                
                                <div className="flex flex-col gap-1 mt-3">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{professional?.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{professional?.contact}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {consultation.scheduledDate && (
                              <>
                                <Separator />
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Appointment</h4>
                                  <div className="flex items-center gap-2">
                                    <CalendarIcon2 className="h-4 w-4 text-muted-foreground" />
                                    <span>{format(new Date(consultation.scheduledDate), "PPP 'at' p")}</span>
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {consultation.patientNotes && (
                              <>
                                <Separator />
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Patient Notes</h4>
                                  <p className="text-sm">{consultation.patientNotes}</p>
                                </div>
                              </>
                            )}
                            
                            {consultation.professionalNotes && (
                              <>
                                <Separator />
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Professional Notes</h4>
                                  <p className="text-sm">{consultation.professionalNotes}</p>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <DialogFooter>
                            {consultation.status === 'requested' && (
                              <>
                                <Button
                                  variant="outline"
                                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => updateConsultation.mutate({
                                    id: consultation.id,
                                    data: { status: 'cancelled' }
                                  })}
                                  disabled={updateConsultation.isPending}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel Request
                                </Button>
                                
                                <Button
                                  variant="default"
                                  onClick={() => updateConsultation.mutate({
                                    id: consultation.id,
                                    data: { status: 'scheduled' }
                                  })}
                                  disabled={updateConsultation.isPending}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Schedule Appointment
                                </Button>
                              </>
                            )}
                            
                            {consultation.status === 'scheduled' && (
                              <>
                                <Button
                                  variant="outline"
                                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => updateConsultation.mutate({
                                    id: consultation.id,
                                    data: { status: 'cancelled' }
                                  })}
                                  disabled={updateConsultation.isPending}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel Appointment
                                </Button>
                                
                                <Button
                                  variant="default"
                                  onClick={() => updateConsultation.mutate({
                                    id: consultation.id,
                                    data: { status: 'completed' }
                                  })}
                                  disabled={updateConsultation.isPending}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Mark as Completed
                                </Button>
                              </>
                            )}
                            
                            <DialogClose asChild>
                              <Button variant="ghost">Close</Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      {consultation.status === 'scheduled' && (
                        <Button 
                          variant="default" 
                          size="sm"
                          disabled={updateConsultation.isPending}
                        >
                          Start Consultation
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}