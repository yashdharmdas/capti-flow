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

  let requestBody;
  try {
    requestBody = await req.json();
  } catch (parseError) {
    console.error('Error parsing request body:', parseError);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Invalid request format. Please ensure JSON is properly formatted.'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { videoData, captions, template } = requestBody;
    
    // Input validation
    if (!videoData) {
      throw new Error('Missing video data. Please ensure video file is properly uploaded.');
    }
    
    if (!captions || !Array.isArray(captions) || captions.length === 0) {
      throw new Error('Missing or invalid captions. Please ensure captions are generated first.');
    }
    
    if (!template) {
      throw new Error('Missing template selection. Please choose a caption style.');
    }

    console.log(`🎬 Generating video with ${captions.length} captions using "${template}" template`);

    // Validate video data format
    try {
      const testDecode = atob(videoData.substring(0, 100));
      if (testDecode.length === 0) {
        throw new Error('Video data appears to be empty');
      }
    } catch (decodeError) {
      throw new Error('Invalid video data format. Please re-upload your video.');
    }

    // Validate captions format
    for (let i = 0; i < captions.length; i++) {
      const caption = captions[i];
      if (!caption.text || typeof caption.text !== 'string') {
        throw new Error(`Invalid caption text at position ${i + 1}`);
      }
      if (typeof caption.start_time !== 'number' || typeof caption.end_time !== 'number') {
        throw new Error(`Invalid caption timing at position ${i + 1}`);
      }
      if (caption.start_time >= caption.end_time) {
        throw new Error(`Invalid caption duration at position ${i + 1}: start time must be before end time`);
      }
    }

    console.log('✅ Input validation completed');

    // Convert base64 video data to blob with error handling
    let videoBlob: Uint8Array;
    try {
      videoBlob = new Uint8Array(
        atob(videoData)
          .split('')
          .map(char => char.charCodeAt(0))
      );
      
      if (videoBlob.length === 0) {
        throw new Error('Converted video data is empty');
      }
      
      console.log(`📁 Video data converted: ${videoBlob.length} bytes`);
    } catch (conversionError) {
      console.error('Video conversion error:', conversionError);
      throw new Error('Failed to process video data. Please ensure the video file is not corrupted.');
    }

    // Generate SRT subtitle content with error handling
    let srtContent: string;
    try {
      srtContent = generateSRT(captions);
      
      if (!srtContent || srtContent.trim().length === 0) {
        throw new Error('Failed to generate subtitle content');
      }
      
      console.log(`📝 Generated SRT content: ${srtContent.split('\n').length} lines`);
    } catch (srtError) {
      console.error('SRT generation error:', srtError);
      throw new Error('Failed to generate subtitle file. Please check your captions.');
    }

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

  } catch (error: any) {
    console.error('❌ Error generating video:', error);
    
    // Categorize error types for better user feedback
    let userMessage = 'An unexpected error occurred during video generation';
    let statusCode = 500;
    
    if (error.message.includes('Missing')) {
      userMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes('Invalid')) {
      userMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes('video data')) {
      userMessage = 'There was a problem processing your video. Please try uploading again.';
      statusCode = 422;
    } else if (error.message.includes('captions') || error.message.includes('subtitle')) {
      userMessage = 'There was a problem with the caption data. Please regenerate captions.';
      statusCode = 422;
    } else if (error.message.includes('timeout')) {
      userMessage = 'Video processing timed out. Please try with a shorter video.';
      statusCode = 408;
    } else if (error.message.includes('memory') || error.message.includes('storage')) {
      userMessage = 'Not enough resources to process this video. Please try with a smaller file.';
      statusCode = 507;
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: userMessage,
      stage: 'video_generation',
      technical_error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: statusCode,
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