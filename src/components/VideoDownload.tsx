import { useState } from "react";
import { Download, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ErrorHandler, ProcessingError } from "@/lib/errorHandler";
import ErrorDisplay from "./ErrorDisplay";
import { toast } from "@/hooks/use-toast";

interface Caption {
  id: number;
  text: string;
  startTime: number;
  endTime: number;
}

interface VideoDownloadProps {
  videoFile: File;
  captions: Caption[];
  template: string;
  onStartOver: () => void;
}

const VideoDownload = ({ videoFile, captions, template, onStartOver }: VideoDownloadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<ProcessingError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const validateInputs = () => {
    if (!videoFile) {
      throw new Error('No video file available for download');
    }
    
    if (!captions || captions.length === 0) {
      throw new Error('No captions available for video generation');
    }
    
    if (!template) {
      throw new Error('No template selected for caption styling');
    }
    
    // Check video file size for processing
    if (videoFile.size > 200 * 1024 * 1024) { // 200MB limit for video generation
      throw new Error('Video file too large for processing. Maximum size is 200MB.');
    }
  };

  const convertVideoToBase64 = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Video file appears to be empty');
      }
      
      // Convert in chunks to avoid memory issues with large files
      const chunkSize = 1024 * 1024; // 1MB chunks
      const uint8Array = new Uint8Array(arrayBuffer);
      let base64String = '';
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        base64String += btoa(String.fromCharCode(...chunk));
      }
      
      return base64String;
    } catch (error: any) {
      console.error('Error converting video to base64:', error);
      throw new Error(`Failed to process video file: ${error.message}`);
    }
  };

  const handleDownload = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      console.log('🎬 Starting video download generation...');
      
      // Step 1: Validate inputs
      validateInputs();
      
      console.log('✅ Validation complete');
      
      // Step 2: Convert video to base64
      console.log('🔄 Converting video to base64...');
      const base64Video = await convertVideoToBase64(videoFile);
      
      console.log('✅ Video conversion complete, size:', base64Video.length);
      
      // Step 3: Call edge function to process video with captions
      console.log('🎯 Calling video generation service...');
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: {
          videoData: base64Video,
          captions: captions.map(caption => ({
            text: caption.text,
            start_time: caption.startTime,
            end_time: caption.endTime
          })),
          template: template
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Video generation service error: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Video generation failed without specific error');
      }

      console.log('✅ Video generation service completed');

      // Step 4: Create and download files
      console.log('💾 Creating download files...');
      
      // Create video blob from processed data
      const videoBlob = new Blob([new Uint8Array(atob(data.videoData).split('').map(c => c.charCodeAt(0)))], 
        { type: 'video/mp4' });
      
      if (videoBlob.size === 0) {
        throw new Error('Generated video file is empty');
      }
      
      const videoUrl = URL.createObjectURL(videoBlob);
      
      // Download the video
      const videoLink = document.createElement('a');
      videoLink.href = videoUrl;
      videoLink.download = `${videoFile.name.split('.')[0]}_captioned.mp4`;
      document.body.appendChild(videoLink);
      videoLink.click();
      document.body.removeChild(videoLink);
      
      // Create and download subtitle file
      if (data.subtitles) {
        const srtBlob = new Blob([data.subtitles], { type: 'text/plain' });
        const srtUrl = URL.createObjectURL(srtBlob);
        const srtLink = document.createElement('a');
        srtLink.href = srtUrl;
        srtLink.download = `${videoFile.name.split('.')[0]}_captions.srt`;
        document.body.appendChild(srtLink);
        srtLink.click();
        document.body.removeChild(srtLink);
        
        // Cleanup SRT URL
        setTimeout(() => URL.revokeObjectURL(srtUrl), 1000);
      }
      
      setDownloadUrl(videoUrl);
      
      toast({
        title: "Download Complete!",
        description: "Your captioned video has been downloaded successfully",
      });
      
      console.log('🎉 Download process completed successfully');
      
      // Cleanup video URL after delay
      setTimeout(() => {
        URL.revokeObjectURL(videoUrl);
      }, 5000);
      
    } catch (error: any) {
      console.error('❌ Error in download process:', error);
      
      const processedError = ErrorHandler.handle(error, 'video_generation');
      setError(processedError);
      ErrorHandler.showError(processedError);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async () => {
    if (retryCount >= 3) {
      toast({
        title: "Maximum retries exceeded",
        description: "Please try again later or contact support",
        variant: "destructive"
      });
      return;
    }
    
    setRetryCount(prev => prev + 1);
    
    // Add delay for retry
    const delay = ErrorHandler.getRetryDelay(retryCount);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    await handleDownload();
  };

  const handleDismissError = () => {
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Your Video is Ready!</h2>
        <p className="text-muted-foreground">
          Your video has been processed with {captions.length} caption segments using the {template} template.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-8">
          <ErrorDisplay 
            error={error}
            onRetry={error.canRetry ? handleRetry : undefined}
            onDismiss={handleDismissError}
            showTechnicalDetails={retryCount >= 2}
          />
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-6 mb-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-left">
            <span className="text-muted-foreground">Original File:</span>
            <p className="font-medium">{videoFile.name}</p>
          </div>
          <div className="text-left">
            <span className="text-muted-foreground">File Size:</span>
            <p className="font-medium">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
          <div className="text-left">
            <span className="text-muted-foreground">Captions:</span>
            <p className="font-medium">{captions.length} segments</p>
          </div>
          <div className="text-left">
            <span className="text-muted-foreground">Template:</span>
            <p className="font-medium capitalize">{template}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleDownload}
          disabled={isProcessing}
          className="btn-hero w-full max-w-md mx-auto flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Download className="mr-2 w-5 h-5" />
              Download Video
            </>
          )}
        </button>

        <button
          onClick={onStartOver}
          className="btn-secondary w-full max-w-md mx-auto"
        >
          Create Another Video
        </button>
      </div>

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> This demo downloads the original video file. 
          In a production implementation, this would generate a new video with captions burned-in.
        </p>
      </div>
    </div>
  );
};

export default VideoDownload;