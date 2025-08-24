import { useState } from "react";
import VideoPreview from "@/components/VideoPreview";

const PreviewPage = () => {
  // Mock video source URL - for UI/UX preview only
  const mockVideoSource = "https://cdn.pixabay.com/video/2022/04/16/114109-700585365_large.mp4"; // A small, publicly accessible MP4 video

  // Mock captions data
  const mockCaptions = [
    { id: 1, text: "What would CEO do if he", startTime: 0, endTime: 3, highlightedWord: "CEO" },
    { id: 2, text: "lost broke again?", startTime: 3, endTime: 5, highlightedWord: "broke" },
    { id: 3, text: "PAY ATTENTION.", startTime: 5, endTime: 7, highlightedWord: "ATTENTION."},
    { id: 4, text: "back on his feet and building", startTime: 7, endTime: 10, highlightedWord: "building" },
    { id: 5, text: "MARKETS THAT THE BIG GUYS", startTime: 10, endTime: 13 },
    { id: 6, text: "to cut back", startTime: 13, endTime: 15, highlightedWord: "cut" },
    { id: 7, text: "I think they would be doing", startTime: 15, endTime: 18, highlightedWord: "doing" },
    { id: 8, text: "what they would do if they were", startTime: 18, endTime: 21, highlightedWord: "do" },
  ];

  const mockTemplate = "Lewis"; // Or any default template you prefer for preview

  const handleBackToTemplates = () => {
    console.log("Back to templates (mock function)");
    // In a real scenario, this would navigate away
  };

  const handleDownload = (useEnhancedAudio: boolean) => {
    console.log(`Download initiated (mock function). Enhanced audio used: ${useEnhancedAudio}`);
    // In a real scenario, this would trigger video download
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col">
      <header className="w-full py-6 px-8 flex items-center justify-between border-b border-border bg-background/80 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <img src="/favicon.ico" alt="CaptiFlow Logo" className="w-8 h-8" />
          <span className="font-bold text-2xl tracking-tight gradient-text">CaptiFlow</span>
        </div>
        <span className="text-muted-foreground font-medium text-lg">Preview & Export</span>
        <div />
      </header>
      <main className="flex-1 flex items-center justify-center p-0 md:p-8">
        <div className="w-full max-w-[1600px] mx-auto">
          <VideoPreview
            videoSource={mockVideoSource}
            captions={mockCaptions}
            template={mockTemplate}
            onBackToTemplates={handleBackToTemplates}
            onDownload={handleDownload}
          />
        </div>
      </main>
    </div>
  );
};

export default PreviewPage;
