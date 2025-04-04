import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useImageUpload, useAudioRecording } from "@/lib/media-handlers";
import { usePatient } from "@/context/patient-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Loader, X, Mic, Square } from "lucide-react";

export default function InputSection({ onGuidanceReceived }: { onGuidanceReceived: (guidance: any) => void }) {
  const { currentPatient } = usePatient();
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    images, 
    previewUrls, 
    handleImageChange, 
    removeImage, 
    clearImages 
  } = useImageUpload();
  
  const {
    isRecording,
    audioURL,
    audioBlob,
    recordingTime,
    formattedTime,
    startRecording,
    stopRecording,
    cancelRecording,
    clearAudio
  } = useAudioRecording();

  const assessMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Send the form data directly to the API
      const response = await fetch('/api/first-aid/assess', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process first aid request');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Assessment Complete",
        description: "First aid guidance has been generated based on your input."
      });
      
      // Pass the guidance data to the parent component
      onGuidanceReceived(data);
      
      // Clear the form
      setDescription("");
      clearImages();
      clearAudio();
      
      // Invalidate any cached guidance data
      if (currentPatient) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/first-aid/guidance/patient/${currentPatient.id}`] 
        });
      }
    },
    onError: (error: any) => {
      // Check if it's an API unavailability error
      if (error.response && error.response.data && error.response.data.apiUnavailable) {
        toast({
          title: "AI Service Unavailable",
          description: "The AI assessment service is temporarily unavailable. Please try again later or contact support.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to process your first aid request. Please try again.",
          variant: "destructive"
        });
      }
      console.error("Assessment error:", error);
    }
  });

  const handleSubmit = async () => {
    // Validate that there is at least one input (image, text, or audio)
    if (images.length === 0 && !description && !audioBlob) {
      toast({
        title: "Input Required",
        description: "Please provide an image, description, or voice recording.",
        variant: "destructive"
      });
      return;
    }

    // Prepare the form data
    const formData = new FormData();
    
    // Add images
    images.forEach((image, index) => {
      formData.append(`images`, image);
    });
    
    // Add text description
    if (description) {
      formData.append("text", description);
    }
    
    // Add audio recording if available
    if (audioBlob) {
      formData.append("audio", audioBlob);
    }
    
    // Add patient ID if a patient is selected
    if (currentPatient) {
      formData.append("patientId", currentPatient.id.toString());
    }
    
    // Submit the form
    assessMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">Input Information</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Image Upload */}
        <div className="mb-6">
          <Label className="block text-sm font-medium text-neutral-700 mb-2">Upload Images</Label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-300 rounded-lg p-4 text-center cursor-pointer hover:bg-neutral-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm text-neutral-600">Drag & drop images here or click to browse</p>
            <p className="text-xs text-neutral-500 mt-1">Supported formats: JPG, PNG - Max size: 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept="image/jpeg,image/png"
              onChange={handleImageChange}
            />
          </div>
          
          {/* Preview uploaded images */}
          {previewUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Upload preview ${index + 1}`}
                    className="h-24 w-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className="absolute top-1 right-1 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-neutral-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Text Description */}
        <div className="mb-6">
          <Label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
            Describe the Injury/Symptoms
          </Label>
          <Textarea
            id="description"
            rows={4}
            className="w-full resize-none"
            placeholder="Describe what happened and any symptoms you're experiencing..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        {/* Audio Recording */}
        <div>
          <Label className="block text-sm font-medium text-neutral-700 mb-2">Voice Description</Label>
          
          {/* Not recording state */}
          {!isRecording && !audioURL && (
            <Button
              type="button"
              variant="outline"
              className="flex items-center justify-center w-full p-3"
              onClick={startRecording}
            >
              <Mic className="h-5 w-5 text-neutral-700 mr-2" />
              <span>Start Voice Recording</span>
            </Button>
          )}
          
          {/* Recording in progress */}
          {isRecording && (
            <div className="p-4 border border-neutral-300 rounded-md bg-white">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center">
                  <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="ml-2 text-sm text-neutral-700">Recording...</span>
                </span>
                <span className="text-sm text-neutral-500">{formattedTime}</span>
              </div>
              
              <div className="audio-wave mb-3 h-10 flex items-center gap-[3px]">
                {Array.from({ length: 20 }).map((_, i) => (
                  <span 
                    key={i} 
                    className="w-[3px] bg-primary h-full animate-pulse rounded-[2px]"
                    style={{ 
                      animationDelay: `${(i % 3) * 0.2}s`,
                      height: `${10 + Math.random() * 20}px`
                    }}
                  ></span>
                ))}
              </div>
              
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelRecording}
                >
                  <X className="h-5 w-5" />
                </Button>
                
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="flex items-center"
                  onClick={stopRecording}
                >
                  <Square className="h-5 w-5 mr-1" />
                  Stop
                </Button>
              </div>
            </div>
          )}
          
          {/* Audio preview after recording */}
          {audioURL && !isRecording && (
            <div className="p-4 border border-neutral-300 rounded-md bg-white">
              <audio src={audioURL} controls className="w-full mb-3" />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAudio}
                >
                  Remove Audio
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex items-center justify-end">
          <Button
            type="button"
            disabled={assessMutation.isPending}
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md font-medium ml-3"
          >
            {assessMutation.isPending ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Get First Aid Guidance"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
