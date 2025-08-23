import { useEffect, useState } from "react";
import { Wand2, Volume2, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ErrorHandler, ProcessingError } from "@/lib/errorHandler";
import ErrorDisplay from "./ErrorDisplay";
import { toast } from "@/hooks/use-toast";

// Simple audio extraction function
const extractAudioFromVideo = async (videoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    video.crossOrigin = "anonymous";
    video.src = URL.createObjectURL(videoFile);
    
    video.onloadedmetadata = async () => {
      try {
        console.log('Video loaded, duration:', video.duration);
        
        // For now, convert the entire video file to base64
        // This will be processed by the server to extract audio
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          console.log('Video converted to base64, length:', base64Data.length);
          resolve(base64Data);
        };
        reader.onerror = () => {
          console.error('Failed to read video file');
          reject(new Error('Failed to read video file'));
        };
        reader.readAsDataURL(videoFile);
        
      } catch (error) {
        console.error('Error in audio extraction:', error);
        reject(error);
      }
    };
    
    video.onerror = (error) => {
      console.error('Video loading error:', error);
      reject(new Error('Failed to load video for audio extraction'));
    };
  });
};

interface ProcessingStepProps {
  videoFile: File;
  onComplete: (captions: any[]) => void;
}

const ProcessingStep = ({ videoFile, onComplete }: ProcessingStepProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<ProcessingError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const processingSteps = [
    { icon: Volume2, label: "Extracting audio from video", duration: 2000 },
    { icon: Wand2, label: "Generating captions with AI", duration: 3000 },
    { icon: FileText, label: "Syncing text with timing", duration: 1500 },
    { icon: CheckCircle, label: "Finalizing captions", duration: 1000 }
  ];

  const validateVideoFile = async (file: File): Promise<void> => {
    // Check file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      throw new Error('File size exceeds 100MB limit');
    }
    
    // Check file type
    const supportedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm'];
    if (!supportedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}. Supported formats: MP4, MOV, AVI, WebM`);
    }
    
    // Validate video properties
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const { videoWidth, videoHeight } = video;
        
        if (duration > 60) {
          reject(new Error('Video duration exceeds 60 seconds limit'));
          return;
        }
        
        if (!videoWidth || !videoHeight) {
          reject(new Error('Invalid video dimensions'));
          return;
        }
        
        const aspectRatio = videoWidth / videoHeight;
        if (Math.abs(aspectRatio - 0.5625) > 0.2) { // Allow some tolerance
          reject(new Error('Video must be in vertical format (approximately 9:16 aspect ratio)'));
          return;
        }
        
        resolve();
      };
      
      video.onerror = () => {
        reject(new Error('Invalid or corrupted video file'));
      };
      
      video.src = URL.createObjectURL(file);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Video validation timed out'));
      }, 10000);
    });
  };

  const processVideo = async (): Promise<void> => {
    try {
      setError(null);
      
      // Step 1: Validate video file
      setCurrentStep(0);
      setProgress(5);
      console.log('🔍 Validating video file...');
      
      await validateVideoFile(videoFile);
      
      // Step 2: Create video record in database
      setProgress(10);
      console.log('📝 Creating video record...');
      
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          filename: videoFile.name,
          file_size: videoFile.size,
          status: 'processing'
        })
        .select()
        .single();

      if (videoError) {
        throw new Error(`Database error: ${videoError.message}`);
      }

      const videoId = videoData.id;
      console.log('✅ Video record created:', videoId);
      
      // Step 3: Extract audio from video
      setCurrentStep(1);
      setProgress(25);
      console.log('🎵 Extracting audio from video...');
      
      const audioBase64 = await extractAudioFromVideoWithErrorHandling(videoFile);
      
      // Step 4: Call transcription service
      setCurrentStep(2);
      setProgress(50);
      console.log('🗣️ Calling transcription service...');
      
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions
        .invoke('transcribe-video', {
          body: {
            videoId: videoId,
            audioData: audioBase64
          }
        });

      if (transcriptionError) {
        throw new Error(`Transcription service error: ${transcriptionError.message}`);
      }

      if (!transcriptionData?.success) {
        throw new Error(transcriptionData?.error || 'Transcription failed for unknown reason');
      }

      if (!transcriptionData.captions || transcriptionData.captions.length === 0) {
        throw new Error('No captions were generated. Please ensure your video contains clear speech.');
      }

      // Step 5: Process and validate captions
      setCurrentStep(3);
      setProgress(75);
      console.log('📝 Processing captions...');
      
      const formattedCaptions = transcriptionData.captions.map((caption: any, index: number) => {
        if (!caption.text || typeof caption.text !== 'string') {
          throw new Error('Invalid caption text received');
        }
        
        return {
          id: index + 1,
          text: caption.text.trim(),
          startTime: caption.start_time || 0,
          endTime: caption.end_time || 0
        };
      });

      // Step 6: Finalize
      setProgress(100);
      console.log('✅ Caption generation completed:', formattedCaptions.length, 'segments');
      
      // Wait for visual feedback
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: "Success!",
        description: `Generated ${formattedCaptions.length} caption segments`,
      });
      
      onComplete(formattedCaptions);

    } catch (error: any) {
      console.error('❌ Error processing video:', error);
      
      // Determine the stage based on current step
      let stage = 'unknown';
      if (currentStep === 0) {
        stage = 'upload_validation';
      } else if (currentStep === 1) {
        stage = 'audio_extraction';
      } else if (currentStep === 2) {
        stage = 'transcription';
      } else if (currentStep === 3) {
        stage = 'caption_processing';
      }
      
      const processedError = ErrorHandler.handle(error, stage);
      setError(processedError);
      setProgress(0);
      setCurrentStep(-1); // Set to error state
      
      ErrorHandler.showError(processedError);
    }
  };

  const extractAudioFromVideoWithErrorHandling = async (videoFile: File): Promise<string> => {
    try {
      return await extractAudioFromVideo(videoFile);
    } catch (error: any) {
      if (error.message.includes('Failed to read')) {
        throw new Error('Could not read video file. Please ensure it is not corrupted.');
      } else if (error.message.includes('Failed to load')) {
        throw new Error('Could not load video for processing. Please try a different file format.');
      } else {
        throw new Error(`Audio extraction failed: ${error.message}`);
      }
    }
  };

  const handleRetry = async () => {
    if (retryCount >= 3) {
      toast({
        title: "Maximum retries exceeded",
        description: "Please try with a different video or contact support",
        variant: "destructive"
      });
      return;
    }
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    // Add exponential backoff delay
    const delay = ErrorHandler.getRetryDelay(retryCount);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    await processVideo();
    setIsRetrying(false);
  };

  const handleDismissError = () => {
    setError(null);
  };

  useEffect(() => {
    if (videoFile && !isRetrying) {
      processVideo();
    }
  }, [videoFile]);

  return (
    <div className="max-w-2xl mx-auto py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Processing Your Video</h2>
        <p className="text-muted-foreground">
          Our AI is analyzing your video and generating perfect captions
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

      {/* Video Preview */}
      <div className="max-w-md mx-auto mb-12">
        <div className="aspect-[9/16] bg-gradient-card rounded-2xl border border-border shadow-card overflow-hidden">
          <video 
            src={URL.createObjectURL(videoFile)}
            className="w-full h-full object-cover"
            muted
            loop
            autoPlay
          />
        </div>
      </div>

      {/* Progress Bar */}
      {!error && (
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>
              {currentStep === -1 ? 'Processing failed' : 
               currentStep === 3 && progress === 100 ? 'Complete!' : 
               isRetrying ? `Retrying... (Attempt ${retryCount + 1})` : 
               'Processing...'}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="video-timeline">
            <div 
              className={`video-timeline-progress ${currentStep === -1 ? 'bg-destructive' : 'progress-glow'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Processing Steps */}
      {!error && (
        <div className="space-y-4">
          {processingSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep || (currentStep === 3 && progress === 100);
            const isFailed = currentStep === -1 && index <= currentStep;
            
            return (
              <div 
                key={index}
                className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-300 ${
                  isFailed
                    ? 'border-destructive bg-destructive/5'
                    : isActive 
                    ? 'border-primary bg-primary/5 animate-pulse' 
                    : isCompleted 
                    ? 'border-success bg-success/5' 
                    : 'border-border bg-card/50'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  isFailed
                    ? 'bg-destructive text-destructive-foreground'
                    : isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : isCompleted 
                    ? 'bg-success text-success-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {isFailed ? <AlertTriangle size={20} /> : <Icon size={20} />}
                </div>
                
                <div className="flex-1">
                  <p className={`font-medium ${
                    isFailed
                      ? 'text-destructive'
                      : isActive 
                      ? 'text-primary' 
                      : isCompleted 
                      ? 'text-success' 
                      : 'text-muted-foreground'
                  }`}>
                    {step.label}
                    {isFailed && ' - Failed'}
                  </p>
                </div>
                
                {isCompleted && !isFailed && (
                  <CheckCircle size={20} className="text-success" />
                )}
                
                {isActive && !isFailed && (
                  <div className="w-6 h-6">
                    <div className="animate-spin rounded-full h-full w-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Processing Tips */}
      <div className="mt-12 p-6 bg-card/50 rounded-lg border border-border">
        <h4 className="font-semibold mb-2">💡 Did you know?</h4>
        <p className="text-sm text-muted-foreground">
          Our AI processes over 10,000 videos daily with 95%+ accuracy. 
          The captions are automatically synchronized with your audio for perfect timing.
        </p>
      </div>
    </div>
  );
};

export default ProcessingStep;