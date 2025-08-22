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

    const { videoId, audioData } = requestBody;
    
    if (!videoId || !audioData) {
      throw new Error('Missing videoId or audioData');
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
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');

    console.log('Sending audio to OpenAI Whisper API...');

    // Call OpenAI Whisper API (using OpenAI key for now)
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('OpenAI Whisper API error:', errorText);
      throw new Error(`OpenAI Whisper API error: ${errorText}`);
    }

    const transcriptionResult = await whisperResponse.json();
    console.log('Transcription completed:', transcriptionResult.text);

    // Process words into caption segments (3-5 words per caption)
    const words = transcriptionResult.words || [];
    const captions = [];
    let currentCaption = { words: [], start: 0, end: 0 };

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      if (currentCaption.words.length === 0) {
        currentCaption.start = word.start;
      }
      
      currentCaption.words.push(word.word);
      currentCaption.end = word.end;

      // Create caption segment when we have 3-5 words or reach end of words
      if (currentCaption.words.length >= 3 && (currentCaption.words.length >= 5 || i === words.length - 1)) {
        captions.push({
          text: currentCaption.words.join(' ').trim(),
          start_time: currentCaption.start,
          end_time: currentCaption.end,
          word_index: i - currentCaption.words.length + 1
        });
        currentCaption = { words: [], start: 0, end: 0 };
      }
    }

    // If no words were provided, create captions from segments
    if (words.length === 0 && transcriptionResult.segments) {
      for (let i = 0; i < transcriptionResult.segments.length; i++) {
        const segment = transcriptionResult.segments[i];
        const segmentWords = segment.text.trim().split(' ');
        
        // Break long segments into smaller captions
        for (let j = 0; j < segmentWords.length; j += 4) {
          const captionWords = segmentWords.slice(j, j + 4);
          const startRatio = j / segmentWords.length;
          const endRatio = Math.min((j + 4) / segmentWords.length, 1);
          const duration = segment.end - segment.start;
          
          captions.push({
            text: captionWords.join(' '),
            start_time: segment.start + (duration * startRatio),
            end_time: segment.start + (duration * endRatio),
            word_index: j
          });
        }
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
        word_index: caption.word_index
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