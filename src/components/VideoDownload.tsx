import { useState } from "react";
import { Download, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  useEnhancedAudio: boolean;
}

const VideoDownload = ({ videoFile, captions, template, onStartOver, useEnhancedAudio }: VideoDownloadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setIsProcessing(true);
      
      // Log the intended behavior for enhanced audio download
      if (useEnhancedAudio) {
        console.log("Attempting to download video with enhanced audio (server-side processing required).");
      } else {
        console.log("Downloading video with original audio.");
      }

      // Convert video file to base64 for processing
      const arrayBuffer = await videoFile.arrayBuffer();
      const base64Video = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Call edge function to process video with captions
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: {
          videoData: base64Video,
          captions: captions,
          template: template
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Create download with the processed video
      // For now, we'll download the original with subtitle file
      const videoBlob = new Blob([new Uint8Array(atob(data.videoData).split('').map(c => c.charCodeAt(0)))], 
        { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);
      
      // Download the video
      const videoLink = document.createElement('a');
      videoLink.href = videoUrl;
      videoLink.download = `${videoFile.name.split('.')[0]}_captioned.mp4`;
      document.body.appendChild(videoLink);
      videoLink.click();
      document.body.removeChild(videoLink);
      
      // Also download the subtitle file
      const srtBlob = new Blob([data.subtitles], { type: 'text/plain' });
      const srtUrl = URL.createObjectURL(srtBlob);
      const srtLink = document.createElement('a');
      srtLink.href = srtUrl;
      srtLink.download = `${videoFile.name.split('.')[0]}_captions.srt`;
      document.body.appendChild(srtLink);
      srtLink.click();
      document.body.removeChild(srtLink);
      
      setDownloadUrl(videoUrl);
      
      // Cleanup URLs
      setTimeout(() => {
        URL.revokeObjectURL(videoUrl);
        URL.revokeObjectURL(srtUrl);
      }, 1000);
      
    } catch (error) {
      console.error('Error generating video:', error);
    } finally {
      setIsProcessing(false);
    }
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