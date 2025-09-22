-- Extend courses table for SCORM support
ALTER TABLE public.courses 
ADD COLUMN course_type text NOT NULL DEFAULT 'manual' CHECK (course_type IN ('manual', 'scorm')),
ADD COLUMN scorm_package_path text,
ADD COLUMN scorm_manifest_data jsonb,
ADD COLUMN scorm_entry_point text;

-- Create SCORM packages storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('scorm-packages', 'scorm-packages', false);

-- Create storage policies for SCORM packages
CREATE POLICY "Admins can upload SCORM packages" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'scorm-packages' AND get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'super-admin'::user_role]));

CREATE POLICY "Admins can view SCORM packages" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'scorm-packages' AND get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'super-admin'::user_role]));

CREATE POLICY "Everyone can view SCORM content" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'scorm-packages' AND (storage.foldername(name))[1] = 'content');

-- Create SCORM sessions table for tracking learner progress
CREATE TABLE public.scorm_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL,
  user_id uuid NOT NULL,
  session_id text NOT NULL,
  cmi_data jsonb DEFAULT '{}'::jsonb,
  lesson_status text DEFAULT 'not attempted',
  lesson_location text,
  completion_status text,
  success_status text,
  score_raw integer,
  score_min integer,
  score_max integer,
  total_time text DEFAULT '0000:00:00.00',
  session_time text DEFAULT '0000:00:00.00',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id, session_id)
);

-- Enable RLS on SCORM sessions
ALTER TABLE public.scorm_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for SCORM sessions
CREATE POLICY "Users can manage own SCORM sessions" 
ON public.scorm_sessions 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all SCORM sessions" 
ON public.scorm_sessions 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'super-admin'::user_role]));

-- Create trigger for updating timestamps
CREATE TRIGGER update_scorm_sessions_updated_at
BEFORE UPDATE ON public.scorm_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_scorm_sessions_course_user ON public.scorm_sessions(course_id, user_id);
CREATE INDEX idx_scorm_sessions_user ON public.scorm_sessions(user_id);
CREATE INDEX idx_scorm_sessions_course ON public.scorm_sessions(course_id);