import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usePatient } from "@/context/patient-context";
import { MedicalRecord, insertMedicalRecordSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { INJURY_TYPES, INJURY_STATUS } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RecordItem from "@/components/record/record-item";
import { Loader, PlusCircle } from "lucide-react";

const recordFormSchema = insertMedicalRecordSchema.extend({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.string().min(1, "Please select a type"),
  status: z.string().min(1, "Please select a status"),
});

type RecordFormData = z.infer<typeof recordFormSchema>;

export default function MedicalRecords() {
  const { currentPatient } = usePatient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  
  const { data: records, isLoading } = useQuery<MedicalRecord[]>({
    queryKey: currentPatient 
      ? [`/api/medical-records/patient/${currentPatient.id}`] 
      : ["medical-records-empty"],
    enabled: !!currentPatient,
  });
  
  const form = useForm<RecordFormData>({
    resolver: zodResolver(recordFormSchema),
    defaultValues: {
      patientId: currentPatient?.id || 0,
      title: "",
      description: "",
      type: "",
      status: "",
      images: [],
    },
  });
  
  const mutation = useMutation({
    mutationFn: async (data: RecordFormData) => {
      if (editingRecord) {
        const response = await apiRequest("PUT", `/api/medical-records/${editingRecord.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/medical-records", data);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: editingRecord ? "Record Updated" : "Record Created",
        description: editingRecord 
          ? "Medical record has been updated successfully." 
          : "New medical record has been created successfully.",
      });
      
      if (currentPatient) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/medical-records/patient/${currentPatient.id}`]
        });
      }
      
      setDialogOpen(false);
      setEditingRecord(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: editingRecord 
          ? "Failed to update medical record. Please try again." 
          : "Failed to create medical record. Please try again.",
        variant: "destructive",
      });
      console.error("Mutation error:", error);
    },
  });
  
  const openEditDialog = (record: MedicalRecord) => {
    setEditingRecord(record);
    form.reset({
      patientId: record.patientId,
      title: record.title,
      description: record.description,
      type: record.type,
      status: record.status,
      images: record.images || [],
    });
    setDialogOpen(true);
  };
  
  const openNewDialog = () => {
    setEditingRecord(null);
    form.reset({
      patientId: currentPatient?.id || 0,
      title: "",
      description: "",
      type: "",
      status: "",
      images: [],
    });
    setDialogOpen(true);
  };
  
  const onSubmit = (data: RecordFormData) => {
    if (!currentPatient) {
      toast({
        title: "No Patient Selected",
        description: "Please select a patient before creating a medical record.",
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate({
      ...data,
      patientId: currentPatient.id,
    });
  };

  if (!currentPatient) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <h2 className="text-xl font-semibold mb-2">No Patient Selected</h2>
          <p className="text-muted-foreground mb-6">
            Please select or create a patient profile to view and manage medical records.
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Medical Records</h1>
        <Button onClick={openNewDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Record
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !records || records.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="text-xl font-semibold mb-2">No Medical Records</h2>
            <p className="text-muted-foreground mb-6">
              There are no medical records for this patient yet.
            </p>
            <Button onClick={openNewDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add First Record
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <RecordItem 
              key={record.id} 
              record={record} 
              onEdit={openEditDialog} 
            />
          ))}
        </div>
      )}
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? "Edit Medical Record" : "Add New Medical Record"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Title of the medical record" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type of injury/condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INJURY_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select current status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INJURY_STATUS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of the injury, treatment, and progress" 
                        rows={5}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{editingRecord ? "Update Record" : "Add Record"}</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
