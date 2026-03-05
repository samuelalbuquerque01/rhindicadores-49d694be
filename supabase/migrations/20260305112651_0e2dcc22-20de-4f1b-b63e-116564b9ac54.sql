
-- Create the atestados bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('atestados', 'atestados', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read atestados" ON storage.objects
FOR SELECT USING (bucket_id = 'atestados');

-- Allow anyone to upload
CREATE POLICY "Public insert atestados" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'atestados');

-- Allow anyone to update their files
CREATE POLICY "Public update atestados" ON storage.objects
FOR UPDATE USING (bucket_id = 'atestados');

-- Allow anyone to delete
CREATE POLICY "Public delete atestados" ON storage.objects
FOR DELETE USING (bucket_id = 'atestados');
