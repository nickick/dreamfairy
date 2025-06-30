-- Create audio storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio',
  'audio',
  true, -- Public bucket for audio files
  10485760, -- 10MB file size limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a']::text[]
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create RLS policies for audio bucket

-- Allow authenticated users to upload their own audio files
CREATE POLICY "Users can upload their own audio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio' AND
  (storage.foldername(name))[1] = 'tts' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to update their own audio files
CREATE POLICY "Users can update their own audio files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'audio' AND
  (storage.foldername(name))[1] = 'tts' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to delete their own audio files
CREATE POLICY "Users can delete their own audio files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio' AND
  (storage.foldername(name))[1] = 'tts' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public read access since bucket is public
CREATE POLICY "Public can read audio files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio');