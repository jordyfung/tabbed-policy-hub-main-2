-- Add signature field to course_completions table for digital signatures
ALTER TABLE public.course_completions 
ADD COLUMN signature TEXT;

-- Add comment to explain the signature field
COMMENT ON COLUMN public.course_completions.signature IS 'Digital signature provided by user upon course completion';
