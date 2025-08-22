-- Create storage bucket for video files
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', false);

-- Create storage policies for video uploads
CREATE POLICY "Videos can be uploaded by everyone" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Videos can be viewed by everyone" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'videos');

CREATE POLICY "Videos can be deleted by everyone" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'videos');