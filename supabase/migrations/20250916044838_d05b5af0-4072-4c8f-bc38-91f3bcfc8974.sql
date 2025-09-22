-- Update the courses table RLS policy to allow both admin and super-admin roles
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;

CREATE POLICY "Admins can manage courses" 
ON public.courses 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'super-admin'::user_role]));