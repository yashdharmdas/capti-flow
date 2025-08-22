import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, AlertCircle, CheckCircle, X, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoUploadProps {
  onUpload: (file: File) => void;
}

const VideoUpload = ({ onUpload }: VideoUploadProps) => {
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validateVideo = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const { videoWidth, videoHeight } = video;
        const aspectRatio = videoWidth / videoHeight;
        
        // Check duration (max 60 seconds)
        if (duration > 60) {
          toast({
            title: "Video too long",
            description: "Please upload a video under 60 seconds",
            variant: "destructive"
          });
          resolve(false);
          return;
        }
        
        // Check aspect ratio (should be close to 9:16 = 0.5625)
        if (Math.abs(aspectRatio - 0.5625) > 0.1) {
          toast({
            title: "Invalid aspect ratio",
            description: "Please upload a 9:16 vertical video",
            variant: "destructive"
          });
          resolve(false);
          return;
        }
        
        resolve(true);
      };
      
      video.onerror = () => {
        toast({
          title: "Invalid video file",
          description: "Please upload a valid video file",
          variant: "destructive"
        });
        resolve(false);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setIsValidating(true);
    
    // Check file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file under 100MB",
        variant: "destructive"
      });
      setIsValidating(false);
      return;
    }
    
    // Validate video properties
    const isValid = await validateVideo(file);
    setIsValidating(false);
    
    if (isValid) {
      toast({
        title: "Video uploaded successfully",
        description: "Processing your video...",
      });
      onUpload(file);
    }
  }, [onUpload, toast]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    maxFiles: 1,
    multiple: false
  });

  return (
    <div className="max-w-2xl mx-auto py-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Upload Your Video</h2>
        <p className="text-muted-foreground">
          Upload a vertical (9:16) video up to 60 seconds long
        </p>
      </div>

      <div 
        {...getRootProps()} 
        className={`upload-zone p-16 text-center cursor-pointer ${
          isDragActive ? 'dragover' : ''
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-6">
          {isValidating ? (
            <div className="animate-pulse">
              <Video size={64} className="text-primary mx-auto mb-4" />
              <p className="text-lg font-medium">Validating video...</p>
              <p className="text-muted-foreground">Checking duration and aspect ratio</p>
            </div>
          ) : isDragActive ? (
            <div>
              <Upload size={64} className="text-primary mx-auto mb-4 animate-bounce" />
              <p className="text-lg font-medium">Drop your video here</p>
            </div>
          ) : (
            <div>
              <Upload size={64} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                Drag & drop your video here
              </p>
              <p className="text-muted-foreground mb-4">
                or click to browse files
              </p>
              <button className="btn-secondary">
                Choose Video File
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Requirements */}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        {[
          { icon: Video, title: "Format", desc: "MP4, MOV, AVI, WebM" },
          { icon: CheckCircle, title: "Aspect Ratio", desc: "9:16 (vertical)" },
          { icon: AlertCircle, title: "Duration", desc: "Max 60 seconds" }
        ].map((req, index) => (
          <div key={index} className="flex items-center space-x-3 p-4 bg-card rounded-lg border border-border">
            <req.icon size={20} className="text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{req.title}</p>
              <p className="text-xs text-muted-foreground">{req.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* File Rejection Messages */}
      {fileRejections.length > 0 && (
        <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center space-x-2 text-destructive">
            <X size={16} />
            <p className="font-medium text-sm">Upload Failed</p>
          </div>
          {fileRejections.map(({ file, errors }, index) => (
            <div key={index} className="mt-2">
              <p className="text-sm text-destructive/80">{file.name}</p>
              {errors.map(error => (
                <p key={error.code} className="text-xs text-destructive/60">
                  {error.message}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoUpload;