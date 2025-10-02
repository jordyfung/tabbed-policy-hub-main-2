-- Add Team Management permission to training tab
INSERT INTO public.admin_permissions (tab_id, subtab_id, is_enabled) VALUES
('training', 'team', true);

-- Remove Team Management permission from dashboard tab (since it's been moved)
DELETE FROM public.admin_permissions WHERE tab_id = 'dashboard' AND subtab_id = 'team';
