import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let requestBody;
  try {
    requestBody = await req.json();
  } catch (error) {
    console.error('Error parsing request body:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { videoId, audioData, videoDuration } = requestBody;
    
    if (!videoId || !audioData || videoDuration === undefined) {
      throw new Error('Missing videoId, audioData, or videoDuration');
    }

    console.log('Starting transcription for video:', videoId);

    // Update video status to processing
    await supabaseClient
      .from('videos')
      .update({ status: 'processing' })
      .eq('id', videoId);

    // Convert base64 audio to blob for LemonFox Whisper API
    const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
    const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });

    // Prepare form data for LemonFox Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('language', 'english');
    formData.append('response_format', 'json');

    console.log('Sending audio to Lemonfox Whisper API...');

    // Call Lemonfox Whisper API
    const whisperResponse = await fetch('https://api.lemonfox.ai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer jjfHhdimCVAWdj29SzhyeuWCN7o3beIc`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('Lemonfox Whisper API error:', errorText);
      throw new Error(`Lemonfox Whisper API error: ${errorText}`);
    }

    const transcriptionResult = await whisperResponse.json();
    console.log('Transcription completed:', transcriptionResult.text);

    const fullText = transcriptionResult.text || '';
    const words = fullText.split(/\s+/);
    const captions = [];
    const idealWordsPerCaption = 4;
    let currentWordIndex = 0;

    while (currentWordIndex < words.length) {
      const segmentWords = words.slice(currentWordIndex, currentWordIndex + idealWordsPerCaption);
      if (segmentWords.length === 0) break;

      const text = segmentWords.join(' ').trim();
      if (text) {
        captions.push({ text });
      }
      currentWordIndex += segmentWords.length;
    }

    // Distribute timestamps evenly
    if (videoDuration > 0 && captions.length > 0) {
      const timePerCaption = videoDuration / captions.length;
      for (let i = 0; i < captions.length; i++) {
        captions[i].start_time = i * timePerCaption;
        captions[i].end_time = (i + 1) * timePerCaption;
      }
    } else if (captions.length > 0) {
        // Fallback if videoDuration is 0 or not provided properly (should not happen with new changes)
        const defaultTimePerCaption = 3; // 3 seconds per caption fallback
        for (let i = 0; i < captions.length; i++) {
            captions[i].start_time = i * defaultTimePerCaption;
            captions[i].end_time = (i + 1) * defaultTimePerCaption;
        }
    }

    console.log(`Generated ${captions.length} caption segments`);

    // Store captions in database
    if (captions.length > 0) {
      const captionInserts = captions.map(caption => ({
        video_id: videoId,
        text: caption.text,
        start_time: caption.start_time,
        end_time: caption.end_time,
      }));

      const { error: captionsError } = await supabaseClient
        .from('captions')
        .insert(captionInserts);

      if (captionsError) {
        throw new Error(`Error inserting captions: ${captionsError.message}`);
      }
    }

    // Update video status to completed
    await supabaseClient
      .from('videos')
      .update({ status: 'completed' })
      .eq('id', videoId);

    console.log('Transcription process completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        captions: captions,
        originalText: transcriptionResult.text 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transcribe-video function:', error);

    // Update video status to failed if we have a videoId
    try {
      const { videoId } = requestBody;
      if (videoId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );
        
        await supabaseClient
          .from('videos')
          .update({ 
            status: 'failed',
            error_message: error.message 
          })
          .eq('id', videoId);
      }
    } catch (updateError) {
      console.error('Error updating video status:', updateError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});