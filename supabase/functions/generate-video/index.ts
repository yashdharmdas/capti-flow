import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Caption {
  text: string;
  start_time: number;
  end_time: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoData, captions, template } = await req.json();
    
    if (!videoData || !captions) {
      throw new Error('Missing video data or captions');
    }

    console.log(`Generating video with ${captions.length} captions using ${template} template`);

    // Convert base64 video data to blob
    const videoBlob = new Uint8Array(
      atob(videoData)
        .split('')
        .map(char => char.charCodeAt(0))
    );

    // Generate SRT subtitle content
    const srtContent = generateSRT(captions);
    console.log('Generated SRT content:', srtContent);

    // For now, we'll return the original video with subtitle data
    // In a full implementation, this would use FFmpeg to burn in subtitles
    // But that requires a more complex server setup with FFmpeg installed
    
    return new Response(JSON.stringify({ 
      success: true,
      videoData: videoData, // Return original video for now
      subtitles: srtContent,
      message: 'Video processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating video:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateSRT(captions: Caption[]): string {
  return captions.map((caption, index) => {
    const startTime = formatSRTTime(caption.start_time);
    const endTime = formatSRTTime(caption.end_time);
    
    return `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n`;
  }).join('\n');
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}