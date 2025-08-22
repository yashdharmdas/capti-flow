import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Download, ArrowLeft, Edit3, Settings } from "lucide-react";

interface Caption {
  id: number;
  text: string;
  startTime: number;
  endTime: number;
}

interface VideoPreviewProps {
  videoFile: File;
  captions: Caption[];
  template: string;
  onBackToTemplates: () => void;
  onDownload: () => void;
}

const VideoPreview = ({ videoFile, captions, template, onBackToTemplates, onDownload }: VideoPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(null);
  const [editingCaption, setEditingCaption] = useState<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Find current caption
      const current = captions.find(
        caption => video.currentTime >= caption.startTime && video.currentTime < caption.endTime
      );
      setCurrentCaption(current || null);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [captions]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    console.log('Toggle play/pause - Current state:', isPlaying);
    console.log('Video readyState:', video.readyState);
    console.log('Video networkState:', video.networkState);

    if (isPlaying) {
      video.pause();
    } else {
      // Add error handling for play() promise
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Video play started successfully');
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error('Video play failed:', error);
            // Try to play muted if autoplay policy blocked it
            video.muted = true;
            return video.play();
          })
          .then(() => {
            console.log('Video play started (muted)');
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error('Video play failed even when muted:', error);
          });
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * duration;
  };

  const restartVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = 0;
    setCurrentTime(0);
  };

  const getCaptionStyle = (template: string) => {
    switch (template) {
      case 'bold':
        return 'caption-bold';
      case 'gradient':
        return 'caption-gradient';
      case 'neon':
        return 'caption-neon';
      default:
        return 'caption-minimal';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Preview Your Video</h2>
        <p className="text-muted-foreground">
          Review your captions and make any final adjustments before downloading
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Video Player */}
        <div className="space-y-4">
          <div className="aspect-[9/16] bg-black rounded-2xl overflow-hidden relative max-w-md mx-auto">
            <video
              ref={videoRef}
              src={URL.createObjectURL(videoFile)}
              className="w-full h-full object-cover"
              controls={false}
              preload="metadata"
              muted
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onLoadedData={() => console.log('Video data loaded successfully')}
              onCanPlay={() => console.log('Video can start playing')}
              onError={(e) => {
                console.error('Video error:', e);
                console.error('Error details:', videoRef.current?.error);
              }}
            />
            
            {/* Caption Overlay */}
            {currentCaption && (
              <div className="absolute bottom-16 left-4 right-4 text-center">
                <p className={getCaptionStyle(template)}>
                  {currentCaption.text}
                </p>
              </div>
            )}
          </div>

          {/* Video Controls */}
          <div className="bg-card rounded-lg border border-border p-4 max-w-md mx-auto">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={togglePlayPause}
                className="bg-primary text-primary-foreground rounded-full p-3 hover:bg-primary/90 transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <button
                onClick={restartVideo}
                className="btn-ghost"
              >
                <RotateCcw size={16} />
              </button>

              <div className="flex items-center text-sm text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span className="mx-2">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Timeline */}
            <div 
              className="video-timeline cursor-pointer"
              onClick={handleSeek}
            >
              <div 
                className="video-timeline-progress"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Caption Editor */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Caption Timeline</h3>
            <div className="flex space-x-2">
              <button className="btn-ghost">
                <Settings size={16} className="mr-2" />
                Style
              </button>
              <button 
                onClick={onBackToTemplates}
                className="btn-ghost"
              >
                <ArrowLeft size={16} className="mr-2" />
                Templates
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {captions.map((caption) => (
              <div
                key={caption.id}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  currentCaption?.id === caption.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card/50 hover:bg-card'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm text-muted-foreground">
                    {formatTime(caption.startTime)} - {formatTime(caption.endTime)}
                  </div>
                  <button 
                    onClick={() => setEditingCaption(caption.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
                
                {editingCaption === caption.id ? (
                  <input
                    type="text"
                    value={caption.text}
                    className="w-full bg-input border border-border rounded px-3 py-2 text-sm"
                    onBlur={() => setEditingCaption(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingCaption(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <p className="text-sm">{caption.text}</p>
                )}
              </div>
            ))}
          </div>

          {/* Export Options */}
          <div className="bg-card/50 rounded-lg border border-border p-6">
            <h4 className="font-semibold mb-4">Export Settings</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Resolution</span>
                <span className="text-muted-foreground">1080p (Original)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Format</span>
                <span className="text-muted-foreground">MP4</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Captions</span>
                <span className="text-muted-foreground">Embedded</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button 
              onClick={onDownload}
              className="btn-hero w-full"
            >
              <Download className="mr-2" size={20} />
              Download Video
            </button>
            <button 
              onClick={onBackToTemplates}
              className="btn-secondary w-full"
            >
              Change Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;