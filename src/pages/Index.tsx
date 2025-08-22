import { useState } from "react";
import { Upload, Wand2, Play, Download, CheckCircle } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import VideoUpload from "@/components/VideoUpload";
import TemplateSelector from "@/components/TemplateSelector";
import VideoPreview from "@/components/VideoPreview";
import ProcessingStep from "@/components/ProcessingStep";

export type WorkflowStep = 'hero' | 'upload' | 'processing' | 'templates' | 'preview' | 'download';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('hero');
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('minimal');
  const [generatedCaptions, setGeneratedCaptions] = useState<any[]>([]);

  const steps = [
    { id: 'upload', label: 'Upload Video', icon: Upload },
    { id: 'processing', label: 'Generate Captions', icon: Wand2 },
    { id: 'templates', label: 'Choose Style', icon: Play },
    { id: 'preview', label: 'Preview & Edit', icon: CheckCircle },
    { id: 'download', label: 'Download', icon: Download }
  ];

  const handleVideoUpload = (file: File) => {
    setUploadedVideo(file);
    setCurrentStep('processing');
  };

  const handleProcessingComplete = (captions: any[]) => {
    setGeneratedCaptions(captions);
    setCurrentStep('templates');
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setCurrentStep('preview');
  };

  const handleStartOver = () => {
    setCurrentStep('hero');
    setUploadedVideo(null);
    setSelectedTemplate('minimal');
    setGeneratedCaptions([]);
  };

  if (currentStep === 'hero') {
    return <HeroSection onStartClick={() => setCurrentStep('upload')} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleStartOver}
              className="text-2xl font-bold gradient-text"
            >
              CaptiFlow
            </button>
            
            <div className="flex items-center space-x-6">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
                
                return (
                  <div 
                    key={step.id}
                    className={`flex items-center space-x-2 ${
                      isActive ? 'text-primary' : 
                      isCompleted ? 'text-success' : 'text-muted-foreground'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm font-medium hidden md:block">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {currentStep === 'upload' && (
          <VideoUpload onUpload={handleVideoUpload} />
        )}
        
        {currentStep === 'processing' && uploadedVideo && (
          <ProcessingStep 
            videoFile={uploadedVideo}
            onComplete={handleProcessingComplete}
          />
        )}
        
        {currentStep === 'templates' && (
          <TemplateSelector 
            onSelect={handleTemplateSelect}
            selectedTemplate={selectedTemplate}
          />
        )}
        
        {currentStep === 'preview' && uploadedVideo && (
          <VideoPreview 
            videoFile={uploadedVideo}
            captions={generatedCaptions}
            template={selectedTemplate}
            onBackToTemplates={() => setCurrentStep('templates')}
            onDownload={() => setCurrentStep('download')}
          />
        )}
        
        {currentStep === 'download' && (
          <div className="text-center py-16">
            <div className="animate-slide-up">
              <CheckCircle size={64} className="text-success mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Video Ready!</h2>
              <p className="text-muted-foreground mb-8">Your captioned video has been processed successfully.</p>
              <div className="space-y-4">
                <button className="btn-hero">
                  Download Video
                </button>
                <div>
                  <button 
                    onClick={handleStartOver}
                    className="btn-ghost"
                  >
                    Create Another Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;