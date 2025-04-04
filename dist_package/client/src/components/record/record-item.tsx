import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronUp
} from "lucide-react";
import { MedicalRecord } from "@shared/schema";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface RecordItemProps {
  record: MedicalRecord;
  onEdit: (record: MedicalRecord) => void;
}

export default function RecordItem({ record, onEdit }: RecordItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/medical-records/${record.id}`, null);
      return record.id;
    },
    onSuccess: () => {
      toast({
        title: "Record Deleted",
        description: "The medical record has been deleted successfully."
      });
      
      queryClient.invalidateQueries({ 
        queryKey: [`/api/medical-records/patient/${record.patientId}`] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the medical record. Please try again.",
        variant: "destructive"
      });
      console.error("Delete error:", error);
    }
  });

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <CardTitle className="text-lg font-medium">{record.title}</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => onEdit(record)}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </div>
          <div className="flex items-center mt-1 text-sm text-muted-foreground">
            <span className="mr-2">{formatDate(record.date)}</span>
            <span className="text-xs">({formatRelativeTime(record.date)})</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className={expanded ? "" : "line-clamp-2"}>
            {record.description}
          </p>
          {record.description.length > 150 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 h-8 p-0 text-primary"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Read More
                </>
              )}
            </Button>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
              {record.type}
            </Badge>
            <Badge variant="secondary" className={
              record.status === 'Resolved' || record.status === 'Recovered' 
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : record.status === 'Needs Attention'
                  ? "bg-red-100 text-red-800 hover:bg-red-200"
                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            }>
              {record.status}
            </Badge>
          </div>
        </CardFooter>
      </Card>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the medical record "{record.title}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
