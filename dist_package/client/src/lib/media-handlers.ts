import { useState } from 'react';
import { apiRequest } from './queryClient';

export function useImageUpload() {
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    
    // Validate file size and type
    const invalidFiles = newFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Only JPG and PNG are supported.');
        return true;
      }
      
      if (file.size > maxSize) {
        setError('File too large. Maximum size is 10MB.');
        return true;
      }
      
      return false;
    });
    
    if (invalidFiles.length > 0) return;
    
    setError(null);
    
    // Create preview URLs
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    
    setImages(prev => [...prev, ...newFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const clearImages = () => {
    // Revoke all URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    setImages([]);
    setPreviewUrls([]);
  };

  return {
    images,
    previewUrls,
    isLoading,
    error,
    handleImageChange,
    removeImage,
    clearImages
  };
}

export function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setAudioBlob(blob);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      recorder.start();
      setIsRecording(true);
      
      // Set up timer
      const startTime = Date.now();
      const timerInterval = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      
      // Store the interval ID to clear it later
      recorder.onstart = () => {
        (recorder as any)._timerInterval = timerInterval;
      };
      
      // Clear the interval when recording stops
      const originalOnStop = recorder.onstop;
      recorder.onstop = (e) => {
        clearInterval((recorder as any)._timerInterval);
        setRecordingTime(0);
        if (originalOnStop) originalOnStop.call(recorder, e);
      };
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check your device permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      
      // Clear the audio URL if it was set
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
        setAudioURL(null);
      }
      
      setAudioBlob(null);
      setIsRecording(false);
    }
  };

  const clearAudio = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
    }
    setAudioBlob(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    audioURL,
    recordingTime,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    clearAudio,
    formattedTime: formatTime(recordingTime)
  };
}
