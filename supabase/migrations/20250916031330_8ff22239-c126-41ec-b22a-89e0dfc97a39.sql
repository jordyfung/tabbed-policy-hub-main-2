-- Create admin_permissions table to control which sub-tabs admins can see
CREATE TABLE public.admin_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tab_id TEXT NOT NULL,
  subtab_id TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tab_id, subtab_id)
);

-- Enable RLS on admin_permissions
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_permissions
CREATE POLICY "Super admins can manage permissions" 
ON public.admin_permissions 
FOR ALL 
USING (get_user_role(auth.uid()) = 'super-admin'::user_role);

CREATE POLICY "Admins can view permissions" 
ON public.admin_permissions 
FOR SELECT 
USING (get_user_role(auth.uid()) IN ('admin'::user_role, 'super-admin'::user_role));

-- Insert default permissions (all sub-tabs enabled by default)
INSERT INTO public.admin_permissions (tab_id, subtab_id, is_enabled) VALUES
('dashboard', 'overview', true),
('dashboard', 'analytics', true),
('dashboard', 'reports', true),
('dashboard', 'team', true),
('dashboard', 'quality-standards', true),
('dashboard', 'permissions', true),
('policies', 'overview', true),
('policies', 'management', true),
('training', 'overview', true),
('training', 'courses', true),
('training', 'assignments', true),
('assurance', 'overview', true),
('assurance', 'audits', true),
('assurance', 'incidents', true),
('assurance', 'improvements', true);

-- Update users with jordy in their name/email to super-admin
UPDATE public.profiles 
SET role = 'super-admin'::user_role 
WHERE email ILIKE '%jordy%' OR first_name ILIKE '%jordy%';

-- Create helper functions
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role = 'super-admin'::user_role FROM public.profiles WHERE profiles.user_id = $1;
$$;

CREATE OR REPLACE FUNCTION public.get_enabled_subtabs(tab_name TEXT)
RETURNS TABLE(subtab_id TEXT)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ap.subtab_id 
  FROM public.admin_permissions ap 
  WHERE ap.tab_id = tab_name AND ap.is_enabled = true;
$$;

-- Create trigger for updating updated_at
CREATE TRIGGER update_admin_permissions_updated_at
BEFORE UPDATE ON public.admin_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();