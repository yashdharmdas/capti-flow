import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Download, ArrowLeft, Edit3, Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { extractAudioFromVideo } from "@/lib/audioExtractor";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Caption {
  id: number;
  text: string;
  startTime: number;
  endTime: number;
  highlightedWord?: string; // New: Optional word to highlight in green
}

interface VideoPreviewProps {
  videoSource: string; // Changed from videoFile: File;
  captions: Caption[];
  template: string;
  onBackToTemplates: () => void;
  onDownload: (useEnhancedAudio: boolean) => void;
}

const VideoPreview = ({ videoSource, captions, template, onBackToTemplates, onDownload }: VideoPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(null);
  const [editingCaption, setEditingCaption] = useState<number | null>(null);
  const [isVoiceEnhanced, setIsVoiceEnhanced] = useState(false);
  const [isProcessingEnhancement, setIsProcessingEnhancement] = useState(false);
  const [enhancedAudioUrl, setEnhancedAudioUrl] = useState<string | null>(null);
  const [originalVideoUrl, setOriginalVideoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("choose-style");
  const [selectedCaptionStyle, setSelectedCaptionStyle] = useState<string>("Stellar");
  const [captionPosition, setCaptionPosition] = useState<number>(50); // New state for caption vertical position (0-100%)
  const [fontSize, setFontSize] = useState<number>(42); // New state for font size in px

  const { toast } = useToast();

  // Define your caption styles here
  const captionStyles = [
    { id: 1, name: "Stellar" },
    { id: 2, name: "Cosmo" },
    { id: 3, name: "Vibrant" },
    { id: 4, name: "Radiant" },
    { id: 5, name: "Glow" },
    { id: 6, name: "Flare" },
    { id: 7, name: "Pulse" },
    { id: 8, name: "Echo" },
    { id: 9, name: "Wave" },
    { id: 10, name: "Zenith" },
    { id: 11, name: "Aura" },
    { id: 12, name: "Apex" },
    { id: 13, name: "Quantum" },
    { id: 14, name: "Nebula" },
    { id: 15, name: "Fusion" },
    { id: 16, name: "Pixel" },
    { id: 17, name: "Matrix" },
    { id: 18, name: "Synapse" },
    { id: 19, name: "Cipher" },
    { id: 20, name: "Vector" },
    { id: 21, name: "Nova" },
    { id: 22, name: "Onyx" },
  ];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set video source directly to prevent re-loading
    video.src = videoSource;

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

    const handleCanPlay = () => {
    };

    const handleError = (e: Event) => {
      if (video.error) {
      }
    };

    const handleLoadStart = () => {
    };

    const handleLoadedData = () => {
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoSource, captions]); // Only depend on videoSource and captions to prevent re-renders

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      // Add error handling for play() promise
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            // Try to play muted if autoplay policy blocked it
            video.muted = true;
            return video.play();
          })
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            // Check if video has valid source
          });
      } else {
        setIsPlaying(true);
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

  const handleVoiceEnhancerToggle = async () => {
    if (!isVoiceEnhanced) {
      // If turning ON enhancement
      if (enhancedAudioUrl) {
        // If enhanced audio is already cached, use it directly
        if (videoRef.current) {
          setOriginalVideoUrl(videoRef.current.src); // Store original video URL
          videoRef.current.src = enhancedAudioUrl;
          videoRef.current.load();
          videoRef.current.play();
        }
        setIsVoiceEnhanced(true);
        return; // Exit early as no new processing is needed
      }

      setIsProcessingEnhancement(true);
      try {
        const audioBase64 = await extractAudioFromVideo(videoSource); // Pass videoSource directly
        // Temporarily disable Supabase function invocation for UI/UX preview
        // const { data, error } = await supabase.functions.invoke('enhance-audio', {
        //   body: { audioData: audioBase64 },
        // });

        // if (error) {
        //   throw new Error(`Supabase function error: ${error.message}`);
        // }
        // if (!data?.success || !data?.enhancedAudioBase64) {
        //   throw new Error(data?.error || 'Audio enhancement failed');
        // }

        // const enhancedAudioBlob = new Blob(
        //   [Uint8Array.from(atob(data.enhancedAudioBase64), c => c.charCodeAt(0))],
        //   { type: 'audio/wav' }
        // );
        // const url = URL.createObjectURL(enhancedAudioBlob);
        // setEnhancedAudioUrl(url);
        // setIsVoiceEnhanced(true);
        // if (videoRef.current) {
        //   setOriginalVideoUrl(videoRef.current.src); // Store original video URL
        //   videoRef.current.src = url;
        //   videoRef.current.load();
        //   videoRef.current.play();
        // }

        // --- Temporary Placeholder for UI/UX Preview (simulating success) ---
        setEnhancedAudioUrl(videoRef.current?.src || null); // Keep current audio for preview
        setIsVoiceEnhanced(true);
        if (videoRef.current) {
          // Optionally, play a dummy enhanced audio or just keep current
          // For now, we'll just set it to true to see the UI change
          videoRef.current.play();
        }
        // --- End Temporary Placeholder ---

      } catch (error) {
        // Revert toggle and show error message
        setIsVoiceEnhanced(false);
        setEnhancedAudioUrl(null);
        toast({
          title: "Audio Enhancement Failed",
          description: `Error: ${error.message || "Unknown error"}. Reverting to original audio.`, 
          variant: "destructive",
        });
      } finally {
        setIsProcessingEnhancement(false);
      }
    } else {
      // If turning OFF enhancement, revert to original audio
      if (videoRef.current && originalVideoUrl) {
        videoRef.current.src = originalVideoUrl;
        videoRef.current.load();
        videoRef.current.play();
      }
      setEnhancedAudioUrl(null);
      setOriginalVideoUrl(null);
      setIsVoiceEnhanced(false);
    }
  };

  const handleCompareAudio = async () => {
    if (!videoRef.current || !originalVideoUrl || !enhancedAudioUrl) {
      toast({
        title: "Audio Not Available",
        description: "Original or enhanced audio is not available for comparison.",
        variant: "warning",
      });
      return;
    }

    const currentPlayTime = videoRef.current.currentTime;
    const originalSource = originalVideoUrl;
    const enhancedSource = enhancedAudioUrl;

    // Temporarily switch to original audio
    videoRef.current.src = originalSource;
    videoRef.current.load();
    videoRef.current.currentTime = currentPlayTime;
    videoRef.current.play().catch(e => {
      toast({
        title: "Error Playing Original Audio",
        description: `Could not play original audio: ${e.message || "Unknown error"}.`,
        variant: "destructive",
      });
    });

    // After a short duration, switch back to enhanced audio
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.src = enhancedSource;
        videoRef.current.load();
        videoRef.current.currentTime = currentPlayTime;
        videoRef.current.play().catch(e => {
          toast({
            title: "Error Playing Enhanced Audio",
            description: `Could not play enhanced audio: ${e.message || "Unknown error"}.`,
            variant: "destructive",
          });
        });
      }
    }, 3000); // Play original for 3 seconds
  };

  // We will now use `selectedCaptionStyle` directly in the JSX, so this function might become less relevant.
  // However, if `template` is still used elsewhere for default styling, it can remain.
  // For now, let's ensure `selectedCaptionStyle` is applied. // This function will be deprecated in favor of direct state usage for visual styles. For now, it remains for `template` prop. // I will not remove it, but rather ensure `selectedCaptionStyle` takes precedence for the visual aspect.
  // The original `template` prop will still be passed for other potential uses.

  const renderStyledCaptionText = (text: string, style: string, currentCaption: Caption | null) => {
    if (style === "Stellar" && currentCaption?.highlightedWord) {
      const words = text.split(' ');
      return (
        <div className="font-anton uppercase text-white"> 
          {words.map((word, index) => (
            <span 
              key={index}
              className={`text-stroke-2-black ${ 
                word.toLowerCase() === currentCaption.highlightedWord?.toLowerCase() 
                  ? 'text-green-500' 
                  : 'text-white'
              }`}
            >
              {word}{" "}
            </span>
          ))}
        </div>
      );
    } else if (style === "Cosmo" && currentCaption?.highlightedWord) { // New: Cosmo style
      const words = text.split(' ');
      return (
        <div className="!font-barlow uppercase text-white"> {/* Added !font-barlow */}
          {words.map((word, index) => (
            <span 
              key={index}
              className={`text-stroke-2-black ${ // Added text-stroke-2-black
                word.toLowerCase() === currentCaption.highlightedWord?.toLowerCase()
                  ? 'text-destructive' // Or another orange color from your theme
                  : 'text-white'
                }`}
            >
              {word}{" "}
            </span>
          ))}
        </div>
      );
    } else if (style === "Glow") { // New: Glow style
      return (
        <div className="font-gabarito-important uppercase text-white text-glow font-bold"> {/* Used custom class and font-bold */}
          <span>{text}</span>
        </div>
      );
    }
    // Default rendering if no specific style logic is defined or no highlighted word
    return <span className="text-white font-semibold text-stroke-2-black">{text}</span>; // Ensure text-stroke for default
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background text-foreground p-[5%]">
      {/* Left Column: Video Player and Controls */}
      <div className="w-[30%] flex flex-col items-center justify-center p-4 lg:p-8 bg-[#f9fafc] relative">
        <div className="aspect-[9/16] bg-black rounded-2xl overflow-hidden relative max-w-md w-full">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            controls={false}
            preload="metadata"
            playsInline
            onLoadedData={() => {}}
            onCanPlay={() => {}}
            onError={(e) => {
              console.error('Video error:', e);
              console.error('Error details:', videoRef.current?.error);
            }}
          />
          
          {/* Caption Overlay */}
          {currentCaption ? (
            <div 
              className="absolute left-4 right-4 text-center z-10"
              style={{ bottom: `${captionPosition}%` }}
            >
              <div 
                className="text-white font-semibold" // Base styles for all captions
                style={{ fontSize: `${fontSize}px` }}
              >
                {renderStyledCaptionText(currentCaption.text, selectedCaptionStyle, currentCaption)}
              </div>
            </div>
          ) : (
            <p className="absolute bottom-1/2 left-1/2 -translate-x-1/2 text-red-500 z-10">DEBUG: No Current Caption</p> // Debugging line
          )}
        </div>

        {/* Video Controls (Moved below video, centered) */}
        <div className="bg-card rounded-lg border border-border p-4 w-full max-w-md mx-auto mt-4">
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

          {/* Voice Enhancer Toggle & Compare Audio Button (Removed from here, moved to right sidebar) */}
        </div>
      </div>

      {/* Right Column: Editing Sidebar */}
      <div className="w-[70%] border-l border-border bg-card p-4 lg:p-6 overflow-y-auto">
        <Tabs defaultValue="choose-style" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="choose-style">Choose Style</TabsTrigger>
            <TabsTrigger value="edit-captions">Edit Captions</TabsTrigger>
          </TabsList>
          <TabsContent value="choose-style" className="mt-4">
            {/* Caption Style Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {captionStyles.map((style) => (
                <button
                  key={style.id}
                  className={`p-4 rounded-lg border text-center transition-all duration-200
                    ${selectedCaptionStyle === style.name
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card/50 hover:bg-card'
                    }`}
                  onClick={() => setSelectedCaptionStyle(style.name)}
                >
                  <p className="font-semibold text-lg">{style.name}</p>
                </button>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="edit-captions" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Caption Timeline</h3>
              <div className="flex space-x-2">
                <button className="btn-ghost">
                  <Settings size={16} className="mr-2" />
                  Style
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
                      defaultValue={caption.text}
                      className="w-full bg-input border border-border rounded px-3 py-2 text-sm"
                      onBlur={() => setEditingCaption(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingCaption(null);
                      }}
                      onChange={() => {}} // Fix controlled input warning
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm">{caption.text}</p>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Global Caption Settings - Always visible */}
        <div className="mt-4 p-4 bg-card rounded-lg border border-border space-y-4">
          <h4 className="font-semibold text-lg mb-2">Caption Settings</h4>
          {/* Caption Position Control */}
          <div className="flex items-center space-x-4">
            <label htmlFor="caption-position" className="w-24 text-sm">Position:</label>
            <input
              id="caption-position"
              type="range"
              min="0"
              max="100"
              value={captionPosition}
              onChange={(e) => setCaptionPosition(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <span className="text-sm w-12 text-right">{captionPosition}%</span>
          </div>

          {/* Font Size Control */}
          <div className="flex items-center space-x-4">
            <label htmlFor="font-size" className="w-24 text-sm">Font Size:</label>
            <input
              id="font-size"
              type="range"
              min="10"
              max="100"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <span className="text-sm w-12 text-right">{fontSize}px</span>
          </div>

          {/* Voice Enhancer Toggle */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Settings size={20} className="text-muted-foreground" />
              <div>
                <p className="font-medium">Voice Enhancer</p>
                <p className="text-sm text-muted-foreground">Improve audio clarity and remove background noise</p>
              </div>
            </div>
            {isProcessingEnhancement ? (
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Switch
                id="voice-enhancer"
                checked={isVoiceEnhanced}
                onCheckedChange={handleVoiceEnhancerToggle}
              />
            )}
          </div>

          {/* Compare Audio Button */}
          {isVoiceEnhanced && (
            <button
              onClick={handleCompareAudio}
              className="btn-secondary w-full mt-4"
            >
              Compare Audio (Original/Enhanced)
            </button>
          )}
        </div>

        {/* Export Options */}
        <div className="bg-card rounded-lg border border-border p-4 mt-6">
          <h3 className="font-semibold text-lg mb-4">Export Settings</h3>
          <div className="space-y-3 mb-6">
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

          {/* Action Buttons */}
          <div className="space-y-3">
            <button 
              onClick={() => onDownload(isVoiceEnhanced)}
              className="btn-hero w-full"
            >
              <Download className="mr-2" size={20} />
              Download Video
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;