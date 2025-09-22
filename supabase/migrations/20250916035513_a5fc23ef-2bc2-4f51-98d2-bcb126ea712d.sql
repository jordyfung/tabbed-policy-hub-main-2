-- Create user invitations table for sending email invitations
CREATE TABLE public.user_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  invitation_token TEXT NOT NULL UNIQUE,
  invitation_expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  invited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  is_accepted BOOLEAN NOT NULL DEFAULT false
);

-- Create course bundles table for grouping courses
CREATE TABLE public.course_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course bundle items to link courses to bundles
CREATE TABLE public.course_bundle_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.course_bundles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bundle_id, course_id)
);

-- Create user achievements table for gamification
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  points INTEGER NOT NULL DEFAULT 0
);

-- Create training streaks table for consecutive completions
CREATE TABLE public.training_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completion_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training notifications table for due date alerts
CREATE TABLE public.training_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assignment_id UUID NOT NULL REFERENCES public.course_assignments(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'due_soon', 'overdue', 'reminder'
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Add new columns to course_assignments for enhanced tracking
ALTER TABLE public.course_assignments 
ADD COLUMN last_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN next_due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN completion_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN is_due_soon BOOLEAN NOT NULL DEFAULT false;

-- Add new columns to course_completions for enhanced tracking
ALTER TABLE public.course_completions
ADD COLUMN xp_earned INTEGER NOT NULL DEFAULT 0,
ADD COLUMN streak_bonus INTEGER NOT NULL DEFAULT 0;

-- Add bundle assignment support
ALTER TABLE public.course_assignments
ADD COLUMN bundle_id UUID REFERENCES public.course_bundles(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_invitations
CREATE POLICY "Admins can manage invitations" 
ON public.user_invitations 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'super-admin'::user_role]));

-- RLS Policies for course_bundles
CREATE POLICY "Admins can manage bundles" 
ON public.course_bundles 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'super-admin'::user_role]));

CREATE POLICY "Everyone can view bundles" 
ON public.course_bundles 
FOR SELECT 
USING (true);

-- RLS Policies for course_bundle_items
CREATE POLICY "Admins can manage bundle items" 
ON public.course_bundle_items 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'super-admin'::user_role]));

CREATE POLICY "Everyone can view bundle items" 
ON public.course_bundle_items 
FOR SELECT 
USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all achievements" 
ON public.user_achievements 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'super-admin'::user_role]));

CREATE POLICY "System can create achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for training_streaks
CREATE POLICY "Users can view own streaks" 
ON public.training_streaks 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all streaks" 
ON public.training_streaks 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'super-admin'::user_role]));

-- RLS Policies for training_notifications
CREATE POLICY "Users can view own notifications" 
ON public.training_notifications 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications" 
ON public.training_notifications 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'super-admin'::user_role]));

-- Create function to calculate next due date based on frequency
CREATE OR REPLACE FUNCTION public.calculate_next_due_date(
  assignment_id_param UUID
) RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_completion TIMESTAMP WITH TIME ZONE;
  frequency_months INTEGER;
  next_due TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get last completion date and frequency
  SELECT 
    ca.last_completed_at,
    cf.frequency_months
  INTO 
    last_completion,
    frequency_months
  FROM public.course_assignments ca
  JOIN public.courses c ON ca.course_id = c.id
  LEFT JOIN public.course_frequencies cf ON cf.course_id = c.id
  WHERE ca.id = assignment_id_param;
  
  -- If no frequency set, return null (one-time course)
  IF frequency_months IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate next due date
  IF last_completion IS NULL THEN
    -- First time assignment - due based on assignment date
    SELECT due_date INTO next_due 
    FROM public.course_assignments 
    WHERE id = assignment_id_param;
  ELSE
    -- Recurring - add frequency to last completion
    next_due := last_completion + (frequency_months * interval '1 month');
  END IF;
  
  RETURN next_due;
END;
$$;

-- Create function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(
  user_id_param UUID,
  completion_id_param UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completion_count INTEGER;
  consecutive_count INTEGER;
  achievement_exists BOOLEAN;
BEGIN
  -- Count total completions for user
  SELECT COUNT(*) INTO completion_count
  FROM public.course_completions
  WHERE completed_by = user_id_param;
  
  -- Award "First Course" achievement
  IF completion_count = 1 THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_achievements 
      WHERE user_id = user_id_param AND achievement_type = 'first_course'
    ) INTO achievement_exists;
    
    IF NOT achievement_exists THEN
      INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, description, points)
      VALUES (user_id_param, 'first_course', 'First Steps', 'Completed your first training course', 100);
    END IF;
  END IF;
  
  -- Award milestone achievements
  IF completion_count IN (5, 10, 25, 50, 100) THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_achievements 
      WHERE user_id = user_id_param AND achievement_type = 'milestone_' || completion_count
    ) INTO achievement_exists;
    
    IF NOT achievement_exists THEN
      INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, description, points)
      VALUES (
        user_id_param, 
        'milestone_' || completion_count, 
        completion_count || ' Courses Completed', 
        'Reached ' || completion_count || ' completed courses',
        completion_count * 20
      );
    END IF;
  END IF;
  
  -- Update training streak
  INSERT INTO public.training_streaks (user_id, current_streak, longest_streak, last_completion_date)
  VALUES (user_id_param, 1, 1, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = CASE 
      WHEN training_streaks.last_completion_date = CURRENT_DATE - 1 THEN training_streaks.current_streak + 1
      WHEN training_streaks.last_completion_date = CURRENT_DATE THEN training_streaks.current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(training_streaks.longest_streak, 
      CASE 
        WHEN training_streaks.last_completion_date = CURRENT_DATE - 1 THEN training_streaks.current_streak + 1
        WHEN training_streaks.last_completion_date = CURRENT_DATE THEN training_streaks.current_streak
        ELSE 1
      END
    ),
    last_completion_date = CURRENT_DATE,
    updated_at = now();
END;
$$;

-- Create trigger to award achievements on course completion
CREATE OR REPLACE FUNCTION public.trigger_award_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.check_and_award_achievements(NEW.completed_by, NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER award_achievements_on_completion
  AFTER INSERT ON public.course_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_award_achievements();

-- Create trigger to update due dates and flags
CREATE OR REPLACE FUNCTION public.update_assignment_due_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update last completion date and increment count
  UPDATE public.course_assignments 
  SET 
    last_completed_at = NEW.completed_at,
    completion_count = completion_count + 1,
    next_due_date = public.calculate_next_due_date(NEW.assignment_id)
  WHERE id = NEW.assignment_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_due_dates_on_completion
  AFTER INSERT ON public.course_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_assignment_due_dates();

-- Create function to update due soon flags
CREATE OR REPLACE FUNCTION public.update_due_soon_flags()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.course_assignments
  SET is_due_soon = (
    next_due_date IS NOT NULL AND 
    next_due_date <= (CURRENT_DATE + interval '30 days') AND
    next_due_date > CURRENT_DATE
  );
END;
$$;

-- Add updated_at trigger for course_bundles
CREATE TRIGGER update_course_bundles_updated_at
  BEFORE UPDATE ON public.course_bundles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();