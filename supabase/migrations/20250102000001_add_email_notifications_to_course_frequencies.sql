-- Add email_notifications_enabled field to course_frequencies table
ALTER TABLE public.course_frequencies 
ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true;

-- Add comment to explain the field
COMMENT ON COLUMN public.course_frequencies.email_notifications_enabled IS 'Whether email notifications are enabled for this course frequency rule';
