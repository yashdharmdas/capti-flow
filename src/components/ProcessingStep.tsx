import { useEffect, useState } from "react";
import { Wand2, Volume2, FileText, CheckCircle } from "lucide-react";

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
      for (let i = 0; i < processingSteps.length; i++) {
        setCurrentStep(i);
        const step = processingSteps[i];
        
        // Simulate progress during each step
        const progressIncrement = 100 / processingSteps.length;
        const stepStartProgress = i * progressIncrement;
        
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            const newProgress = Math.min(prev + 2, stepStartProgress + progressIncrement);
            return newProgress;
          });
        }, step.duration / 50);
        
        await new Promise(resolve => setTimeout(resolve, step.duration));
        clearInterval(progressInterval);
        setProgress((i + 1) * progressIncrement);
      }
      
      // Generate mock captions
      const mockCaptions = [
        { id: 1, text: "Welcome to our amazing product demo", startTime: 0, endTime: 3 },
        { id: 2, text: "This is how it works in practice", startTime: 3, endTime: 6 },
        { id: 3, text: "You can see the incredible results", startTime: 6, endTime: 9 },
        { id: 4, text: "Perfect for social media content", startTime: 9, endTime: 12 },
        { id: 5, text: "Try it yourself today", startTime: 12, endTime: 15 }
      ];
      
      setTimeout(() => {
        onComplete(mockCaptions);
      }, 500);
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