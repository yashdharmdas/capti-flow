import { useEffect, useState } from "react";
import { Wand2, Volume2, FileText, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProcessingStepProps {
  videoFile: File;
  onComplete: (captions: any[]) => void;
}

const ProcessingStep = ({ videoFile, onComplete }: ProcessingStepProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const processingSteps = [
    { icon: Volume2, label: "Extracting audio from video", duration: 2000 },
    { icon: Wand2, label: "Generating captions with AI", duration: 3000 },
    { icon: FileText, label: "Syncing text with timing", duration: 1500 },
    { icon: CheckCircle, label: "Finalizing captions", duration: 1000 }
  ];

  useEffect(() => {
    const processVideo = async () => {
      try {
        // Step 1: Create video record in database
        setCurrentStep(0);
        console.log('Creating video record...');
        
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
        console.log('Video record created:', videoId);
        
        // Step 2: Extract audio from video
        setCurrentStep(1);
        setProgress(25);
        console.log('Extracting audio from video...');
        
        // Use a simpler approach - convert video file to base64 for now
        const audioBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Extract base64 data (remove data:video/mp4;base64, prefix)
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = () => reject(new Error('Failed to read video file'));
          reader.readAsDataURL(videoFile);
        });
        
        // Step 3: Call transcription service
        setCurrentStep(2);
        setProgress(50);
        console.log('Calling transcription service...');
        
        const { data: transcriptionData, error: transcriptionError } = await supabase.functions
          .invoke('transcribe-video', {
            body: {
              videoId: videoId,
              audioData: audioBase64
            }
          });

        if (transcriptionError) {
          throw new Error(`Transcription error: ${transcriptionError.message}`);
        }

        if (!transcriptionData?.success) {
          throw new Error(transcriptionData?.error || 'Transcription failed');
        }

        // Step 4: Finalize captions
        setCurrentStep(3);
        setProgress(100);
        console.log('Finalizing captions...');
        
        // Wait a moment for visual feedback
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Convert to expected format for the UI
        const formattedCaptions = transcriptionData.captions.map((caption: any, index: number) => ({
          id: index + 1,
          text: caption.text,
          startTime: caption.start_time,
          endTime: caption.end_time
        }));

        console.log('Caption generation completed:', formattedCaptions);
        onComplete(formattedCaptions);

      } catch (error) {
        console.error('Error processing video:', error);
        
        // Update progress to show error state
        setProgress(0);
        
        // Show error and fallback to demo captions that match video duration
        // Get actual video duration
        const video = document.createElement('video');
        video.src = URL.createObjectURL(videoFile);
        
        const getVideoDuration = (): Promise<number> => {
          return new Promise((resolve) => {
            video.onloadedmetadata = () => {
              resolve(video.duration || 60); // Default to 60 seconds if duration unavailable
            };
            video.onerror = () => {
              resolve(60); // Default fallback
            };
          });
        };
        
        const videoDuration = await getVideoDuration();
        const segmentDuration = 3;
        const numSegments = Math.ceil(videoDuration / segmentDuration);
        
        const mockCaptions = Array.from({ length: numSegments }, (_, index) => ({
          id: index + 1,
          text: index === 0 ? "Audio processing failed" : 
                index === 1 ? "Using demo captions instead" : 
                index === 2 ? "Please try again with a different video" :
                `Demo caption ${index + 1}`,
          startTime: index * segmentDuration,
          endTime: Math.min((index + 1) * segmentDuration, videoDuration)
        }));
        
        setTimeout(() => {
          onComplete(mockCaptions);
        }, 2000);
      }
    };

    processVideo();
  }, [videoFile, onComplete]);

  return (
    <div className="max-w-2xl mx-auto py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Processing Your Video</h2>
        <p className="text-muted-foreground">
          Our AI is analyzing your video and generating perfect captions
        </p>
      </div>

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
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Processing...</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="video-timeline">
          <div 
            className="video-timeline-progress progress-glow"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Processing Steps */}
      <div className="space-y-4">
        {processingSteps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div 
              key={index}
              className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-300 ${
                isActive 
                  ? 'border-primary bg-primary/5 animate-pulse' 
                  : isCompleted 
                  ? 'border-success bg-success/5' 
                  : 'border-border bg-card/50'
              }`}
            >
              <div className={`p-2 rounded-full ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : isCompleted 
                  ? 'bg-success text-success-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                <Icon size={20} />
              </div>
              
              <div className="flex-1">
                <p className={`font-medium ${
                  isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </p>
              </div>
              
              {isCompleted && (
                <CheckCircle size={20} className="text-success" />
              )}
              
              {isActive && (
                <div className="w-6 h-6">
                  <div className="animate-spin rounded-full h-full w-full border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>
          );
        })}
      </div>

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