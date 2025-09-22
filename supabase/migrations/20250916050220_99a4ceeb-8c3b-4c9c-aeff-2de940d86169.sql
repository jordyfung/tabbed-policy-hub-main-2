-- Make scorm-packages bucket public to allow direct file access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'scorm-packages';

-- Add RLS policy for public read access to SCORM content
CREATE POLICY "Public read access to SCORM content" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'scorm-packages');

-- Clean up failed course records that have no SCORM data
DELETE FROM public.courses 
WHERE course_type = 'scorm' 
AND (scorm_package_path IS NULL OR scorm_entry_point IS NULL);