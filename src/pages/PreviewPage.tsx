import { useState } from "react";
import VideoPreview from "@/components/VideoPreview";

const PreviewPage = () => {
  // Mock video source URL - for UI/UX preview only
  const mockVideoSource = "https://cdn.pixabay.com/video/2022/04/16/114109-700585365_large.mp4"; // A small, publicly accessible MP4 video

  // Mock captions data
  const mockCaptions = [
    { id: 1, text: "What would CEO do if he", startTime: 0, endTime: 3, highlightedWord: "CEO" },
    { id: 2, text: "lost broke again?", startTime: 3, endTime: 5, highlightedWord: "broke" },
    { id: 3, text: "PAY ATTENTION.", startTime: 5, endTime: 7, highlightedWord: "ATTENTION."}, // Removed styleName
    { id: 4, text: "back on his feet and building", startTime: 7, endTime: 10, highlightedWord: "building" },
    { id: 5, text: "MARKETS THAT THE BIG GUYS", startTime: 10, endTime: 13 }, // Removed styleName
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
    <div className="h-screen w-screen">
      <VideoPreview
        videoSource={mockVideoSource} // Pass the mock video URL
        captions={mockCaptions}
        template={mockTemplate}
        onBackToTemplates={handleBackToTemplates}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default PreviewPage;
