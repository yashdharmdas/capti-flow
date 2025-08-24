import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audioData } = await req.json();

    if (!audioData) {
      throw new Error('Missing audioData in request body');
    }

    console.log('Sending audio to Cleanvoice AI API for upload...');

    // Step 1: Upload audio to Cleanvoice AI
    const uploadFormData = new FormData();
    uploadFormData.append('file', new Blob([Uint8Array.from(atob(audioData), c => c.charCodeAt(0))], { type: 'audio/wav' }), 'audio.wav');

    // Add filename as a query parameter
    const uploadUrl = `https://api.cleanvoice.ai/v1/upload?filename=audio.wav`;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'x-api-key': 'uRYfZ3BxLhnMFhRTPaKLc23pbCmzZG69',
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Cleanvoice AI Upload API error:', errorText);
      throw new Error(`Cleanvoice AI Upload API error: ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    const uploadId = uploadData.upload_id;

    if (!uploadId) {
      throw new Error('Missing upload_id from Cleanvoice AI upload response');
    }

    console.log(`Audio uploaded with ID: ${uploadId}. Sending for enhancement...`);

    // Step 2: Enhance audio using the upload_id
    const enhanceResponse = await fetch('https://api.cleanvoice.ai/v1/enhance', {
      method: 'POST',
      headers: {
        'x-api-key': 'uRYfZ3BxLhnMFhRTPaKLc23pbCmzZG69',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ upload_id: uploadId }),
    });

    if (!enhanceResponse.ok) {
      const errorText = await enhanceResponse.text();
      console.error('Cleanvoice AI Enhance API error:', errorText);
      throw new Error(`Cleanvoice AI Enhance API error: ${errorText}`);
    }

    const enhanceData = await enhanceResponse.json();
    const enhancedAudioUrl = enhanceData.file_url;

    if (!enhancedAudioUrl) {
      throw new Error('Missing file_url from Cleanvoice AI enhance response');
    }

    console.log(`Fetching enhanced audio from: ${enhancedAudioUrl}`);

    const finalAudioResponse = await fetch(enhancedAudioUrl);
    if (!finalAudioResponse.ok) {
      throw new Error(`Failed to fetch enhanced audio from URL: ${enhancedAudioUrl}`);
    }

    const enhancedAudioBlob = await finalAudioResponse.blob();
    const enhancedAudioArrayBuffer = await enhancedAudioBlob.arrayBuffer();
    const enhancedAudioBase64 = btoa(String.fromCharCode(...new Uint8Array(enhancedAudioArrayBuffer)));

    console.log('Audio enhancement completed successfully.');

    return new Response(
      JSON.stringify({ success: true, enhancedAudioBase64: enhancedAudioBase64 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enhance-audio function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
